import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { RefractiveLensLab } from "../../components/RefractiveLensLab";

export const metadata: Metadata = {
  title: "Refractive Lens - Shaders / Solace",
  description: "Tune and install a shapeable glass lens for generated artwork, images, video, and custom SVG masks.",
};

export default async function RefractiveLensPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "refractive-lens" ? parsed : null;
  return <BrandLabTransfer setup={setup}><RefractiveLensLab /></BrandLabTransfer>;
}
