import type { Metadata } from "next";
import { BlackholeLensingLab } from "../../components/BlackholeLensingLab";

export const metadata: Metadata = {
  title: "Black Hole Portal Shader - Shaders / Solace",
  description:
    "Interactive gravitational lensing black hole portal with Einstein rings, frame dragging, and chromatic dispersion.",
};

export default function BlackholeLensingPage() {
  return <BlackholeLensingLab />;
}
