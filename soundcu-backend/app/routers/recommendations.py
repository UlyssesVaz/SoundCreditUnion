from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from typing import List
import uuid
import os
import json

from app.database import get_db
from app.models import (
    User, Goal, Product, Recommendation as RecommendationModel, 
    GoalStatus, RecommendationType, AnalyticsEvent
)
from app.schemas import (
    RecommendationRequest,
    RecommendationListResponse,
    RecommendationResponse,
    RecommendationMessage,
    RecommendationImpact,
    ProductResponse,
    TrackingEvent,
    PurchaseContext
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/recommendations", tags=["Recommendations"])

# OpenAI client (will be initialized if API key is available)
OPENAI_ENABLED = False
try:
    from openai import OpenAI
    if os.getenv("OPENAI_API_KEY"):
        openai_client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
        OPENAI_ENABLED = True
except ImportError:
    pass


async def get_eligible_products(
    user: User,
    purchase_context: PurchaseContext,
    db: AsyncSession
) -> List[Product]:
    """Get products the user is eligible for based on their financial profile."""
    query = select(Product).where(Product.is_active == True)
    
    financial_profile = user.financial_profile or {}
    
    credit_score = financial_profile.get("credit_score")
    if credit_score:
        query = query.where(
            (Product.min_credit_score == None) | (Product.min_credit_score <= credit_score)
        )
    
    annual_income = financial_profile.get("annual_income")
    if annual_income:
        query = query.where(
            (Product.min_income == None) | (Product.min_income <= annual_income)
        )
    
    dti_ratio = financial_profile.get("dti_ratio")
    if dti_ratio:
        query = query.where(
            (Product.max_dti_ratio == None) | (Product.max_dti_ratio >= dti_ratio)
        )
    
    result = await db.execute(query)
    return result.scalars().all()


async def generate_ai_recommendations(
    user: User,
    purchase_context: PurchaseContext,
    goals: List[Goal],
    eligible_products: List[Product]
) -> List[dict]:
    """Generate recommendations using OpenAI for personalized insights."""
    if not OPENAI_ENABLED:
        return []
    
    # Build context for AI
    user_context = {
        "name": f"{user.first_name} {user.last_name}",
        "segment": user.segment,
        "financial_profile": user.financial_profile or {},
        "goals": [
            {
                "type": g.type.value,
                "name": g.name,
                "target": g.target_amount,
                "current": g.current_amount,
                "spending": g.current_spending
            }
            for g in goals
        ]
    }
    
    purchase_info = {
        "amount": purchase_context.amount,
        "merchant": purchase_context.merchant,
        "category": purchase_context.category
    }
    
    products_info = [
        {
            "name": p.name,
            "type": p.type.value,
            "rate": p.base_rate,
            "benefits": p.benefits
        }
        for p in eligible_products[:5]
    ]
    
    prompt = f"""You are a financial advisor for Sound Credit Union. A member is about to make a purchase and needs personalized recommendations.

Member Profile:
{json.dumps(user_context, indent=2)}

Purchase Context:
{json.dumps(purchase_info, indent=2)}

Available Products:
{json.dumps(products_info, indent=2)}

Generate 2-3 highly personalized recommendations. Focus on:
1. Alert if purchase impacts their goals negatively
2. Suggest relevant products that could help
3. Provide actionable insights in friendly, human language

Return JSON array with this structure:
[
  {{
    "type": "alert|loan|credit_card|cashback",
    "priority": 1-5,
    "title": "Short catchy title",
    "description": "Personalized explanation (2-3 sentences)",
    "cta_text": "Action button text",
    "product_name": "Product name if recommending one",
    "savings": "Estimated savings amount",
    "goal_impact": "Which goal is affected and how"
  }}
]

Be conversational, specific, and helpful. Use emojis sparingly."""

    try:
        response = openai_client.chat.completions.create(
            model="gpt-4-turbo-preview",
            messages=[
                {"role": "system", "content": "You are a helpful financial advisor focused on member success."},
                {"role": "user", "content": prompt}
            ],
            response_format={"type": "json_object"},
            temperature=0.7,
            max_tokens=800
        )
        
        ai_response = json.loads(response.choices[0].message.content)
        return ai_response.get("recommendations", [])
    
    except Exception as e:
        print(f"OpenAI error: {e}")
        return []


async def generate_rules_based_recommendations(
    user: User,
    purchase_context: PurchaseContext,
    goals: List[Goal],
    eligible_products: List[Product]
) -> List[RecommendationResponse]:
    """Fallback: Generate recommendations using rules-based engine."""
    recommendations = []
    amount = purchase_context.amount
    
    # Rule 1: Check spending limits
    for goal in goals:
        if goal.type.value == "spending_limit" and goal.status == GoalStatus.ACTIVE:
            projected_spending = goal.current_spending + amount
            
            if projected_spending > goal.target_amount:
                overage = projected_spending - goal.target_amount
                recommendations.append(RecommendationResponse(
                    id=uuid.uuid4(),
                    type=RecommendationType.ALERT,
                    priority=1,
                    product=None,
                    message=RecommendationMessage(
                        title="⚠️ Spending Limit Alert",
                        description=f"This purchase would exceed your '{goal.name}' limit by ${overage:.2f}",
                        alert_type="warning",
                        cta_text="Review Budget"
                    ),
                    impact=RecommendationImpact(
                        goal_id=goal.id,
                        goal_name=goal.name,
                        percentage=(amount / goal.target_amount) * 100
                    )
                ))
    
    # Rule 2: Cashback offers
    if 50 < amount < 500:
        cashback_amount = amount * 0.02
        recommendations.append(RecommendationResponse(
            id=uuid.uuid4(),
            type=RecommendationType.CASHBACK,
            priority=3,
            product=None,
            message=RecommendationMessage(
                title="💰 Earn Cashback",
                description=f"Use your Sound CU Cashback Card to earn ${cashback_amount:.2f} back",
                cashback_amount=cashback_amount,
                savings=f"${cashback_amount:.2f}",
                cta_text="Learn More"
            ),
            impact=None
        ))
    
    # Rule 3: Credit card for medium purchases
    if 500 <= amount <= 5000:
        credit_cards = [p for p in eligible_products if p.type.value == "credit_card"]
        if credit_cards:
            card = credit_cards[0]
            recommendations.append(RecommendationResponse(
                id=uuid.uuid4(),
                type=RecommendationType.CREDIT_CARD,
                priority=2,
                product=ProductResponse.model_validate(card),
                message=RecommendationMessage(
                    title=f"Consider {card.name}",
                    description=card.description,
                    cta_text="Apply Now",
                    cta_url=card.application_url
                ),
                impact=None
            ))
    
    # Rule 4: Loan for large purchases
    if amount > 5000:
        loans = [p for p in eligible_products if p.type.value == "loan"]
        if loans:
            loan = loans[0]
            monthly_payment = (amount * (loan.base_rate / 100 / 12)) / (1 - (1 + loan.base_rate / 100 / 12) ** -60)
            recommendations.append(RecommendationResponse(
                id=uuid.uuid4(),
                type=RecommendationType.LOAN,
                priority=2,
                product=ProductResponse.model_validate(loan),
                message=RecommendationMessage(
                    title=f"Finance with {loan.name}",
                    description=f"Spread this over time. ~${monthly_payment:.2f}/month at {loan.base_rate}% APR",
                    cta_text="Get Pre-Qualified",
                    cta_url=loan.application_url
                ),
                impact=None
            ))
    
    recommendations.sort(key=lambda x: x.priority)
    return recommendations[:5]


@router.post("/get", response_model=RecommendationListResponse)
async def get_recommendations(
    request: RecommendationRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get personalized recommendations (AI-enhanced when available)."""
    
    # Get user's active goals
    result = await db.execute(
        select(Goal).where(
            Goal.user_id == current_user.id,
            Goal.status == GoalStatus.ACTIVE
        )
    )
    goals = result.scalars().all()
    
    # Get eligible products
    eligible_products = await get_eligible_products(
        current_user,
        request.purchase_context,
        db
    )
    
    # Try AI-enhanced recommendations first
    if OPENAI_ENABLED:
        ai_recs = await generate_ai_recommendations(
            current_user,
            request.purchase_context,
            goals,
            eligible_products
        )
        
        if ai_recs:
            # Convert AI recommendations to schema
            recommendations = []
            for i, ai_rec in enumerate(ai_recs):
                # Find matching product if mentioned
                product = None
                if ai_rec.get("product_name"):
                    for p in eligible_products:
                        if p.name.lower() in ai_rec["product_name"].lower():
                            product = ProductResponse.model_validate(p)
                            break
                
                rec_type = RecommendationType(ai_rec.get("type", "alert"))
                recommendations.append(RecommendationResponse(
                    id=uuid.uuid4(),
                    type=rec_type,
                    priority=ai_rec.get("priority", i + 1),
                    product=product,
                    message=RecommendationMessage(
                        title=ai_rec["title"],
                        description=ai_rec["description"],
                        cta_text=ai_rec.get("cta_text"),
                        savings=ai_rec.get("savings")
                    ),
                    impact=None
                ))
            
            return RecommendationListResponse(recommendations=recommendations[:5])
    
    # Fallback to rules-based
    recommendations = await generate_rules_based_recommendations(
        current_user,
        request.purchase_context,
        goals,
        eligible_products
    )
    
    return RecommendationListResponse(recommendations=recommendations)


@router.post("/track", status_code=status.HTTP_204_NO_CONTENT)
async def track_recommendation_event(
    event: TrackingEvent,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Track recommendation events for analytics."""
    
    analytics_event = AnalyticsEvent(
        user_id=current_user.id,
        event_type=f"recommendation_{event.event_type}",
        event_data={
            "recommendation_id": str(event.recommendation_id),
            "context": event.context.model_dump() if event.context else None
        }
    )
    db.add(analytics_event)
    await db.commit()
    
    return None
