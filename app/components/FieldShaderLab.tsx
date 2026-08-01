"use client";

import { useEffect, useMemo, useRef, useState, useSyncExternalStore } from "react";
import Link from "next/link";
import { DialRoot, useDialKitController, type DialConfig } from "dialkit";
import { HighlightedCode } from "./HighlightedCode";
import { PaletteEditor } from "./PaletteEditor";
import { PanelResetButton } from "./PanelResetButton";
import { CodeActionIcon, CopyActionIcon } from "./RegistryActionIcons";
import { SolaceLogo } from "./SolaceLogo";
import { Tooltip } from "./Tooltip";
import {
  FIELD_PALETTES,
  FieldShaderPalette,
  FieldShaderSettings,
  FieldShaderVariant,
  SolaceFieldShader,
} from "./SolaceFieldShader";

const CANONICAL_ORIGIN = "https://shaders.solaceui.com";

const DEFINITIONS: Record<FieldShaderVariant, {
  number: string;
  slug: string;
  title: string;
  description: string;
  instruction: string;
}> = {
  viscous: {
    number: "002",
    slug: "viscous-cursor-dye",
    title: "Viscous cursor dye",
    description: "A folded color field that stretches around pointer velocity and settles into slow ambient currents.",
    instruction: "Move quickly to pull the dye into longer folds",
  },
  reaction: {
    number: "003",
    slug: "reaction-bloom",
    title: "Reaction bloom",
    description: "A pointer-seeded chemical garden of membranes, rings, and domain-warped cellular growth.",
    instruction: "Move slowly to inspect the evolving membranes",
  },
  cellular: {
    number: "004",
    slug: "cellular-contagion",
    title: "Cellular contagion",
    description: "A discrete field that moves through dormant, excited, burning, and cooling color states.",
    instruction: "Sweep the field to move the contagion front",
  },
  repulsion: {
    number: "005",
    slug: "repulsion-lattice",
    title: "Repulsion lattice",
    description: "A rising halftone field that parts into a compact four-point aperture around the pointer.",
    instruction: "Move slowly to open a void; move quickly to shear its edge",
  },
  magnetic: {
    number: "006",
    slug: "magnetic-pixels",
    title: "Magnetic pixels",
    description: "Spring-tethered particles switch polarity around the pointer and reveal the tension holding them in place.",
    instruction: "Sweep across the lattice to reverse its local polarity",
  },
  chromatic: {
    number: "007",
    slug: "chromatic-refraction",
    title: "Chromatic refraction",
    description: "A moving glass field separates spectral layers and catches velocity along its refractive rim.",
    instruction: "Move quickly to pull the spectral layers apart",
  },
};

const DEFAULT_PALETTES: Record<FieldShaderVariant, FieldShaderPalette> = {
  viscous: "signal",
  reaction: "signal",
  cellular: "signal",
  repulsion: "ember",
  magnetic: "signal",
  chromatic: "acid",
};

function createFieldDials(defaultPalette: FieldShaderPalette) {
  const colors = FIELD_PALETTES[defaultPalette];
  return {
    material: {
      scale: [1, 0.35, 2.4, 0.05] as [number, number, number, number],
      intensity: [1, 0.35, 1.8, 0.05] as [number, number, number, number],
      distortion: [0.7, 0, 1.5, 0.05] as [number, number, number, number],
      trail: [0.45, 0, 1, 0.05] as [number, number, number, number],
    },
    motion: {
      speed: [0.7, 0, 1.6, 0.05] as [number, number, number, number],
      animate: true,
    },
    color: {
      preset: {
        type: "select",
        options: [
          { value: "signal", label: "Signal" },
          { value: "acid", label: "Acid" },
          { value: "ember", label: "Ember" },
          { value: "glacier", label: "Glacier" },
          { value: "mono", label: "Monochrome" },
        ],
        default: defaultPalette,
      },
      background: { type: "color", default: colors.background },
      primary: { type: "color", default: colors.primary },
      secondary: { type: "color", default: colors.secondary },
      highlight: { type: "color", default: colors.highlight },
    },
  } satisfies DialConfig;
}

async function writeClipboard(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  const field = document.createElement("textarea");
  field.value = text;
  field.style.position = "fixed";
  field.style.opacity = "0";
  document.body.appendChild(field);
  field.select();
  document.execCommand("copy");
  field.remove();
}

