import io

import torch
from PIL import Image

IMAGE_SIZE = 256


class ImageSizeError(ValueError):
    def __init__(self, width: int, height: int) -> None:
        self.width = width
        self.height = height
        super().__init__(f"Image must be {IMAGE_SIZE}x{IMAGE_SIZE}, got {width}x{height}")


def to_rgb(image: Image.Image) -> Image.Image:
    if image.mode == "RGBA":
        background = Image.new("RGB", image.size, (255, 255, 255))
        background.paste(image, mask=image.getchannel("A"))
        return background
    if image.mode == "RGB":
        return image
    return image.convert("RGB")


def image_to_tensor(image: Image.Image) -> torch.Tensor:
    if image.width != IMAGE_SIZE or image.height != IMAGE_SIZE:
        raise ImageSizeError(image.width, image.height)
    rgb = to_rgb(image)
    pixels = torch.frombuffer(bytearray(rgb.tobytes()), dtype=torch.uint8).reshape(IMAGE_SIZE, IMAGE_SIZE, 3)
    tensor = pixels.to(dtype=torch.float32).permute(2, 0, 1).div(255.0)
    normalized = (tensor - 0.5) / 0.5
    return normalized.unsqueeze(0)


def tensor_to_png(output: torch.Tensor) -> bytes:
    image = output.detach().clamp(0, 1).mul(255).add(0.5).to(dtype=torch.uint8)
    channels = image.squeeze(0).permute(1, 2, 0).contiguous()
    encoded = Image.frombytes("RGB", (channels.shape[1], channels.shape[0]), bytes(channels.reshape(-1).tolist()))
    buffer = io.BytesIO()
    encoded.save(buffer, format="PNG")
    return buffer.getvalue()
