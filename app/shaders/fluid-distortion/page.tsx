import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { FluidDistortionLab } from "../../components/FluidDistortionLab";

export const metadata: Metadata = {
  title: "Fluid Distortion - Shaders / Solace",
  description: "Tune and install a pointer-reactive 2D fluid that warps generated forms or your own media.",
};

export default async function FluidDistortionPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "fluid-distortion" ? parsed : null;
  return <BrandLabTransfer setup={setup}><FluidDistortionLab /></BrandLabTransfer>;
}
