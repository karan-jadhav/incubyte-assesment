from uuid import uuid4

import pytest
from sqlalchemy import delete

from backend.database import async_session_maker
from backend.models import Employee
from backend.repositories import (
    DuplicateEmployeeCodeRepositoryError,
    EmployeeRepository,
)
from backend.schemas import EmployeeCreate, EmployeeUpdate


pytestmark = pytest.mark.anyio
TEST_EMPLOYEE_CODE_PREFIX = "IT-"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
async def clean_integration_employees():
    await delete_integration_employees()
    yield
    await delete_integration_employees()


async def test_repository_creates_gets_updates_and_deletes_employee():
    async with async_session_maker() as session:
        repository = EmployeeRepository(session)
        created = await repository.create(employee_create("IT-CRUD-001"))

        fetched = await repository.get_by_id(created.id)
        assert fetched is not None
        assert fetched.employee_code == "IT-CRUD-001"

        updated = await repository.update(
            fetched,
            EmployeeUpdate.model_validate(
                {
                    "job_title": "Senior Software Engineer",
                    "salary": "150000.00",
                }
            ),
        )
        assert updated.job_title == "Senior Software Engineer"
        assert str(updated.salary) == "150000.00"

        await repository.delete(updated)

        assert await repository.get_by_id(created.id) is None


async def test_repository_raises_for_duplicate_employee_code():
    async with async_session_maker() as session:
        repository = EmployeeRepository(session)
        await repository.create(employee_create("IT-DUPE-001"))

        try:
            await repository.create(employee_create("IT-DUPE-001"))
        except DuplicateEmployeeCodeRepositoryError as error:
            assert error.employee_code == "IT-DUPE-001"
        else:
            raise AssertionError("Expected DuplicateEmployeeCodeRepositoryError")


async def test_repository_lists_with_pagination_search_and_filters():
    unique_country = f"Integration Country {uuid4()}"
    unique_name = f"Integration Ava {uuid4()}"
    async with async_session_maker() as session:
        repository = EmployeeRepository(session)
        await repository.create(
            employee_create(
                "IT-LIST-001",
                full_name=unique_name,
                country=unique_country,
                job_title="Software Engineer",
            )
        )
        await repository.create(
            employee_create(
                "IT-LIST-002",
                full_name="Noah Patel",
                country=unique_country,
                job_title="Data Analyst",
            )
        )
        await repository.create(
            employee_create(
                "IT-LIST-003",
                full_name="Mia Brown",
                country=unique_country,
                job_title="Software Engineer",
            )
        )

        employees, total = await repository.list(
            page=1,
            page_size=10,
            search=unique_name,
            country=unique_country,
            job_title="Software Engineer",
        )

        assert total == 1
        assert [employee.employee_code for employee in employees] == ["IT-LIST-001"]

        page_two, total = await repository.list(
            page=2,
            page_size=2,
            country=unique_country,
        )

        assert total == 3
        assert len(page_two) == 1


async def test_repository_lists_distinct_countries_and_job_titles():
    unique_country = f"Integration Country {uuid4()}"
    async with async_session_maker() as session:
        repository = EmployeeRepository(session)
        await repository.create(
            employee_create(
                "IT-LOOKUP-001",
                country=unique_country,
                job_title="Software Engineer",
            )
        )
        await repository.create(
            employee_create(
                "IT-LOOKUP-002",
                country=unique_country,
                job_title="Data Analyst",
            )
        )

        countries = await repository.list_countries()
        job_titles = await repository.list_job_titles(country=unique_country)

    assert unique_country in countries
    assert job_titles == ["Data Analyst", "Software Engineer"]


def employee_create(
    employee_code: str | None = None,
    *,
    full_name: str = "Ava Shah",
    country: str = "India",
    job_title: str = "Software Engineer",
) -> EmployeeCreate:
    return EmployeeCreate.model_validate(
        {
            "employee_code": employee_code or f"IT-{uuid4()}",
            "full_name": full_name,
            "job_title": job_title,
            "department": "Engineering",
            "country": country,
            "currency": "INR",
            "salary": "125000.00",
            "employment_type": "Full-time",
            "hire_date": "2021-04-12",
        }
    )


async def delete_integration_employees() -> None:
    async with async_session_maker() as session:
        await session.execute(
            delete(Employee).where(
                Employee.employee_code.startswith(TEST_EMPLOYEE_CODE_PREFIX)
            )
        )
        await session.commit()
