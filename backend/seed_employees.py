import argparse
import asyncio
import random
import time
from collections.abc import Iterator, Sequence
from dataclasses import dataclass
from datetime import date, timedelta
from decimal import Decimal
from pathlib import Path
from typing import Any

from sqlalchemy import delete
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from backend.database import async_session_maker
from backend.models import Employee


DEFAULT_EMPLOYEE_COUNT = 10_000
DEFAULT_BATCH_SIZE = 1_000
DEFAULT_RANDOM_SEED = 20_260_605
SEED_EMPLOYEE_CODE_PREFIX = "SEED-"
DATA_DIR = Path(__file__).resolve().parent / "seed_data"
FIRST_NAMES_FILE = DATA_DIR / "first_names.txt"
LAST_NAMES_FILE = DATA_DIR / "last_names.txt"

JOB_PROFILES = (
    ("Software Engineer", "Engineering", 72_000, 160_000),
    ("Senior Software Engineer", "Engineering", 105_000, 210_000),
    ("Product Manager", "Product", 88_000, 185_000),
    ("Data Analyst", "Analytics", 58_000, 125_000),
    ("Data Scientist", "Analytics", 92_000, 190_000),
    ("HR Manager", "People", 62_000, 135_000),
    ("Finance Manager", "Finance", 78_000, 155_000),
    ("Sales Executive", "Sales", 48_000, 118_000),
    ("Customer Success Manager", "Customer Success", 55_000, 130_000),
    ("Operations Manager", "Operations", 64_000, 140_000),
)

COUNTRIES = (
    ("United States", "USD", Decimal("1.00")),
    ("Canada", "CAD", Decimal("0.92")),
    ("United Kingdom", "GBP", Decimal("0.88")),
    ("Germany", "EUR", Decimal("0.86")),
    ("India", "INR", Decimal("0.32")),
    ("Singapore", "SGD", Decimal("0.78")),
    ("Australia", "AUD", Decimal("0.84")),
    ("Brazil", "BRL", Decimal("0.42")),
)

EMPLOYMENT_TYPES = (
    "Full-time",
    "Part-time",
    "Contract",
)


@dataclass(frozen=True)
class EmployeeSeedSummary:
    requested_count: int
    inserted_count: int
    skipped_count: int
    elapsed_seconds: float
    reset: bool


def read_source_file(path: Path) -> list[str]:
    return [
        line.strip()
        for line in path.read_text(encoding="utf-8").splitlines()
        if line.strip()
    ]


def generate_employee_rows(
    *,
    count: int,
    first_names: Sequence[str],
    last_names: Sequence[str],
    seed: int = DEFAULT_RANDOM_SEED,
) -> Iterator[dict[str, Any]]:
    randomizer = random.Random(seed)
    hire_start = date(2014, 1, 1)
    hire_range_days = (date.today() - hire_start).days

    for index in range(1, count + 1):
        job_title, department, salary_min, salary_max = randomizer.choice(JOB_PROFILES)
        country, currency, multiplier = randomizer.choice(COUNTRIES)
        salary = Decimal(randomizer.randint(salary_min, salary_max)) * multiplier

        yield {
            "employee_code": f"{SEED_EMPLOYEE_CODE_PREFIX}{index:05d}",
            "full_name": (
                f"{randomizer.choice(first_names)} {randomizer.choice(last_names)}"
            ),
            "job_title": job_title,
            "department": department,
            "country": country,
            "currency": currency,
            "salary": salary.quantize(Decimal("0.01")),
            "employment_type": randomizer.choice(EMPLOYMENT_TYPES),
            "hire_date": hire_start + timedelta(days=randomizer.randint(0, hire_range_days)),
        }


def chunk_rows(
    rows: Sequence[dict[str, Any]],
    *,
    batch_size: int,
) -> Iterator[list[dict[str, Any]]]:
    for start in range(0, len(rows), batch_size):
        yield list(rows[start : start + batch_size])


async def seed_employees(
    *,
    count: int = DEFAULT_EMPLOYEE_COUNT,
    batch_size: int = DEFAULT_BATCH_SIZE,
    reset: bool = False,
    seed: int = DEFAULT_RANDOM_SEED,
    session_maker: async_sessionmaker[AsyncSession] = async_session_maker,
) -> EmployeeSeedSummary:
    started_at = time.perf_counter()
    first_names = read_source_file(FIRST_NAMES_FILE)
    last_names = read_source_file(LAST_NAMES_FILE)
    rows = list(
        generate_employee_rows(
            count=count,
            first_names=first_names,
            last_names=last_names,
            seed=seed,
        )
    )

    inserted_count = 0
    async with session_maker() as session:
        if reset:
            await session.execute(
                delete(Employee).where(
                    Employee.employee_code.startswith(SEED_EMPLOYEE_CODE_PREFIX)
                )
            )

        for batch in chunk_rows(rows, batch_size=batch_size):
            statement = (
                insert(Employee)
                .values(batch)
                .on_conflict_do_nothing(
                    index_elements=[Employee.employee_code],
                )
                .returning(Employee.id)
            )
            result = await session.execute(statement)
            inserted_count += len(result.scalars().all())

        await session.commit()

    return EmployeeSeedSummary(
        requested_count=count,
        inserted_count=inserted_count,
        skipped_count=count - inserted_count,
        elapsed_seconds=time.perf_counter() - started_at,
        reset=reset,
    )


def format_summary(summary: EmployeeSeedSummary) -> str:
    return (
        "Seeded employees: "
        f"requested={summary.requested_count} "
        f"inserted={summary.inserted_count} "
        f"skipped={summary.skipped_count} "
        f"reset={str(summary.reset).lower()} "
        f"elapsed={summary.elapsed_seconds:.2f}s"
    )


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="Seed employee records.")
    parser.add_argument("--count", type=int, default=DEFAULT_EMPLOYEE_COUNT)
    parser.add_argument("--batch-size", type=int, default=DEFAULT_BATCH_SIZE)
    parser.add_argument("--seed", type=int, default=DEFAULT_RANDOM_SEED)
    parser.add_argument(
        "--reset",
        action="store_true",
        help="Delete existing SEED-* employees before inserting generated records.",
    )
    return parser


async def main() -> None:
    args = build_parser().parse_args()
    summary = await seed_employees(
        count=args.count,
        batch_size=args.batch_size,
        reset=args.reset,
        seed=args.seed,
    )
    print(format_summary(summary))


if __name__ == "__main__":
    asyncio.run(main())
