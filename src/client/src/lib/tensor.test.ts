import { describe, expect, it } from "vitest";
import { modelOutputToRgba, rgbaToModelInput } from "./tensor";

describe("model pixels", () => {
  it("maps one black pixel into the generator range and back", () => {
    const pixels = new Uint8ClampedArray([0, 128, 255, 255]);
    const input = rgbaToModelInput(pixels, 1);
    expect(input[0]).toBeCloseTo(-1);
    expect(input[1]).toBeCloseTo((128 / 255 - 0.5) / 0.5);
    expect(input[2]).toBeCloseTo(1);

    const output = modelOutputToRgba(new Float32Array([-1, 0, 1]), 1);
    expect(Array.from(output)).toEqual([0, 128, 255, 255]);
  });
});
