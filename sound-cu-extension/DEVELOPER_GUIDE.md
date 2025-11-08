# Developer Guide - Backend Integration

This guide explains how to integrate the Chrome extension with your FastAPI backend.

## 🏗️ Backend Architecture

### Required Endpoints

#### 1. **Benefit Matching** - `POST /api/v1/benefits/relevant`

Returns relevant CU benefits based on purchase context.

**Request:**
```json
{
  "amount": 1250.50,
  "merchant": "amazon.com",
  "currency": "USD",
  "timestamp": "2025-01-20T15:30:00Z",
  "userId": "member_12345" // Optional, from auth
}
```

**Response:**
```json
{
  "benefits": [
    {
      "id": "low-rate-loan",
      "type": "loan",
      "title": "Low-Rate Purchase Loan",
      "description": "Get 5.99% APR for purchases over $1,000",
      "savings": "Save $150 vs. typical credit card",
      "eligibility": true,
      "ctaText": "Apply Now",
      "ctaUrl": "https://soundcu.org/loans/apply?amount=1250.50"
    },
    {
      "id": "cashback-rewards",
      "type": "cashback",
      "title": "3% Cashback",
      "description": "Use your Sound CU Rewards Card",
      "savings": "Earn $37.52 back",
      "eligibility": true,
      "ctaText": "Use Rewards Card",
      "ctaUrl": null
    }
  ]
}
```

#### 2. **User Sync** - `POST /api/v1/sync`

Sync user goals and preferences with the backend.

**Request:**
```json
{
  "goals": [
    {
      "id": "goal_1234567890_abc",
      "name": "Emergency Fund",
      "type": "savings",
      "targetAmount": 1000.00,
      "currentAmount": 250.00,
      "deadline": "2025-12-31",
      "notes": "",
      "createdAt": "2025-01-15T10:30:00Z",
      "lastUpdated": "2025-01-20T15:45:00Z"
    }
  ],
  "userPreferences": {
    "enableNotifications": true,
    "enableCheckoutPrompts": true,
    "enableGoalTracking": true
  }
}
```

**Response:**
```json
{
  "success": true,
  "lastSync": "2025-01-20T15:45:00Z",
  "conflicts": []
}
```

#### 3. **User Profile** - `GET /api/v1/user/profile`

Get user account information and eligibility data.

**Response:**
```json
{
  "userId": "member_12345",
  "name": "John Doe",
  "memberSince": "2020-03-15",
  "accountTypes": ["checking", "savings", "rewards_card"],
  "eligibleBenefits": [
    "low-rate-loans",
    "cashback-rewards",
    "savings-bonus"
  ],
  "preferences": {
    "contactMethod": "email",
    "language": "en"
  }
}
```

## 🔐 Authentication

### Option 1: Cookie-Based Auth

If users are already logged into soundcu.org, the extension can use existing cookies:

```javascript
// In background.js
async function callAPI(endpoint, data) {
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include', // Include cookies
    body: JSON.stringify(data)
  });
  return await response.json();
}
```

**Backend (FastAPI):**
```python
from fastapi import FastAPI, Cookie, HTTPException

@app.post("/api/v1/benefits/relevant")
async def get_relevant_benefits(
    request: BenefitRequest,
    session_token: str = Cookie(None)
):
    if not session_token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    user = await verify_session(session_token)
    benefits = await match_benefits(user, request)
    return {"benefits": benefits}
```

### Option 2: OAuth 2.0 with PKCE

For more secure authentication:

**1. Add OAuth to manifest.json:**
```json
{
  "oauth2": {
    "client_id": "your_extension_client_id",
    "scopes": ["openid", "profile", "financial_data"]
  },
  "permissions": ["identity"]
}
```

**2. Implement login flow in background.js:**
```javascript
async function authenticateUser() {
  return new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow({
      url: `${API_BASE_URL}/oauth/authorize?client_id=...&redirect_uri=...`,
      interactive: true
    }, (redirectUrl) => {
      if (chrome.runtime.lastError) {
        reject(chrome.runtime.lastError);
      } else {
        const token = new URL(redirectUrl).searchParams.get('token');
        resolve(token);
      }
    });
  });
}
```

