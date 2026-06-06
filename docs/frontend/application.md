# Frontend Application

The frontend React app lives in `frontend`.

## Stack

- Vite
- React
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
VITE_API_BASE_URL=http://localhost:8000 npm run dev
```

## Run

Install dependencies:

```bash
cd frontend
npm install
```

Start the local frontend:

```bash
npm run dev
```

The dev server uses port `3000`.

## Validate

```bash
cd frontend
npm run lint
npm run build
```

Use `npm run check` to run Prettier in check mode.

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
```
