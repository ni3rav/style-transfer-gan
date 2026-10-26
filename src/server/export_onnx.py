"""Export netG_A to the ONNX file the browser runs.

From the repository root:

    PYTHONPATH=src uv run python src/server/export_onnx.py
"""

from pathlib import Path

import torch

from server.generator import define_G

ROOT = Path(__file__).resolve().parents[2]
CHECKPOINT = Path(__file__).resolve().parent / "ukiyoe_cyclegan.pt"
DESTINATION = ROOT / "src" / "client" / "public" / "g_a.onnx"


def main() -> None:
    if not CHECKPOINT.is_file():
        raise FileNotFoundError(f"Missing checkpoint: {CHECKPOINT}")
    checkpoint = torch.load(CHECKPOINT, map_location="cpu", weights_only=False)
    nets = checkpoint.get("nets") if isinstance(checkpoint, dict) else None
    if not isinstance(nets, dict) or "G_A" not in nets:
        raise RuntimeError(f"Checkpoint at {CHECKPOINT} is missing nets['G_A']")
    generator = define_G(3, 3, 64, "resnet_9blocks", norm="instance", use_dropout=False)
    generator.load_state_dict(nets["G_A"])
    generator.eval()
    DESTINATION.parent.mkdir(parents=True, exist_ok=True)
    torch.onnx.export(
        generator,
        torch.zeros(1, 3, 256, 256),
        DESTINATION,
        input_names=["image"],
        output_names=["print"],
        opset_version=18,
        dynamo=False,
    )
    print(f"{DESTINATION} {DESTINATION.stat().st_size}")


if __name__ == "__main__":
    main()
