from decimal import Decimal

import httpx2
import pytest

from backend.main import create_app
from backend.routes.insights import get_salary_insight_service
from backend.schemas import (
    JobTitleSalaryBreakdownResponse,
    SalarySummaryResponse,
    TopCountrySalaryResponse,
)


pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def test_salary_summary_route_returns_country_metrics():
    service = FakeSalaryInsightService()

    async with build_client(service) as client:
        response = await client.get(
            "/insights/salary-summary",
            params={"country": "India", "job_title": "Software Engineer"},
        )

    assert response.status_code == 200
    assert response.json() == {
        "country": "India",
        "job_title": "Software Engineer",
        "currency": "INR",
        "employee_count": 2,
        "min_salary": "100000.00",
        "max_salary": "200000.00",
        "avg_salary": "150000.00",
    }
    assert service.summary_filters == {
        "country": "India",
        "job_title": "Software Engineer",
    }


async def test_salary_summary_route_requires_country():
    service = FakeSalaryInsightService()

    async with build_client(service) as client:
        response = await client.get("/insights/salary-summary")

    assert response.status_code == 422


async def test_job_title_breakdown_route_returns_items():
    service = FakeSalaryInsightService()

    async with build_client(service) as client:
        response = await client.get(
            "/insights/job-title-breakdown",
            params={"country": "India"},
        )

    assert response.status_code == 200
    assert response.json()["country"] == "India"
    assert response.json()["items"] == [
        {
            "job_title": "Software Engineer",
            "currency": "INR",
            "employee_count": 2,
            "min_salary": "100000.00",
            "max_salary": "200000.00",
            "avg_salary": "150000.00",
        }
    ]
    assert service.breakdown_country == "India"


async def test_top_countries_route_returns_items():
    service = FakeSalaryInsightService()

    async with build_client(service) as client:
        response = await client.get(
            "/insights/top-countries",
            params={"limit": 3},
        )

    assert response.status_code == 200
    assert response.json()["items"] == [
        {
            "country": "India",
            "currency": "INR",
            "employee_count": 2,
            "min_salary": "100000.00",
            "max_salary": "200000.00",
            "avg_salary": "150000.00",
        }
    ]
    assert service.top_countries_limit == 3


async def test_top_countries_route_validates_limit():
    service = FakeSalaryInsightService()

    async with build_client(service) as client:
        response = await client.get(
            "/insights/top-countries",
            params={"limit": 0},
        )

    assert response.status_code == 422


def build_client(service):
    app = create_app()
    app.dependency_overrides[get_salary_insight_service] = lambda: service
    return httpx2.AsyncClient(
        transport=httpx2.ASGITransport(app=app),
        base_url="http://testserver",
    )


class FakeSalaryInsightService:
    def __init__(self):
        self.summary_filters = None
        self.breakdown_country = None
        self.top_countries_limit = None

    async def get_salary_summary(self, *, country, job_title=None):
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

    async def get_job_title_breakdown(self, *, country):
        self.breakdown_country = country
        return JobTitleSalaryBreakdownResponse(
            country=country,
            items=[
                {
                    "job_title": "Software Engineer",
                    "currency": "INR",
                    "employee_count": 2,
                    "min_salary": Decimal("100000.00"),
                    "max_salary": Decimal("200000.00"),
                    "avg_salary": Decimal("150000.00"),
                }
            ],
        )

    async def get_top_countries_by_average_salary(self, *, limit):
        self.top_countries_limit = limit
        return TopCountrySalaryResponse(
            items=[
                {
                    "country": "India",
                    "currency": "INR",
                    "employee_count": 2,
                    "min_salary": Decimal("100000.00"),
                    "max_salary": Decimal("200000.00"),
                    "avg_salary": Decimal("150000.00"),
                }
            ],
        )
