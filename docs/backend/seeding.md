# Seeding

The seed script creates deterministic employee records for local development.

It reads first and last names from:

* `backend/seed_data/first_names.txt`
* `backend/seed_data/last_names.txt`

## Commands

Seed the default 10,000 employees:

```bash
uv run python -m backend.seed_employees
```

Reset and reseed generated employees:

```bash
uv run python -m backend.seed_employees --reset
```

Run a smaller smoke seed:

```bash
uv run python -m backend.seed_employees --count 25 --reset
```

The script only resets records whose `employee_code` starts with `SEED-`.
