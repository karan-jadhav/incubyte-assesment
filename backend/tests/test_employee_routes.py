from datetime import date, datetime, timezone
from decimal import Decimal

import httpx2
import pytest

from backend.main import create_app
from backend.routes.employees import get_employee_service
from backend.services import DuplicateEmployeeCodeError, EmployeeNotFoundError


pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def employee_payload() -> dict:
    return {
        "employee_code": "EMP-001",
        "full_name": "Ava Shah",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "currency": "INR",
        "salary": "125000.00",
        "employment_type": "Full-time",
        "hire_date": "2021-04-12",
    }


async def test_create_employee_route_returns_created_employee():
    service = FakeEmployeeService()

    async with build_client(service) as client:
        response = await client.post("/employees", json=employee_payload())

    assert response.status_code == 201
    assert response.json()["employee_code"] == "EMP-001"
    assert service.created.employee_code == "EMP-001"


async def test_create_employee_route_returns_409_for_duplicate_employee_code():
    service = FakeEmployeeService(duplicate_code="EMP-001")

    async with build_client(service) as client:
        response = await client.post("/employees", json=employee_payload())

    assert response.status_code == 409
    assert response.json()["detail"] == "Employee code EMP-001 already exists"


async def test_list_employee_route_passes_pagination_and_filters():
    service = FakeEmployeeService()

    async with build_client(service) as client:
        response = await client.get(
            "/employees",
            params={
                "page": 2,
                "page_size": 10,
                "search": "ava",
                "country": "India",
                "job_title": "Software Engineer",
            },
        )

    assert response.status_code == 200
    assert response.json()["total"] == 1
    assert response.json()["page"] == 2
    assert response.json()["page_size"] == 10
    assert service.list_filters == {
        "page": 2,
        "page_size": 10,
        "search": "ava",
        "country": "India",
        "job_title": "Software Engineer",
    }


async def test_get_employee_route_returns_404_when_missing():
    service = FakeEmployeeService(missing=True)

    async with build_client(service) as client:
        response = await client.get("/employees/999")

    assert response.status_code == 404
    assert response.json()["detail"] == "Employee 999 not found"


async def test_update_employee_route_returns_updated_employee():
    service = FakeEmployeeService()

    async with build_client(service) as client:
        response = await client.patch("/employees/1", json={"salary": "150000.00"})

    assert response.status_code == 200
    assert response.json()["salary"] == "150000.00"
    assert service.updated_data.salary == Decimal("150000.00")


async def test_delete_employee_route_returns_no_content():
    service = FakeEmployeeService()

    async with build_client(service) as client:
        response = await client.delete("/employees/1")

    assert response.status_code == 204
    assert response.content == b""
    assert service.deleted_employee_id == 1


def build_client(service):
    app = create_app()
    app.dependency_overrides[get_employee_service] = lambda: service
    return httpx2.AsyncClient(
        transport=httpx2.ASGITransport(app=app),
        base_url="http://testserver",
    )


class FakeEmployeeService:
    def __init__(self, *, missing: bool = False, duplicate_code: str | None = None):
        self.missing = missing
        self.duplicate_code = duplicate_code
        self.created = None
        self.updated_data = None
        self.deleted_employee_id = None
        self.list_filters = None

    async def create_employee(self, data):
        if self.duplicate_code is not None:
            raise DuplicateEmployeeCodeError(self.duplicate_code)
        self.created = data
        return employee_record(
            salary=data.salary,
            employee_code=data.employee_code,
            full_name=data.full_name,
            job_title=data.job_title,
            department=data.department,
            country=data.country,
            currency=data.currency,
            employment_type=data.employment_type,
            hire_date=data.hire_date,
        )

    async def list_employees(self, **filters):
        self.list_filters = filters
        return [employee_record()], 1

    async def get_employee(self, employee_id):
        if self.missing:
            raise EmployeeNotFoundError(employee_id)
        return employee_record(id=employee_id)

    async def update_employee(self, employee_id, data):
        self.updated_data = data
        return employee_record(id=employee_id, salary=data.salary)

    async def delete_employee(self, employee_id):
        self.deleted_employee_id = employee_id


def employee_record(**overrides):
    data = {
        "id": 1,
        "employee_code": "EMP-001",
        "full_name": "Ava Shah",
        "job_title": "Software Engineer",
        "department": "Engineering",
        "country": "India",
        "currency": "INR",
        "salary": Decimal("125000.00"),
        "employment_type": "Full-time",
        "hire_date": date(2021, 4, 12),
        "created_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
        "updated_at": datetime(2026, 1, 1, tzinfo=timezone.utc),
    }
    data.update(overrides)
    return type("EmployeeRecord", (), data)()
