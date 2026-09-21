import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Reaction Bloom — Shaders / Solace",
  description: "Tune and install a pointer-seeded reaction bloom shader.",
};

export default async function ReactionBloomPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "reaction-bloom" ? parsed : null;
  return <BrandLabTransfer setup={setup}><FieldShaderLab variant="reaction" /></BrandLabTransfer>;
}
