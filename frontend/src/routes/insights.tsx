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
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { TooltipContentProps } from 'recharts'

import {
  useEmployeeCountries,
  useEmployeeJobTitles,
  useJobTitleBreakdown,
  useSalarySummary,
  useTopCountriesByAverageSalary,
} from '../api/hooks'
import { ApiError } from '../api/client'
import type {
  JobTitleSalaryBreakdownItem,
  SalarySummaryResponse,
  TopCountrySalaryItem,
} from '../api/types'

export const Route = createFileRoute('/insights')({
  component: InsightsRoute,
})

type InsightTab = 'overview' | 'country'

type SalaryChartDatum = {
  currency: string | null
  employees: number
  name: string
  value: number
}

type CountrySalarySpreadDatum = {
  average: number | null
  currency: string | null
  employees: number
  maximum: number | null
  minimum: number | null
  name: string
}

type DistributionChartDatum = {
  color: string
  name: string
  value: number
}

const topCountryLimitOptions = [3, 5, 10, 15, 20]
const chartColors = [
  '#1f5e67',
  '#806941',
  '#9b341f',
  '#4f6f52',
  '#6d5f88',
  '#287c8e',
  '#a45d3f',
  '#66713a',
  '#3f5f8a',
  '#8a5a6b',
]

function InsightsRoute() {
  const [activeTab, setActiveTab] = useState<InsightTab>('overview')
  const [selectedCountry, setSelectedCountry] = useState('')
  const [selectedJobTitle, setSelectedJobTitle] = useState('')
  const [topCountryLimit, setTopCountryLimit] = useState(5)

  const countriesQuery = useEmployeeCountries()
  const jobTitlesQuery = useEmployeeJobTitles(selectedCountry || undefined)
  const countrySummaryQuery = useSalarySummary(selectedCountry)
  const roleSummaryQuery = useSalarySummary(
    selectedCountry,
    selectedJobTitle || undefined,
  )
  const breakdownQuery = useJobTitleBreakdown(selectedCountry)
  const topCountriesQuery = useTopCountriesByAverageSalary(topCountryLimit)

  const countrySummary = countrySummaryQuery.data
  const roleSummary = selectedJobTitle ? roleSummaryQuery.data : undefined
  const breakdownItems = breakdownQuery.data?.items ?? []
  const topCountries = topCountriesQuery.data?.items ?? []
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
            Separate global comparisons from selected country and role analysis.
          </p>
        </div>

        {topCountriesQuery.isFetching ||
        countrySummaryQuery.isFetching ||
        breakdownQuery.isFetching ? (
          <p className="text-sm font-medium text-[#806941]">
            Refreshing metrics...
          </p>
        ) : null}
      </div>

      <InsightTabs activeTab={activeTab} onChange={setActiveTab} />

      {activeTab === 'overview' ? (
        <OverviewTab
          error={getErrorMessage(topCountriesQuery.error)}
          isError={topCountriesQuery.isError}
          isLoading={topCountriesQuery.isLoading}
          items={topCountries}
          limit={topCountryLimit}
          onLimitChange={setTopCountryLimit}
        />
      ) : (
        <CountryAnalysisTab
          breakdownError={getErrorMessage(breakdownQuery.error)}
          breakdownItems={breakdownItems}
          countrySummary={countrySummary}
          countrySummaryError={getErrorMessage(countrySummaryQuery.error)}
          countries={countriesQuery.data?.items ?? []}
          currency={currency}
          isBreakdownError={breakdownQuery.isError}
          isBreakdownLoading={breakdownQuery.isLoading}
          isCountriesLoading={countriesQuery.isLoading}
          isCountrySummaryError={countrySummaryQuery.isError}
          isJobTitlesLoading={jobTitlesQuery.isLoading}
          isRefreshing={
            countrySummaryQuery.isFetching ||
            roleSummaryQuery.isFetching ||
            breakdownQuery.isFetching
          }
          jobTitles={jobTitlesQuery.data?.items ?? []}
          onCountryChange={updateCountry}
          onJobTitleChange={setSelectedJobTitle}
          roleSummary={roleSummary}
          roleSummaryIsError={roleSummaryQuery.isError}
          roleSummaryIsLoading={roleSummaryQuery.isLoading}
          selectedCountry={selectedCountry}
          selectedJobTitle={selectedJobTitle}
        />
      )}
    </section>
  )
}

