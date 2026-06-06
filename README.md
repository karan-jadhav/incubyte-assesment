# Salary Management Tool

Minimal salary management application for HR workflows. The app supports
employee record management, salary search/filtering, seeded data, and salary
insights by country and job title.

## Features

- Employee create, read, update, and delete
- Paginated employee table
- Debounced employee name search
- Country and job-title filters
- Backend-backed country and job-title dropdowns
- Country salary summary
- Job-title salary summary within a country
- Salary breakdown by job title
- Top countries by average salary with configurable result count
- Deterministic seed script for 10,000 employees

## Stack

Backend:

- Python 3.14+
- FastAPI
- SQLAlchemy async ORM
- Alembic
- PostgreSQL 18
- pytest
- Ruff

Frontend:

- React
- Vite
- TanStack Router
- TanStack Query
- Tailwind CSS
- Lucide React icons

## Project Structure

```text
backend/       FastAPI application, services, repositories, schemas, tests
frontend/      React application
alembic/       Database migrations
docs/          PRD and implementation notes
docker-compose.yml
pyproject.toml
```

## Local Setup

Start PostgreSQL:

```bash
docker compose up -d postgres
```

Apply database migrations:

```bash
uv run alembic upgrade head
```

Seed default employee data:

```bash
uv run python -m backend.seed_employees
```

Start the backend API:

```bash
uv run uvicorn backend.main:app --reload
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Start the frontend:

```bash
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

The frontend dev server runs on port `3000`.

## API

Health:

```text
GET /health
```

Employee endpoints:

```text
POST /employees
GET /employees
GET /employees/countries
GET /employees/job-titles
GET /employees/{employee_id}
PATCH /employees/{employee_id}
DELETE /employees/{employee_id}
```

Insight endpoints:

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
npm run lint
npm run build
```

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
