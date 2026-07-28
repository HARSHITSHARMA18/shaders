import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Cellular Contagion — Solace Shaders",
  description: "Tune and install a discrete pointer-reactive cellular field.",
};

export default function CellularContagionPage() {
  return <FieldShaderLab variant="cellular" />;
}
