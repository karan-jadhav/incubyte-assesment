from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_session
from backend.repositories import SalaryInsightRepository
from backend.schemas import (
    JobTitleSalaryBreakdownResponse,
    SalarySummaryResponse,
)
from backend.services import SalaryInsightService


router = APIRouter(prefix="/insights", tags=["insights"])


async def get_salary_insight_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> SalaryInsightService:
    return SalaryInsightService(SalaryInsightRepository(session))


@router.get("/salary-summary", response_model=SalarySummaryResponse)
async def get_salary_summary(
    service: Annotated[SalaryInsightService, Depends(get_salary_insight_service)],
    country: Annotated[str, Query(min_length=1)],
    job_title: str | None = None,
) -> SalarySummaryResponse:
    return await service.get_salary_summary(country=country, job_title=job_title)


@router.get("/job-title-breakdown", response_model=JobTitleSalaryBreakdownResponse)
async def get_job_title_breakdown(
    service: Annotated[SalaryInsightService, Depends(get_salary_insight_service)],
    country: Annotated[str, Query(min_length=1)],
) -> JobTitleSalaryBreakdownResponse:
    return await service.get_job_title_breakdown(country=country)
