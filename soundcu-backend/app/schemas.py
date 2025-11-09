from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from uuid import UUID
from enum import Enum


# Enums
class GoalType(str, Enum):
    SAVINGS = "savings"
    SPENDING_LIMIT = "spending_limit"
    DEBT_PAYOFF = "debt_payoff"


class GoalStatus(str, Enum):
    ACTIVE = "active"
    COMPLETED = "completed"
    PAUSED = "paused"
    ABANDONED = "abandoned"


class Period(str, Enum):
    MONTHLY = "monthly"
    WEEKLY = "weekly"
    ANNUAL = "annual"
    ONE_TIME = "one_time"


class ProductType(str, Enum):
    LOAN = "loan"
    CREDIT_CARD = "credit_card"
    SAVINGS_ACCOUNT = "savings_account"
    CHECKING_ACCOUNT = "checking_account"


class RecommendationType(str, Enum):
    LOAN = "loan"
    CREDIT_CARD = "credit_card"
    ALERT = "alert"
    CASHBACK = "cashback"


# User Schemas
class UserBase(BaseModel):
    email: EmailStr
    first_name: str = Field(..., min_length=1, max_length=100)
    last_name: str = Field(..., min_length=1, max_length=100)
    phone: Optional[str] = None


class UserCreate(UserBase):
    password: str = Field(..., min_length=8, max_length=100)


class UserUpdate(BaseModel):
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    phone: Optional[str] = None
    segment: Optional[str] = None
    financial_profile: Optional[Dict[str, Any]] = None
    preferences: Optional[Dict[str, Any]] = None


class FinancialProfile(BaseModel):
    annual_income: Optional[float] = None
    credit_score: Optional[int] = None
    dti_ratio: Optional[float] = None


class UserResponse(UserBase):
    id: UUID
    segment: Optional[str] = None
    financial_profile: Optional[FinancialProfile] = None
    created_at: datetime
    is_verified: bool
    
    class Config:
        from_attributes = True


# Auth Schemas
class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"


class TokenData(BaseModel):
    user_id: Optional[UUID] = None


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    user: UserResponse


class RefreshTokenRequest(BaseModel):
    refresh_token: str


# Goal Schemas
class GoalBase(BaseModel):
    type: GoalType
    name: str = Field(..., min_length=1, max_length=200)
    description: Optional[str] = None
    target_amount: float = Field(..., gt=0)
    current_amount: Optional[float] = Field(default=0, ge=0)
    deadline: Optional[datetime] = None
    period: Optional[Period] = None
    priority: Optional[int] = Field(default=1, ge=1, le=10)


class GoalCreate(GoalBase):
    pass


class GoalUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    target_amount: Optional[float] = Field(None, gt=0)
    current_amount: Optional[float] = Field(None, ge=0)
    current_spending: Optional[float] = Field(None, ge=0)
    deadline: Optional[datetime] = None
    period: Optional[Period] = None
    status: Optional[GoalStatus] = None
    priority: Optional[int] = Field(None, ge=1, le=10)


class GoalResponse(GoalBase):
    id: UUID
    user_id: UUID
    current_amount: float
    current_spending: float
    status: GoalStatus
    created_at: datetime
    updated_at: datetime
    completed_at: Optional[datetime] = None
    progress_percentage: Optional[float] = None
    days_remaining: Optional[int] = None
    
    class Config:
        from_attributes = True


class GoalListResponse(BaseModel):
    goals: List[GoalResponse]
    total: int


# Product Schemas
class ProductBase(BaseModel):
    type: ProductType
    name: str
    description: str
    base_rate: Optional[float] = None
    terms: Optional[Dict[str, Any]] = None
    benefits: Optional[List[str]] = None
    application_url: Optional[str] = None


class ProductResponse(ProductBase):
    id: UUID
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True


# Recommendation Schemas
class PurchaseContext(BaseModel):
    amount: float = Field(..., gt=0)
    merchant: str
    category: Optional[str] = None
    url: Optional[str] = None


class RecommendationMessage(BaseModel):
    title: str
    description: str
    savings: Optional[str] = None
    cashback_amount: Optional[float] = None
    cta_text: Optional[str] = None
    cta_url: Optional[str] = None
    alert_type: Optional[str] = None


class RecommendationImpact(BaseModel):
    goal_id: UUID
    goal_name: str
    percentage: float


class RecommendationResponse(BaseModel):
    id: UUID
    type: RecommendationType
    priority: int
    product: Optional[ProductResponse] = None
    message: RecommendationMessage
    impact: Optional[RecommendationImpact] = None
    
    class Config:
        from_attributes = True


class RecommendationRequest(BaseModel):
    purchase_context: PurchaseContext


class RecommendationListResponse(BaseModel):
    recommendations: List[RecommendationResponse]


class TrackingEvent(BaseModel):
    recommendation_id: UUID
    event_type: str = Field(..., pattern="^(shown|clicked|dismissed)$")
    context: Optional[PurchaseContext] = None


# Impact Analysis Schemas
class GoalImpact(BaseModel):
    goal_id: UUID
    goal_name: str
    impact_percentage: float
    new_amount: float
    remaining: float
    is_warning: bool
    description: str


class ImpactAnalysisRequest(BaseModel):
    purchase_amount: float = Field(..., gt=0)


class ImpactAnalysisResponse(BaseModel):
    affected_goals: List[GoalImpact]
    total_goals: int
    warnings_count: int


# Analytics Schemas
class AnalyticsEvent(BaseModel):
    event_type: str
    event_data: Optional[Dict[str, Any]] = None
    session_id: Optional[str] = None
    page_url: Optional[str] = None


# Health Check Schema
class HealthResponse(BaseModel):
    status: str
    version: str
    database: str
    redis: Optional[str] = None
    timestamp: datetime
