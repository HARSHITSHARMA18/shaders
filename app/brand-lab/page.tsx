import type { Metadata } from "next";
import registry from "../../registry.json";
import { readSetup } from "./setup";
import { BrandLab } from "./BrandLab";
import "./brand-lab.css";
import "./art-direction.css";

export const metadata: Metadata = {
  title: "Brand Lab — Shaders / Solace",
  description: "Try real Shaders across art-directed Campaign, Identity and Web Scenes. See what belongs in your brand.",
};

export default async function BrandLabPage({ searchParams }: { searchParams: Promise<{ brandLab?: string | string[] }> }) {
  const raw = (await searchParams).brandLab;
  const initialSetup = readSetup(raw);
  return <BrandLab initialSetup={initialSetup} invalidSetup={Boolean(raw && !initialSetup)} shaders={registry.items.map(({ name, title }) => ({ id: name, title }))} />;
}
