import type { Metadata } from "next";
import { ThermalEtchBurnLab } from "../../components/ThermalEtchBurnLab";

export const metadata: Metadata = {
  title: "Thermal Etch Burn - Solace Shaders",
  description: "Tune and install a grain-heavy procedural thermal burn shader.",
};

export default function ThermalEtchBurnPage() {
  return <ThermalEtchBurnLab />;
}