## 📡 Backend Implementation Example (FastAPI)

### Setup

```python
# requirements.txt
fastapi==0.109.0
uvicorn==0.27.0
pydantic==2.5.0
python-jose==3.3.0
redis==5.0.1
```

### Main Application

```python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

app = FastAPI(title="Sound CU Extension API")

# CORS for extension
app.add_middleware(
    CORSMiddleware,
    allow_origins=["chrome-extension://*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class PurchaseContext(BaseModel):
    amount: float
    merchant: str
    currency: str = "USD"
    timestamp: datetime
    userId: Optional[str] = None

class Benefit(BaseModel):
    id: str
    type: str
    title: str
    description: str
    savings: str
    eligibility: bool
    ctaText: str
    ctaUrl: Optional[str] = None

class BenefitResponse(BaseModel):
    benefits: List[Benefit]

# Endpoints
@app.post("/api/v1/benefits/relevant", response_model=BenefitResponse)
async def get_relevant_benefits(context: PurchaseContext):
    """
    Match benefits based on purchase context.
    """
    benefits = []
    
    # Example: Low-rate loan for large purchases
    if context.amount >= 1000:
        benefits.append(Benefit(
            id="low-rate-loan",
            type="loan",
            title="Low-Rate Purchase Loan",
            description=f"Get 5.99% APR for this ${context.amount:.2f} purchase",
            savings=f"Save ${context.amount * 0.12:.2f} vs. typical credit card",
            eligibility=True,
            ctaText="Apply Now",
            ctaUrl=f"https://soundcu.org/loans/apply?amount={context.amount}"
        ))
    
    # Example: Cashback for all purchases
    cashback_rate = 0.03
    cashback_amount = context.amount * cashback_rate
    benefits.append(Benefit(
        id="cashback-rewards",
        type="cashback",
        title=f"{int(cashback_rate * 100)}% Cashback",
        description="Use your Sound CU Rewards Card",
        savings=f"Earn ${cashback_amount:.2f} back",
        eligibility=True,
        ctaText="Use Rewards Card",
        ctaUrl=None
    ))
    
    return BenefitResponse(benefits=benefits)

@app.post("/api/v1/sync")
async def sync_user_data(sync_data: dict):
    """
    Sync user goals and preferences.
    """
    # Store in database
    # await db.store_user_goals(sync_data['goals'])
    # await db.store_user_preferences(sync_data['userPreferences'])
    
    return {
        "success": True,
        "lastSync": datetime.utcnow().isoformat(),
        "conflicts": []
    }

@app.get("/api/v1/user/profile")
async def get_user_profile(user_id: str):
    """
    Get user profile and eligibility.
    """
    # Fetch from database
    return {
        "userId": user_id,
        "name": "John Doe",
        "memberSince": "2020-03-15",
        "accountTypes": ["checking", "savings", "rewards_card"],
        "eligibleBenefits": [
            "low-rate-loans",
            "cashback-rewards",
            "savings-bonus"
        ],
        "preferences": {
            "contactMethod": "email",
            "language": "en"
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
```

### Database Schema (PostgreSQL)

