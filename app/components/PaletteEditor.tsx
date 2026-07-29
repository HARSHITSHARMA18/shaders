"use client";

import { useMemo, useState, type PointerEvent } from "react";

export type PaletteStop = {
  key: string;
  label: string;
  value: string;
};

type Props = {
  stops: PaletteStop[];
  onChange: (key: string, value: string) => void;
};

type Hsv = {
  hue: number;
  saturation: number;
  value: number;
};

function normalizeHex(hex: string) {
  const source = hex.trim().replace("#", "");
  if (/^[0-9a-f]{3}$/i.test(source)) {
    return `#${source.split("").map((character) => character + character).join("")}`.toUpperCase();
  }
  if (/^[0-9a-f]{6}$/i.test(source)) {
    return `#${source}`.toUpperCase();
  }
  return null;
}

function hexToHsv(hex: string): Hsv {
  const normalized = normalizeHex(hex) ?? "#000000";
  const value = Number.parseInt(normalized.slice(1), 16);
  const red = ((value >> 16) & 255) / 255;
  const green = ((value >> 8) & 255) / 255;
  const blue = (value & 255) / 255;
  const maximum = Math.max(red, green, blue);
  const minimum = Math.min(red, green, blue);
  const delta = maximum - minimum;
  let hue = 0;

  if (delta > 0) {
    if (maximum === red) hue = 60 * (((green - blue) / delta) % 6);
    else if (maximum === green) hue = 60 * ((blue - red) / delta + 2);
    else hue = 60 * ((red - green) / delta + 4);
  }

  if (hue < 0) hue += 360;
  return {
    hue,
    saturation: maximum === 0 ? 0 : (delta / maximum) * 100,
    value: maximum * 100,
  };
}

function hsvToHex({ hue, saturation, value }: Hsv) {
  const chroma = (value / 100) * (saturation / 100);
  const sector = hue / 60;
  const intermediate = chroma * (1 - Math.abs((sector % 2) - 1));
  const match = value / 100 - chroma;
  let red = 0;
  let green = 0;
  let blue = 0;

  if (sector < 1) [red, green] = [chroma, intermediate];
  else if (sector < 2) [red, green] = [intermediate, chroma];
  else if (sector < 3) [green, blue] = [chroma, intermediate];
  else if (sector < 4) [green, blue] = [intermediate, chroma];
  else if (sector < 5) [red, blue] = [intermediate, chroma];
  else [red, blue] = [chroma, intermediate];

  return `#${[red, green, blue]
    .map((channel) => Math.round((channel + match) * 255).toString(16).padStart(2, "0"))
    .join("")}`.toUpperCase();
}

