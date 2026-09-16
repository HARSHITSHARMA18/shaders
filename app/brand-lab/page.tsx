import type { Metadata } from "next";
import registry from "../../registry.json";
import { BrandLab } from "./BrandLab";
import "./brand-lab.css";

export const metadata: Metadata = {
  title: "Brand Lab — Shaders / Solace",
  description: "Try real Shaders across an art-directed campaign. See what belongs in your brand.",
};

export default function BrandLabPage() {
  return <BrandLab shaders={registry.items.map(({ name, title }) => ({ id: name, title }))} />;
}