function InsightTabs({
  activeTab,
  onChange,
}: {
  activeTab: InsightTab
  onChange: (tab: InsightTab) => void
}) {
  return (
    <div
      className="inline-flex rounded-md border border-[#d8d0c2] bg-white p-1"
      role="tablist"
      aria-label="Insight sections"
    >
      <TabButton
        active={activeTab === 'overview'}
        label="Overview"
        onClick={() => onChange('overview')}
      />
      <TabButton
        active={activeTab === 'country'}
        label="Country analysis"
        onClick={() => onChange('country')}
      />
    </div>
  )
}

function TabButton({
  active,
  label,
  onClick,
}: {
  active: boolean
  label: string
  onClick: () => void
}) {
  return (
    <button
      aria-selected={active}
      className={`h-9 rounded px-4 text-sm font-semibold transition ${
        active
          ? 'bg-[#1f5e67] text-white'
          : 'text-[#5c554b] hover:bg-[#efe7d9] hover:text-[#231f20]'
      }`}
      onClick={onClick}
      role="tab"
      type="button"
    >
      {label}
    </button>
  )
}

type OverviewTabProps = {
  error: string | null
  isError: boolean
  isLoading: boolean
  items: Array<TopCountrySalaryItem>
  limit: number
  onLimitChange: (limit: number) => void
}

function OverviewTab({
  error,
  isError,
  isLoading,
  items,
  limit,
  onLimitChange,
}: OverviewTabProps) {
  const chartData = buildCountrySalarySpreadChartData(items)

  return (
    <div className="space-y-4" role="tabpanel">
      <SectionHeader
        eyebrow="Global overview"
        title="Company-wide salary comparison"
        description="This view is independent from country and job-title filters."
      />

      <ChartPanel
        action={<LimitControl limit={limit} onLimitChange={onLimitChange} />}
        description="Minimum, average, and maximum salary by country using stored native salary values."
        title="Country salary spread"
      >
        {isLoading ? (
          <ChartMessage message="Loading chart..." />
        ) : isError ? (
          <ChartMessage
            message={error ?? 'Unable to load top countries.'}
            tone="error"
          />
        ) : chartData.length === 0 ? (
          <ChartMessage message="No country salary data found." />
        ) : (
          <CountrySalarySpreadChart data={chartData} />
        )}
      </ChartPanel>

      <TopCountriesTable
        error={error}
        isError={isError}
        isLoading={isLoading}
        items={items}
      />
    </div>
  )
}

type CountryAnalysisTabProps = {
  breakdownError: string | null
  breakdownItems: Array<JobTitleSalaryBreakdownItem>
  countries: Array<string>
  countrySummary: SalarySummaryResponse | undefined
  countrySummaryError: string | null
  currency: string | null
  isBreakdownError: boolean
  isBreakdownLoading: boolean
  isCountriesLoading: boolean
  isCountrySummaryError: boolean
  isJobTitlesLoading: boolean
  isRefreshing: boolean
  jobTitles: Array<string>
  onCountryChange: (country: string) => void
  onJobTitleChange: (jobTitle: string) => void
  roleSummary: SalarySummaryResponse | undefined
  roleSummaryIsError: boolean
  roleSummaryIsLoading: boolean
  selectedCountry: string
  selectedJobTitle: string
}

