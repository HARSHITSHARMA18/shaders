import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { ParticleMorphLab } from "../../components/ParticleMorphLab";

export const metadata: Metadata = {
  title: "Particle Assembly - Shaders / Solace",
  description: "Tune and install a glossy particle shader that assembles into an editable wordmark or pasted SVG logo.",
};

export default async function ParticleAssemblyPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "particle-assembly" ? parsed : null;
  return <BrandLabTransfer setup={setup}><ParticleMorphLab /></BrandLabTransfer>;
}
