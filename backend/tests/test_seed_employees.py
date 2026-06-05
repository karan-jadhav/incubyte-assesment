from datetime import date
from decimal import Decimal

import pytest

from backend.seed_employees import (
    DEFAULT_EMPLOYEE_COUNT,
    EmployeeSeedSummary,
    chunk_rows,
    format_summary,
    generate_employee_rows,
    seed_employees,
)


pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


def test_generate_employee_rows_creates_expected_fields():
    rows = list(
        generate_employee_rows(
            count=3,
            first_names=["Ava", "Noah"],
            last_names=["Shah", "Patel"],
            seed=1,
        )
    )

    assert len(rows) == 3
    assert rows[0].keys() == {
        "employee_code",
        "full_name",
        "job_title",
        "department",
        "country",
        "currency",
        "salary",
        "employment_type",
        "hire_date",
    }
    assert rows[0]["employee_code"] == "SEED-00001"
    assert rows[1]["employee_code"] == "SEED-00002"
    assert isinstance(rows[0]["salary"], Decimal)
    assert rows[0]["salary"] > 0
    assert isinstance(rows[0]["hire_date"], date)
    assert rows[0]["full_name"].split()[0] in {"Ava", "Noah"}
    assert rows[0]["full_name"].split()[1] in {"Shah", "Patel"}


def test_generate_employee_rows_is_deterministic_for_same_seed():
    first_run = list(
        generate_employee_rows(
            count=5,
            first_names=["Ava", "Noah"],
            last_names=["Shah", "Patel"],
            seed=99,
        )
    )
    second_run = list(
        generate_employee_rows(
            count=5,
            first_names=["Ava", "Noah"],
            last_names=["Shah", "Patel"],
            seed=99,
        )
    )

    assert first_run == second_run


def test_default_seed_count_matches_prd():
    assert DEFAULT_EMPLOYEE_COUNT == 10_000


def test_chunk_rows_splits_rows_by_batch_size():
    rows = [{"id": value} for value in range(5)]

    assert list(chunk_rows(rows, batch_size=2)) == [
        [{"id": 0}, {"id": 1}],
        [{"id": 2}, {"id": 3}],
        [{"id": 4}],
    ]


def test_format_summary_includes_counts_and_elapsed_time():
    summary = EmployeeSeedSummary(
        requested_count=10,
        inserted_count=7,
        skipped_count=3,
        elapsed_seconds=1.234,
        reset=False,
    )

    assert format_summary(summary) == (
        "Seeded employees: requested=10 inserted=7 skipped=3 reset=false "
        "elapsed=1.23s"
    )


async def test_seed_employees_counts_returned_inserted_rows(tmp_path, monkeypatch):
    first_names_file = tmp_path / "first_names.txt"
    last_names_file = tmp_path / "last_names.txt"
    first_names_file.write_text("Ava\nNoah\n", encoding="utf-8")
    last_names_file.write_text("Shah\nPatel\n", encoding="utf-8")
    monkeypatch.setattr("backend.seed_employees.FIRST_NAMES_FILE", first_names_file)
    monkeypatch.setattr("backend.seed_employees.LAST_NAMES_FILE", last_names_file)

    session_maker = FakeSessionMaker(returned_ids=[1, 2, 3])

    summary = await seed_employees(
        count=5,
        batch_size=5,
        reset=True,
        session_maker=session_maker,
    )

    assert session_maker.session.deleted_seed_rows is True
    assert session_maker.session.committed is True
    assert summary.requested_count == 5
    assert summary.inserted_count == 3
    assert summary.skipped_count == 2


class FakeSessionMaker:
    def __init__(self, *, returned_ids):
        self.session = FakeSession(returned_ids=returned_ids)

    def __call__(self):
        return self.session


class FakeSession:
    def __init__(self, *, returned_ids):
        self.returned_ids = returned_ids
        self.deleted_seed_rows = False
        self.committed = False

    async def __aenter__(self):
        return self

    async def __aexit__(self, exc_type, exc, traceback):
        return None

    async def execute(self, statement):
        if statement.is_delete:
            self.deleted_seed_rows = True
            return FakeResult([])
        return FakeResult(self.returned_ids)

    async def commit(self):
        self.committed = True


class FakeResult:
    def __init__(self, values):
        self.values = values

    def scalars(self):
        return self

    def all(self):
        return self.values