function CountryAnalysisTab({
  breakdownError,
  breakdownItems,
  countries,
  countrySummary,
  countrySummaryError,
  currency,
  isBreakdownError,
  isBreakdownLoading,
  isCountriesLoading,
  isCountrySummaryError,
  isJobTitlesLoading,
  isRefreshing,
  jobTitles,
  onCountryChange,
  onJobTitleChange,
  roleSummary,
  roleSummaryIsError,
  roleSummaryIsLoading,
  selectedCountry,
  selectedJobTitle,
}: CountryAnalysisTabProps) {
  const salaryChartData = buildBreakdownSalaryChartData(breakdownItems)
  const distributionChartData = buildDistributionChartData(breakdownItems)

  return (
    <div className="space-y-4" role="tabpanel">
      <SectionHeader
        eyebrow="Selected scope"
        title="Country and role analysis"
        description="Country selection drives the charts and breakdown; role focus updates the selected-role summary."
      />

      <CountryAnalysisControls
        countries={countries}
        isCountriesLoading={isCountriesLoading}
        isJobTitlesLoading={isJobTitlesLoading}
        jobTitles={jobTitles}
        onCountryChange={onCountryChange}
        onJobTitleChange={onJobTitleChange}
        selectedCountry={selectedCountry}
        selectedJobTitle={selectedJobTitle}
      />

      {!selectedCountry ? (
        <EmptyState
          title="No country selected"
          message="Choose a country to load country metrics, role metrics, and job-title charts."
        />
      ) : isCountrySummaryError ? (
        <EmptyState
          tone="error"
          title="Unable to load salary summary"
          message={countrySummaryError ?? 'The salary summary request failed.'}
        />
      ) : (
        <div className="space-y-4">
          <SelectedScopeHeader
            country={selectedCountry}
            isRefreshing={isRefreshing}
            jobTitle={selectedJobTitle}
          />

          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
            <MetricCard
              icon={UsersRound}
              label="Country employees"
              value={formatCount(countrySummary?.employee_count)}
            />
            <MetricCard
              icon={TrendingDown}
              label="Country minimum"
              value={formatSalary(countrySummary?.min_salary, currency)}
            />
            <MetricCard
              icon={TrendingUp}
              label="Country maximum"
              value={formatSalary(countrySummary?.max_salary, currency)}
            />
            <MetricCard
              icon={CircleDollarSign}
              label="Country average"
              value={formatSalary(countrySummary?.avg_salary, currency)}
            />
            <MetricCard
              icon={BriefcaseBusiness}
              label="Role focus average"
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
              country={selectedCountry}
              isError={roleSummaryIsError}
              isLoading={roleSummaryIsLoading}
              jobTitle={selectedJobTitle}
              summary={roleSummary}
            />
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(20rem,0.65fr)]">
            <ChartPanel
              description="Country-wide average salary grouped by job title."
              title="Salary by job title"
            >
              {isBreakdownLoading ? (
                <ChartMessage message="Loading salary chart..." />
              ) : isBreakdownError ? (
                <ChartMessage
                  message={breakdownError ?? 'Unable to load salary chart.'}
                  tone="error"
                />
              ) : salaryChartData.length === 0 ? (
                <ChartMessage message="No salary data found for this country." />
              ) : (
                <SalaryBarChart data={salaryChartData} />
              )}
            </ChartPanel>

            <ChartPanel
              description="Country-wide employee count share by job title."
              title="Employees by job title"
            >
              {isBreakdownLoading ? (
                <ChartMessage message="Loading distribution..." />
              ) : isBreakdownError ? (
                <ChartMessage
                  message={breakdownError ?? 'Unable to load distribution.'}
                  tone="error"
                />
              ) : distributionChartData.length === 0 ? (
                <ChartMessage message="No employee distribution found." />
              ) : (
                <EmployeeDistributionChart data={distributionChartData} />
              )}
            </ChartPanel>
          </div>

          <BreakdownTable
            error={breakdownError}
            isError={isBreakdownError}
            isLoading={isBreakdownLoading}
            items={breakdownItems}
          />
        </div>
      )}
    </div>
  )
}

function SectionHeader({
  description,
  eyebrow,
  title,
}: {
  description: string
  eyebrow: string
  title: string
}) {
  return (
    <div>
      <p className="text-sm font-medium text-[#806941]">{eyebrow}</p>
      <h3 className="mt-1 text-2xl font-semibold">{title}</h3>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#5f574c]">
        {description}
      </p>
    </div>
  )
}

type CountryAnalysisControlsProps = {
  countries: Array<string>
  isCountriesLoading: boolean
  isJobTitlesLoading: boolean
  jobTitles: Array<string>
  onCountryChange: (country: string) => void
  onJobTitleChange: (jobTitle: string) => void
  selectedCountry: string
  selectedJobTitle: string
}