```sql
-- Users table
CREATE TABLE users (
    user_id VARCHAR(255) PRIMARY KEY,
    member_id VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255),
    email VARCHAR(255),
    member_since DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Goals table
CREATE TABLE goals (
    goal_id VARCHAR(255) PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(50) NOT NULL,
    target_amount DECIMAL(10, 2) NOT NULL,
    current_amount DECIMAL(10, 2) DEFAULT 0,
    current_spending DECIMAL(10, 2) DEFAULT 0,
    deadline DATE,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Benefits table
CREATE TABLE benefits (
    benefit_id VARCHAR(255) PRIMARY KEY,
    type VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    eligibility_rules JSONB,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences
CREATE TABLE user_preferences (
    user_id VARCHAR(255) PRIMARY KEY REFERENCES users(user_id),
    enable_notifications BOOLEAN DEFAULT true,
    enable_checkout_prompts BOOLEAN DEFAULT true,
    enable_goal_tracking BOOLEAN DEFAULT true,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Purchase context log (for analytics)
CREATE TABLE purchase_contexts (
    context_id SERIAL PRIMARY KEY,
    user_id VARCHAR(255) REFERENCES users(user_id),
    amount DECIMAL(10, 2),
    merchant VARCHAR(255),
    currency VARCHAR(3),
    timestamp TIMESTAMP,
    benefits_shown JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## 🧪 Testing the Integration

### 1. Local Testing

Start your FastAPI server:
```bash
uvicorn main:app --reload
```

Update `background.js`:
```javascript
const API_BASE_URL = 'http://localhost:8000';
```

### 2. Test Endpoints with cURL

```bash
# Test benefit matching
curl -X POST http://localhost:8000/api/v1/benefits/relevant \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 1500,
    "merchant": "amazon.com",
    "currency": "USD",
    "timestamp": "2025-01-20T15:30:00Z"
  }'

# Test sync
curl -X POST http://localhost:8000/api/v1/sync \
  -H "Content-Type: application/json" \
  -d '{
    "goals": [],
    "userPreferences": {
      "enableNotifications": true
    }
  }'
```

### 3. Production Deployment

Deploy your FastAPI app to:
- AWS Lambda + API Gateway
- Google Cloud Run
- Heroku
- Digital Ocean App Platform

Update the extension's `API_BASE_URL` to your production endpoint.

## 📊 Analytics & Monitoring

### Track Extension Usage

```python
from fastapi import Request

@app.post("/api/v1/analytics/event")
async def track_event(request: Request, event_data: dict):
    """
    Track extension events for analytics.
    """
    # Log to analytics service
    # await analytics.track(event_data)
    
    return {"success": True}
```

### Extension Events to Track

```javascript
// In background.js
async function trackEvent(eventName, data) {
  await fetch(`${API_BASE_URL}/api/v1/analytics/event`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      event: eventName,
      data: data,
      timestamp: new Date().toISOString()
    })
  });
}

// Track checkout detections
trackEvent('checkout_detected', { merchant: 'amazon.com', amount: 150 });

// Track benefit views
trackEvent('benefit_shown', { benefitId: 'low-rate-loan' });

// Track goal creation
trackEvent('goal_created', { goalType: 'savings' });
```

## 🔄 Real-time Updates with WebSockets

For real-time notifications:

```python
from fastapi import WebSocket

@app.websocket("/ws/{user_id}")
async def websocket_endpoint(websocket: WebSocket, user_id: str):
    await websocket.accept()
    try:
        while True:
            # Send updates to extension
            await websocket.send_json({
                "type": "benefit_update",
                "data": {...}
            })
    except Exception as e:
        print(f"WebSocket error: {e}")
```

```javascript
// In background.js
const ws = new WebSocket(`wss://api.soundcu.org/ws/${userId}`);

ws.onmessage = (event) => {
  const message = JSON.parse(event.data);
  if (message.type === 'benefit_update') {
    // Update cached benefits
    chrome.storage.local.set({ cachedBenefits: message.data });
  }
};
```

## 🚀 Production Checklist

- [ ] Set up HTTPS for API (required for production)
- [ ] Implement rate limiting
- [ ] Add request validation and sanitization
- [ ] Set up error logging (Sentry, CloudWatch, etc.)
- [ ] Configure CORS properly for extension ID
- [ ] Implement caching (Redis) for benefit matching
- [ ] Add database connection pooling
- [ ] Set up CI/CD pipeline
- [ ] Create API documentation (Swagger/OpenAPI)
- [ ] Implement API versioning
- [ ] Add monitoring and alerting
- [ ] Security audit and penetration testing

---

**Need help?** Contact the dev team at developers@soundcu.org
