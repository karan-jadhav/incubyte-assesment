# Database

The local database runs on PostgreSQL 18 through Docker Compose.

## Local Connection

Default connection URL:

```text
postgresql+psycopg://incubyte:incubyte@localhost:5432/incubyte
```

Alembic reads `DATABASE_URL` when it is set. Plain `postgresql://` and `postgres://` URLs are normalized to use SQLAlchemy's `psycopg` driver.

SQLAlchemy models live in `backend/models.py`. Alembic imports `Base.metadata` from that module for autogenerate.

## Commands

Start the database:

```bash
docker compose up -d postgres
```

Create a migration:

```bash
uv run alembic revision -m "describe change"
```

Apply migrations:

```bash
uv run alembic upgrade head
```

Show the current migration:

```bash
uv run alembic current
```

Use `--autogenerate` after changing SQLAlchemy models so Alembic can compare `Base.metadata` with the database schema.
