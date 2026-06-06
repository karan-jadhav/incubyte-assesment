import pytest

from backend.schemas import EmployeeCreate, EmployeeUpdate
from backend.services import (
    DuplicateEmployeeCodeError,
    EmployeeNotFoundError,
    EmployeeService,
)


pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def payload() -> dict:
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


async def test_service_creates_employee_through_repository():
    repository = FakeRepository()
    service = EmployeeService(repository)
    data = EmployeeCreate.model_validate(payload())

    employee = await service.create_employee(data)

    assert employee == repository.employee
    assert repository.created_data == data


async def test_service_create_raises_duplicate_employee_code_error():
    repository = FakeRepository(duplicate_code="EMP-001")
    service = EmployeeService(repository)
    data = EmployeeCreate.model_validate(payload())

    try:
        await service.create_employee(data)
    except DuplicateEmployeeCodeError as error:
        assert error.employee_code == "EMP-001"
    else:
        raise AssertionError("Expected DuplicateEmployeeCodeError")


async def test_service_get_employee_raises_when_missing():
    service = EmployeeService(FakeRepository(employee=None))

    try:
        await service.get_employee(123)
    except EmployeeNotFoundError as error:
        assert error.employee_id == 123
    else:
        raise AssertionError("Expected EmployeeNotFoundError")


async def test_service_updates_existing_employee():
    repository = FakeRepository()
    service = EmployeeService(repository)
    data = EmployeeUpdate.model_validate({"salary": "150000.00"})

    employee = await service.update_employee(1, data)

    assert employee == repository.employee
    assert repository.updated_employee == repository.employee
    assert repository.updated_data == data


async def test_service_delete_raises_when_missing():
    service = EmployeeService(FakeRepository(employee=None))

    try:
        await service.delete_employee(456)
    except EmployeeNotFoundError as error:
        assert error.employee_id == 456
    else:
        raise AssertionError("Expected EmployeeNotFoundError")


async def test_service_lists_countries_and_job_titles():
    repository = FakeRepository()
    service = EmployeeService(repository)

    countries = await service.list_countries()
    job_titles = await service.list_job_titles(country="India")

    assert countries == ["India"]
    assert job_titles == ["Software Engineer"]
    assert repository.job_title_country == "India"


class FakeRepository:
    def __init__(self, employee=object(), duplicate_code: str | None = None):
        self.employee = employee
        self.duplicate_code = duplicate_code
        self.created_data = None
        self.updated_employee = None
        self.updated_data = None
        self.deleted_employee = None
        self.job_title_country = None

    async def create(self, data):
        if self.duplicate_code is not None:
            from backend.repositories import DuplicateEmployeeCodeRepositoryError

            raise DuplicateEmployeeCodeRepositoryError(self.duplicate_code)
        self.created_data = data
        return self.employee

    async def get_by_id(self, employee_id):
        return self.employee

    async def update(self, employee, data):
        self.updated_employee = employee
        self.updated_data = data
        return employee

    async def delete(self, employee):
        self.deleted_employee = employee

    async def list_countries(self):
        return ["India"]

    async def list_job_titles(self, *, country=None):
        self.job_title_country = country
        return ["Software Engineer"]
