import { Link, createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/')({ component: Home })

function Home() {
  return (
    <section>
      <div>
        <p className="text-sm font-medium text-[#806941]">
          Salary Management Dashboard
        </p>
        <h2 className="mt-1 max-w-3xl text-3xl font-semibold tracking-normal">
          Manage employee compensation data with searchable records and salary
          insights.
        </h2>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-[#5f574c]">
          Review a seeded workforce dataset, maintain employee records, filter
          by country and role, and compare compensation trends through
          country-level and job-title analytics.
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
    </section>
  )
}
