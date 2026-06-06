from decimal import Decimal
from uuid import uuid4

import pytest
from sqlalchemy import delete

from backend.database import async_session_maker
from backend.models import Employee
from backend.repositories import EmployeeRepository, SalaryInsightRepository
from backend.schemas import EmployeeCreate


pytestmark = pytest.mark.anyio
TEST_EMPLOYEE_CODE_PREFIX = "IT-INSIGHT-"


@pytest.fixture
def anyio_backend():
    return "asyncio"


@pytest.fixture(autouse=True)
async def clean_integration_employees():
    await delete_integration_employees()
    yield
    await delete_integration_employees()


async def test_repository_calculates_salary_summary_for_country_and_job_title():
    unique_country = f"Insight Country {uuid4()}"

    async with async_session_maker() as session:
        employee_repository = EmployeeRepository(session)
        insight_repository = SalaryInsightRepository(session)
        await employee_repository.create(
            employee_create(
                "IT-INSIGHT-SUM-001",
                country=unique_country,
                job_title="Software Engineer",
                salary="100000.00",
            )
        )
        await employee_repository.create(
            employee_create(
                "IT-INSIGHT-SUM-002",
                country=unique_country,
                job_title="Software Engineer",
                salary="200000.00",
            )
        )
        await employee_repository.create(
            employee_create(
                "IT-INSIGHT-SUM-003",
                country=unique_country,
                job_title="Data Analyst",
                salary="300000.00",
            )
        )

        country_summary = await insight_repository.salary_summary(
            country=unique_country
        )
        job_title_summary = await insight_repository.salary_summary(
            country=unique_country,
            job_title="Software Engineer",
        )

    assert country_summary.employee_count == 3
    assert country_summary.currency == "INR"
    assert country_summary.min_salary == Decimal("100000.00")
    assert country_summary.max_salary == Decimal("300000.00")
    assert country_summary.avg_salary == Decimal("200000.00")
    assert job_title_summary.employee_count == 2
    assert job_title_summary.min_salary == Decimal("100000.00")
    assert job_title_summary.max_salary == Decimal("200000.00")
    assert job_title_summary.avg_salary == Decimal("150000.00")


async def test_repository_returns_empty_salary_summary_for_missing_filters():
    async with async_session_maker() as session:
        insight_repository = SalaryInsightRepository(session)
        summary = await insight_repository.salary_summary(
            country=f"Missing Country {uuid4()}",
            job_title="Missing Role",
        )

    assert summary.employee_count == 0
    assert summary.currency is None
    assert summary.min_salary is None
    assert summary.max_salary is None
    assert summary.avg_salary is None


async def test_repository_returns_job_title_breakdown_for_country():
    unique_country = f"Insight Country {uuid4()}"

    async with async_session_maker() as session:
        employee_repository = EmployeeRepository(session)
        insight_repository = SalaryInsightRepository(session)
        await employee_repository.create(
            employee_create(
                "IT-INSIGHT-BREAK-001",
                country=unique_country,
                job_title="Software Engineer",
                salary="100000.00",
            )
        )
        await employee_repository.create(
            employee_create(
                "IT-INSIGHT-BREAK-002",
                country=unique_country,
                job_title="Software Engineer",
                salary="200000.00",
            )
        )
        await employee_repository.create(
            employee_create(
                "IT-INSIGHT-BREAK-003",
                country=unique_country,
                job_title="Data Analyst",
                salary="300000.00",
            )
        )

        breakdown = await insight_repository.job_title_breakdown(country=unique_country)

    assert [item.job_title for item in breakdown] == [
        "Data Analyst",
        "Software Engineer",
    ]
    assert breakdown[0].employee_count == 1
    assert breakdown[0].avg_salary == Decimal("300000.00")
    assert breakdown[1].employee_count == 2
    assert breakdown[1].min_salary == Decimal("100000.00")
    assert breakdown[1].max_salary == Decimal("200000.00")
    assert breakdown[1].avg_salary == Decimal("150000.00")


def employee_create(
    employee_code: str,
    *,
    country: str,
    job_title: str = "Software Engineer",
    salary: str = "125000.00",
) -> EmployeeCreate:
    return EmployeeCreate.model_validate(
        {
            "employee_code": employee_code,
            "full_name": "Ava Shah",
            "job_title": job_title,
            "department": "Engineering",
            "country": country,
            "currency": "INR",
            "salary": salary,
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
