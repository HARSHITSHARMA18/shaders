import { toBlob } from "html-to-image";
import type { Surface } from "./model";

export async function downloadAsset(element: HTMLElement, surface: Surface, brandName: string) {
  await document.fonts.ready;
  await Promise.all(Array.from(element.querySelectorAll("img")).map(image => image.decode().catch(() => undefined)));
  const blob = await toBlob(element, {
    canvasWidth: surface.width,
    canvasHeight: surface.height,
    pixelRatio: 1,
    skipAutoScale: true,
    cacheBust: false,
  });
  if (!blob || blob.size < 1000) throw new Error("The image could not be rendered. Try again after the material settles.");
  const file = `${brandName}-${surface.label}`.toLowerCase().normalize("NFKD").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.download = `${file}.png`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 60000);
}
