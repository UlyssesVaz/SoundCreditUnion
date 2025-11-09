from sqlalchemy import Column, String, Integer, Float, DateTime, Boolean, JSON, ForeignKey, Text, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid
import enum

from app.database import Base


class GoalType(str, enum.Enum):
    SAVINGS = "savings"
    SPENDING_LIMIT = "spending_limit"
    DEBT_PAYOFF = "debt_payoff"


class GoalStatus(str, enum.Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    ABANDONED = "abandoned"


class Period(str, enum.Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    ANNUAL = "annual"
    ONE_TIME = "one_time"


class ProductType(str, enum.Enum):
    LOAN = "loan"
    CREDIT_CARD = "credit_card"
    SAVINGS_ACCOUNT = "savings_account"
    CHECKING_ACCOUNT = "checking_account"


class RecommendationType(str, enum.Enum):
    LOAN = "loan"
    CREDIT_CARD = "credit_card"
    ALERT = "alert"
    CASHBACK = "cashback"


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    hashed_password = Column(String(255), nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    phone = Column(String(20), nullable=True)
    
    # Financial Profile
    segment = Column(String(50), nullable=True)  # e.g., "high_value", "growth", "new"
    financial_profile = Column(JSONB, nullable=True, default={})  # annual_income, credit_score, dti_ratio
    
    # Metadata
    is_active = Column(Boolean, default=True)
    is_verified = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Preferences
    preferences = Column(JSONB, nullable=True, default={})  # notification settings, etc.
    
    # Relationships
    goals = relationship("Goal", back_populates="user", cascade="all, delete-orphan")
    refresh_tokens = relationship("RefreshToken", back_populates="user", cascade="all, delete-orphan")
    analytics_events = relationship("AnalyticsEvent", back_populates="user", cascade="all, delete-orphan")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    token = Column(String(500), unique=True, nullable=False, index=True)
    expires_at = Column(DateTime, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    revoked = Column(Boolean, default=False)
    
    # Relationships
    user = relationship("User", back_populates="refresh_tokens")


class Goal(Base):
    __tablename__ = "goals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    
    # Goal Details
    type = Column(SQLEnum(GoalType), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Amounts
    target_amount = Column(Float, nullable=False)
    current_amount = Column(Float, default=0.0)
    current_spending = Column(Float, default=0.0)
    
    # Timeline
    deadline = Column(DateTime, nullable=True)
    period = Column(SQLEnum(Period), nullable=True)
    
    # Status
    status = Column(SQLEnum(GoalStatus), default=GoalStatus.ACTIVE)
    priority = Column(Integer, default=1)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="goals")


class Product(Base):
    __tablename__ = "products"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    
    # Product Details
    type = Column(SQLEnum(ProductType), nullable=False)
    name = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    
    # Rates & Terms
    base_rate = Column(Float, nullable=True)  # APR for loans, APY for savings
    terms = Column(JSONB, nullable=True)  # loan term, credit limit, etc.
    
    # Benefits
    benefits = Column(JSONB, nullable=True)  # array of benefit strings
    
    # Application
    application_url = Column(String(500), nullable=True)
    
    # Eligibility (rules-based for Phase 1)
    min_credit_score = Column(Integer, nullable=True)
    max_dti_ratio = Column(Float, nullable=True)
    min_income = Column(Float, nullable=True)
    
    # Metadata
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class Recommendation(Base):
    __tablename__ = "recommendations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(UUID(as_uuid=True), ForeignKey("products.id", ondelete="SET NULL"), nullable=True)
    
    # Recommendation Details
    type = Column(SQLEnum(RecommendationType), nullable=False)
    priority = Column(Integer, default=1)
    
    # Context
    purchase_context = Column(JSONB, nullable=True)  # amount, merchant, category
    
    # Message Content
    message = Column(JSONB, nullable=False)  # title, description, cta, etc.
    
    # Impact
    impact = Column(JSONB, nullable=True)  # goal_id, goal_name, percentage
    
    # Tracking
    shown_count = Column(Integer, default=0)
    click_count = Column(Integer, default=0)
    conversion = Column(Boolean, default=False)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow)
    expires_at = Column(DateTime, nullable=True)


class AnalyticsEvent(Base):
    __tablename__ = "analytics_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=True)
    
    # Event Details
    event_type = Column(String(100), nullable=False, index=True)
    event_data = Column(JSONB, nullable=True)
    
    # Context
    session_id = Column(String(100), nullable=True)
    page_url = Column(String(500), nullable=True)
    
    # Metadata
    created_at = Column(DateTime, default=datetime.utcnow, index=True)
    
    # Relationships
    user = relationship("User", back_populates="analytics_events")
