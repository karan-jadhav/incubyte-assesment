import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <section className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr]">
      <div>
        <p className="text-sm font-medium text-[#806941]">Salary Management</p>
        <h2 className="mt-1 max-w-3xl text-3xl font-semibold tracking-normal">
          Manage employee salary records without spreadsheet drift.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f574c]">
          The application shell and API client are in place. Employee workflows
          can now be wired against the FastAPI endpoints.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            to="/employees"
            className="inline-flex h-10 items-center justify-center rounded-md bg-[#1f5e67] px-4 text-sm font-semibold text-white transition hover:bg-[#174b52]"
          >
            Open employees
          </Link>
          <Link
            to="/insights"
            className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc4b4] bg-white px-4 text-sm font-semibold text-[#231f20] transition hover:bg-[#fffaf1]"
          >
            Open insights
          </Link>
        </div>
      </div>

      <dl className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1">
        {[
          ['Dataset', '10,000 employees'],
          ['Primary workflow', 'CRUD + filters'],
          ['Reporting', 'Country and role'],
        ].map(([label, value]) => (
          <div
            key={label}
            className="rounded-md border border-[#d8d0c2] bg-white p-4"
          >
            <dt className="text-xs font-semibold tracking-[0.08em] text-[#806941] uppercase">
              {label}
            </dt>
            <dd className="mt-2 text-lg font-semibold">{value}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}
