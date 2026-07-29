import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Magnetic Pixels - Solace Shaders",
  description: "Tune and install a spring-tethered magnetic pixel shader.",
};

export default function MagneticPixelsPage() {
  return <FieldShaderLab variant="magnetic" />;
}