function CountryAnalysisControls({
  countries,
  isCountriesLoading,
  isJobTitlesLoading,
  jobTitles,
  onCountryChange,
  onJobTitleChange,
  selectedCountry,
  selectedJobTitle,
}: CountryAnalysisControlsProps) {
  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e1d8ca] bg-[#fffaf1] px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-[#231f20]">
            Analysis controls
          </p>
          <p className="mt-1 text-sm text-[#6d6255]">
            {formatScopeLabel(selectedCountry, selectedJobTitle)}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <ScopeBadge label="Country" value={selectedCountry || 'None'} />
          <ScopeBadge
            label="Role focus"
            value={selectedJobTitle || 'All job titles'}
          />
        </div>
      </div>

      <div className="grid gap-3 p-4 sm:grid-cols-2">
        <label>
          <span className="mb-1 block text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
            Country
          </span>
          <select
            className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20 disabled:cursor-not-allowed disabled:bg-[#f4eee5] disabled:text-[#7b7165]"
            disabled={isCountriesLoading}
            onChange={(event) => onCountryChange(event.target.value)}
            value={selectedCountry}
          >
            <option value="">
              {isCountriesLoading ? 'Loading countries...' : 'Select country'}
            </option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="mb-1 block text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
            Role focus
          </span>
          <select
            className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20 disabled:cursor-not-allowed disabled:bg-[#f4eee5] disabled:text-[#7b7165]"
            disabled={!selectedCountry || isJobTitlesLoading}
            onChange={(event) => onJobTitleChange(event.target.value)}
            value={selectedJobTitle}
          >
            <option value="">
              {!selectedCountry
                ? 'Select country first'
                : isJobTitlesLoading
                  ? 'Loading job titles...'
                  : 'All job titles'}
            </option>
            {jobTitles.map((jobTitle) => (
              <option key={jobTitle} value={jobTitle}>
                {jobTitle}
              </option>
            ))}
          </select>
        </label>
      </div>
    </div>
  )
}

type ChartPanelProps = {
  action?: React.ReactNode
  children: React.ReactNode
  description: string
  title: string
}

function ChartPanel({ action, children, description, title }: ChartPanelProps) {
  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white">
      <div className="flex flex-col gap-3 border-b border-[#e1d8ca] bg-[#fffaf1] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#231f20]">{title}</p>
          <p className="mt-1 text-sm text-[#6d6255]">{description}</p>
        </div>
        {action}
      </div>
      <div className="p-4">{children}</div>
    </div>
  )
}

