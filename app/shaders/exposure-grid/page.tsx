import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { ExposureGridLab } from "../../components/ExposureGridLab";

export const metadata: Metadata = {
  title: "Exposure Grid - Shaders / Solace",
  description: "Tune and install an editorial image or video grid with independently changing sampled cells.",
};

export default async function ExposureGridPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "exposure-grid" ? parsed : null; return <BrandLabTransfer setup={setup}><ExposureGridLab /></BrandLabTransfer>; }
