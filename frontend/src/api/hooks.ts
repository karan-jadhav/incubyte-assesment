import {
  keepPreviousData,
  queryOptions,
  useMutation,
  useQuery,
  useQueryClient,
} from '@tanstack/react-query'

import { apiClient } from './client'
import type {
  Employee,
  EmployeeCreateInput,
  EmployeeListResponse,
  EmployeeUpdateInput,
  JobTitleSalaryBreakdownResponse,
  ListEmployeesParams,
  LookupListResponse,
  SalarySummaryResponse,
} from './types'

export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (params: ListEmployeesParams = {}) =>
    [
      ...employeeQueryKeys.lists(),
      normalizeListEmployeesParams(params),
    ] as const,
  lookups: () => [...employeeQueryKeys.all, 'lookup'] as const,
  countries: () => [...employeeQueryKeys.lookups(), 'countries'] as const,
  jobTitles: (country: string | undefined = undefined) =>
    [...employeeQueryKeys.lookups(), 'job-titles', country || 'all'] as const,
  details: () => [...employeeQueryKeys.all, 'detail'] as const,
  detail: (employeeId: number) =>
    [...employeeQueryKeys.details(), employeeId] as const,
}

export const insightQueryKeys = {
  all: ['insights'] as const,
  salarySummary: (country: string, jobTitle: string | undefined = undefined) =>
    [
      ...insightQueryKeys.all,
      'salary-summary',
      country,
      jobTitle || 'all',
    ] as const,
  jobTitleBreakdown: (country: string) =>
    [...insightQueryKeys.all, 'job-title-breakdown', country] as const,
}

export function employeeListQueryOptions(params: ListEmployeesParams = {}) {
  return queryOptions({
    queryKey: employeeQueryKeys.list(params),
    queryFn: () =>
      apiClient.get<EmployeeListResponse>('/employees', {
        query: params,
      }),
  })
}

export function employeeDetailQueryOptions(employeeId: number) {
  return queryOptions({
    queryKey: employeeQueryKeys.detail(employeeId),
    queryFn: () => apiClient.get<Employee>(`/employees/${employeeId}`),
  })
}

export function useEmployees(params: ListEmployeesParams = {}) {
  return useQuery({
    ...employeeListQueryOptions(params),
    placeholderData: keepPreviousData,
  })
}

export function useEmployee(employeeId: number) {
  return useQuery(employeeDetailQueryOptions(employeeId))
}

export function useEmployeeCountries() {
  return useQuery({
    queryKey: employeeQueryKeys.countries(),
    queryFn: () => apiClient.get<LookupListResponse>('/employees/countries'),
  })
}

export function useEmployeeJobTitles(country: string | undefined = undefined) {
  return useQuery({
    queryKey: employeeQueryKeys.jobTitles(country),
    queryFn: () =>
      apiClient.get<LookupListResponse>('/employees/job-titles', {
        query: { country },
      }),
  })
}

export function useSalarySummary(
  country: string,
  jobTitle: string | undefined = undefined,
) {
  return useQuery({
    queryKey: insightQueryKeys.salarySummary(country, jobTitle),
    queryFn: () =>
      apiClient.get<SalarySummaryResponse>('/insights/salary-summary', {
        query: {
          country,
          job_title: jobTitle,
        },
      }),
    enabled: country.length > 0,
  })
}

export function useJobTitleBreakdown(country: string) {
  return useQuery({
    queryKey: insightQueryKeys.jobTitleBreakdown(country),
    queryFn: () =>
      apiClient.get<JobTitleSalaryBreakdownResponse>(
        '/insights/job-title-breakdown',
        {
          query: { country },
        },
      ),
    enabled: country.length > 0,
  })
}

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EmployeeCreateInput) =>
      apiClient.post<Employee>('/employees', input),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lookups() })
      queryClient.invalidateQueries({ queryKey: insightQueryKeys.all })
      queryClient.setQueryData(employeeQueryKeys.detail(employee.id), employee)
    },
  })
}

export function useUpdateEmployeeMutation(employeeId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EmployeeUpdateInput) =>
      apiClient.patch<Employee>(`/employees/${employeeId}`, input),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lookups() })
      queryClient.invalidateQueries({ queryKey: insightQueryKeys.all })
      queryClient.setQueryData(employeeQueryKeys.detail(employee.id), employee)
    },
  })
}

export function useDeleteEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (employeeId: number) =>
      apiClient.delete<void>(`/employees/${employeeId}`),
    onSuccess: (_result, employeeId) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() })
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lookups() })
      queryClient.invalidateQueries({ queryKey: insightQueryKeys.all })
      queryClient.removeQueries({
        queryKey: employeeQueryKeys.detail(employeeId),
      })
    },
  })
}

function normalizeListEmployeesParams(params: ListEmployeesParams) {
  return {
    page: params.page ?? 1,
    page_size: params.page_size ?? 20,
    search: params.search || undefined,
    country: params.country || undefined,
    job_title: params.job_title || undefined,
  }
}
