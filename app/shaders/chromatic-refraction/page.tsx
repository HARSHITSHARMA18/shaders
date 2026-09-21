import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Chromatic Refraction - Shaders / Solace",
  description: "Tune and install a pointer-reactive chromatic refraction shader.",
};

export default async function ChromaticRefractionPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "chromatic-refraction" ? parsed : null;
  return <BrandLabTransfer setup={setup}><FieldShaderLab variant="chromatic" /></BrandLabTransfer>;
}
