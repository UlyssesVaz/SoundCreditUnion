"""
Database initialization and seed script for Sound CU Co-Pilot

Creates 3 diverse user personas with realistic financial profiles and goals.
"""
import asyncio
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import sys
import os

# Add parent directory to path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import Base
from app.models import User, Goal, Product, GoalType, GoalStatus, Period, ProductType
from app.auth import get_password_hash


async def init_db(db_url: str):
    """Initialize database and create all tables."""
    engine = create_async_engine(db_url, echo=True)
    
    async with engine.begin() as conn:
        # Drop all tables (fresh start)
        await conn.run_sync(Base.metadata.drop_all)
        # Create all tables
        await conn.run_sync(Base.metadata.create_all)
    
    return engine


async def seed_data(engine):
    """Seed database with test users, goals, and products."""
    
    AsyncSessionLocal = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    
    async with AsyncSessionLocal() as session:
        
        # ========== PERSONA 1: Sarah - Young Professional 🎓 ==========
        sarah = User(
            email="sarah@example.com",
            hashed_password=get_password_hash("password123"),
            first_name="Sarah",
            last_name="Chen",
            phone="+1-206-555-0101",
            segment="growth",
            financial_profile={
                "annual_income": 65000,
                "credit_score": 720,
                "dti_ratio": 0.28
            },
            preferences={
                "risk_tolerance": "moderate",
                "communication_preference": "email"
            },
            is_verified=True
        )
        session.add(sarah)
        await session.flush()
        
        # Sarah's Goals
        sarah_goals = [
            Goal(
                user_id=sarah.id,
                type=GoalType.SAVINGS,
                name="House Down Payment",
                description="Saving for 20% down payment on $200K home",
                target_amount=40000,
                current_amount=12500,
                deadline=datetime.utcnow() + timedelta(days=730),  # 2 years
                period=Period.ONE_TIME,
                status=GoalStatus.ACTIVE,
                priority=1
            ),
            Goal(
                user_id=sarah.id,
                type=GoalType.DEBT_PAYOFF,
                name="Student Loan Payoff",
                description="Pay off remaining student loans",
                target_amount=15000,
                current_amount=5000,
                deadline=datetime.utcnow() + timedelta(days=1095),  # 3 years
                period=Period.MONTHLY,
                status=GoalStatus.ACTIVE,
                priority=2
            ),
            Goal(
                user_id=sarah.id,
                type=GoalType.SPENDING_LIMIT,
                name="Monthly Dining Out",
                description="Limit restaurant spending to save more",
                target_amount=300,
                current_spending=185,
                period=Period.MONTHLY,
                status=GoalStatus.ACTIVE,
                priority=3
            )
        ]
        for goal in sarah_goals:
            session.add(goal)
        
        
        # ========== PERSONA 2: Marcus - High Earner 💼 ==========
        marcus = User(
            email="marcus@example.com",
            hashed_password=get_password_hash("password123"),
            first_name="Marcus",
            last_name="Thompson",
            phone="+1-206-555-0102",
            segment="high_value",
            financial_profile={
                "annual_income": 180000,
                "credit_score": 790,
                "dti_ratio": 0.15
            },
            preferences={
                "risk_tolerance": "aggressive",
                "communication_preference": "text"
            },
            is_verified=True
        )
        session.add(marcus)
        await session.flush()
        
        # Marcus's Goals
        marcus_goals = [
            Goal(
                user_id=marcus.id,
                type=GoalType.SAVINGS,
                name="European Vacation",
                description="Family trip to Europe summer 2025",
                target_amount=8000,
                current_amount=4200,
                deadline=datetime.utcnow() + timedelta(days=180),  # 6 months
                period=Period.ONE_TIME,
                status=GoalStatus.ACTIVE,
                priority=2
            ),
            Goal(
                user_id=marcus.id,
                type=GoalType.SAVINGS,
                name="Home Renovation",
                description="Kitchen and bathroom remodel",
                target_amount=50000,
                current_amount=15000,
                deadline=datetime.utcnow() + timedelta(days=365),  # 1 year
                period=Period.ONE_TIME,
                status=GoalStatus.ACTIVE,
                priority=1
            ),
            Goal(
                user_id=marcus.id,
                type=GoalType.SPENDING_LIMIT,
                name="Monthly Shopping",
                description="Discretionary shopping budget",
                target_amount=2000,
                current_spending=1250,
                period=Period.MONTHLY,
                status=GoalStatus.ACTIVE,
                priority=3
            )
        ]
        for goal in marcus_goals:
            session.add(goal)
        
        
        # ========== PERSONA 3: Jamie - Budget-Conscious Parent 👨‍👩‍👧 ==========
        jamie = User(
            email="jamie@example.com",
            hashed_password=get_password_hash("password123"),
            first_name="Jamie",
            last_name="Rodriguez",
            phone="+1-206-555-0103",
            segment="new",
            financial_profile={
                "annual_income": 48000,
                "credit_score": 650,
                "dti_ratio": 0.38
            },
            preferences={
                "risk_tolerance": "conservative",
                "communication_preference": "email"
            },
            is_verified=True
        )
        session.add(jamie)
        await session.flush()
        
        # Jamie's Goals
        jamie_goals = [
            Goal(
                user_id=jamie.id,
                type=GoalType.SAVINGS,
                name="Emergency Fund",
                description="Build 3-month emergency fund",
                target_amount=5000,
                current_amount=1200,
                period=Period.MONTHLY,
                status=GoalStatus.ACTIVE,
                priority=1
            ),
            Goal(
                user_id=jamie.id,
                type=GoalType.SPENDING_LIMIT,
                name="Monthly Budget",
                description="Total monthly spending limit to stay on track",
                target_amount=2000,
                current_spending=1650,
                period=Period.MONTHLY,
                status=GoalStatus.ACTIVE,
                priority=1
            ),
            Goal(
                user_id=jamie.id,
                type=GoalType.SPENDING_LIMIT,
                name="Groceries",
                description="Weekly grocery budget for family of 4",
                target_amount=150,
                current_spending=98,
                period=Period.WEEKLY,
                status=GoalStatus.ACTIVE,
                priority=2
            ),
            Goal(
                user_id=jamie.id,
                type=GoalType.DEBT_PAYOFF,
                name="Credit Card Debt",
                description="Pay off high-interest credit card",
                target_amount=3500,
                current_amount=800,
                deadline=datetime.utcnow() + timedelta(days=365),
                period=Period.MONTHLY,
                status=GoalStatus.ACTIVE,
                priority=2
            )
        ]
        for goal in jamie_goals:
            session.add(goal)
        
        
        # ========== PRODUCTS CATALOG ==========
        products = [
            # Credit Cards
            Product(
                type=ProductType.CREDIT_CARD,
                name="Sound CU Cashback Rewards Card",
                description="Earn 2% cashback on all purchases. No annual fee.",
                base_rate=16.99,
                terms={
                    "credit_limit_range": [1000, 25000],
                    "annual_fee": 0,
                    "cashback_rate": 0.02,
                    "intro_apr": 0,
                    "intro_period_months": 12
                },
                benefits=[
                    "2% cashback on all purchases",
                    "No annual fee",
                    "0% APR for 12 months",
                    "Fraud protection"
                ],
                application_url="https://soundcu.com/apply/cashback-card",
                min_credit_score=650,
                min_income=30000,
                is_active=True
            ),
            Product(
                type=ProductType.CREDIT_CARD,
                name="Sound CU Premium Travel Card",
                description="Premium card with travel rewards and lounge access.",
                base_rate=18.99,
                terms={
                    "credit_limit_range": [5000, 50000],
                    "annual_fee": 95,
                    "points_per_dollar": 3,
                    "travel_credits": 200
                },
                benefits=[
                    "3X points on travel and dining",
                    "$200 annual travel credit",
                    "Airport lounge access",
                    "Travel insurance included"
                ],
                application_url="https://soundcu.com/apply/travel-card",
                min_credit_score=720,
                min_income=75000,
                is_active=True
            ),
            
            # Loans
            Product(
                type=ProductType.LOAN,
                name="Sound CU Personal Loan",
                description="Flexible personal loans for any purpose. Quick approval.",
                base_rate=7.99,
                terms={
                    "loan_amount_range": [1000, 50000],
                    "term_months_range": [12, 84],
                    "origination_fee": 0
                },
                benefits=[
                    "Rates as low as 7.99% APR",
                    "No origination fees",
                    "Quick approval process",
                    "Flexible repayment terms"
                ],
                application_url="https://soundcu.com/apply/personal-loan",
                min_credit_score=640,
                min_income=35000,
                max_dti_ratio=0.43,
                is_active=True
            ),
            Product(
                type=ProductType.LOAN,
                name="Sound CU Home Equity Line",
                description="Tap into your home's equity with competitive rates.",
                base_rate=6.49,
                terms={
                    "line_amount_range": [10000, 500000],
                    "draw_period_years": 10,
                    "repayment_period_years": 20
                },
                benefits=[
                    "Rates as low as 6.49% APR",
                    "No closing costs up to $250K",
                    "Interest may be tax deductible",
                    "Use funds for any purpose"
                ],
                application_url="https://soundcu.com/apply/heloc",
                min_credit_score=680,
                min_income=50000,
                max_dti_ratio=0.40,
                is_active=True
            ),
            
            # Savings Accounts
            Product(
                type=ProductType.SAVINGS_ACCOUNT,
                name="Sound CU High-Yield Savings",
                description="Earn more on your savings with our competitive rates.",
                base_rate=4.25,  # APY
                terms={
                    "min_balance": 0,
                    "monthly_fee": 0,
                    "compounding": "daily"
                },
                benefits=[
                    "4.25% APY on all balances",
                    "No minimum balance",
                    "No monthly fees",
                    "FDIC insured up to $250K"
                ],
                application_url="https://soundcu.com/open/savings",
                is_active=True
            ),
            
            # Checking Accounts
            Product(
                type=ProductType.CHECKING_ACCOUNT,
                name="Sound CU Free Checking",
                description="Simple checking with no monthly fees or minimums.",
                terms={
                    "min_balance": 0,
                    "monthly_fee": 0,
                    "overdraft_protection": True
                },
                benefits=[
                    "No monthly maintenance fees",
                    "No minimum balance required",
                    "Free ATM network nationwide",
                    "Mobile check deposit"
                ],
                application_url="https://soundcu.com/open/checking",
                is_active=True
            )
        ]
        
        for product in products:
            session.add(product)
        
        
        # Commit all changes
        await session.commit()
        
        print("\n✅ Database seeded successfully!")
        print("\n📊 Created Test Users:")
        print("  1. Sarah Chen (sarah@example.com) - Young Professional 🎓")
        print("     - Income: $65K | Credit: 720 | Segment: Growth")
        print("     - Goals: House down payment, Student loans, Dining budget")
        print("\n  2. Marcus Thompson (marcus@example.com) - High Earner 💼")
        print("     - Income: $180K | Credit: 790 | Segment: High-Value")
        print("     - Goals: European vacation, Home renovation, Shopping budget")
        print("\n  3. Jamie Rodriguez (jamie@example.com) - Budget-Conscious Parent 👨‍👩‍👧")
        print("     - Income: $48K | Credit: 650 | Segment: New")
        print("     - Goals: Emergency fund, Monthly budget, Groceries, CC debt")
        print("\n  Password for all: password123")
        print("\n💳 Created 6 Sound CU Products (2 cards, 2 loans, 2 accounts)")


async def main():
    """Main initialization function."""
    db_url = os.getenv(
        "ASYNC_DATABASE_URL",
        "postgresql+asyncpg://soundcu:soundcu_password@localhost:5432/soundcu_db"
    )
    
    print(f"🔧 Initializing database at: {db_url}")
    engine = await init_db(db_url)
    
    print("\n🌱 Seeding database...")
    await seed_data(engine)
    
    await engine.dispose()
    print("\n🎉 Database initialization complete!")


if __name__ == "__main__":
    asyncio.run(main())
