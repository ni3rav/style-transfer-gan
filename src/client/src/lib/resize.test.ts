import { createCanvas, loadImage, type Canvas } from "@napi-rs/canvas";
import { describe, expect, it } from "vitest";
import { toTranslatePng, TRANSLATE_EDGE } from "./resize.ts";

function asBrowserCanvas(canvas: Canvas): HTMLCanvasElement {
  return {
    get width() {
      return canvas.width;
    },
    set width(value: number) {
      canvas.width = value;
    },
    get height() {
      return canvas.height;
    },
    set height(value: number) {
      canvas.height = value;
    },
    getContext(kind: "2d") {
      return canvas.getContext(kind);
    },
    toBlob(callback: (blob: Blob | null) => void, type?: string) {
      const encoded = canvas.toBuffer("image/png");
      callback(new Blob([new Uint8Array(encoded)], { type: type ?? "image/png" }));
    },
  } as unknown as HTMLCanvasElement;
}

describe("toTranslatePng", () => {
  it("draws an arbitrary image onto a 256×256 canvas and uploads a PNG of that size", async () => {
    const source = createCanvas(320, 180);
    const sourceContext = source.getContext("2d");
    sourceContext.fillStyle = "rgb(180, 40, 30)";
    sourceContext.fillRect(0, 0, source.width, source.height);

    const blob = await toTranslatePng(source as unknown as CanvasImageSource, () =>
      asBrowserCanvas(createCanvas(4, 9)),
    );

    expect(source.width).not.toBe(TRANSLATE_EDGE);
    expect(source.height).not.toBe(TRANSLATE_EDGE);
    expect(blob.type).toBe("image/png");

    const bytes = new Uint8Array(await blob.arrayBuffer());
    expect(Array.from(bytes.subarray(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);

    const decoded = await loadImage(Buffer.from(bytes));
    expect(decoded.width).toBe(TRANSLATE_EDGE);
    expect(decoded.height).toBe(TRANSLATE_EDGE);

    const check = createCanvas(decoded.width, decoded.height);
    const checkContext = check.getContext("2d");
    checkContext.drawImage(decoded, 0, 0);
    const pixel = checkContext.getImageData(24, 24, 1, 1).data;
    expect(pixel[0]).toBe(180);
    expect(pixel[1]).toBe(40);
    expect(pixel[2]).toBe(30);
    expect(pixel[3]).toBe(255);
  });
});
