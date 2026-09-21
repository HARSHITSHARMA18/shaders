import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Magnetic Pixels - Shaders / Solace",
  description: "Tune and install a spring-tethered magnetic pixel shader.",
};

export default async function MagneticPixelsPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "magnetic-pixels" ? parsed : null;
  return <BrandLabTransfer setup={setup}><FieldShaderLab variant="magnetic" /></BrandLabTransfer>;
}
