import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Viscous Cursor Dye — Solace Shaders",
  description: "Tune and install a pointer-reactive folded dye shader.",
};

export default function ViscousCursorDyePage() {
  return <FieldShaderLab variant="viscous" />;
}
