import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Chromatic Refraction - Solace Shaders",
  description: "Tune and install a pointer-reactive chromatic refraction shader.",
};

export default function ChromaticRefractionPage() {
  return <FieldShaderLab variant="chromatic" />;
}
