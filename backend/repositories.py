from decimal import Decimal

from sqlalchemy import distinct, func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Employee
from backend.schemas import (
    EmployeeCreate,
    EmployeeUpdate,
    JobTitleSalaryBreakdownItem,
    SalarySummaryResponse,
    TopCountrySalaryItem,
)


class DuplicateEmployeeCodeRepositoryError(Exception):
    def __init__(self, employee_code: str):
        self.employee_code = employee_code
        super().__init__(f"Employee code {employee_code} already exists")


class EmployeeRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def create(self, data: EmployeeCreate) -> Employee:
        employee = Employee(**data.model_dump())
        self.session.add(employee)
        try:
            await self.session.commit()
        except IntegrityError as error:
            await self.session.rollback()
            raise DuplicateEmployeeCodeRepositoryError(data.employee_code) from error
        await self.session.refresh(employee)
        return employee

    async def get_by_id(self, employee_id: int) -> Employee | None:
        return await self.session.get(Employee, employee_id)

    async def list(
        self,
        *,
        page: int,
        page_size: int,
        search: str | None = None,
        country: str | None = None,
        job_title: str | None = None,
    ) -> tuple[list[Employee], int]:
        filters = self._build_filters(
            search=search,
            country=country,
            job_title=job_title,
        )
        total = await self._count(filters)
        statement = (
            select(Employee)
            .where(*filters)
            .order_by(Employee.id)
            .offset((page - 1) * page_size)
            .limit(page_size)
        )
        result = await self.session.scalars(statement)
        return list(result.all()), total

    async def update(self, employee: Employee, data: EmployeeUpdate) -> Employee:
        for field, value in data.model_dump(exclude_unset=True).items():
            setattr(employee, field, value)

        await self.session.commit()
        await self.session.refresh(employee)
        return employee

    async def delete(self, employee: Employee) -> None:
        await self.session.delete(employee)
        await self.session.commit()

    async def list_countries(self) -> list[str]:
        statement = select(Employee.country).distinct().order_by(Employee.country)
        result = await self.session.scalars(statement)
        return list(result.all())

    async def list_job_titles(self, *, country: str | None = None) -> list[str]:
        statement = select(Employee.job_title).distinct()
        if country:
            statement = statement.where(Employee.country == country)
        statement = statement.order_by(Employee.job_title)
        result = await self.session.scalars(statement)
        return list(result.all())

    async def _count(self, filters: list) -> int:
        statement = select(func.count()).select_from(Employee).where(*filters)
        result = await self.session.scalar(statement)
        return int(result or 0)

    def _build_filters(
        self,
        *,
        search: str | None,
        country: str | None,
        job_title: str | None,
    ) -> list:
        filters = []
        if search:
            filters.append(Employee.full_name.ilike(f"%{search}%"))
        if country:
            filters.append(Employee.country == country)
        if job_title:
            filters.append(Employee.job_title == job_title)
        return filters


class SalaryInsightRepository:
    def __init__(self, session: AsyncSession):
        self.session = session

    async def salary_summary(
        self,
        *,
        country: str,
        job_title: str | None = None,
    ) -> SalarySummaryResponse:
        filters = [Employee.country == country]
        if job_title:
            filters.append(Employee.job_title == job_title)

        statement = select(
            func.count(Employee.id),
            func.min(Employee.salary),
            func.max(Employee.salary),
            func.avg(Employee.salary),
            func.count(distinct(Employee.currency)),
            func.min(Employee.currency),
        ).where(*filters)
        row = (await self.session.execute(statement)).one()
        employee_count = int(row[0] or 0)

        return SalarySummaryResponse(
            country=country,
            job_title=job_title,
            currency=self._resolve_currency(
                employee_count=employee_count,
                distinct_currency_count=int(row[4] or 0),
                currency=row[5],
            ),
            employee_count=employee_count,
            min_salary=row[1],
            max_salary=row[2],
            avg_salary=self._round_decimal(row[3]),
        )

    async def job_title_breakdown(
        self,
        *,
        country: str,
    ) -> list[JobTitleSalaryBreakdownItem]:
        statement = (
            select(
                Employee.job_title,
                func.count(Employee.id),
                func.min(Employee.salary),
                func.max(Employee.salary),
                func.avg(Employee.salary),
                func.count(distinct(Employee.currency)),
                func.min(Employee.currency),
            )
            .where(Employee.country == country)
            .group_by(Employee.job_title)
            .order_by(Employee.job_title)
        )
        rows = (await self.session.execute(statement)).all()
        return [
            JobTitleSalaryBreakdownItem(
                job_title=row[0],
                currency=self._resolve_currency(
                    employee_count=int(row[1] or 0),
                    distinct_currency_count=int(row[5] or 0),
                    currency=row[6],
                ),
                employee_count=int(row[1] or 0),
                min_salary=row[2],
                max_salary=row[3],
                avg_salary=self._round_decimal(row[4]),
            )
            for row in rows
        ]

    async def top_countries_by_average_salary(
        self,
        *,
        limit: int,
    ) -> list[TopCountrySalaryItem]:
        avg_salary = func.avg(Employee.salary)
        statement = (
            select(
                Employee.country,
                func.count(Employee.id),
                func.min(Employee.salary),
                func.max(Employee.salary),
                avg_salary,
                func.count(distinct(Employee.currency)),
                func.min(Employee.currency),
            )
            .group_by(Employee.country)
            .order_by(avg_salary.desc(), Employee.country)
            .limit(limit)
        )
        rows = (await self.session.execute(statement)).all()
        return [
            TopCountrySalaryItem(
                country=row[0],
                currency=self._resolve_currency(
                    employee_count=int(row[1] or 0),
                    distinct_currency_count=int(row[5] or 0),
                    currency=row[6],
                ),
                employee_count=int(row[1] or 0),
                min_salary=row[2],
                max_salary=row[3],
                avg_salary=self._round_decimal(row[4]),
            )
            for row in rows
        ]

    def _resolve_currency(
        self,
        *,
        employee_count: int,
        distinct_currency_count: int,
        currency: str | None,
    ) -> str | None:
        if employee_count == 0 or distinct_currency_count != 1:
            return None
        return currency

    def _round_decimal(self, value: Decimal | None) -> Decimal | None:
        if value is None:
            return None
        return value.quantize(Decimal("0.01"))
