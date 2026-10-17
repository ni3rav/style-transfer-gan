export const TRANSLATE_EDGE = 256;

export function drawStretched(
  canvas: HTMLCanvasElement,
  image: CanvasImageSource,
  edge = TRANSLATE_EDGE,
): void {
  canvas.width = edge;
  canvas.height = edge;
  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Canvas is unavailable.");
  }
  context.drawImage(image, 0, 0, edge, edge);
}

function canvasToPngBlob(canvas: HTMLCanvasElement): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (!blob) {
        reject(new Error("Could not encode the photo."));
        return;
      }
      resolve(blob);
    }, "image/png");
  });
}

export async function toTranslatePng(
  image: CanvasImageSource,
  createCanvas: () => HTMLCanvasElement = () => document.createElement("canvas"),
): Promise<Blob> {
  const canvas = createCanvas();
  drawStretched(canvas, image);
  return canvasToPngBlob(canvas);
}

export async function fileToTranslatePng(file: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  try {
    return await toTranslatePng(bitmap);
  } finally {
    bitmap.close();
  }
}
