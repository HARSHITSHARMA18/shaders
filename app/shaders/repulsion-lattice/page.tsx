import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Repulsion Lattice - Shaders / Solace",
  description: "Tune and install a pointer-reactive repulsion lattice shader.",
};

export default async function RepulsionLatticePage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "repulsion-lattice" ? parsed : null;
  return <BrandLabTransfer setup={setup}><FieldShaderLab variant="repulsion" /></BrandLabTransfer>;
}
