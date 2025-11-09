from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime
from typing import List
from uuid import UUID

from app.database import get_db
from app.models import User, Goal, GoalStatus
from app.schemas import (
    GoalCreate,
    GoalUpdate,
    GoalResponse,
    GoalListResponse,
    ImpactAnalysisRequest,
    ImpactAnalysisResponse,
    GoalImpact
)
from app.dependencies import get_current_user

router = APIRouter(prefix="/goals", tags=["Goals"])


def calculate_goal_metrics(goal: Goal) -> dict:
    """Calculate progress percentage and days remaining for a goal."""
    metrics = {}
    
    # Calculate progress percentage
    if goal.target_amount > 0:
        if goal.type.value == "spending_limit":
            # For spending limits, progress is current spending vs target
            metrics["progress_percentage"] = min(
                (goal.current_spending / goal.target_amount) * 100,
                100
            )
        else:
            # For savings/debt, progress is current amount vs target
            metrics["progress_percentage"] = min(
                (goal.current_amount / goal.target_amount) * 100,
                100
            )
    else:
        metrics["progress_percentage"] = 0
    
    # Calculate days remaining
    if goal.deadline:
        delta = goal.deadline - datetime.utcnow()
        metrics["days_remaining"] = max(delta.days, 0) if delta.days >= 0 else 0
    else:
        metrics["days_remaining"] = None
    
    return metrics


@router.get("", response_model=GoalListResponse)
async def get_goals(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    status_filter: str = None
):
    """
    Get all goals for the current user.
    
    - **status**: Optional filter by status (active, completed, paused, abandoned)
    """
    query = select(Goal).where(Goal.user_id == current_user.id)
    
    if status_filter:
        try:
            goal_status = GoalStatus(status_filter)
            query = query.where(Goal.status == goal_status)
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid status: {status_filter}"
            )
    
    query = query.order_by(Goal.priority.desc(), Goal.created_at.desc())
    
    result = await db.execute(query)
    goals = result.scalars().all()
    
    # Add calculated metrics to each goal
    goal_responses = []
    for goal in goals:
        goal_dict = goal.__dict__.copy()
        metrics = calculate_goal_metrics(goal)
        goal_dict.update(metrics)
        goal_responses.append(GoalResponse.model_validate(goal_dict))
    
    return GoalListResponse(
        goals=goal_responses,
        total=len(goal_responses)
    )


