import io

import pytest
import torch
from PIL import Image

from server.images import ImageSizeError, image_to_tensor


def _png(image: Image.Image) -> Image.Image:
    buffer = io.BytesIO()
    image.save(buffer, format="PNG")
    buffer.seek(0)
    return Image.open(buffer)


def test_rejects_128_png():
    image = _png(Image.new("RGB", (128, 128), (10, 20, 30)))
    with pytest.raises(ImageSizeError, match="256"):
        image_to_tensor(image)


def test_rgb_png_becomes_normalized_tensor():
    image = Image.new("RGB", (256, 256), (0, 0, 0))
    image.putpixel((2, 3), (255, 255, 255))
    tensor = image_to_tensor(_png(image))
    assert tensor.shape == (1, 3, 256, 256)
    assert tensor.dtype == torch.float32
    assert float(tensor.min()) >= -1.0 - 1e-5
    assert float(tensor.max()) <= 1.0 + 1e-5
    assert tensor[0, :, 0, 0].tolist() == pytest.approx([-1.0, -1.0, -1.0])
    assert tensor[0, :, 3, 2].tolist() == pytest.approx([1.0, 1.0, 1.0])


def test_rgba_png_composites_onto_white():
    image = Image.new("RGBA", (256, 256), (255, 0, 0, 0))
    image.putpixel((0, 0), (0, 0, 255, 255))
    tensor = image_to_tensor(_png(image))
    assert tensor.shape == (1, 3, 256, 256)
    assert tensor.dtype == torch.float32
    assert tensor[0, :, 1, 1].tolist() == pytest.approx([1.0, 1.0, 1.0])
    assert tensor[0, :, 0, 0].tolist() == pytest.approx([-1.0, -1.0, 1.0])
