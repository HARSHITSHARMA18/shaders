import type { Metadata } from "next";
import { RefractiveLensLab } from "../../components/RefractiveLensLab";

export const metadata: Metadata = {
  title: "Refractive Lens - Solace Shaders",
  description: "Tune and install a shapeable glass lens for generated artwork, images, video, and custom SVG masks.",
};

export default function RefractiveLensPage() {
  return <RefractiveLensLab />;
}
