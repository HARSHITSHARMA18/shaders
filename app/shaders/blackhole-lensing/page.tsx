import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { BlackholeLensingLab } from "../../components/BlackholeLensingLab";

export const metadata: Metadata = {
  title: "Black Hole Portal Shader - Shaders / Solace",
  description:
    "Interactive gravitational lensing black hole portal with Einstein rings, frame dragging, and chromatic dispersion.",
};

export default async function BlackholeLensingPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "blackhole-lensing" ? parsed : null;
  return <BrandLabTransfer setup={setup}><BlackholeLensingLab /></BrandLabTransfer>;
}
