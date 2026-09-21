import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Cellular Contagion — Shaders / Solace",
  description: "Tune and install a discrete pointer-reactive cellular field.",
};

export default async function CellularContagionPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "cellular-contagion" ? parsed : null;
  return <BrandLabTransfer setup={setup}><FieldShaderLab variant="cellular" /></BrandLabTransfer>;
}
