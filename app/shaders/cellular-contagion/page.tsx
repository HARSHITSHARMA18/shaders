import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Cellular Contagion — Shaders / Solace",
  description: "Tune and install a discrete pointer-reactive cellular field.",
};

export default function CellularContagionPage() {
  return <FieldShaderLab variant="cellular" />;
}