export function FieldShaderLab({ variant }: { variant: FieldShaderVariant }) {
  const definition = DEFINITIONS[variant];
  const defaultPalette = DEFAULT_PALETTES[variant];
  const dialConfig = useMemo(() => createFieldDials(defaultPalette), [defaultPalette]);
  const dial = useDialKitController(definition.title, dialConfig, {
    id: `solace-${definition.slug}`,
    persist: true,
  });
  const selectedPreset = dial.values.color.preset as FieldShaderPalette;
  const previousPreset = useRef(selectedPreset);
  useEffect(() => {
    if (previousPreset.current === selectedPreset) return;
    previousPreset.current = selectedPreset;
    dial.setValues({ color: { ...FIELD_PALETTES[selectedPreset] } });
  }, [dial, selectedPreset]);
  const origin = useSyncExternalStore(
    () => () => undefined,
    () => window.location.origin,
    () => CANONICAL_ORIGIN,
  );
  const [codeOpen, setCodeOpen] = useState(false);
  const [copied, setCopied] = useState<"install" | "jsx" | null>(null);

  const settings = useMemo<FieldShaderSettings>(
    () => ({
      scale: dial.values.material.scale,
      intensity: dial.values.material.intensity,
      distortion: dial.values.material.distortion,
      trail: dial.values.material.trail,
      speed: dial.values.motion.animate ? dial.values.motion.speed : 0,
      palette: selectedPreset,
      colors: {
        background: dial.values.color.background,
        primary: dial.values.color.primary,
        secondary: dial.values.color.secondary,
        highlight: dial.values.color.highlight,
      },
    }),
    [dial.values, selectedPreset],
  );

  const registryUrl = `${origin}/r/${definition.slug}.json`;
  const registryCommand = origin
    ? `npx shadcn@latest add ${registryUrl}`
    : `npx shadcn@latest add /r/${definition.slug}.json`;
  const snippet = `import { SolaceFieldShader } from "@/components/solace-field-shader";

<div className="relative h-[560px] overflow-hidden rounded-2xl">
  <SolaceFieldShader
    variant="${variant}"
    scale={${settings.scale.toFixed(2)}}
    intensity={${settings.intensity.toFixed(2)}}
    speed={${settings.speed.toFixed(2)}}
    distortion={${settings.distortion.toFixed(2)}}
    trail={${settings.trail.toFixed(2)}}
    colors={{
      background: "${settings.colors?.background}",
      primary: "${settings.colors?.primary}",
      secondary: "${settings.colors?.secondary}",
      highlight: "${settings.colors?.highlight}",
    }}
    className="h-full w-full"
  />
</div>`;

  const copy = async (kind: "install" | "jsx", value: string) => {
    await writeClipboard(value);
    setCopied(kind);
    window.setTimeout(() => setCopied(null), 1600);
  };

  return (
    <div className="labShell detailShell">
      <header className="topbar">
        <Link className="wordmark" href="/" aria-label="Back to Solace Shaders catalog">
          <SolaceLogo className="solaceLogo" />
          <span>Solace</span>
          <span className="brandDivider">/</span>
          <span className="brandSection">Shaders</span>
        </Link>
      </header>

      <main className="workspace detailWorkspace" id="top">
        <section className="experiment">
          <div className="experimentHeading">
            <div>
              <Link className="backLink" href="/">← All shaders</Link>
              <div className="eyebrow">Experiment {definition.number} / Interactive field</div>
              <h1>{definition.title}</h1>
            </div>
            <p>{definition.description}</p>
          </div>

          <div className="stage fieldStage">
            <SolaceFieldShader className="shaderCanvas" variant={variant} settings={settings} />
            <div className="stageTop" aria-hidden="true">
              <span>{variant} field</span>
              <span>WebGL 2</span>
            </div>
            <div className="stageBottom">
              <span>{definition.instruction}</span>
              <span className="stageHint">Tune the material in DialKit</span>
            </div>
          </div>
        </section>

        <section className="installPanel" aria-labelledby="install-title">
          <div className="installIntro">
            <span className="eyebrow">Solace registry</span>
            <h2 id="install-title">Add it to your project</h2>
            <p>Installs the standalone WebGL component into your components directory.</p>
          </div>
          <div className="installCommand">
            <code>{registryCommand}</code>
            <Tooltip content={copied === "install" ? "Copied" : "Copy command"}>
              <button
                className={`iconActionButton${copied === "install" ? " isCopied" : ""}`}
                type="button"
                aria-label={copied === "install" ? "Command copied" : "Copy command"}
                onClick={() => copy("install", registryCommand)}
              >
                <CopyActionIcon confirmed={copied === "install"} />
              </button>
            </Tooltip>
          </div>
          <Tooltip content={codeOpen ? "Hide configured JSX" : "View configured JSX"}>
            <button
              className="usageToggle iconActionButton"
              type="button"
              aria-label={codeOpen ? "Hide configured JSX" : "View configured JSX"}
              aria-expanded={codeOpen}
              aria-controls="configured-jsx"
              onClick={() => setCodeOpen((open) => !open)}
            >
              <CodeActionIcon />
            </button>
          </Tooltip>
        </section>

        {codeOpen ? (
          <section className="codePanel" id="configured-jsx" aria-label="Configured component snippet">
            <div className="codePanelHeader">
              <div>
                <span className="eyebrow">Current DialKit values</span>
                <h2>Ready-to-paste usage</h2>
              </div>
              <Tooltip content={copied === "jsx" ? "Copied" : "Copy JSX"}>
                <button
                  className={`quietButton iconActionButton${copied === "jsx" ? " isCopied" : ""}`}
                  type="button"
                  aria-label={copied === "jsx" ? "JSX copied" : "Copy JSX"}
                  onClick={() => copy("jsx", snippet)}
                >
                  <CopyActionIcon confirmed={copied === "jsx"} />
                </button>
              </Tooltip>
            </div>
            <HighlightedCode code={snippet} />
          </section>
        ) : null}
      </main>

      <aside className="inspector" aria-label={`${definition.title} fine-tuning controls`}>
        <div className="dialkitFrame">
          <PanelResetButton onReset={dial.resetValues} />
          <DialRoot mode="inline" theme="dark" productionEnabled />
          <PaletteEditor
            stops={[
              { key: "background", label: "Background", value: dial.values.color.background },
              { key: "primary", label: "Primary", value: dial.values.color.primary },
              { key: "secondary", label: "Secondary", value: dial.values.color.secondary },
              { key: "highlight", label: "Highlight", value: dial.values.color.highlight },
            ]}
            onChange={(key, value) => dial.setValue(`color.${key}`, value)}
          />
        </div>
      </aside>
    </div>
  );
}