function LimitControl({
  limit,
  onLimitChange,
}: {
  limit: number
  onLimitChange: (limit: number) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-[#5f574c]">
      <span>Show</span>
      <select
        className="h-9 rounded-md border border-[#cfc4b4] bg-white px-2 text-sm text-[#231f20] outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20"
        onChange={(event) => onLimitChange(Number(event.target.value))}
        value={limit}
      >
        {topCountryLimitOptions.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
      <span>countries</span>
    </label>
  )
}

function SalaryBarChart({ data }: { data: Array<SalaryChartDatum> }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer height="100%" width="100%">
        <BarChart
          data={data}
          margin={{ top: 16, right: 18, bottom: 40, left: 4 }}
        >
          <CartesianGrid stroke="#eee6da" vertical={false} />
          <XAxis
            angle={-20}
            dataKey="name"
            height={72}
            interval={0}
            stroke="#6d6255"
            textAnchor="end"
            tick={{ fill: '#6d6255', fontSize: 12 }}
          />
          <YAxis
            stroke="#6d6255"
            tick={{ fill: '#6d6255', fontSize: 12 }}
            tickFormatter={(value) => formatCompactNumber(Number(value))}
          />
          <Tooltip content={<SalaryTooltip />} cursor={{ fill: '#f4eee5' }} />
          <Bar dataKey="value" fill="#1f5e67" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  )
}

function CountrySalarySpreadChart({
  data,
}: {
  data: Array<CountrySalarySpreadDatum>
}) {
  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
        <ChartLegendItem color="#806941" label="Minimum" />
        <ChartLegendItem color="#1f5e67" label="Average" />
        <ChartLegendItem color="#9b341f" label="Maximum" />
      </div>
      <div className="h-88 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <BarChart
            data={data}
            margin={{ top: 16, right: 18, bottom: 40, left: 4 }}
          >
            <CartesianGrid stroke="#eee6da" vertical={false} />
            <XAxis
              angle={-20}
              dataKey="name"
              height={72}
              interval={0}
              stroke="#6d6255"
              textAnchor="end"
              tick={{ fill: '#6d6255', fontSize: 12 }}
            />
            <YAxis
              stroke="#6d6255"
              tick={{ fill: '#6d6255', fontSize: 12 }}
              tickFormatter={(value) => formatCompactNumber(Number(value))}
            />
            <Tooltip
              content={<CountrySalarySpreadTooltip />}
              cursor={{ fill: '#f4eee5' }}
            />
            <Bar
              dataKey="minimum"
              fill="#806941"
              name="Minimum"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="average"
              fill="#1f5e67"
              name="Average"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="maximum"
              fill="#9b341f"
              name="Maximum"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

function ChartLegendItem({ color, label }: { color: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        className="h-2.5 w-2.5 rounded-sm"
        style={{ backgroundColor: color }}
      />
      {label}
    </span>
  )
}

function EmployeeDistributionChart({
  data,
}: {
  data: Array<DistributionChartDatum>
}) {
  return (
    <div className="grid gap-3 md:grid-cols-[minmax(12rem,1fr)_minmax(10rem,0.8fr)] xl:grid-cols-1">
      <div className="h-72 w-full">
        <ResponsiveContainer height="100%" width="100%">
          <PieChart>
            <Pie
              data={data}
              dataKey="value"
              innerRadius={58}
              nameKey="name"
              outerRadius={96}
              paddingAngle={2}
            >
              {data.map((item) => (
                <Cell fill={item.color} key={item.name} />
              ))}
            </Pie>
            <Tooltip content={<DistributionTooltip />} />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="space-y-2 self-center">
        {data.map((item) => (
          <div
            className="flex items-center justify-between gap-3 text-sm"
            key={item.name}
          >
            <span className="flex min-w-0 items-center gap-2">
              <span
                className="h-2.5 w-2.5 shrink-0 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="truncate text-[#4f473d]">{item.name}</span>
            </span>
            <span className="font-medium text-[#231f20]">
              {formatCount(item.value)}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

function SalaryTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<number, string>) {
  if (!active || payload.length === 0) {
    return null
  }

  const datum = payload[0].payload as SalaryChartDatum | undefined
  if (!datum) {
    return null
  }

  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-semibold text-[#231f20]">{label}</p>
      <p className="mt-1 text-[#4f473d]">
        Average: {formatSalaryValue(datum.value, datum.currency)}
      </p>
      <p className="text-[#6d6255]">
        Employees: {formatCount(datum.employees)}
      </p>
      {!datum.currency ? (
        <p className="text-[#806941]">Mixed currency</p>
      ) : null}
    </div>
  )
}

function CountrySalarySpreadTooltip({
  active,
  label,
  payload,
}: TooltipContentProps<number, string>) {
  if (!active || payload.length === 0) {
    return null
  }

  const datum = payload[0].payload as CountrySalarySpreadDatum | undefined
  if (!datum) {
    return null
  }

  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-semibold text-[#231f20]">{label}</p>
      <div className="mt-2 space-y-1 text-[#4f473d]">
        <p>Minimum: {formatSalaryNumber(datum.minimum, datum.currency)}</p>
        <p>Average: {formatSalaryNumber(datum.average, datum.currency)}</p>
        <p>Maximum: {formatSalaryNumber(datum.maximum, datum.currency)}</p>
      </div>
      <p className="mt-1 text-[#6d6255]">
        Employees: {formatCount(datum.employees)}
      </p>
      {!datum.currency ? (
        <p className="text-[#806941]">Mixed currency</p>
      ) : null}
    </div>
  )
}

function DistributionTooltip({
  active,
  payload,
}: TooltipContentProps<number, string>) {
  if (!active || payload.length === 0) {
    return null
  }

  const datum = payload[0].payload as DistributionChartDatum | undefined
  if (!datum) {
    return null
  }

  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white px-3 py-2 text-sm shadow-sm">
      <p className="font-semibold text-[#231f20]">{datum.name}</p>
      <p className="mt-1 text-[#4f473d]">
        Employees: {formatCount(datum.value)}
      </p>
    </div>
  )
}

function ChartMessage({
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'error' | 'neutral'
}) {
  return (
    <div className="flex h-72 items-center justify-center text-center">
      <p
        className={`text-sm font-medium ${
          tone === 'error' ? 'text-[#9b341f]' : 'text-[#231f20]'
        }`}
      >
        {message}
      </p>
    </div>
  )
}

type TopCountriesTableProps = {
  error: string | null
  isError: boolean
  isLoading: boolean
  items: Array<TopCountrySalaryItem>
}

function TopCountriesTable({
  error,
  isError,
  isLoading,
  items,
}: TopCountriesTableProps) {
  return (
    <div className="overflow-hidden rounded-md border border-[#d8d0c2] bg-white">
      <div className="border-b border-[#e1d8ca] bg-[#fffaf1] px-4 py-3">
        <p className="text-sm font-medium text-[#231f20]">Top country values</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full min-w-[54rem] border-collapse text-left text-sm">
          <thead>
            <tr className="border-b border-[#e1d8ca] bg-[#fffaf1] text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Employees</th>
              <th className="px-4 py-3">Minimum</th>
              <th className="px-4 py-3">Average</th>
              <th className="px-4 py-3">Maximum</th>
              <th className="px-4 py-3">Currency</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <TableMessage colSpan={6} message="Loading countries..." />
            ) : isError ? (
              <TableMessage
                colSpan={6}
                message={error ?? 'Unable to load top countries.'}
                tone="error"
              />
            ) : items.length === 0 ? (
              <TableMessage
                colSpan={6}
                message="No country salary data found."
              />
            ) : (
              items.map((item) => (
                <tr
                  className="border-b border-[#eee6da] last:border-0 hover:bg-[#fffaf1]"
                  key={item.country}
                >
                  <td className="px-4 py-3 font-medium text-[#231f20]">
                    {item.country}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {formatCount(item.employee_count)}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {formatSalaryForTable(item.min_salary, item.currency)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatSalaryForTable(item.avg_salary, item.currency)}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {formatSalaryForTable(item.max_salary, item.currency)}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {item.currency ?? 'Mixed'}
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

function ScopeBadge({ label, value }: { label: string; value: string }) {
  return (
    <span className="inline-flex min-h-8 items-center gap-2 rounded-md border border-[#d8d0c2] bg-white px-3 text-[#4f473d]">
      <span className="text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
        {label}
      </span>
      <span className="font-medium text-[#231f20]">{value}</span>
    </span>
  )
}

type SelectedScopeHeaderProps = {
  country: string
  isRefreshing: boolean
  jobTitle: string
}

function SelectedScopeHeader({
  country,
  isRefreshing,
  jobTitle,
}: SelectedScopeHeaderProps) {
  return (
    <div className="rounded-md border border-[#d8d0c2] bg-white px-4 py-4">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
            Country and role summary
          </p>
          <h3 className="mt-1 text-xl font-semibold">
            {formatScopeLabel(country, jobTitle)}
          </h3>
        </div>
        <div className="flex flex-wrap gap-2 text-sm">
          <ScopeBadge label="Country" value={country} />
          <ScopeBadge label="Role focus" value={jobTitle || 'All job titles'} />
          {isRefreshing ? (
            <span className="inline-flex min-h-8 items-center rounded-md bg-[#fffaf1] px-3 text-sm font-medium text-[#806941]">
              Refreshing
            </span>
          ) : null}
        </div>
      </div>
    </div>
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
  country: string
  isError: boolean
  isLoading: boolean
  jobTitle: string
  summary: SalarySummaryResponse | undefined
}

function RoleSummaryPanel({
  country,
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
          <p className="text-sm font-medium text-[#806941]">
            Selected role summary
          </p>
          <h3 className="mt-1 text-xl font-semibold">{jobTitle}</h3>
          <p className="mt-1 text-sm text-[#6d6255]">{country}</p>
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
          Job-title breakdown for selected country
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
              <TableMessage colSpan={5} message="Loading breakdown..." />
            ) : isError ? (
              <TableMessage
                colSpan={5}
                message={error ?? 'Unable to load salary breakdown.'}
                tone="error"
              />
            ) : items.length === 0 ? (
              <TableMessage
                colSpan={5}
                message="No salary data found for this country."
              />
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
                    {formatSalaryForTable(item.min_salary, item.currency)}
                  </td>
                  <td className="px-4 py-3 text-[#4f473d]">
                    {formatSalaryForTable(item.max_salary, item.currency)}
                  </td>
                  <td className="px-4 py-3 font-medium">
                    {formatSalaryForTable(item.avg_salary, item.currency)}
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

function TableMessage({
  colSpan,
  message,
  tone = 'neutral',
}: {
  colSpan: number
  message: string
  tone?: 'error' | 'neutral'
}) {
  return (
    <tr>
      <td className="px-4 py-12 text-center" colSpan={colSpan}>
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

function buildCountrySalarySpreadChartData(items: Array<TopCountrySalaryItem>) {
  return items
    .map((item) => ({
      average: toNumber(item.avg_salary),
      currency: item.currency,
      employees: item.employee_count,
      maximum: toNumber(item.max_salary),
      minimum: toNumber(item.min_salary),
      name: item.country,
    }))
    .filter(hasSalarySpread)
}

function hasSalarySpread(item: CountrySalarySpreadDatum) {
  return item.minimum !== null || item.average !== null || item.maximum !== null
}

function buildBreakdownSalaryChartData(
  items: Array<JobTitleSalaryBreakdownItem>,
) {
  return items
    .map((item) => ({
      currency: item.currency,
      employees: item.employee_count,
      name: item.job_title,
      value: toNumber(item.avg_salary),
    }))
    .filter((item) => item.value !== null) as Array<SalaryChartDatum>
}

function buildDistributionChartData(items: Array<JobTitleSalaryBreakdownItem>) {
  return items
    .filter((item) => item.employee_count > 0)
    .map((item, index) => ({
      color: chartColors[index % chartColors.length],
      name: item.job_title,
      value: item.employee_count,
    }))
}

function toNumber(value: string | null | undefined) {
  if (!value) {
    return null
  }

  const numericValue = Number(value)
  return Number.isFinite(numericValue) ? numericValue : null
}

function formatCount(value: number | undefined) {
  if (value === undefined) {
    return '--'
  }

  return new Intl.NumberFormat().format(value)
}

function formatCompactNumber(value: number) {
  return new Intl.NumberFormat(undefined, {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value)
}

function formatSalary(
  value: string | null | undefined,
  currency: string | null | undefined,
) {
  if (!value || !currency) {
    return '--'
  }

  return formatSalaryValue(Number(value), currency)
}

function formatSalaryForTable(
  value: string | null | undefined,
  currency: string | null | undefined,
) {
  if (!value) {
    return '--'
  }

  return formatSalaryValue(Number(value), currency)
}

function formatSalaryValue(value: number, currency: string | null | undefined) {
  if (!Number.isFinite(value)) {
    return '--'
  }

  if (!currency) {
    return new Intl.NumberFormat(undefined, {
      maximumFractionDigits: 0,
    }).format(value)
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value)
  } catch {
    return `${currency} ${value}`
  }
}

function formatSalaryNumber(
  value: number | null,
  currency: string | null | undefined,
) {
  if (value === null) {
    return '--'
  }

  return formatSalaryValue(value, currency)
}

function formatScopeLabel(country: string, jobTitle: string) {
  if (!country) {
    return 'No country selected'
  }

  if (!jobTitle) {
    return `${country} - all job titles`
  }

  return `${country} - ${jobTitle}`
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
