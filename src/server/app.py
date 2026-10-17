"""Photo-to-Ukiyo-e inference API.

From the repository root:

    PYTHONPATH=src uv run uvicorn server.app:app --host 127.0.0.1 --port 8000
"""

import asyncio
import io
import threading
from pathlib import Path

import torch
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import Response
from fastapi.staticfiles import StaticFiles
from PIL import Image, UnidentifiedImageError

from server.generator import define_G
from server.images import ImageSizeError, image_to_tensor, tensor_to_png

CHECKPOINT_PATH = Path(__file__).resolve().parent / "ukiyoe_cyclegan.pt"
CLIENT_DIST = Path(__file__).resolve().parents[1] / "client" / "dist"
_translate_lock = threading.Lock()


def load_generator(checkpoint_path: Path) -> torch.nn.Module:
    if not checkpoint_path.is_file():
        raise FileNotFoundError(
            f"Missing checkpoint: {checkpoint_path}. Expected ukiyoe_cyclegan.pt next to the server."
        )
    checkpoint = torch.load(checkpoint_path, map_location="cpu", weights_only=False)
    nets = checkpoint.get("nets") if isinstance(checkpoint, dict) else None
    if not isinstance(nets, dict) or "G_A" not in nets:
        raise RuntimeError(f"Checkpoint at {checkpoint_path} is missing nets['G_A']")
    generator = define_G(3, 3, 64, "resnet_9blocks", norm="instance", use_dropout=False)
    generator.load_state_dict(nets["G_A"])
    generator.eval()
    return generator


def translate(image: Image.Image, generator: torch.nn.Module) -> bytes:
    with _translate_lock:
        tensor = image_to_tensor(image)
        with torch.no_grad():
            output = generator(tensor)
        output = ((output + 1) / 2).clamp(0, 1)
        return tensor_to_png(output)


def create_app(generator: torch.nn.Module) -> FastAPI:
    app = FastAPI()
    app.add_middleware(
        CORSMiddleware,
        allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.post("/api/translate")
    async def translate_image(image: UploadFile = File(...)) -> Response:
        payload = await image.read()
        try:
            with Image.open(io.BytesIO(payload)) as uploaded:
                uploaded.load()
                opened = uploaded.copy()
        except UnidentifiedImageError as exc:
            raise HTTPException(status_code=400, detail="Upload is not a valid image") from exc
        try:
            png = await asyncio.to_thread(translate, opened, generator)
        except ImageSizeError as exc:
            raise HTTPException(status_code=400, detail=str(exc)) from exc
        return Response(content=png, media_type="image/png")

    if CLIENT_DIST.is_dir():
        app.mount("/", StaticFiles(directory=CLIENT_DIST, html=True), name="client")
    return app


generator = load_generator(CHECKPOINT_PATH)
app = create_app(generator)
