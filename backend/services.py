from backend.models import Employee
from backend.repositories import (
    DuplicateEmployeeCodeRepositoryError,
    EmployeeRepository,
    SalaryInsightRepository,
)
from backend.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    JobTitleSalaryBreakdownResponse,
    SalarySummaryResponse,
)


class DuplicateEmployeeCodeError(Exception):
    def __init__(self, employee_code: str):
        self.employee_code = employee_code
        super().__init__(f"Employee code {employee_code} already exists")


class EmployeeNotFoundError(Exception):
    def __init__(self, employee_id: int):
        self.employee_id = employee_id
        super().__init__(f"Employee {employee_id} not found")


class EmployeeService:
    def __init__(self, repository: EmployeeRepository):
        self.repository = repository

    async def create_employee(self, data: EmployeeCreate) -> Employee:
        try:
            return await self.repository.create(data)
        except DuplicateEmployeeCodeRepositoryError as error:
            raise DuplicateEmployeeCodeError(error.employee_code) from error

    async def list_employees(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        country: str | None = None,
        job_title: str | None = None,
    ) -> tuple[list[Employee], int]:
        return await self.repository.list(
            page=page,
            page_size=page_size,
            search=search,
            country=country,
            job_title=job_title,
        )

    async def get_employee(self, employee_id: int) -> Employee:
        employee = await self.repository.get_by_id(employee_id)
        if employee is None:
            raise EmployeeNotFoundError(employee_id)
        return employee

    async def update_employee(self, employee_id: int, data: EmployeeUpdate) -> Employee:
        employee = await self.get_employee(employee_id)
        return await self.repository.update(employee, data)

    async def delete_employee(self, employee_id: int) -> None:
        employee = await self.get_employee(employee_id)
        await self.repository.delete(employee)

    async def list_countries(self) -> list[str]:
        return await self.repository.list_countries()

    async def list_job_titles(self, *, country: str | None = None) -> list[str]:
        return await self.repository.list_job_titles(country=country)


class SalaryInsightService:
    def __init__(self, repository: SalaryInsightRepository):
        self.repository = repository

    async def get_salary_summary(
        self,
        *,
        country: str,
        job_title: str | None = None,
    ) -> SalarySummaryResponse:
        return await self.repository.salary_summary(
            country=country,
            job_title=job_title,
        )

    async def get_job_title_breakdown(
        self,
        *,
        country: str,
    ) -> JobTitleSalaryBreakdownResponse:
        items = await self.repository.job_title_breakdown(country=country)
        return JobTitleSalaryBreakdownResponse(country=country, items=items)
