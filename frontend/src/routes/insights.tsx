import { useState } from 'react'
import {
  BriefcaseBusiness,
  CircleDollarSign,
  TrendingDown,
  TrendingUp,
  UsersRound,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import {
  useEmployeeCountries,
  useEmployeeJobTitles,
  useJobTitleBreakdown,
  useSalarySummary,
} from '../api/hooks'
import { ApiError } from '../api/client'
import type {
  JobTitleSalaryBreakdownItem,
  SalarySummaryResponse,
} from '../api/types'

export const Route = createFileRoute('/insights')({
  component: InsightsRoute,
})

function InsightsRoute() {
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedJobTitle, setSelectedJobTitle] = useState('')

  const countriesQuery = useEmployeeCountries()
  const jobTitlesQuery = useEmployeeJobTitles(selectedCountry || undefined)
  const countrySummaryQuery = useSalarySummary(selectedCountry)
  const roleSummaryQuery = useSalarySummary(
    selectedCountry,
    selectedJobTitle || undefined,
  )
  const breakdownQuery = useJobTitleBreakdown(selectedCountry)

  const countrySummary = countrySummaryQuery.data
  const roleSummary = selectedJobTitle ? roleSummaryQuery.data : undefined
  const breakdownItems = breakdownQuery.data?.items ?? []
  const currency = roleSummary?.currency ?? countrySummary?.currency ?? null

  function updateCountry(country: string) {
    setSelectedCountry(country)
    setSelectedJobTitle('')
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#806941]">Salary Analytics</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">
            Insights
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f574c]">
            Country-level salary metrics and job-title breakdowns calculated
            from the employee database.
          </p>
        </div>

        {countrySummaryQuery.isFetching || breakdownQuery.isFetching ? (
          <p className="text-sm font-medium text-[#806941]">
            Refreshing metrics...
          </p>
        ) : null}
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
            Country
          </span>
          <select
            className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20 disabled:cursor-not-allowed disabled:bg-[#f4eee5] disabled:text-[#7b7165]"
            disabled={countriesQuery.isLoading}
            onChange={(event) => updateCountry(event.target.value)}
            value={selectedCountry}
          >
            <option value="">
              {countriesQuery.isLoading
                ? 'Loading countries...'
                : 'Select country'}
            </option>
            {(countriesQuery.data?.items ?? []).map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
            Job title
          </span>
          <select
            className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20 disabled:cursor-not-allowed disabled:bg-[#f4eee5] disabled:text-[#7b7165]"
            disabled={!selectedCountry || jobTitlesQuery.isLoading}
            onChange={(event) => setSelectedJobTitle(event.target.value)}
            value={selectedJobTitle}
          >
            <option value="">
              {!selectedCountry
                ? 'Select country first'
                : jobTitlesQuery.isLoading
                  ? 'Loading job titles...'
                  : 'All job titles'}
            </option>
            {(jobTitlesQuery.data?.items ?? []).map((jobTitle) => (
              <option key={jobTitle} value={jobTitle}>
                {jobTitle}
              </option>
            ))}
          </select>
        </label>
      </div>

      {!selectedCountry ? (
        <EmptyState
          title="Select a country"
          message="Choose a country to view salary summary and job-title breakdowns."
        />
      ) : countrySummaryQuery.isError ? (
        <EmptyState
          tone="error"
          title="Unable to load salary summary"
          message={
            getErrorMessage(countrySummaryQuery.error) ??
            'The salary summary request failed.'
          }
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              icon={UsersRound}
              label="Employees"
              value={formatCount(countrySummary?.employee_count)}
            />
            <MetricCard
              icon={TrendingDown}
              label="Minimum salary"
              value={formatSalary(countrySummary?.min_salary, currency)}
            />
            <MetricCard
              icon={TrendingUp}
              label="Maximum salary"
              value={formatSalary(countrySummary?.max_salary, currency)}
            />
            <MetricCard
              icon={CircleDollarSign}
              label="Average salary"
              value={formatSalary(countrySummary?.avg_salary, currency)}
            />
            <MetricCard
              icon={BriefcaseBusiness}
              label="Role average"
              value={
                selectedJobTitle
                  ? formatSalary(roleSummary?.avg_salary, roleSummary?.currency)
                  : '--'
              }
              detail={selectedJobTitle || 'Select job title'}
            />
          </div>

          {selectedJobTitle ? (
            <RoleSummaryPanel
              isError={roleSummaryQuery.isError}
              isLoading={roleSummaryQuery.isLoading}
              jobTitle={selectedJobTitle}
              summary={roleSummary}
            />
          ) : null}

          <BreakdownTable
            error={getErrorMessage(breakdownQuery.error)}
            isError={breakdownQuery.isError}
            isLoading={breakdownQuery.isLoading}
            items={breakdownItems}
          />
        </>
      )}
    </section>
  )
}

type MetricCardProps = {
  detail?: string
  icon: LucideIcon
  label: string
  value: string
}

function MetricCard({ detail, icon: Icon, label, value }: MetricCardProps) {
  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white p-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-medium text-[#6d6255]">{label}</p>
        <Icon className="h-4 w-4 text-[#1f5e67]" aria-hidden="true" />
      </div>
      <p className="mt-4 text-2xl font-semibold">{value}</p>
      {detail ? <p className="mt-1 text-xs text-[#806941]">{detail}</p> : null}
    </div>
  )
}

type RoleSummaryPanelProps = {
  isError: boolean
  isLoading: boolean
  jobTitle: string
  summary: SalarySummaryResponse | undefined
}

function RoleSummaryPanel({
  isError,
  isLoading,
  jobTitle,
  summary,
}: RoleSummaryPanelProps) {
  if (isLoading) {
    return (
      <div className="rounded-md border border-[#d8d0c2] bg-white px-4 py-5 text-sm text-[#6d6255]">
        Loading role summary...
      </div>
    )
  }

  if (isError) {
    return (
      <div className="rounded-md border border-[#e0b8aa] bg-[#fff2ed] px-4 py-5 text-sm text-[#9b341f]">
        Unable to load role summary.
      </div>
    )
  }

  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white px-4 py-5">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#806941]">Selected role</p>
          <h3 className="mt-1 text-xl font-semibold">{jobTitle}</h3>
        </div>
        <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
          <InlineMetric
            label="Employees"
            value={formatCount(summary?.employee_count)}
          />
          <InlineMetric
            label="Min"
            value={formatSalary(summary?.min_salary, summary?.currency)}
          />
          <InlineMetric
            label="Max"
            value={formatSalary(summary?.max_salary, summary?.currency)}
          />
          <InlineMetric
            label="Avg"
            value={formatSalary(summary?.avg_salary, summary?.currency)}
          />
        </div>
      </div>
    </div>
  )
}

function InlineMetric({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
        {label}
      </p>
      <p className="mt-1 font-semibold text-[#231f20]">{value}</p>
    </div>
  )
}

type BreakdownTableProps = {
  error: string | null
  isError: boolean
  isLoading: boolean
  items: Array<JobTitleSalaryBreakdownItem>
}

function BreakdownTable({
  error,
  isError,
  isLoading,
  items,
}: BreakdownTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-[#d8d0c2] bg-white">
      <div className="border-b border-[#e1d8ca] bg-[#fffaf1] px-4 py-3">
        <p className="text-sm font-medium text-[#231f20]">
          Salary breakdown by job title
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[46rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#e1d8ca] bg-[#fffaf1] text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
              <th className="px-4 py-3">Job title</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Minimum</th>
              <th className="px-4 py-3">Maximum</th>
              <th className="px-4 py-3">Average</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <BreakdownMessage message="Loading breakdown..." />
            ) : isError ? (
              <BreakdownMessage
                message={error ?? 'Unable to load salary breakdown.'}
                tone="error"
              />
            ) : items.length === 0 ? (
              <BreakdownMessage message="No salary data found for this country." />
            ) : (
              items.map((item) => (
                <tr
                  className="border-b border-[#eee6da] last:border-0 hover:bg-[#fffaf1]"
                  key={item.job_title}
                >
                  <td className="px-4 py-3 font-medium text-[#231f20]">
                    {item.job_title}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {formatCount(item.employee_count)}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {formatSalary(item.min_salary, item.currency)}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {formatSalary(item.max_salary, item.currency)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatSalary(item.avg_salary, item.currency)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function BreakdownMessage({
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'error' | 'neutral'
}) {
  return (
    <tr>
      <td className="px-4 py-12 text-center" colSpan={5}>
        <p
          className={`text-sm font-medium ${
            tone === 'error' ? 'text-[#9b341f]' : 'text-[#231f20]'
          }`}
        >
          {message}
        </p>
      </td>
    </tr>
  )
}

function EmptyState({
  message,
  title,
  tone = 'neutral',
}: {
  message: string
  title: string
  tone?: 'error' | 'neutral'
}) {
  return (
    <div
      className={`rounded-md border px-4 py-12 text-center ${
        tone === 'error'
          ? 'border-[#e0b8aa] bg-[#fff2ed]'
          : 'border-[#d8d0c2] bg-white'
      }`}
    >
      <p
        className={`text-sm font-medium ${
          tone === 'error' ? 'text-[#9b341f]' : 'text-[#231f20]'
        }`}
      >
        {title}
      </p>
      <p className="mt-1 text-sm text-[#6d6255]">{message}</p>
    </div>
  )
}

function formatCount(value: number | undefined) {
  if (value === undefined) {
    return '--'
  }

  return new Intl.NumberFormat().format(value)
}

function formatSalary(
  value: string | null | undefined,
  currency: string | null | undefined,
) {
  if (!value || !currency) {
    return '--'
  }

  const numericValue = Number(value)

  if (!Number.isFinite(numericValue)) {
    return `${currency} ${value}`
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(numericValue)
  } catch {
    return `${currency} ${value}`
  }
}

function getErrorMessage(error: unknown): string | null {
  if (!error) {
    return null
  }

  if (error instanceof ApiError) {
    return error.message
  }

  if (error instanceof Error) {
    return error.message
  }

  return 'Something went wrong.'
}
