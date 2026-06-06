import { useEffect, useState } from 'react'
import type { FormEvent, ReactNode } from 'react'
import {
  ChevronLeft,
  ChevronRight,
  Edit2,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X,
} from 'lucide-react'
import { createFileRoute } from '@tanstack/react-router'

import {
  useCreateEmployeeMutation,
  useDeleteEmployeeMutation,
  useEmployeeCountries,
  useEmployeeJobTitles,
  useEmployees,
  useUpdateEmployeeMutation,
} from '../api/hooks'
import { ApiError } from '../api/client'
import type { Employee, EmployeeCreateInput } from '../api/types'

export const Route = createFileRoute('/employees')({
  component: EmployeesRoute,
})

const pageSize = 20

const emptyFormValues: EmployeeCreateInput = {
  employee_code: '',
  full_name: '',
  job_title: '',
  department: '',
  country: '',
  currency: 'USD',
  salary: '',
  employment_type: 'Full-time',
  hire_date: '',
}

type FormMode = 'create' | 'edit'

function EmployeesRoute() {
  const [page, setPage] = useState(1)
  const [filters, setFilters] = useState({
    country: '',
    jobTitle: '',
  })
  const [search, setSearch] = useState('')
  const [formMode, setFormMode] = useState<FormMode | null>(null)
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null)
  const [deletingEmployee, setDeletingEmployee] = useState<Employee | null>(
    null,
  )
  const [formValues, setFormValues] =
    useState<EmployeeCreateInput>(emptyFormValues)
  const debouncedSearch = useDebouncedValue(search.trim(), 350)
  const activeSearch = debouncedSearch.length > 2 ? debouncedSearch : ''

  const employeesQuery = useEmployees({
    page,
    page_size: pageSize,
    search: activeSearch,
    country: filters.country,
    job_title: filters.jobTitle,
  })
  const createEmployee = useCreateEmployeeMutation()
  const updateEmployee = useUpdateEmployeeMutation(editingEmployee?.id ?? 0)
  const deleteEmployee = useDeleteEmployeeMutation()
  const countriesQuery = useEmployeeCountries()
  const jobTitlesQuery = useEmployeeJobTitles(filters.country || undefined)
  const formJobTitlesQuery = useEmployeeJobTitles(
    formValues.country || undefined,
  )

  const employeeList = employeesQuery.data
  const employees = employeeList?.items ?? []
  const total = employeeList?.total ?? 0
  const totalPages = Math.max(1, Math.ceil(total / pageSize))
  const isFormSubmitting = createEmployee.isPending || updateEmployee.isPending
  const countries = countriesQuery.data?.items ?? []
  const jobTitles = jobTitlesQuery.data?.items ?? []
  const formCountries = mergeOptions(countries, formValues.country)
  const formJobTitles = mergeOptions(
    formJobTitlesQuery.data?.items ?? [],
    formValues.job_title,
  )
  const searchHint =
    search.trim().length > 0 && search.trim().length <= 2
      ? 'Type at least 3 characters to search.'
      : null

  function openCreateForm() {
    setFormMode('create')
    setEditingEmployee(null)
    setFormValues(emptyFormValues)
  }

  function openEditForm(employee: Employee) {
    setFormMode('edit')
    setEditingEmployee(employee)
    setFormValues({
      employee_code: employee.employee_code,
      full_name: employee.full_name,
      job_title: employee.job_title,
      department: employee.department,
      country: employee.country,
      currency: employee.currency,
      salary: employee.salary,
      employment_type: employee.employment_type,
      hire_date: employee.hire_date,
    })
  }

  function closeForm() {
    setFormMode(null)
    setEditingEmployee(null)
    setFormValues(emptyFormValues)
    createEmployee.reset()
    updateEmployee.reset()
  }

  function openDeleteDialog(employee: Employee) {
    setDeletingEmployee(employee)
    deleteEmployee.reset()
  }

  function closeDeleteDialog() {
    setDeletingEmployee(null)
    deleteEmployee.reset()
  }

  function clearFilters() {
    const clearedFilters = {
      country: '',
      jobTitle: '',
    }

    setSearch('')
    setFilters(clearedFilters)
    setPage(1)
  }

  function updateSearch(value: string) {
    setSearch(value)
    setPage(1)
  }

  function updateCountryFilter(country: string) {
    setFilters({
      country,
      jobTitle: '',
    })
    setPage(1)
  }

  function updateJobTitleFilter(jobTitle: string) {
    setFilters((current) => ({
      country: current.country,
      jobTitle,
    }))
    setPage(1)
  }

  function updateFormCountry(country: string) {
    setFormValues((current) => ({
      ...current,
      country,
      job_title: '',
    }))
  }

  function updateFormValue(field: keyof EmployeeCreateInput, value: string) {
    setFormValues((current) => ({
      ...current,
      [field]: value,
    }))
  }

  async function submitEmployeeForm(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    try {
      if (formMode === 'create') {
        await createEmployee.mutateAsync(normalizeCreateInput(formValues))
        closeForm()
        return
      }

      if (formMode === 'edit' && editingEmployee) {
        const { employee_code: _employeeCode, ...updateInput } =
          normalizeCreateInput(formValues)
        await updateEmployee.mutateAsync(updateInput)
        closeForm()
      }
    } catch {}
  }

  async function confirmDeleteEmployee() {
    if (!deletingEmployee) {
      return
    }

    try {
      await deleteEmployee.mutateAsync(deletingEmployee.id)
      closeDeleteDialog()
    } catch {}
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-[#806941]">Employee Records</p>
          <h2 className="mt-1 text-3xl font-semibold tracking-normal">
            Employees
          </h2>
        </div>

        <button
          className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-[#1f5e67] px-4 text-sm font-semibold text-white transition hover:bg-[#174b52] disabled:cursor-not-allowed disabled:opacity-60"
          onClick={openCreateForm}
          type="button"
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add employee
        </button>
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(18rem,1fr)_12rem_12rem_auto]">
        <div>
          <label className="relative block">
            <span className="sr-only">Search employees by name</span>
            <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-[#7b7165]" />
            <input
              className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white pr-3 pl-10 text-sm outline-none transition placeholder:text-[#8b8175] focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20"
              onChange={(event) => updateSearch(event.target.value)}
              placeholder="Search by name"
              type="search"
              value={search}
            />
          </label>
          {searchHint ? (
            <p className="mt-1 text-xs text-[#806941]">{searchHint}</p>
          ) : null}
        </div>

        <label>
          <span className="sr-only">Filter by country</span>
          <select
            className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition placeholder:text-[#8b8175] focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20"
            disabled={countriesQuery.isLoading}
            onChange={(event) => updateCountryFilter(event.target.value)}
            value={filters.country}
          >
            <option value="">
              {countriesQuery.isLoading
                ? 'Loading countries...'
                : 'All countries'}
            </option>
            {countries.map((country) => (
              <option key={country} value={country}>
                {country}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span className="sr-only">Filter by job title</span>
          <select
            className="h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition placeholder:text-[#8b8175] focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20"
            disabled={jobTitlesQuery.isLoading}
            onChange={(event) => updateJobTitleFilter(event.target.value)}
            value={filters.jobTitle}
          >
            <option value="">
              {jobTitlesQuery.isLoading
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

        <div className="flex gap-2">
          <button
            className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-[#cfc4b4] bg-white text-[#5c554b] transition hover:bg-[#fffaf1]"
            onClick={clearFilters}
            title="Clear filters"
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
      </div>

      {formMode ? (
        <Modal
          description="Required fields map directly to the backend employee schema."
          onClose={closeForm}
          title={formMode === 'edit' ? 'Edit employee' : 'Add employee'}
        >
          <EmployeeForm
            error={getErrorMessage(
              createEmployee.error ?? updateEmployee.error,
            )}
            countries={formCountries}
            isSubmitting={isFormSubmitting}
            isCountriesLoading={countriesQuery.isLoading}
            isJobTitlesLoading={formJobTitlesQuery.isLoading}
            jobTitles={formJobTitles}
            mode={formMode}
            onChange={updateFormValue}
            onCountryChange={updateFormCountry}
            onClose={closeForm}
            onSubmit={submitEmployeeForm}
            values={formValues}
          />
        </Modal>
      ) : null}

      {deletingEmployee ? (
        <DeleteEmployeeDialog
          employee={deletingEmployee}
          error={getErrorMessage(deleteEmployee.error)}
          isDeleting={deleteEmployee.isPending}
          onCancel={closeDeleteDialog}
          onConfirm={() => void confirmDeleteEmployee()}
        />
      ) : null}

      <div className="overflow-hidden rounded-md border border-[#d8d0c2] bg-white">
        <div className="flex items-center justify-between gap-3 border-b border-[#e1d8ca] bg-[#fffaf1] px-4 py-3">
          <p className="text-sm font-medium text-[#231f20]">
            {employeesQuery.isLoading
              ? 'Loading employees'
              : `${total} employees`}
          </p>
          <button
            className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#cfc4b4] bg-white px-3 text-sm font-medium text-[#5c554b] transition hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-60"
            disabled={employeesQuery.isFetching}
            onClick={() => employeesQuery.refetch()}
            type="button"
          >
            <RefreshCw
              className={`h-4 w-4 ${employeesQuery.isFetching ? 'animate-spin' : ''}`}
              aria-hidden="true"
            />
            Refresh
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full min-w-232 border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-[#e1d8ca] bg-[#fffaf1] text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Job title</th>
                <th className="px-4 py-3">Department</th>
                <th className="px-4 py-3">Country</th>
                <th className="px-4 py-3">Salary</th>
                <th className="px-4 py-3">Hire date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employeesQuery.isLoading ? (
                <TableMessage message="Loading employee records..." />
              ) : employeesQuery.isError ? (
                <TableMessage
                  message={
                    getErrorMessage(employeesQuery.error) ??
                    'Unable to load employee records.'
                  }
                  tone="error"
                />
              ) : employees.length === 0 ? (
                <TableMessage message="No employees match the current filters." />
              ) : (
                employees.map((employee) => (
                  <tr
                    className="border-b border-[#eee6da] last:border-0 hover:bg-[#fffaf1]"
                    key={employee.id}
                  >
                    <td className="px-4 py-3">
                      <div>
                        <p className="font-medium text-[#231f20]">
                          {employee.full_name}
                        </p>
                        <p className="text-xs text-[#6d6255]">
                          {employee.employee_code}
                        </p>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-[#4f473d]">
                      {employee.job_title}
                    </td>
                    <td className="px-4 py-3 text-[#4f473d]">
                      {employee.department}
                    </td>
                    <td className="px-4 py-3 text-[#4f473d]">
                      {employee.country}
                    </td>
                    <td className="px-4 py-3 font-medium">
                      {formatSalary(employee.salary, employee.currency)}
                    </td>
                    <td className="px-4 py-3 text-[#4f473d]">
                      {formatDate(employee.hire_date)}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#cfc4b4] text-[#5c554b] transition hover:bg-[#fffaf1]"
                          onClick={() => openEditForm(employee)}
                          title={`Edit ${employee.full_name}`}
                          type="button"
                        >
                          <Edit2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                        <button
                          className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-[#e0b8aa] text-[#9b341f] transition hover:bg-[#fff2ed] disabled:cursor-not-allowed disabled:opacity-60"
                          disabled={deleteEmployee.isPending}
                          onClick={() => openDeleteDialog(employee)}
                          title={`Delete ${employee.full_name}`}
                          type="button"
                        >
                          <Trash2 className="h-4 w-4" aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-3 border-t border-[#e1d8ca] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-[#6d6255]">
            Page {page} of {totalPages}
          </p>
          <div className="flex gap-2">
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#cfc4b4] bg-white px-3 text-sm font-medium transition hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page <= 1 || employeesQuery.isFetching}
              onClick={() => setPage((current) => Math.max(1, current - 1))}
              type="button"
            >
              <ChevronLeft className="h-4 w-4" aria-hidden="true" />
              Previous
            </button>
            <button
              className="inline-flex h-9 items-center justify-center gap-2 rounded-md border border-[#cfc4b4] bg-white px-3 text-sm font-medium transition hover:bg-[#fffaf1] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={page >= totalPages || employeesQuery.isFetching}
              onClick={() =>
                setPage((current) => Math.min(totalPages, current + 1))
              }
              type="button"
            >
              Next
              <ChevronRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
    </section>
  )
}

type EmployeeFormProps = {
  countries: Array<string>
  error: string | null
  isCountriesLoading: boolean
  isJobTitlesLoading: boolean
  isSubmitting: boolean
  jobTitles: Array<string>
  mode: FormMode
  onChange: (field: keyof EmployeeCreateInput, value: string) => void
  onCountryChange: (country: string) => void
  onClose: () => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
  values: EmployeeCreateInput
}

function EmployeeForm({
  countries,
  error,
  isCountriesLoading,
  isJobTitlesLoading,
  isSubmitting,
  jobTitles,
  mode,
  onChange,
  onCountryChange,
  onClose,
  onSubmit,
  values,
}: EmployeeFormProps) {
  const isEdit = mode === 'edit'

  return (
    <form className="space-y-4" onSubmit={onSubmit}>
      <div className="grid gap-3 md:grid-cols-2">
        <FormField
          disabled={isEdit}
          label="Employee code"
          onChange={(value) => onChange('employee_code', value)}
          required
          value={values.employee_code}
        />
        <FormField
          label="Full name"
          onChange={(value) => onChange('full_name', value)}
          required
          value={values.full_name}
        />
        <FormSelect
          disabled={isCountriesLoading}
          label="Country"
          onChange={onCountryChange}
          options={countries}
          placeholder={
            isCountriesLoading ? 'Loading countries...' : 'Select country'
          }
          required
          value={values.country}
        />
        <FormSelect
          disabled={!values.country || isJobTitlesLoading}
          label="Job title"
          onChange={(value) => onChange('job_title', value)}
          options={jobTitles}
          placeholder={
            !values.country
              ? 'Select country first'
              : isJobTitlesLoading
                ? 'Loading job titles...'
                : 'Select job title'
          }
          required
          value={values.job_title}
        />
        <FormField
          label="Department"
          onChange={(value) => onChange('department', value)}
          required
          value={values.department}
        />
        <FormField
          label="Currency"
          maxLength={3}
          minLength={3}
          onChange={(value) => onChange('currency', value.toUpperCase())}
          required
          value={values.currency}
        />
        <FormField
          label="Salary"
          min="0.01"
          onChange={(value) => onChange('salary', value)}
          required
          step="0.01"
          type="number"
          value={values.salary}
        />
        <FormField
          label="Employment type"
          onChange={(value) => onChange('employment_type', value)}
          required
          value={values.employment_type}
        />
        <FormField
          label="Hire date"
          onChange={(value) => onChange('hire_date', value)}
          required
          type="date"
          value={values.hire_date}
        />
      </div>

      {error ? (
        <p className="rounded-md border border-[#e0b8aa] bg-[#fff2ed] px-3 py-2 text-sm text-[#9b341f]">
          {error}
        </p>
      ) : null}

      <div className="flex justify-end gap-2 border-t border-[#eee6da] pt-4">
        <button
          className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc4b4] bg-white px-4 text-sm font-semibold text-[#231f20] transition hover:bg-[#fffaf1]"
          onClick={onClose}
          type="button"
        >
          Cancel
        </button>
        <button
          className="inline-flex h-10 items-center justify-center rounded-md bg-[#1f5e67] px-4 text-sm font-semibold text-white transition hover:bg-[#174b52] disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isSubmitting}
          type="submit"
        >
          {isSubmitting ? 'Saving...' : 'Save employee'}
        </button>
      </div>
    </form>
  )
}

type ModalProps = {
  children: ReactNode
  description: string
  onClose: () => void
  title: string
}

function Modal({ children, description, onClose, title }: ModalProps) {
  return (
    <div
      aria-labelledby="employee-modal-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-[#231f20]/45 px-4 py-6 backdrop-blur-sm sm:items-center"
      role="dialog"
    >
      <div className="w-full max-w-3xl rounded-md border border-[#d8d0c2] bg-white shadow-xl">
        <div className="flex items-start justify-between gap-4 border-b border-[#eee6da] px-5 py-4">
          <div>
            <h3 className="text-lg font-semibold" id="employee-modal-title">
              {title}
            </h3>
            <p className="mt-1 text-sm text-[#6d6255]">{description}</p>
          </div>
          <button
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#cfc4b4] text-[#5c554b] transition hover:bg-[#fffaf1]"
            onClick={onClose}
            title="Close"
            type="button"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </button>
        </div>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}

type DeleteEmployeeDialogProps = {
  employee: Employee
  error: string | null
  isDeleting: boolean
  onCancel: () => void
  onConfirm: () => void
}

function DeleteEmployeeDialog({
  employee,
  error,
  isDeleting,
  onCancel,
  onConfirm,
}: DeleteEmployeeDialogProps) {
  return (
    <div
      aria-labelledby="delete-employee-title"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#231f20]/45 px-4 py-6 backdrop-blur-sm"
      role="dialog"
    >
      <div className="w-full max-w-md rounded-md border border-[#e0b8aa] bg-white shadow-xl">
        <div className="border-b border-[#f0d4ca] px-5 py-4">
          <h3
            className="text-lg font-semibold text-[#231f20]"
            id="delete-employee-title"
          >
            Delete employee
          </h3>
          <p className="mt-2 text-sm leading-6 text-[#5f574c]">
            This will permanently delete{' '}
            <span className="font-semibold text-[#231f20]">
              {employee.full_name}
            </span>{' '}
            from the salary records.
          </p>
        </div>

        <div className="space-y-4 px-5 py-4">
          <div className="rounded-md bg-[#fff7f3] px-3 py-2 text-sm text-[#7b2d1d]">
            Employee code: {employee.employee_code}
          </div>

          {error ? (
            <p className="rounded-md border border-[#e0b8aa] bg-[#fff2ed] px-3 py-2 text-sm text-[#9b341f]">
              {error}
            </p>
          ) : null}

          <div className="flex justify-end gap-2">
            <button
              className="inline-flex h-10 items-center justify-center rounded-md border border-[#cfc4b4] bg-white px-4 text-sm font-semibold text-[#231f20] transition hover:bg-[#fffaf1]"
              disabled={isDeleting}
              onClick={onCancel}
              type="button"
            >
              Cancel
            </button>
            <button
              className="inline-flex h-10 items-center justify-center rounded-md bg-[#9b341f] px-4 text-sm font-semibold text-white transition hover:bg-[#7f2a19] disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isDeleting}
              onClick={onConfirm}
              type="button"
            >
              {isDeleting ? 'Deleting...' : 'Delete employee'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

type FormFieldProps = {
  disabled?: boolean
  label: string
  maxLength?: number
  min?: string
  minLength?: number
  onChange: (value: string) => void
  required?: boolean
  step?: string
  type?: 'date' | 'number' | 'text'
  value: string
}

function FormField({
  disabled = false,
  label,
  maxLength,
  min,
  minLength,
  onChange,
  required = false,
  step,
  type = 'text',
  value,
}: FormFieldProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
        {label}
      </span>
      <input
        className="mt-1 h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition placeholder:text-[#8b8175] focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20 disabled:bg-[#f4eee5] disabled:text-[#7b7165]"
        disabled={disabled}
        maxLength={maxLength}
        min={min}
        minLength={minLength}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        step={step}
        type={type}
        value={value}
      />
    </label>
  )
}

type FormSelectProps = {
  disabled?: boolean
  label: string
  onChange: (value: string) => void
  options: Array<string>
  placeholder: string
  required?: boolean
  value: string
}

function FormSelect({
  disabled = false,
  label,
  onChange,
  options,
  placeholder,
  required = false,
  value,
}: FormSelectProps) {
  return (
    <label className="block">
      <span className="text-xs font-semibold tracking-[0.08em] text-[#6d6255] uppercase">
        {label}
      </span>
      <select
        className="mt-1 h-10 w-full rounded-md border border-[#cfc4b4] bg-white px-3 text-sm outline-none transition focus:border-[#1f5e67] focus:ring-2 focus:ring-[#1f5e67]/20 disabled:bg-[#f4eee5] disabled:text-[#7b7165]"
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        value={value}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  )
}

function TableMessage({
  message,
  tone = 'neutral',
}: {
  message: string
  tone?: 'error' | 'neutral'
}) {
  return (
    <tr>
      <td className="px-4 py-12 text-center" colSpan={7}>
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

function normalizeCreateInput(
  values: EmployeeCreateInput,
): EmployeeCreateInput {
  return {
    employee_code: values.employee_code.trim(),
    full_name: values.full_name.trim(),
    job_title: values.job_title.trim(),
    department: values.department.trim(),
    country: values.country.trim(),
    currency: values.currency.trim().toUpperCase(),
    salary: values.salary,
    employment_type: values.employment_type.trim(),
    hire_date: values.hire_date,
  }
}

function mergeOptions(options: Array<string>, selectedValue: string) {
  const normalizedSelectedValue = selectedValue.trim()
  if (!normalizedSelectedValue || options.includes(normalizedSelectedValue)) {
    return options
  }

  return [...options, normalizedSelectedValue].sort((first, second) =>
    first.localeCompare(second),
  )
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

function formatSalary(salary: string, currency: string) {
  const numericSalary = Number(salary)

  if (!Number.isFinite(numericSalary)) {
    return `${currency} ${salary}`
  }

  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(numericSalary)
  } catch {
    return `${currency} ${salary}`
  }
}

function formatDate(value: string) {
  const date = new Date(value)

  if (Number.isNaN(date.getTime())) {
    return value
  }

  return new Intl.DateTimeFormat(undefined, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}

function useDebouncedValue<T>(value: T, delayMs: number) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setDebouncedValue(value)
    }, delayMs)

    return () => window.clearTimeout(timeoutId)
  }, [delayMs, value])

  return debouncedValue
}
