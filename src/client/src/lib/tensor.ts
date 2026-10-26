export const TRANSLATE_EDGE = 256;

export function rgbaToModelInput(pixels: Uint8ClampedArray, edge = TRANSLATE_EDGE): Float32Array {
  if (pixels.length !== edge * edge * 4) {
    throw new Error(`Image must be ${edge} by ${edge}.`);
  }
  const plane = edge * edge;
  const floats = new Float32Array(3 * plane);
  for (let index = 0; index < plane; index += 1) {
    const offset = index * 4;
    floats[index] = (pixels[offset] / 255 - 0.5) / 0.5;
    floats[plane + index] = (pixels[offset + 1] / 255 - 0.5) / 0.5;
    floats[plane * 2 + index] = (pixels[offset + 2] / 255 - 0.5) / 0.5;
  }
  return floats;
}

export function modelOutputToRgba(values: ArrayLike<number>, edge = TRANSLATE_EDGE): Uint8ClampedArray {
  const plane = edge * edge;
  if (values.length !== 3 * plane) {
    throw new Error(`Model output must contain ${3 * plane} values.`);
  }
  const pixels = new Uint8ClampedArray(new ArrayBuffer(plane * 4));
  for (let index = 0; index < plane; index += 1) {
    const offset = index * 4;
    pixels[offset] = toByte(values[index]);
    pixels[offset + 1] = toByte(values[plane + index]);
    pixels[offset + 2] = toByte(values[plane * 2 + index]);
    pixels[offset + 3] = 255;
  }
  return pixels;
}

function toByte(value: number): number {
  const unit = Math.min(1, Math.max(0, (value + 1) / 2));
  return Math.min(255, Math.floor(unit * 255 + 0.5));
}
