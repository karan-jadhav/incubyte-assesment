# Frontend Application

The frontend React app lives in `frontend`.

## Stack

- Vite
- React
- Bun
- TanStack Router
- TanStack Query
- TanStack Query Devtools
- Tailwind CSS
- Lucide React icons

## Configuration

The API base URL is read from `VITE_API_BASE_URL`.

If the variable is not set, the frontend uses `/api`.

Example local API configuration:

```bash
VITE_API_BASE_URL=http://localhost:8000 bun run dev
```

## Run

Install dependencies:

```bash
cd frontend
bun install
```

Start the local frontend:

```bash
bun run dev
```

The dev server uses port `3000`.

## Docker

The frontend production image is defined in `frontend/Dockerfile`.

The Docker image builds static assets with:

```text
VITE_API_BASE_URL=/api
```

and serves them through a Bun static server on port `3000`. The static server
rejects path traversal attempts and falls back to `index.html` for client-side
routes.

In Docker Compose, Traefik routes:

```text
https://incubyte-assesment.jadhav.dev
```

to the frontend service.

## Validate

```bash
cd frontend
bun run lint
bun run build
```

Use `bun run check` to run Prettier in check mode.

## Structure

```text
frontend/src/
  api/
    client.ts
    hooks.ts
    types.ts
  components/
    app-shell.tsx
  routes/
    __root.tsx
    index.tsx
    employees.tsx
    insights.tsx
  query-client.ts
  router.tsx
  styles.css
```

`client.ts` is limited to the shared fetch wrapper and error handling.
Application API calls are exposed from `hooks.ts` as TanStack Query hooks and
mutations.

## Routes

### Employees

`/employees` provides employee management:

- Paginated employee table
- Debounced search by employee name
- Country and job-title filters
- Add employee modal
- Edit employee modal
- Delete confirmation dialog

Country and job-title options come from backend lookup APIs. Job titles are
scoped by country in filters and in the employee form.

### Insights

`/insights` provides salary analytics:

- Country salary summary
- Minimum, maximum, and average salary
- Job-title salary summary within a country
- Job-title salary breakdown table
- Top countries by average salary with configurable result count

The page uses backend aggregation endpoints so calculations stay in sync with
employee create, update, and delete actions.

## API Endpoints Used

```text
GET /employees
GET /employees/countries
GET /employees/job-titles
POST /employees
PATCH /employees/{employee_id}
DELETE /employees/{employee_id}
GET /insights/salary-summary
GET /insights/job-title-breakdown
GET /insights/top-countries
```
