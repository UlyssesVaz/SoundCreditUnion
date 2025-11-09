# Sound CU Co-Pilot Backend

Production-ready FastAPI backend for the Sound Credit Union Financial Co-Pilot Chrome extension.

## 🚀 Features

- **JWT Authentication** with refresh tokens
- **Goal Management** - Full CRUD for financial goals
- **AI-Powered Recommendations** - OpenAI-enhanced product suggestions
- **Impact Analysis** - See how purchases affect your goals
- **Product Catalog** - Sound CU's full product lineup
- **Analytics Tracking** - Event tracking for recommendations

## 📋 Prerequisites

- Docker & Docker Compose
- Python 3.11+ (for local development)
- OpenAI API Key (optional, for AI recommendations)

## 🏃 Quick Start

### 1. Clone and Setup

```bash
cd soundcu-backend
cp .env.example .env
```

### 2. Add OpenAI API Key (Optional)

Edit `.env` and add your OpenAI key:
```bash
OPENAI_API_KEY=sk-your-key-here
```

### 3. Start Services

```bash
docker-compose up -d
```

This starts:
- PostgreSQL on `localhost:5432`
- Backend API on `localhost:8000`

### 4. Initialize Database

```bash
# Wait for services to be healthy
sleep 10

# Run database initialization
docker-compose exec backend python scripts/init_db.py
```

### 5. Test the API

```bash
# Health check
curl http://localhost:8000/v1/health

# View API docs
open http://localhost:8000/v1/docs
```

## 👥 Test Users

Three personas are pre-loaded for testing:

### 1. Sarah Chen - Young Professional 🎓
```
Email: sarah@example.com
Password: password123
Income: $65K | Credit: 720 | Segment: Growth
Goals: House down payment, Student loans, Dining budget
```

### 2. Marcus Thompson - High Earner 💼
```
Email: marcus@example.com
Password: password123
Income: $180K | Credit: 790 | Segment: High-Value
Goals: European vacation, Home renovation, Shopping budget
```

### 3. Jamie Rodriguez - Budget-Conscious Parent 👨‍👩‍👧
```
Email: jamie@example.com
Password: password123
Income: $48K | Credit: 650 | Segment: New
Goals: Emergency fund, Monthly budget, Groceries, CC debt
```

## 🔌 API Endpoints

### Authentication
- `POST /v1/auth/register` - Register new user
- `POST /v1/auth/login` - Login
- `POST /v1/auth/refresh` - Refresh access token
- `POST /v1/auth/logout` - Logout
- `GET /v1/auth/me` - Get current user

### Users
- `GET /v1/users/me` - Get profile
- `PUT /v1/users/me` - Update profile
- `DELETE /v1/users/me` - Delete account

### Goals
- `GET /v1/goals` - List all goals
- `POST /v1/goals` - Create goal
- `GET /v1/goals/{id}` - Get specific goal
- `PUT /v1/goals/{id}` - Update goal
- `DELETE /v1/goals/{id}` - Delete goal
- `POST /v1/goals/impact-analysis` - Analyze purchase impact

### Recommendations
- `POST /v1/recommendations/get` - Get AI-powered recommendations
- `POST /v1/recommendations/track` - Track recommendation events

### Products
- `GET /v1/products` - List all products

## 🧪 Testing the Extension

### 1. Login as Sarah
```bash
curl -X POST http://localhost:8000/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"sarah@example.com","password":"password123"}'
```

Save the `access_token` from the response.

### 2. Get Recommendations
```bash
curl -X POST http://localhost:8000/v1/recommendations/get \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "purchase_context": {
      "amount": 1500,
      "merchant": "BestBuy",
      "category": "electronics"
    }
  }'
```

### 3. Analyze Impact on Goals
```bash
curl -X POST http://localhost:8000/v1/goals/impact-analysis \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"purchase_amount": 500}'
```

## 📊 Database Schema

```
users
  - id (uuid, primary key)
  - email (unique)
  - financial_profile (jsonb)
  - segment (string)

goals
  - id (uuid, primary key)
  - user_id (fk to users)
  - type (savings|spending_limit|debt_payoff)
  - target_amount
  - current_amount
  - status

products
  - id (uuid, primary key)
  - type (loan|credit_card|savings_account|checking_account)
  - name
  - base_rate
  - eligibility criteria

recommendations
  - id (uuid, primary key)
  - user_id (fk to users)
  - product_id (fk to products)
  - message (jsonb)
  - tracking metrics
```

## 🛠️ Development

### Local Development (without Docker)

```bash
# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start PostgreSQL
docker-compose up -d postgres

# Run migrations
python scripts/init_db.py

# Start server
uvicorn main:app --reload
```

### View Logs

```bash
# All services
docker-compose logs -f

# Just backend
docker-compose logs -f backend
```

### Stop Services

```bash
docker-compose down
```

### Reset Database

```bash
docker-compose down -v
docker-compose up -d
docker-compose exec backend python scripts/init_db.py
```

## 🎯 API Response Times

Target: All endpoints < 200ms

- Auth endpoints: ~50-100ms
- Goal CRUD: ~30-80ms
- Recommendations (rules-based): ~100-150ms
- Recommendations (AI-enhanced): ~800-1500ms (due to OpenAI call)

## 🔐 Security Features

- JWT access tokens (30 min expiry)
- Refresh tokens (7 day expiry)
- Password hashing with bcrypt
- CORS protection
- Request validation with Pydantic
- Rate limiting ready (not enabled in dev)

## 📝 Environment Variables

See `.env.example` for all configuration options.

Key settings:
- `DATABASE_URL` - PostgreSQL connection string
- `SECRET_KEY` - JWT signing key (change in production!)
- `OPENAI_API_KEY` - For AI recommendations
- `ENVIRONMENT` - development|production

## 🚢 Production Deployment

For production deployment:

1. Change `SECRET_KEY` to a secure random string
2. Set `ENVIRONMENT=production`
3. Configure proper CORS origins
4. Enable rate limiting
5. Set up proper logging/monitoring
6. Use managed PostgreSQL (RDS/Cloud SQL)
7. Add Redis for caching
8. Set up SSL/TLS

## 📚 API Documentation

Interactive docs available at:
- Swagger UI: http://localhost:8000/v1/docs
- ReDoc: http://localhost:8000/v1/redoc

## 🤝 Support

For issues or questions about the backend API, check:
1. API documentation at `/v1/docs`
2. Logs: `docker-compose logs -f backend`
3. Database: `docker-compose exec postgres psql -U soundcu soundcu_db`

## 📄 License

Proprietary - Sound Credit Union
