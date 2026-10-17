const translateTimeoutMs = 120_000;

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

async function readFailureDetail(response: Response): Promise<string> {
  try {
    const body: unknown = await response.json();
    if (
      body &&
      typeof body === "object" &&
      "detail" in body &&
      typeof body.detail === "string" &&
      body.detail.trim()
    ) {
      return body.detail.trim();
    }
  } catch {
    // A non-JSON body still needs a plain failure message.
  }
  return "The translation did not finish.";
}

export async function translatePhoto(image: Blob): Promise<Blob> {
  const body = new FormData();
  body.append("image", image, "photo.png");
  const response = await fetch("/api/translate", {
    method: "POST",
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(translateTimeoutMs),
  });

  if (response.status === 400) {
    throw new TranslateError(await readFailureDetail(response));
  }
  if (!response.ok) {
    throw new TranslateError("The translation did not finish.");
  }

  const type = response.headers.get("content-type") ?? "";
  if (!type.includes("image/png")) {
    throw new TranslateError("The translation did not finish.");
  }

  const result = await response.blob();
  return result.type === "image/png" ? result : new Blob([result], { type: "image/png" });
}
