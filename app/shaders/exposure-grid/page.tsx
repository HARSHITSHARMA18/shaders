import type { Metadata } from "next";
import { ExposureGridLab } from "../../components/ExposureGridLab";

export const metadata: Metadata = {
  title: "Exposure Grid - Solace Shaders",
  description: "Tune and install an editorial image or video grid with independently changing sampled cells.",
};

export default function ExposureGridPage() { return <ExposureGridLab />; }
