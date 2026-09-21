import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { ThermalEtchBurnLab } from "../../components/ThermalEtchBurnLab";

export const metadata: Metadata = {
  title: "Thermal Etch Burn - Shaders / Solace",
  description: "Tune and install a grain-heavy procedural thermal burn shader.",
};

export default async function ThermalEtchBurnPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "thermal-etch-burn" ? parsed : null;
  return <BrandLabTransfer setup={setup}><ThermalEtchBurnLab /></BrandLabTransfer>;
}
