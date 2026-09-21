import { BrandLabTransfer } from "../../components/BrandLabTransfer";
import { readSetup } from "../../brand-lab/setup";
import type { Metadata } from "next";
import { ShaderLab } from "../../components/ShaderLab";

export const metadata: Metadata = {
  title: "Thermal Pixel Ink - Shaders / Solace",
  description: "Create interactive heat trails with a WebGL shader. Tune the pixel size and palette, then install the editable React component in your project.",
};

export default async function ThermalPixelInkPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const parsed = readSetup((await searchParams).brandLab);
  const setup = parsed?.shaderId === "thermal-pixel-ink" ? parsed : null;
  return <BrandLabTransfer setup={setup}><ShaderLab /></BrandLabTransfer>;
}
