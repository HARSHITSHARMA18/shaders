import type { Metadata } from "next";
import { FluidDistortionLab } from "../../components/FluidDistortionLab";

export const metadata: Metadata = {
  title: "Fluid Distortion - Shaders / Solace",
  description: "Tune and install a pointer-reactive 2D fluid that warps generated forms or your own media.",
};

export default function FluidDistortionPage() {
  return <FluidDistortionLab />;
}
