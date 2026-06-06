import { BarChart3 } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/insights')({
  component: InsightsRoute,
})

function InsightsRoute() {
  return (
    <section className="space-y-6">
      <div>
        <p className="text-sm font-medium text-[#806941]">Salary Analytics</p>
        <h2 className="mt-1 text-3xl font-semibold tracking-normal">
          Insights
        </h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <select className="h-10 rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20">
          <option>Select country</option>
        </select>

        <select className="h-10 rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20">
          <option>Select job title</option>
        </select>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          'Minimum salary',
          'Maximum salary',
          'Average salary',
          'Employees',
        ].map((label) => (
          <div
            key={label}
            className="rounded-md border border-[#d8d0c2] bg-white p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-medium text-[#6d6255]">{label}</p>
              <BarChart3
                className="h-4 w-4 text-[#1f5e67]"
                aria-hidden="true"
              />
            </div>
            <p className="mt-4 text-2xl font-semibold">--</p>
          </div>
        ))}
      </div>

      <div className="rounded-md border border-[#d8d0c2] bg-white px-4 py-12 text-center">
        <p className="text-sm font-medium text-[#231f20]">
          Insight endpoints are needed next.
        </p>
        <p className="mt-1 text-sm text-[#6d6255]">
          This screen is ready for country and job-title salary aggregations.
        </p>
      </div>
    </section>
  )
}
