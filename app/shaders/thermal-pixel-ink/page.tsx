import type { Metadata } from "next";
import { ShaderLab } from "../../components/ShaderLab";

export const metadata: Metadata = {
  title: "Thermal Pixel Ink - Shaders / Solace",
  description: "Create interactive heat trails with a WebGL shader. Tune the pixel size and palette, then install the editable React component in your project.",
};

export default function ThermalPixelInkPage() {
  return <ShaderLab />;
}
