from decimal import Decimal

from sqlalchemy import CheckConstraint, Index, UniqueConstraint
from sqlalchemy.orm import Mapped

from backend.models import Base, Employee, NAMING_CONVENTION


def test_base_metadata_uses_naming_convention():
    assert Base.metadata.naming_convention == NAMING_CONVENTION


def test_employee_model_uses_expected_table_name_and_columns():
    table = Employee.__table__

    assert table.name == "employees"
    assert set(table.columns.keys()) == {
        "id",
        "employee_code",
        "full_name",
        "job_title",
        "department",
        "country",
        "currency",
        "salary",
        "employment_type",
        "hire_date",
        "created_at",
        "updated_at",
    }
    assert Base.metadata.tables["employees"] is table


def test_employee_model_declares_typed_mapped_fields():
    annotations = Employee.__annotations__

    assert annotations["id"] == Mapped[int]
    assert annotations["employee_code"] == Mapped[str]
    assert annotations["salary"] == Mapped[Decimal]


def test_employee_model_has_constraints_and_indexes_for_core_workflows():
    table = Employee.__table__
    constraints = table.constraints
    index_names = {index.name for index in table.indexes}

    assert any(
        isinstance(constraint, UniqueConstraint)
        and constraint.name == "uq_employees_employee_code"
        and {column.name for column in constraint.columns} == {"employee_code"}
        for constraint in constraints
    )
    assert any(
        isinstance(constraint, CheckConstraint)
        and constraint.name == "ck_employees_salary_positive"
        and "salary > 0" in str(constraint.sqltext)
        for constraint in constraints
    )
    assert "ix_employees_full_name" in index_names
    assert "ix_employees_country" in index_names
    assert "ix_employees_job_title" in index_names
    assert "ix_employees_country_job_title" in index_names
    assert any(
        isinstance(index, Index)
        and index.name == "ix_employees_country_job_title"
        and [column.name for column in index.columns] == ["country", "job_title"]
        for index in table.indexes
    )
