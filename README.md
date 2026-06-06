# Salary Management Tool

Salary Management Tool is a full-stack HR application for managing employee
salary records and reviewing compensation insights. It includes a FastAPI
backend, PostgreSQL persistence, deterministic employee seeding, and a React
frontend with employee workflows and salary analytics.

## Features

- Employee create, read, update, and delete
- Paginated employee table
- Debounced employee search
- Country and job-title filters
- Backend-backed country and job-title dropdowns
- Add/edit employee modal and delete confirmation dialog
- Country salary summary
- Role-specific salary summary within a country
- Job-title salary breakdown within a country
- Top country salary spread chart and table
- Employee distribution and salary charts with Recharts
- Deterministic seed script for 10,000 employees
- Docker production setup with Traefik, HTTPS, frontend, backend, and Postgres

## Stack

Backend:

- Python 3.13+ for local development
- FastAPI
- SQLAlchemy async ORM
- Alembic
- PostgreSQL
- pytest
- Ruff

Frontend:

- React
- Vite
- Bun
- TanStack Router
- TanStack Query
- Recharts
- Tailwind CSS
- Lucide React icons

Deployment:

- Docker Compose
- Backend image: `python:3.14-slim`
- Frontend image: `oven/bun:latest`
- Database image: `postgres:18`
- Reverse proxy: `traefik:v3`

## Project Structure

```text
backend/       FastAPI app, config, routes, schemas, services, repositories, tests
frontend/      React app, routes, API hooks, Bun production static server
alembic/       Database migrations
docs/          PRD and implementation notes
docker-compose.yml
pyproject.toml
```

## Prerequisites

Local development:

- Python 3.13+
- `uv`
- Bun
- Docker and Docker Compose for PostgreSQL

Production Docker deployment:

- Docker Engine
- Docker Compose plugin
- A domain pointing to the server
- Ports `80` and `443` open for Traefik and Let's Encrypt

## Environment Files

Create local backend env from the example:

```bash
cp backend/.env.example backend/.env
```

Default local values:

```env
APP_NAME="Incubyte Salary Management API"
APP_ENVIRONMENT=development
DATABASE_URL=postgresql+psycopg://incubyte:incubyte@localhost:5432/incubyte
APP_DEBUG=false
POSTGRES_USER=incubyte
POSTGRES_PASSWORD=incubyte
POSTGRES_DB=incubyte
```

For Docker deployment, create `backend/.env.docker` on the server:

```env
APP_NAME="Incubyte Salary Management API"
APP_ENVIRONMENT=production
DATABASE_URL=postgresql+psycopg://incubyte:CHANGE_ME@postgres:5432/incubyte
APP_DEBUG=false
POSTGRES_USER=incubyte
POSTGRES_PASSWORD=CHANGE_ME
POSTGRES_DB=incubyte
```

Keep `DATABASE_URL`, `POSTGRES_USER`, `POSTGRES_PASSWORD`, and `POSTGRES_DB`
aligned. The Docker database hostname is `postgres`, not `localhost`.

## Local Setup

Install backend dependencies:

```bash
uv sync
```

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Apply migrations:

```bash
uv run alembic upgrade head
```

Seed deterministic employee data:

```bash
uv run python -m backend.seed_employees
```

Start the backend API:

```bash
uv run uvicorn backend.main:app --reload
```

The backend runs at:

```text
http://localhost:8000
```

Health check:

```text
GET http://localhost:8000/health
```

Install frontend dependencies:

```bash
cd frontend
bun install
```

Start the frontend dev server:

```bash
VITE_API_BASE_URL=http://localhost:8000 bun run dev
```

The frontend runs at:

```text
http://localhost:3000
```

## Docker Deployment

The production Docker setup serves:

```text
https://incubyte-assesment.jadhav.dev
```

Routing:

```text
/      frontend container
/api   backend container, with /api stripped before forwarding
```

Build and start all containers:

```bash
docker compose up -d --build
```

For production, set the Let's Encrypt ACME email when starting the full stack:

```bash
TRAEFIK_ACME_EMAIL=admin@jadhav.dev docker compose up -d --build
```

Apply migrations in the backend container:

```bash
docker compose exec backend alembic upgrade head
```

Seed employee data:

```bash
docker compose exec backend python -m backend.seed_employees
```

Check containers:

```bash
docker compose ps
```

View logs with Docker timestamps:

```bash
docker compose logs -f -t backend
docker compose logs -f -t frontend
```

The backend image also configures Uvicorn logs with timestamps and proxy header
support, so access logs can show the original forwarded client IP from Traefik.

## Rebuild Commands

Rebuild only the frontend app container:

```bash
docker compose up -d frontend --build --no-deps
```

Rebuild only the backend app container:

```bash
docker compose up -d backend --build --no-deps
```

`--no-deps` prevents Docker Compose from walking service dependency chains and
restarting dependency containers such as Postgres during app-only rebuilds.

Run migrations after backend changes that include schema updates:

```bash
docker compose exec backend alembic upgrade head
```

## API Endpoints

Health:

```text
GET /health
```

Employees:

```text
POST /employees
GET /employees
GET /employees/countries
GET /employees/job-titles
GET /employees/{employee_id}
PATCH /employees/{employee_id}
DELETE /employees/{employee_id}
```

Insights:

```text
GET /insights/salary-summary
GET /insights/job-title-breakdown
GET /insights/top-countries
```

## Validation

Backend:

```bash
uv run ruff format backend
uv run ruff check backend
uv run pytest backend/tests
```

Frontend:

```bash
cd frontend
bun run lint
bun run build
```

Production image smoke checks:

```bash
docker compose build backend frontend
docker compose up -d
docker compose ps
```

## Troubleshooting

If the backend cannot connect to the database locally, verify that Postgres is
running and that `backend/.env` uses `localhost` in `DATABASE_URL`.

If the backend cannot connect to the database in Docker, verify that
`backend/.env.docker` uses `postgres` in `DATABASE_URL`.

If HTTPS certificates are not issued, verify that the domain points to the
server and that ports `80` and `443` are reachable.

If frontend API calls fail in Docker, verify that the frontend was built with:

```text
VITE_API_BASE_URL=/api
```

The included Compose build args already set this value.

## AI Assistance

OpenAI Codex was used as the AI coding assistant for this project. The workflow
was agent-assisted but developer-directed:

- I used Codex to read the PRD and existing code, then break the work into
  backend, frontend, Docker, and documentation tasks.
- Codex helped implement repository, service, route, React, TanStack Query,
  Docker, and README changes across the project.
- I reviewed the generated changes, clarified requirements during the build,
  and directed follow-up refinements such as modal behavior, dropdown UX,
  Recharts insights, Docker serving, logging, and deployment docs.
- Validation was performed through project commands such as `uv run ruff check
backend`, `bun run lint`, and `bun run build`.

## Documentation

- [Product Requirements](docs/prd.md)
- [Backend Application](docs/backend/application.md)
- [Database](docs/backend/database.md)
- [Seeding](docs/backend/seeding.md)
- [Frontend Application](docs/frontend/application.md)
- [Frontend README](frontend/README.md)

## Scope Notes

Authentication, audit history, payroll workflows, currency conversion, and
import/export are intentionally out of scope for this version. Salaries are
stored with their native currency; cross-country averages are displayed with the
stored currency and are not converted.
