# PricePilot Backend

PricePilot is a production-style FastAPI backend for short-term rental revenue intelligence. It supports property management, booking CSV ingestion, analytics, pricing recommendations, AI insights, authentication, organization-based data isolation, and audit logging.

---

## What This Backend Does

PricePilot helps rental/property teams:

- create and manage rental properties
- upload booking data through CSV files
- preview and map CSV columns before processing
- validate bookings and track failed rows
- view revenue, occupancy, performance, and trend analytics
- generate pricing recommendations
- ask AI-powered revenue questions
- track user/API activity through audit logs

---

## Tech Stack

- Python
- FastAPI
- PostgreSQL
- SQLModel / SQLAlchemy
- Alembic
- Pandas
- Redis
- JWT authentication
- SlowAPI rate limiting
- OpenRouter / OpenAI-compatible LLM API
- Pytest
- Docker / Docker Compose
- GitHub Actions

---

## Core Features

### Authentication

- User registration and login
- JWT-based protected APIs
- Password hashing using secure hashing
- Demo login support for recruiters/reviewers

### Organization-Based Access

- Users belong to an organization/workspace
- Data is isolated by organization
- Users can only access their own properties, bookings, analytics, uploads, insights, and audit logs
- Personal email domains create personal workspaces
- Company email domains create company-style workspaces

### Property Management

- Create, list, update, and delete properties
- Filter properties by city and property type
- Duplicate property names are blocked within the same organization

### Booking CSV Ingestion

- CSV upload preview
- Dynamic column mapping
- Background processing
- Job status tracking
- Failed row reporting with row number, reason, and raw row data

### Analytics

- Revenue summary
- Revenue by city
- Revenue by property
- Occupancy summary
- Dashboard summary
- Advanced performance analytics
- Revenue and booking trends

### Pricing Recommendations

- Property-level price recommendation
- Demand and city-based comparison
- Confidence and explanation included in response

### AI Insights

- Ask natural language questions over booking/revenue data
- Returns answer, supporting facts, confidence, context summary, and source
- Fallback behavior works when no LLM key is configured

### Logging and Security

- Structured request logs
- Database-backed audit logs
- Rate limiting for sensitive endpoints
- Redis caching for analytics
- Dockerized development setup

---

## Project Structure

```text
app/
├── api/
├── core/
├── db/
├── schemas/
├── services/
└── main.py

alembic/
scripts/
tests/
```

---

## Environment Variables

Create a `.env` file based on `.env.example`.

For Docker:

```env
DATABASE_URL=postgresql+psycopg://pricepilot:pricepilot@postgres:5432/pricepilot
REDIS_URL=redis://redis:6379/0
```

For local Python execution:

```env
DATABASE_URL=postgresql+psycopg://pricepilot:pricepilot@localhost:5433/pricepilot
REDIS_URL=redis://localhost:6379/0
```

Important variables:

```env
JWT_SECRET_KEY=change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=60
RATE_LIMIT_ENABLED=true
OPENAI_API_KEY=
OPENAI_MODEL=stepfun/step-3.5-flash:free
UPLOAD_DIR=uploads
```

---

## Run Locally With Docker

```bash
docker compose up --build
```

Open Swagger:

```text
http://127.0.0.1:8000/docs
```

Run migrations inside Docker:

```bash
docker compose exec api alembic upgrade head
```

---

## Run Locally Without Docker API

Start PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Use local database URL:

```powershell
$env:DATABASE_URL="postgresql+psycopg://pricepilot:pricepilot@localhost:5433/pricepilot"
```

Run migrations:

```bash
alembic upgrade head
```

Start API:

```bash
python -m uvicorn app.main:app --reload
```

---

## Demo Login

The backend includes a demo login endpoint:

```http
POST /api/auth/demo-login
```

It creates/uses a demo workspace with sample properties and bookings, then returns a JWT token.

For Swagger OAuth authorization, use:

```text
username: demo@pricepilot.app
password: Demo@12345
```

---

## Main API Endpoints

### Auth

```http
POST /api/auth/register
POST /api/auth/login
POST /api/auth/demo-login
GET  /api/auth/me
```

### Properties

```http
POST   /api/properties
GET    /api/properties
GET    /api/properties/{property_id}
PUT    /api/properties/{property_id}
DELETE /api/properties/{property_id}
```

### Uploads

```http
POST /api/upload/bookings/preview
POST /api/upload/bookings/process
GET  /api/upload/jobs/{job_id}
GET  /api/upload/jobs/{job_id}/errors
```

### Analytics

```http
GET /api/analytics/revenue
GET /api/analytics/revenue/by-city
GET /api/analytics/revenue/by-property
GET /api/analytics/occupancy
GET /api/analytics/dashboard-summary
GET /api/analytics/performance
GET /api/analytics/trends
```

### Pricing

```http
GET /api/recommendations/pricing/{property_id}
```

### AI Insights

```http
POST /api/insights/query
```

Example:

```json
{
  "question": "Which city has highest bookings?"
}
```

### Audit Logs

```http
GET /api/audit-logs
```

---

## Tests

Run:

```bash
python -m pytest
```

Current status:

```text
12 tests passing
```

Format and sort imports:

```bash
python -m black app tests scripts
python -m isort app tests scripts
```

---

## Migrations

Create migration:

```bash
alembic revision --autogenerate -m "message"
```

Apply migrations:

```bash
alembic upgrade head
```

Check current migration:

```bash
alembic current
```

Latest backend migration includes audit logs.

---
