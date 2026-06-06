# Backend Application

The backend FastAPI app lives in `backend`.

## Configuration

Runtime settings are defined in `backend/config.py` using `pydantic-settings`.
By default, settings are loaded from `backend/.env`.

Tracked example values are available in `backend/.env.example`.

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

## Employee API

Employee CRUD endpoints:

```text
POST /employees
GET /employees
GET /employees/{employee_id}
PATCH /employees/{employee_id}
DELETE /employees/{employee_id}
```

The list endpoint supports `page`, `page_size`, `search`, `country`, and `job_title` query parameters.
