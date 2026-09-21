import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Viscous Cursor Dye — Shaders / Solace",
  description: "Tune and install a pointer-reactive folded dye shader.",
};

export default async function ViscousCursorDyePage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "viscous-cursor-dye" ? parsed : null;
  return <BrandLabTransfer setup={setup}><FieldShaderLab variant="viscous" /></BrandLabTransfer>;
}
