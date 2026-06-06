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
  ListEmployeesParams,
} from './types'

export const employeeQueryKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeQueryKeys.all, 'list'] as const,
  list: (params: ListEmployeesParams = {}) =>
    [
      ...employeeQueryKeys.lists(),
      normalizeListEmployeesParams(params),
    ] as const,
  details: () => [...employeeQueryKeys.all, 'detail'] as const,
  detail: (employeeId: number) =>
    [...employeeQueryKeys.details(), employeeId] as const,
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

export function useCreateEmployeeMutation() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (input: EmployeeCreateInput) =>
      apiClient.post<Employee>('/employees', input),
    onSuccess: (employee) => {
      queryClient.invalidateQueries({ queryKey: employeeQueryKeys.lists() })
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
