from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from backend.models import Employee
from backend.schemas import EmployeeCreate, EmployeeUpdate


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
