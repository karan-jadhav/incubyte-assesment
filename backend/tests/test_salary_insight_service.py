from decimal import Decimal

import pytest

from backend.schemas import (
    JobTitleSalaryBreakdownItem,
    SalarySummaryResponse,
    TopCountrySalaryItem,
)
from backend.services import SalaryInsightService


pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def test_insight_service_gets_salary_summary():
    repository = FakeSalaryInsightRepository()
    service = SalaryInsightService(repository)

    summary = await service.get_salary_summary(
        country="India",
        job_title="Software Engineer",
    )

    assert summary.employee_count == 2
    assert repository.summary_filters == {
        "country": "India",
        "job_title": "Software Engineer",
    }


async def test_insight_service_wraps_job_title_breakdown():
    repository = FakeSalaryInsightRepository()
    service = SalaryInsightService(repository)

    response = await service.get_job_title_breakdown(country="India")

    assert response.country == "India"
    assert response.items[0].job_title == "Software Engineer"
    assert repository.breakdown_country == "India"


async def test_insight_service_wraps_top_countries():
    repository = FakeSalaryInsightRepository()
    service = SalaryInsightService(repository)

    response = await service.get_top_countries_by_average_salary(limit=3)

    assert response.items[0].country == "India"
    assert repository.top_countries_limit == 3


class FakeSalaryInsightRepository:
    def __init__(self):
        self.summary_filters = None
        self.breakdown_country = None
        self.top_countries_limit = None

    async def salary_summary(self, *, country, job_title=None):
        self.summary_filters = {
            "country": country,
            "job_title": job_title,
        }
        return SalarySummaryResponse(
            country=country,
            job_title=job_title,
            currency="INR",
            employee_count=2,
            min_salary=Decimal("100000.00"),
            max_salary=Decimal("200000.00"),
            avg_salary=Decimal("150000.00"),
        )

    async def job_title_breakdown(self, *, country):
        self.breakdown_country = country
        return [
            JobTitleSalaryBreakdownItem(
                job_title="Software Engineer",
                currency="INR",
                employee_count=2,
                min_salary=Decimal("100000.00"),
                max_salary=Decimal("200000.00"),
                avg_salary=Decimal("150000.00"),
            )
        ]

    async def top_countries_by_average_salary(self, *, limit):
        self.top_countries_limit = limit
        return [
            TopCountrySalaryItem(
                country="India",
                currency="INR",
                employee_count=2,
                min_salary=Decimal("100000.00"),
                max_salary=Decimal("200000.00"),
                avg_salary=Decimal("150000.00"),
            )
        ]