function HexColorInput({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const [draft, setDraft] = useState<string | null>(null);
  const displayedValue = draft ?? value.toUpperCase();

  const submit = () => {
    const normalized = normalizeHex(displayedValue);
    if (normalized) onChange(normalized);
    setDraft(null);
  };

  return (
    <input
      value={displayedValue}
      onFocus={() => setDraft(value.toUpperCase())}
      onChange={(event) => {
        const nextValue = event.target.value;
        setDraft(nextValue);
        const normalized = normalizeHex(nextValue);
        if (normalized) onChange(normalized);
      }}
      onBlur={submit}
      onKeyDown={(event) => {
        if (event.key === "Enter") event.currentTarget.blur();
        if (event.key === "Escape") {
          setDraft(null);
          event.currentTarget.blur();
        }
      }}
      maxLength={7}
      spellCheck={false}
    />
  );
}

export function PaletteEditor({ stops, onChange }: Props) {
  const [activeKey, setActiveKey] = useState(stops[0]?.key ?? "");
  const activeStop = stops.find((stop) => stop.key === activeKey) ?? stops[0];
  const activeValue = activeStop?.value ?? "#000000";
  const hsv = useMemo(() => hexToHsv(activeValue), [activeValue]);

  if (!activeStop) return null;

  const updateSaturationValue = (event: PointerEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const saturation = Math.min(100, Math.max(0, ((event.clientX - bounds.left) / bounds.width) * 100));
    const value = Math.min(100, Math.max(0, (1 - (event.clientY - bounds.top) / bounds.height) * 100));
    onChange(activeStop.key, hsvToHex({ hue: hsv.hue, saturation, value }));
  };

  return (
    <section className="paletteEditor" aria-label="Custom shader palette editor">
      <div className="paletteEditorHeading">
        <span>Palette lab</span>
        <span>{stops.length} editable stops</span>
      </div>

      <div className="paletteSwatchRail" role="list" aria-label="Palette color stops">
        {stops.map((stop) => (
          <button
            className="paletteSwatchButton"
            data-active={stop.key === activeStop.key}
            key={stop.key}
            type="button"
            onClick={() => setActiveKey(stop.key)}
            aria-label={`Edit ${stop.label}: ${stop.value}`}
            aria-pressed={stop.key === activeStop.key}
            title={stop.label}
          >
            <span style={{ backgroundColor: stop.value }} />
          </button>
        ))}
      </div>

      <div className="paletteEditorSurface">
        <div className="paletteEditorMeta">
          <span>{activeStop.label}</span>
          <label>
            <span className="srOnly">Hex color</span>
            <HexColorInput
              key={activeStop.key}
              value={activeValue}
              onChange={(value) => onChange(activeStop.key, value)}
            />
          </label>
        </div>

        <div
          className="paletteSaturationField"
          style={{ backgroundColor: `hsl(${hsv.hue} 100% 50%)` }}
          onPointerDown={(event) => {
            event.currentTarget.setPointerCapture(event.pointerId);
            updateSaturationValue(event);
          }}
          onPointerMove={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              updateSaturationValue(event);
            }
          }}
          onPointerUp={(event) => {
            if (event.currentTarget.hasPointerCapture(event.pointerId)) {
              event.currentTarget.releasePointerCapture(event.pointerId);
            }
          }}
          role="slider"
          aria-label={`${activeStop.label} saturation and brightness`}
          aria-valuetext={`${Math.round(hsv.saturation)}% saturation, ${Math.round(hsv.value)}% brightness`}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(hsv.saturation)}
          onKeyDown={(event) => {
            const increment = event.shiftKey ? 10 : 2;
            if (event.key === "ArrowLeft") {
              event.preventDefault();
              onChange(activeStop.key, hsvToHex({ ...hsv, saturation: Math.max(0, hsv.saturation - increment) }));
            }
            if (event.key === "ArrowRight") {
              event.preventDefault();
              onChange(activeStop.key, hsvToHex({ ...hsv, saturation: Math.min(100, hsv.saturation + increment) }));
            }
            if (event.key === "ArrowDown") {
              event.preventDefault();
              onChange(activeStop.key, hsvToHex({ ...hsv, value: Math.max(0, hsv.value - increment) }));
            }
            if (event.key === "ArrowUp") {
              event.preventDefault();
              onChange(activeStop.key, hsvToHex({ ...hsv, value: Math.min(100, hsv.value + increment) }));
            }
          }}
          tabIndex={0}
        >
          <span
            className="paletteFieldCursor"
            style={{ left: `${hsv.saturation}%`, top: `${100 - hsv.value}%`, backgroundColor: activeValue }}
          />
        </div>

        <label className="paletteHueControl">
          <span>Hue</span>
          <input
            type="range"
            min="0"
            max="359"
            step="1"
            value={Math.round(hsv.hue)}
            onChange={(event) => {
              onChange(activeStop.key, hsvToHex({ ...hsv, hue: Number(event.target.value) }));
            }}
            aria-label={`${activeStop.label} hue`}
          />
          <output>{Math.round(hsv.hue)}°</output>
        </label>
      </div>
    </section>
  );
}
