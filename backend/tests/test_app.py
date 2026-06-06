import httpx2
import pytest

from backend.main import create_app


pytestmark = pytest.mark.anyio


@pytest.fixture
def anyio_backend():
    return "asyncio"


async def test_health_endpoint_returns_status():
    async with httpx2.AsyncClient(
        transport=httpx2.ASGITransport(app=create_app()),
        base_url="http://testserver",
    ) as client:
        response = await client.get("/health")

    assert response.status_code == 200
    assert response.json() == {
        "status": "ok",
        "environment": "development",
    }
