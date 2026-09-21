import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { SpecimenIndexLab } from "../../components/SpecimenIndexLab";

export const metadata: Metadata = {
  title: "Specimen Index - Shaders / Solace",
  description: "Tune and install an image-aware optical study with connected detail, color, and structure probes.",
};

export default async function SpecimenIndexPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "specimen-index" ? parsed : null;
  return <BrandLabTransfer setup={setup}><SpecimenIndexLab /></BrandLabTransfer>;
}
