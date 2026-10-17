import io

from PIL import Image
from fastapi.testclient import TestClient

from server.app import app

PNG_MAGIC = b"\x89PNG\r\n\x1a\n"
TIMEOUT_SECONDS = 180


def _png(width: int, height: int) -> bytes:
    buffer = io.BytesIO()
    Image.new("RGB", (width, height), (40, 80, 120)).save(buffer, format="PNG")
    return buffer.getvalue()


def _client() -> TestClient:
    client = TestClient(app)
    client.timeout = TIMEOUT_SECONDS
    return client


def test_translate_returns_256_png():
    with _client() as client:
        response = client.post(
            "/api/translate",
            files={"image": ("photo.png", _png(256, 256), "image/png")},
        )
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("image/png")
    assert response.content.startswith(PNG_MAGIC)
    assert Image.open(io.BytesIO(response.content)).size == (256, 256)


def test_translate_rejects_64_png():
    with _client() as client:
        response = client.post(
            "/api/translate",
            files={"image": ("small.png", _png(64, 64), "image/png")},
        )
    assert response.status_code == 400
    assert response.json()["detail"] == "Image must be 256x256, got 64x64"
