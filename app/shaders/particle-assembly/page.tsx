import type { Metadata } from "next";
import { ParticleMorphLab } from "../../components/ParticleMorphLab";

export const metadata: Metadata = {
  title: "Particle Assembly - Solace Shaders",
  description: "Tune and install a glossy particle shader that assembles into an editable wordmark or pasted SVG logo.",
};

export default function ParticleAssemblyPage() {
  return <ParticleMorphLab />;
}
