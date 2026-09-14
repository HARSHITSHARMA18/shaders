import type { Metadata } from "next";
import { SpecimenIndexLab } from "../../components/SpecimenIndexLab";

export const metadata: Metadata = {
  title: "Specimen Index - Shaders / Solace",
  description: "Tune and install an image-aware optical study with connected detail, color, and structure probes.",
};

export default function SpecimenIndexPage() {
  return <SpecimenIndexLab />;
}
