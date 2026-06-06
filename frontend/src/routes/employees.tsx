import { Plus, Search } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

export const Route = createFileRoute('/employees')({
  component: EmployeesRoute,
})

function EmployeesRoute() {
  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#806941]">Employee Records</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">
            Employees
          </h2>
        </div>

        <button className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f5e67] px-4 text-sm font-semibold text-white transition hover:bg-[#174b52]">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add employee
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_12rem_12rem]">
        <label className="relative block">
          <span className="sr-only">Search employees by name</span>
          <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7b7165]" />
          <input
            className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white pr-3 pl-10 text-sm outline-none transition placeholder:text-[#8b8175] focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20"
            placeholder="Search by name"
            type="search"
          />
        </label>

        <select className="h-10 rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20">
          <option>All countries</option>
        </select>

        <select className="h-10 rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20">
          <option>All job titles</option>
        </select>
      </div>

      <div className="overflow-hidden rounded-md border border-[#d8d0c2] bg-white">
        <div className="grid grid-cols-[1.2fr_1fr_0.8fr_0.8fr_0.8fr] border-b border-[#e1d8ca] bg-[#fffaf1] px-4 py-3 text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
          <span>Name</span>
          <span>Job title</span>
          <span>Country</span>
          <span>Salary</span>
          <span>Status</span>
        </div>
        <div className="px-4 py-12 text-center">
          <p className="text-sm font-medium text-[#231f20]">
            Employee table will be wired next.
          </p>
          <p className="mt-1 text-sm text-[#6d6255]">
            The API client is ready for paginated employee data.
          </p>
        </div>
      </div>
    </section>
  )
}
