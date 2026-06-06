from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy.ext.asyncio import AsyncSession

from backend.database import get_session
from backend.repositories import EmployeeRepository
from backend.schemas import (
    EmployeeCreate,
    EmployeeListResponse,
    EmployeeRead,
    EmployeeUpdate,
    LookupListResponse,
)
from backend.services import (
    DuplicateEmployeeCodeError,
    EmployeeNotFoundError,
    EmployeeService,
)


router = APIRouter(prefix="/employees", tags=["employees"])


async def get_employee_service(
    session: Annotated[AsyncSession, Depends(get_session)],
) -> EmployeeService:
    return EmployeeService(EmployeeRepository(session))


@router.post(
    "",
    response_model=EmployeeRead,
    status_code=status.HTTP_201_CREATED,
)
async def create_employee(
    data: EmployeeCreate,
    service: Annotated[EmployeeService, Depends(get_employee_service)],
):
    try:
        return await service.create_employee(data)
    except DuplicateEmployeeCodeError as error:
        raise conflict_error(error) from error


@router.get("", response_model=EmployeeListResponse)
async def list_employees(
    service: Annotated[EmployeeService, Depends(get_employee_service)],
    page: Annotated[int, Query(ge=1)] = 1,
    page_size: Annotated[int, Query(ge=1, le=100)] = 20,
    search: str | None = None,
    country: str | None = None,
    job_title: str | None = None,
):
    employees, total = await service.list_employees(
        page=page,
        page_size=page_size,
        search=search,
        country=country,
        job_title=job_title,
    )
    return EmployeeListResponse(
        items=[EmployeeRead.model_validate(employee) for employee in employees],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/countries", response_model=LookupListResponse)
async def list_countries(
    service: Annotated[EmployeeService, Depends(get_employee_service)],
) -> LookupListResponse:
    return LookupListResponse(items=await service.list_countries())


@router.get("/job-titles", response_model=LookupListResponse)
async def list_job_titles(
    service: Annotated[EmployeeService, Depends(get_employee_service)],
    country: str | None = None,
) -> LookupListResponse:
    return LookupListResponse(items=await service.list_job_titles(country=country))


@router.get("/{employee_id}", response_model=EmployeeRead)
async def get_employee(
    employee_id: int,
    service: Annotated[EmployeeService, Depends(get_employee_service)],
):
    try:
        return await service.get_employee(employee_id)
    except EmployeeNotFoundError as error:
        raise not_found_error(error) from error


@router.patch("/{employee_id}", response_model=EmployeeRead)
async def update_employee(
    employee_id: int,
    data: EmployeeUpdate,
    service: Annotated[EmployeeService, Depends(get_employee_service)],
):
    try:
        return await service.update_employee(employee_id, data)
    except EmployeeNotFoundError as error:
        raise not_found_error(error) from error


@router.delete("/{employee_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_employee(
    employee_id: int,
    service: Annotated[EmployeeService, Depends(get_employee_service)],
) -> Response:
    try:
        await service.delete_employee(employee_id)
    except EmployeeNotFoundError as error:
        raise not_found_error(error) from error
    return Response(status_code=status.HTTP_204_NO_CONTENT)


def not_found_error(error: EmployeeNotFoundError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail=f"Employee {error.employee_id} not found",
    )


def conflict_error(error: DuplicateEmployeeCodeError) -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail=f"Employee code {error.employee_code} already exists",
    )
