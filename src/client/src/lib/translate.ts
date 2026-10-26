import * as ort from "onnxruntime-web/wasm";
import mjsUrl from "onnxruntime-web/ort-wasm-simd-threaded.mjs?url";
import wasmUrl from "onnxruntime-web/ort-wasm-simd-threaded.wasm?url";
import { modelOutputToRgba, rgbaToModelInput, TRANSLATE_EDGE } from "@/lib/tensor";

ort.env.wasm.numThreads = 1;
ort.env.wasm.wasmPaths = {
  wasm: wasmUrl,
  mjs: mjsUrl,
};

export class TranslateError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TranslateError";
  }
}

export function retryMessage(detail: string): string {
  const sentence = detail.trim().replace(/[.\s]+$/, "");
  return `${sentence}. Translate again.`;
}

let sessionPromise: Promise<ort.InferenceSession> | null = null;

function generator(): Promise<ort.InferenceSession> {
  sessionPromise ??= ort.InferenceSession.create("/g_a.onnx", {
    executionProviders: ["wasm"],
  });
  return sessionPromise;
}

export async function translatePhoto(image: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(image);
  const canvas = document.createElement("canvas");
  canvas.width = TRANSLATE_EDGE;
  canvas.height = TRANSLATE_EDGE;
  try {
    if (bitmap.width !== TRANSLATE_EDGE || bitmap.height !== TRANSLATE_EDGE) {
      throw new TranslateError(`Image must be ${TRANSLATE_EDGE} by ${TRANSLATE_EDGE}.`);
    }
    const context = canvas.getContext("2d", { willReadFrequently: true });
    if (!context) {
      throw new TranslateError("The translation did not finish.");
    }
    context.drawImage(bitmap, 0, 0);
    const pixels = context.getImageData(0, 0, TRANSLATE_EDGE, TRANSLATE_EDGE).data;
    const session = await generator();
    const result = await session.run({
      image: new ort.Tensor("float32", rgbaToModelInput(pixels), [1, 3, TRANSLATE_EDGE, TRANSLATE_EDGE]),
    });
    const output = result.print;
    if (!(output?.data instanceof Float32Array) || output.data.length !== 3 * TRANSLATE_EDGE * TRANSLATE_EDGE) {
      throw new TranslateError("The translation did not finish.");
    }
    const imageData = new ImageData(TRANSLATE_EDGE, TRANSLATE_EDGE);
    imageData.data.set(modelOutputToRgba(output.data));
    context.putImageData(imageData, 0, 0);
    const translated = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob(resolve, "image/png");
    });
    if (!translated) {
      throw new TranslateError("The translation did not finish.");
    }
    return translated;
  } catch (caught) {
    if (caught instanceof TranslateError) {
      throw caught;
    }
    throw new TranslateError(
      caught instanceof Error && caught.message ? caught.message : "The translation did not finish.",
    );
  } finally {
    bitmap.close();
  }
}
