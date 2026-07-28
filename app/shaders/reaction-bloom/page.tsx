import type { Metadata } from "next";
import { FieldShaderLab } from "../../components/FieldShaderLab";

export const metadata: Metadata = {
  title: "Reaction Bloom — Solace Shaders",
  description: "Tune and install a pointer-seeded reaction bloom shader.",
};

export default function ReactionBloomPage() {
  return <FieldShaderLab variant="reaction" />;
}
