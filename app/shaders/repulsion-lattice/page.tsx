import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Repulsion Lattice - Solace Shaders",
  description: "Tune and install a pointer-reactive repulsion lattice shader.",
};

export default function RepulsionLatticePage() {
  return <FieldShaderLab variant="repulsion" />;
}