@router.post("", response_model=GoalResponse, status_code=status.HTTP_201_CREATED)
async def create_goal(
    goal_data: GoalCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Create a new financial goal.
    
    - **type**: savings, spending_limit, or debt_payoff
    - **name**: Goal name
    - **description**: Optional description
    - **target_amount**: Target amount in dollars
    - **current_amount**: Optional starting amount
    - **deadline**: Optional deadline date
    - **period**: Optional period (monthly, weekly, annual, one_time)
    - **priority**: Priority level (1-10, default 1)
    """
    new_goal = Goal(
        user_id=current_user.id,
        type=goal_data.type,
        name=goal_data.name,
        description=goal_data.description,
        target_amount=goal_data.target_amount,
        current_amount=goal_data.current_amount or 0,
        deadline=goal_data.deadline,
        period=goal_data.period,
        priority=goal_data.priority or 1,
        status=GoalStatus.ACTIVE
    )
    
    db.add(new_goal)
    await db.commit()
    await db.refresh(new_goal)
    
    # Add calculated metrics
    goal_dict = new_goal.__dict__.copy()
    metrics = calculate_goal_metrics(new_goal)
    goal_dict.update(metrics)
    
    return GoalResponse.model_validate(goal_dict)


@router.get("/{goal_id}", response_model=GoalResponse)
async def get_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Get a specific goal by ID."""
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Add calculated metrics
    goal_dict = goal.__dict__.copy()
    metrics = calculate_goal_metrics(goal)
    goal_dict.update(metrics)
    
    return GoalResponse.model_validate(goal_dict)


@router.put("/{goal_id}", response_model=GoalResponse)
async def update_goal(
    goal_id: UUID,
    goal_update: GoalUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Update an existing goal.
    
    All fields are optional - only provided fields will be updated.
    """
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    # Update only provided fields
    update_data = goal_update.model_dump(exclude_unset=True)
    
    for field, value in update_data.items():
        setattr(goal, field, value)
    
    # Check if goal is completed
    if goal.status == GoalStatus.COMPLETED and not goal.completed_at:
        goal.completed_at = datetime.utcnow()
    
    await db.commit()
    await db.refresh(goal)
    
    # Add calculated metrics
    goal_dict = goal.__dict__.copy()
    metrics = calculate_goal_metrics(goal)
    goal_dict.update(metrics)
    
    return GoalResponse.model_validate(goal_dict)


@router.delete("/{goal_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_goal(
    goal_id: UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """Delete a goal."""
    result = await db.execute(
        select(Goal).where(
            Goal.id == goal_id,
            Goal.user_id == current_user.id
        )
    )
    goal = result.scalar_one_or_none()
    
    if not goal:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Goal not found"
        )
    
    await db.delete(goal)
    await db.commit()
    
    return None


@router.post("/impact-analysis", response_model=ImpactAnalysisResponse)
async def analyze_purchase_impact(
    impact_request: ImpactAnalysisRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    """
    Analyze how a purchase would impact the user's goals.
    
    - **purchase_amount**: Amount of the potential purchase
    
    Returns impact on each active goal including warnings.
    """
    # Get all active goals
    result = await db.execute(
        select(Goal).where(
            Goal.user_id == current_user.id,
            Goal.status == GoalStatus.ACTIVE
        ).order_by(Goal.priority.desc())
    )
    goals = result.scalars().all()
    
    affected_goals = []
    warnings_count = 0
    
    for goal in goals:
        impact_percentage = 0
        new_amount = goal.current_amount
        remaining = goal.target_amount - goal.current_amount
        is_warning = False
        description = ""
        
        if goal.type.value == "spending_limit":
            # For spending limits, check if purchase would exceed limit
            new_spending = goal.current_spending + impact_request.purchase_amount
            impact_percentage = (impact_request.purchase_amount / goal.target_amount) * 100
            remaining = max(goal.target_amount - new_spending, 0)
            
            if new_spending > goal.target_amount:
                is_warning = True
                warnings_count += 1
                overage = new_spending - goal.target_amount
                description = f"This purchase would put you ${overage:.2f} over your {goal.name} limit"
            else:
                description = f"You'll have ${remaining:.2f} remaining in your {goal.name}"
        
        elif goal.type.value == "savings":
            # For savings, show impact on ability to save
            impact_percentage = (impact_request.purchase_amount / goal.target_amount) * 100
            
            if impact_percentage > 10:  # More than 10% of goal
                is_warning = True
                warnings_count += 1
                description = f"This purchase is {impact_percentage:.1f}% of your {goal.name} target"
            else:
                description = f"Small impact on {goal.name} goal"
        
        elif goal.type.value == "debt_payoff":
            # For debt payoff, show opportunity cost
            impact_percentage = (impact_request.purchase_amount / goal.target_amount) * 100
            
            if impact_percentage > 5:  # More than 5% of remaining debt
                is_warning = True
                warnings_count += 1
                description = f"This amount could reduce your {goal.name} by {impact_percentage:.1f}%"
            else:
                description = f"Minimal impact on {goal.name}"
        
        affected_goals.append(GoalImpact(
            goal_id=goal.id,
            goal_name=goal.name,
            impact_percentage=round(impact_percentage, 2),
            new_amount=round(new_amount, 2),
            remaining=round(remaining, 2),
            is_warning=is_warning,
            description=description
        ))
    
    return ImpactAnalysisResponse(
        affected_goals=affected_goals,
        total_goals=len(goals),
        warnings_count=warnings_count
    )
