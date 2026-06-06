from datetime import date, datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class EmployeeBase(BaseModel):
    full_name: str = Field(min_length=1, max_length=200)
    job_title: str = Field(min_length=1, max_length=120)
    department: str = Field(min_length=1, max_length=120)
    country: str = Field(min_length=1, max_length=80)
    currency: str = Field(min_length=3, max_length=3)
    salary: Decimal = Field(gt=0, max_digits=12, decimal_places=2)
    employment_type: str = Field(min_length=1, max_length=50)
    hire_date: date


class EmployeeCreate(EmployeeBase):
    employee_code: str = Field(min_length=1, max_length=50)


class EmployeeUpdate(BaseModel):
    full_name: str | None = Field(default=None, min_length=1, max_length=200)
    job_title: str | None = Field(default=None, min_length=1, max_length=120)
    department: str | None = Field(default=None, min_length=1, max_length=120)
    country: str | None = Field(default=None, min_length=1, max_length=80)
    currency: str | None = Field(default=None, min_length=3, max_length=3)
    salary: Decimal | None = Field(default=None, gt=0, max_digits=12, decimal_places=2)
    employment_type: str | None = Field(default=None, min_length=1, max_length=50)
    hire_date: date | None = None


class EmployeeRead(EmployeeBase):
    model_config = ConfigDict(from_attributes=True)

    id: int
    employee_code: str
    created_at: datetime
    updated_at: datetime


class EmployeeListResponse(BaseModel):
    items: list[EmployeeRead]
    total: int
    page: int
    page_size: int
