# Averlen Backend

FastAPI backend for Averlen's multi-tenant hospitality revenue intelligence platform.

## Main capabilities

- JWT authentication and refresh-token session management
- Refresh-token rotation and revocation
- Organization-scoped multi-tenant isolation
- Role-based authorization
- Property management
- Persistent user avatars and property photos through Cloudinary in production
- Booking CSV preview, mapping, validation, and ingestion
- Import history, data-quality reporting, and idempotency protection
- Revenue and occupancy analytics
- Pricing recommendations and recommendation history
- AI revenue insights through OpenRouter with fallback behavior
- Notifications, workspace invitations, access requests, and team management
- Audit logging
- Health and readiness endpoints

## Local development

Create `.env` from `.env.example`.

To use local PostgreSQL and Redis:

```bash
docker compose up -d postgres redis
```

Install dependencies:

```bash
pip install -r requirements-dev.txt
```

Apply migrations:

```bash
alembic upgrade head
```

Start the API:

```bash
python -m uvicorn app.main:app --reload
```

The API is available at `http://127.0.0.1:8000` by default.

## Media storage

Local development can use filesystem storage:

```env
MEDIA_STORAGE_BACKEND=local
```

Production uses Cloudinary:

```env
MEDIA_STORAGE_BACKEND=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=averlen
```

Cloudinary credentials must remain server-side and must never be exposed to the frontend.

## Tests

```bash
python -m pytest
```

PostgreSQL-specific integration tests can use a dedicated `TEST_DATABASE_URL` when explicitly required. Do not point test configuration at a production database.

## Production

Production values are supplied through environment variables. Do not commit `.env` files, API keys, database credentials, Redis credentials, or database exports.

External services:

- PostgreSQL through `DATABASE_URL`
- Redis through `REDIS_URL`
- Cloudinary for persistent media
- OpenRouter for optional LLM-backed insights

Important production settings include:

```env
ENVIRONMENT=production
DEBUG=false
ENABLE_DOCS=false
DATABASE_URL=
REDIS_URL=
JWT_SECRET_KEY=
FRONTEND_ORIGINS=
SITE_URL=

OPENROUTER_API_KEY=
OPENROUTER_MODEL=

MEDIA_STORAGE_BACKEND=cloudinary
CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
CLOUDINARY_FOLDER=averlen

REFRESH_COOKIE_SECURE=true
REFRESH_COOKIE_SAMESITE=none
```

Alembic migrations must run before the API serves a new release. The repository's root `render.yaml` contains the Render deployment configuration.
