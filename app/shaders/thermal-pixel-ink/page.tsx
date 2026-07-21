import type { Metadata } from "next";
import { ShaderLab } from "../../components/ShaderLab";

export const metadata: Metadata = {
  title: "Thermal Pixel Ink - Solace Shaders",
  description: "Tune and copy a persistent, quantized WebGL heat field for Solace UI.",
};

export default function ThermalPixelInkPage() {
  return <ShaderLab />;
}
