import { useEffect, useState, type ChangeEvent } from "react";
import { Button, buttonVariants } from "@/components/ui/button";
import { fileToTranslatePng } from "@/lib/resize";
import { TranslateError, retryMessage, translatePhoto } from "@/lib/translate";
import { cn } from "@/lib/utils";

const controlClassName =
  "h-11 px-4 text-base focus-visible:outline-2 focus-visible:outline-offset-[3px] focus-visible:outline-foreground sm:w-auto";

function useObjectUrl(blob: Blob | null): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blob) {
      setUrl(null);
      return;
    }
    const next = URL.createObjectURL(blob);
    setUrl(next);
    return () => {
      URL.revokeObjectURL(next);
    };
  }, [blob]);

  return url;
}

export function PrintBench() {
  const [photo, setPhoto] = useState<Blob | null>(null);
  const [print, setPrint] = useState<Blob | null>(null);
  const [phase, setPhase] = useState<"idle" | "preparing" | "translating">("idle");
  const [error, setError] = useState<string | null>(null);
  const photoUrl = useObjectUrl(photo);
  const printUrl = useObjectUrl(print);
  const busy = phase !== "idle";

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || busy) {
      return;
    }
    setError(null);
    setPrint(null);
    setPhase("preparing");
    try {
      setPhoto(await fileToTranslatePng(file));
    } catch {
      setPhoto(null);
      setError("This file could not be read as a photo. Choose a different photo.");
    } finally {
      setPhase("idle");
    }
  }

  async function onTranslate() {
    if (!photo || busy) {
      return;
    }
    setError(null);
    setPrint(null);
    setPhase("translating");
    try {
      setPrint(await translatePhoto(photo));
    } catch (caught) {
      const detail =
        caught instanceof TranslateError ? caught.message : "The translation did not finish.";
      setError(retryMessage(detail));
    } finally {
      setPhase("idle");
    }
  }

  const printMessage =
    phase === "translating"
      ? "Translating. This usually takes about half a minute."
      : "The print will appear here.";

  return (
    <main className="min-h-svh bg-background text-foreground">
      <h1 className="sr-only">Ukiyo-e</h1>
      <div className="flex w-full max-w-3xl flex-col items-start gap-6 px-4 py-6 sm:px-8 sm:py-10">
        <div
          className="grid w-full grid-cols-1 border-[3px] border-foreground bg-card sm:grid-cols-2"
          aria-busy={phase === "translating"}
        >
          <figure className="border-b-[3px] border-foreground sm:border-r-[3px] sm:border-b-0">
            <div className="aspect-square bg-card">
              {photoUrl ? (
                <img
                  src={photoUrl}
                  alt="Your photo, stretched to 256 by 256"
                  width={256}
                  height={256}
                  className="h-full w-full object-fill"
                />
              ) : (
                <p className="max-w-[24ch] p-4 text-left text-lg leading-relaxed">
                  Choose a landscape photo.
                </p>
              )}
            </div>
            <figcaption className="px-4 py-3 text-left text-base leading-relaxed">
              Your photo
            </figcaption>
          </figure>
          <figure>
            <div className="aspect-square bg-card" aria-live="polite">
              {printUrl ? (
                <img
                  src={printUrl}
                  alt="Ukiyo-e print"
                  width={256}
                  height={256}
                  className="h-full w-full object-fill"
                />
              ) : (
                <p className="max-w-[28ch] p-4 text-left text-lg leading-relaxed">{printMessage}</p>
              )}
            </div>
            <figcaption className="px-4 py-3 text-left text-base leading-relaxed">Ukiyo-e</figcaption>
          </figure>
        </div>

        <div className="flex w-full flex-col gap-3 sm:flex-row sm:flex-wrap">
          <label
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              controlClassName,
              "w-full cursor-pointer focus-within:ring-3 focus-within:ring-foreground",
              busy && "pointer-events-none opacity-50",
            )}
          >
            <input
              type="file"
              accept="image/*"
              className="sr-only"
              disabled={busy}
              onChange={(event) => {
                void onPhoto(event);
              }}
            />
            Choose a photo
          </label>
          <Button
            type="button"
            size="lg"
            className={cn(controlClassName, "w-full")}
            disabled={!photo || busy}
            onClick={() => {
              void onTranslate();
            }}
          >
            {phase === "translating" ? "Translating" : "Translate to Ukiyo-e"}
          </Button>
          {printUrl ? (
            <Button asChild variant="outline" size="lg" className={cn(controlClassName, "w-full")}>
              <a href={printUrl} download="ukiyoe.png">
                Download picture
              </a>
            </Button>
          ) : null}
        </div>

        {phase === "translating" ? <div className="wait-rule" aria-hidden="true" /> : null}

        {error ? (
          <p
            role="alert"
            className="max-w-[65ch] border-l-[3px] border-foreground pl-3 text-left text-base leading-relaxed"
          >
            {error}
          </p>
        ) : null}
      </div>
    </main>
  );
}
