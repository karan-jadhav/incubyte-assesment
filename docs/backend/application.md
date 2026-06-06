# Backend Application

The backend FastAPI app lives in `backend`.

## Configuration

Runtime settings are defined in `backend/config.py` using `pydantic-settings`.
By default, settings are loaded from `backend/.env`.

Tracked example values are available in `backend/.env.example`.

Docker Compose loads backend container settings from `backend/.env.docker`.
That file uses the Compose database service name, `postgres`, instead of
`localhost`. It also provides `POSTGRES_USER`, `POSTGRES_PASSWORD`, and
`POSTGRES_DB` to the Postgres container.

Database access uses SQLAlchemy's async engine and sessions. The local database URL uses the `postgresql+psycopg` driver.

## Run

Start the API locally:

```bash
uv run uvicorn backend.main:app --reload
```

Health check:

```text
GET /health
```

## Docker

The backend production image is defined in `backend/Dockerfile`.

It runs Uvicorn on port `8000` and expects `DATABASE_URL` to point at the
PostgreSQL database. In Docker Compose, the backend service reads this value
from `backend/.env.docker`.

In Docker Compose, Traefik routes:

```text
https://incubyte-assesment.jadhav.dev/api
```

to the backend service and strips `/api` before forwarding the request.

## Employee API

Employee CRUD endpoints:

```text
POST /employees
GET /employees
GET /employees/countries
GET /employees/job-titles
GET /employees/{employee_id}
PATCH /employees/{employee_id}
DELETE /employees/{employee_id}
```

The list endpoint supports `page`, `page_size`, `search`, `country`, and `job_title` query parameters.

`GET /employees/countries` returns distinct countries for employee filters.

`GET /employees/job-titles` returns distinct job titles and supports an optional `country`
query parameter.

## Insight API

Salary insight endpoints:

```text
GET /insights/salary-summary
GET /insights/job-title-breakdown
GET /insights/top-countries
```

`GET /insights/salary-summary` requires `country` and supports an optional `job_title`
query parameter. It returns employee count, minimum salary, maximum salary, and average
salary for the selected scope.

`GET /insights/job-title-breakdown` requires `country` and returns salary summary rows grouped by job title.

`GET /insights/top-countries` returns countries ordered by average salary in
their stored native salary values. It supports an optional `limit` query
parameter from 1 to 20 and defaults to 5.
