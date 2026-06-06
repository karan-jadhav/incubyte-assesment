from datetime import date, datetime, timezone
from decimal import Decimal

import pytest
from pydantic import ValidationError

from backend.schemas import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeRead,
    EmployeeUpdate,
)


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


def test_employee_create_validates_required_employee_fields():
    schema = EmployeeCreate.model_validate(employee_payload())

    assert schema.employee_code == "EMP-001"
    assert schema.salary == Decimal("125000.00")
    assert schema.hire_date == date(2021, 4, 12)


def test_employee_create_rejects_non_positive_salary():
    payload = employee_payload()
    payload["salary"] = "0"

    with pytest.raises(ValidationError):
        EmployeeCreate.model_validate(payload)


def test_employee_update_allows_partial_updates():
    schema = EmployeeUpdate.model_validate(
        {
            "job_title": "Senior Software Engineer",
            "salary": "150000.00",
        }
    )

    assert schema.job_title == "Senior Software Engineer"
    assert schema.salary == Decimal("150000.00")
    assert schema.full_name is None


def test_employee_read_and_list_response_serialize_from_attributes():
    employee = FakeEmployee()

    employee_read = EmployeeRead.model_validate(employee)
    response = EmployeeListResponse(
        items=[employee_read],
        total=1,
        page=1,
        page_size=20,
    )

    assert response.items[0].id == 1
    assert response.items[0].full_name == "Ava Shah"
    assert response.total == 1


class FakeEmployee:
    id = 1
    employee_code = "EMP-001"
    full_name = "Ava Shah"
    job_title = "Software Engineer"
    department = "Engineering"
    country = "India"
    currency = "INR"
    salary = Decimal("125000.00")
    employment_type = "Full-time"
    hire_date = date(2021, 4, 12)
    created_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
    updated_at = datetime(2026, 1, 1, tzinfo=timezone.utc)
