# Salary Management Frontend

React frontend for the salary management tool. It uses TanStack Router for
file-based routing, TanStack Query for API state, and Tailwind CSS for styling.

## Run

Install dependencies:

```bash
bun install
```

Start the Vite dev server:

```bash
bun run dev
```

The dev server runs on port `3000` by default.

## Docker

Build the production image from the repository root:

```bash
docker build -f frontend/Dockerfile -t incubyte-frontend .
```

The image builds with `VITE_API_BASE_URL=/api` by default and serves static
assets with Bun on port `3000`.

## Backend URL

API requests use `VITE_API_BASE_URL`.

```bash
VITE_API_BASE_URL=http://localhost:8000 bun run dev
```

If `VITE_API_BASE_URL` is not set, the frontend uses `/api`.

## Scripts

```bash
bun run dev
bun run build
bun run lint
bun run check
bun run format
bun run generate-routes
```

## App Structure

```text
src/
  api/
    client.ts        Fetch wrapper and API error handling
    hooks.ts         TanStack Query hooks and mutations
    types.ts         API request and response types
  components/
    app-shell.tsx    Main application shell and navigation
  routes/
    __root.tsx       Root route, providers, and devtools
    index.tsx        Dashboard entry route
    employees.tsx    Employee table, filters, create/edit modal, delete dialog
    insights.tsx     Salary insight dashboard
  query-client.ts    Shared TanStack Query client
  router.tsx         TanStack Router setup
  styles.css         Tailwind CSS entry and global styles
```

## Features

### Employees

The Employees route supports:

- Paginated employee table
- Debounced name search after 3 or more characters
- Country and job-title filters from backend lookup APIs
- Add employee modal
- Edit employee modal
- Delete confirmation dialog

The add/edit modal uses backend-backed country and job-title dropdowns. Job
titles are scoped by the selected country.

### Insights

The Insights route supports:

- Country selector
- Top countries by average salary with configurable result count
- Country salary summary
- Job-title selector scoped by country
- Selected role salary summary
- Salary breakdown by job title within the selected country

Insights are loaded from backend aggregation APIs and refresh through TanStack
Query invalidation when employee records change.

## API Integration

`src/api/client.ts` only contains the reusable API client. Route-specific API
calls live in `src/api/hooks.ts` as TanStack Query hooks and mutations.

Implemented endpoints:

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

## Development Notes

TanStack Router route files are generated into `src/routeTree.gen.ts`. If routes
change and the dev server is not running, regenerate the route tree manually:

```bash
npm run generate-routes
```

TanStack Query Devtools are enabled from the root route during development.
