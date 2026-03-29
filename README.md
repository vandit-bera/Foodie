# 🍜 Foodie — Full-Stack Social Food App

Instagram-style food discovery app with location-based feed.

## Stack

| Layer | Technology |
|-------|-----------|
| Mobile | React Native (Expo Router) |
| Web | Next.js 15 (App Router) |
| Backend | FastAPI (Python 3.12) |
| Database | PostgreSQL 16 + PostGIS |
| Auth | JWT (access 30m + refresh 7d rotation) |

---

## Project Structure

```
hacks/
├── backend/      ← FastAPI API server
├── web/          ← Next.js web app
└── mobile/       ← React Native (Expo) app
```

---

## Quick Start

### 1. Backend

**Prerequisites:** Docker, Docker Compose

```bash
cd backend

# Copy env file
cp .env.example .env
# Edit .env — set a strong JWT_SECRET_KEY

# Start PostgreSQL + API
docker compose up --build

# API docs available at:
# http://localhost:8000/api/docs
```

**Without Docker (local):**
```bash
cd backend
python -m venv venv && source venv/bin/activate
pip install -r requirements.txt

# Start PostgreSQL with PostGIS separately, then:
cp .env.example .env   # edit DATABASE_URL

alembic upgrade head          # run migrations
uvicorn app.main:app --reload  # start dev server
```

**Run tests:**
```bash
pytest tests/ -v
```

---

### 2. Web App

**Prerequisites:** Node.js 20+

```bash
cd web
npm install

cp .env.local.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1

npm run dev
# → http://localhost:3000
```

---

### 3. Mobile App

**Prerequisites:** Node.js 20+, Expo CLI, iOS Simulator or Android Emulator

```bash
cd mobile
npm install

# Update API URL in app.json → extra.apiUrl
# (Use your machine's local IP, not localhost, for physical devices)
# e.g. "apiUrl": "http://192.168.1.100:8000/api/v1"

npx expo start
```

---

## Environment Variables

### Backend (`.env`)

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | asyncpg PostgreSQL URL | `postgresql+asyncpg://...` |
| `JWT_SECRET_KEY` | JWT signing secret | **change in prod** |
| `ACCESS_TOKEN_EXPIRE_MINUTES` | Access token TTL | `30` |
| `REFRESH_TOKEN_EXPIRE_DAYS` | Refresh token TTL | `7` |
| `MEDIA_DIR` | Upload directory | `media` |
| `MAX_IMAGE_SIZE_MB` | Max image upload size | `5` |
| `ALLOWED_ORIGINS` | CORS origins (JSON array) | localhost |

### Web (`.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL |

---

## API Overview

```
POST   /api/v1/auth/signup
POST   /api/v1/auth/login
POST   /api/v1/auth/refresh
POST   /api/v1/auth/logout

GET    /api/v1/users/me
PATCH  /api/v1/users/me
POST   /api/v1/users/me/avatar
GET    /api/v1/users/{id}
GET    /api/v1/users/{id}/posts

POST   /api/v1/posts
GET    /api/v1/posts/feed?lat=&lng=&radius=10
GET    /api/v1/posts/{id}
DELETE /api/v1/posts/{id}

POST   /api/v1/posts/{id}/like
DELETE /api/v1/posts/{id}/like
GET    /api/v1/posts/{id}/likes

POST   /api/v1/posts/{id}/comments
GET    /api/v1/posts/{id}/comments
DELETE /api/v1/posts/{id}/comments/{cid}

GET    /api/v1/search/posts?q=biryani&city=Delhi
POST   /api/v1/upload/image
```

Full interactive docs: `http://localhost:8000/api/docs`

---

## Scaling Suggestions (V2+)

| Area | Recommendation |
|------|---------------|
| Image storage | Swap `upload_service.py` to S3 / Cloudflare R2 |
| Caching | Add Redis for feed caching (stale-while-revalidate) |
| Search | Replace pg_trgm with Elasticsearch / Typesense for better relevance |
| Background jobs | Celery + Redis for async image processing, notifications |
| CDN | Cloudfront / Cloudflare for static media |
| DB pooling | PgBouncer in front of PostgreSQL |
| Monitoring | Sentry (errors) + Prometheus + Grafana (metrics) |
| Rate limiting | SlowAPI middleware on FastAPI |
| Auth | Add Google/Apple OAuth |
| Push notifications | Expo Notifications + FCM |
