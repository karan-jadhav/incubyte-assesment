export type Employee = {
  id: number
  employee_code: string
  full_name: string
  job_title: string
  department: string
  country: string
  currency: string
  salary: string
  employment_type: string
  hire_date: string
  created_at: string
  updated_at: string
}

export type EmployeeCreateInput = {
  employee_code: string
  full_name: string
  job_title: string
  department: string
  country: string
  currency: string
  salary: string
  employment_type: string
  hire_date: string
}

export type EmployeeUpdateInput = Partial<
  Omit<EmployeeCreateInput, 'employee_code'>
>

export type EmployeeListResponse = {
  items: Array<Employee>
  total: number
  page: number
  page_size: number
}

export type LookupListResponse = {
  items: Array<string>
}

export type ListEmployeesParams = {
  page?: number
  page_size?: number
  search?: string
  country?: string
  job_title?: string
}

export type SalarySummaryResponse = {
  country: string
  job_title: string | null
  currency: string | null
  employee_count: number
  min_salary: string | null
  max_salary: string | null
  avg_salary: string | null
}

export type JobTitleSalaryBreakdownItem = {
  job_title: string
  currency: string | null
  employee_count: number
  min_salary: string | null
  max_salary: string | null
  avg_salary: string | null
}

export type JobTitleSalaryBreakdownResponse = {
  country: string
  items: Array<JobTitleSalaryBreakdownItem>
}

export type TopCountrySalaryItem = {
  country: string
  currency: string | null
  employee_count: number
  min_salary: string | null
  max_salary: string | null
  avg_salary: string | null
}

export type TopCountrySalaryResponse = {
  items: Array<TopCountrySalaryItem>
}
