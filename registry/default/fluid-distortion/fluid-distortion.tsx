"use client";

import { useEffect, useMemo, useRef } from "react";

export type FluidDistortionComposition = "flare" | "capsule" | "orbs" | "ribbon" | "svg" | "media";
export type FluidDistortionCurrent = "idle" | "pointer" | "orbit";
export type FluidDistortionCharacter = "silk" | "honey" | "storm";
export type FluidDistortionPalette = "flare" | "aurora" | "citrus" | "glacier" | "ink";
export type FluidDistortionMediaType = "auto" | "image" | "video";

export type FluidDistortionColors = {
  background: string;
  bloomA: string;
  bloomB: string;
  bloomC: string;
  highlight: string;
};

export type FluidDistortionSettings = {
  composition: FluidDistortionComposition;
  current: FluidDistortionCurrent;
  character: FluidDistortionCharacter;
  cursorSize: number;
  cursorPower: number;
  distortion: number;
  softness: number;
  gloss: number;
  swirl: number;
  dissipationVel: number;
  dissipationDist: number;
  palette: FluidDistortionPalette;
  colors: FluidDistortionColors;
};

type Props = Partial<Omit<FluidDistortionSettings, "colors">> & {
  src?: string;
  mediaType?: FluidDistortionMediaType;
  svgMask?: string;
  colors?: Partial<FluidDistortionColors>;
  settings?: FluidDistortionSettings;
  className?: string;
  alt?: string;
};

export const SOLACE_MARK_SVG = `<svg viewBox="0 0 64 38" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 20.1032H39.8387C44.7808 20.1032 48.7871 24.1095 48.7871 29.0516C48.7871 33.9937 44.7808 38 39.8387 38H0V20.1032Z" fill="white"/>
  <path d="M63.4968 17.8968H23.6581C18.716 17.8968 14.7097 13.8904 14.7097 8.94839C14.7097 4.00633 18.716 0 23.6581 0H63.4968V17.8968Z" fill="white"/>
</svg>`;

export const DEFAULT_FLUID_DISTORTION_SVG = SOLACE_MARK_SVG;

export const FLUID_DISTORTION_PALETTES: Record<FluidDistortionPalette, FluidDistortionColors> = {
  flare: {
    background: "#FFFFFF",
    bloomA: "#FF4B9A",
    bloomB: "#FF6A21",
    bloomC: "#E01732",
    highlight: "#FFE6C8",
  },
  aurora: {
    background: "#F7FBFF",
    bloomA: "#5EEAD4",
    bloomB: "#60A5FA",
    bloomC: "#C084FC",
    highlight: "#F0FDFF",
  },
  citrus: {
    background: "#FFFCF4",
    bloomA: "#FFE14A",
    bloomB: "#FF7A1A",
    bloomC: "#FF3D6E",
    highlight: "#FFF4C8",
  },
  glacier: {
    background: "#F4FAFC",
    bloomA: "#7DD3FC",
    bloomB: "#38BDF8",
    bloomC: "#2563EB",
    highlight: "#F0F9FF",
  },
  ink: {
    background: "#F6F3EC",
    bloomA: "#1C1917",
    bloomB: "#44403C",
    bloomC: "#0C0A09",
    highlight: "#E7E5E4",
  },
};

export const FLUID_DISTORTION_CHARACTERS: Record<
  FluidDistortionCharacter,
  Pick<
    FluidDistortionSettings,
    "cursorSize" | "cursorPower" | "distortion" | "softness" | "gloss" | "swirl" | "dissipationVel" | "dissipationDist"
  >
> = {
  silk: {
    cursorSize: 0.018,
    cursorPower: 0.28,
    distortion: 0.52,
    softness: 0.09,
    gloss: 0.42,
    swirl: 0.55,
    dissipationVel: 0.986,
    dissipationDist: 0.992,
  },
  honey: {
    cursorSize: 0.038,
    cursorPower: 0.2,
    distortion: 0.34,
    softness: 0.12,
    gloss: 0.18,
    swirl: 0.22,
    dissipationVel: 0.948,
    dissipationDist: 0.97,
  },
  storm: {
    cursorSize: 0.026,
    cursorPower: 0.58,
    distortion: 0.78,
    softness: 0.07,
    gloss: 0.72,
    swirl: 0.88,
    dissipationVel: 0.972,
    dissipationDist: 0.982,
  },
};

const DEFAULT_SETTINGS: FluidDistortionSettings = {
  composition: "media",
  current: "idle",
  character: "silk",
  palette: "flare",
  colors: FLUID_DISTORTION_PALETTES.flare,
  ...FLUID_DISTORTION_CHARACTERS.silk,
};

const QUAD = `#version 300 es
in vec2 a_position;
out vec2 vUv;
out vec2 vL;
out vec2 vR;
out vec2 vT;
out vec2 vB;
uniform vec2 u_texel;
void main() {
  vUv = a_position * 0.5 + 0.5;
  vL = vUv - vec2(u_texel.x, 0.0);
  vR = vUv + vec2(u_texel.x, 0.0);
  vT = vUv + vec2(0.0, u_texel.y);
  vB = vUv - vec2(0.0, u_texel.y);
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const SPLAT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D u_input;
uniform vec2 u_point;
uniform vec3 u_value;
uniform float u_radius;
uniform float u_ratio;
void main() {
  vec2 p = vUv - u_point;
  p.x *= u_ratio;
  float splat = exp(-dot(p, p) / max(u_radius, 0.0002));
  vec3 base = texture(u_input, vUv).xyz;
  fragColor = vec4(base + splat * u_value, 1.0);
}`;

const ADVECT = `#version 300 es
precision highp float;
in vec2 vUv;
out vec4 fragColor;
uniform sampler2D u_velocity;
uniform sampler2D u_input;
uniform float u_dt;
uniform float u_dissipation;
void main() {
  vec2 vel = texture(u_velocity, vUv).xy;
  vec2 coord = clamp(vUv - u_dt * vel, 0.001, 0.999);
  fragColor = vec4(u_dissipation * texture(u_input, coord).xyz, 1.0);
}`;

const DIVERGENCE = `#version 300 es
precision highp float;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D u_velocity;
void main() {
  float L = texture(u_velocity, vL).x;
  float R = texture(u_velocity, vR).x;
  float T = texture(u_velocity, vT).y;
  float B = texture(u_velocity, vB).y;
  fragColor = vec4(0.5 * (R - L + T - B), 0.0, 0.0, 1.0);
}`;

const PRESSURE = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D u_pressure;
uniform sampler2D u_divergence;
void main() {
  float L = texture(u_pressure, vL).x;
  float R = texture(u_pressure, vR).x;
  float T = texture(u_pressure, vT).x;
  float B = texture(u_pressure, vB).x;
  float divergence = texture(u_divergence, vUv).x;
  fragColor = vec4((L + R + T + B - divergence) * 0.25, 0.0, 0.0, 1.0);
}`;

const PROJECT = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D u_pressure;
uniform sampler2D u_velocity;
void main() {
  float L = texture(u_pressure, vL).x;
  float R = texture(u_pressure, vR).x;
  float T = texture(u_pressure, vT).x;
  float B = texture(u_pressure, vB).x;
  vec2 velocity = texture(u_velocity, vUv).xy;
  velocity -= vec2(R - L, T - B);
  fragColor = vec4(velocity, 0.0, 1.0);
}`;

const CURL = `#version 300 es
precision highp float;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D u_velocity;
void main() {
  float L = texture(u_velocity, vL).y;
  float R = texture(u_velocity, vR).y;
  float T = texture(u_velocity, vT).x;
  float B = texture(u_velocity, vB).x;
  fragColor = vec4(R - L - (T - B), 0.0, 0.0, 1.0);
}`;

const VORTICITY = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;
uniform sampler2D u_velocity;
uniform sampler2D u_curl;
uniform float u_swirl;
uniform float u_dt;
void main() {
  float L = abs(texture(u_curl, vL).x);
  float R = abs(texture(u_curl, vR).x);
  float T = abs(texture(u_curl, vT).x);
  float B = abs(texture(u_curl, vB).x);
  float C = texture(u_curl, vUv).x;
  vec2 force = 0.5 * vec2(abs(T) - abs(B), abs(R) - abs(L));
  float mag = length(force) + 0.0001;
  force = min(u_swirl, mag) * force / mag;
  force.y *= -1.0;
  vec2 vel = texture(u_velocity, vUv).xy;
  fragColor = vec4(vel + force * C * u_dt, 0.0, 1.0);
}`;

const DISPLAY = `#version 300 es
precision highp float;
in vec2 vUv;
in vec2 vL;
in vec2 vR;
in vec2 vT;
in vec2 vB;
out vec4 fragColor;

uniform sampler2D u_disturbance;
uniform sampler2D u_velocity;
uniform sampler2D u_media;
uniform sampler2D u_svg_mask;
uniform vec2 u_resolution;
uniform float u_img_ratio;
uniform float u_svg_ratio;
uniform float u_disturb_power;
uniform float u_inner_scale;
uniform float u_softness;
uniform float u_gloss;
uniform int u_composition;
uniform float u_has_media;
uniform float u_has_svg;
uniform vec3 u_background;
uniform vec3 u_bloom_a;
uniform vec3 u_bloom_b;
uniform vec3 u_bloom_c;
uniform vec3 u_highlight;

float sdCircle(vec2 p, float r) {
  return length(p) - r;
}

float sdCapsule(vec2 p, vec2 a, vec2 b, float r) {
  vec2 pa = p - a;
  vec2 ba = b - a;
  float h = clamp(dot(pa, ba) / dot(ba, ba), 0.0, 1.0);
  return length(pa - ba * h) - r;
}

float smin(float a, float b, float k) {
  float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
  return mix(b, a, h) - k * h * (1.0 - h);
}

float fieldWeight(float d, float softness) {
  float s = max(softness, 0.012);
  return exp(-max(d, -s * 0.35) * max(d, -s * 0.35) / (s * s));
}

vec2 coverUv(vec2 uv, float targetAspect) {
  float viewportAspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 scale = vec2(1.0);
  if (viewportAspect > targetAspect) scale.y = targetAspect / viewportAspect;
  else scale.x = viewportAspect / targetAspect;
  return clamp((uv - 0.5) * scale + 0.5, 0.001, 0.999);
}

vec2 containSvgUv(vec2 uv, float targetAspect) {
  float viewportAspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = uv - 0.5;
  float baseScale = 0.52;
  vec2 scale = targetAspect >= 1.0
    ? vec2(baseScale * targetAspect, baseScale)
    : vec2(baseScale, baseScale / max(targetAspect, 0.001));
  vec2 normP = p * vec2(viewportAspect, 1.0) / scale;
  return normP + 0.5;
}

vec3 sampleMedia(vec2 uv) {
  vec2 uvc = clamp(uv, 0.0, 1.0);
  vec3 base = texture(u_media, coverUv(uvc, u_img_ratio)).rgb;
  float oob = step(uv.x, 0.0) + step(1.0, uv.x) + step(uv.y, 0.0) + step(1.0, uv.y);
  if (oob < 0.5) return base;
  vec3 sum = vec3(0.0);
  for (int x = -1; x <= 1; x++) {
    for (int y = -1; y <= 1; y++) {
      sum += texture(u_media, coverUv(clamp(uvc + vec2(float(x), float(y)) * 0.002, 0.0, 1.0), u_img_ratio)).rgb;
    }
  }
  return sum / 9.0;
}

float sampleSvgMask(vec2 uv) {
  vec2 svgUv = containSvgUv(uv, u_svg_ratio);
  if (svgUv.x < 0.0 || svgUv.x > 1.0 || svgUv.y < 0.0 || svgUv.y > 1.0) return 0.0;
  return texture(u_svg_mask, clamp(svgUv, 0.001, 0.999)).a;
}

void compose(vec2 uv, out vec3 color, out float alpha) {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (uv - 0.5) * vec2(aspect, 1.0);
  float soft = u_softness;
  float d1 = 1.0;
  float d2 = 1.0;
  float d3 = 1.0;
  float along = clamp(uv.x, 0.0, 1.0);

  if (u_composition == 5) {
    float mask = u_has_svg > 0.5 ? sampleSvgMask(uv) : 0.0;
    float maskL = u_has_svg > 0.5 ? sampleSvgMask(uv - vec2(0.012, 0.0)) : 0.0;
    float maskR = u_has_svg > 0.5 ? sampleSvgMask(uv + vec2(0.012, 0.0)) : 0.0;
    float maskT = u_has_svg > 0.5 ? sampleSvgMask(uv + vec2(0.0, 0.012)) : 0.0;
    float maskB = u_has_svg > 0.5 ? sampleSvgMask(uv - vec2(0.0, 0.012)) : 0.0;
    float halo = clamp((mask + maskL + maskR + maskT + maskB) * 0.25, 0.0, 1.0);

    vec3 c1 = mix(u_bloom_a, u_bloom_b, 0.55);
    vec3 c2 = u_bloom_b;
    vec3 c3 = mix(u_bloom_c, u_highlight, 0.35);
    vec3 pigment = mix(c1, c2, smoothstep(0.2, 0.75, along));
    pigment = mix(pigment, c3, mask * 0.45);
    alpha = u_has_svg > 0.5 ? smoothstep(0.02, 0.82, max(mask, halo * 0.65)) : 0.0;
    color = pigment;
    return;
  }

  if (u_composition == 1) {
    d1 = sdCapsule(p, vec2(-0.34, 0.0), vec2(0.34, 0.0), 0.118);
    d2 = d1;
    d3 = d1;
  } else if (u_composition == 2) {
    d1 = sdCircle(p - vec2(-0.2, 0.0), 0.16);
    d2 = sdCircle(p - vec2(0.2, 0.02), 0.14);
    d3 = smin(d1, d2, 0.08);
  } else if (u_composition == 3) {
    d1 = sdCapsule(p, vec2(-0.46, 0.0), vec2(0.46, 0.0), 0.062);
    d2 = sdCircle(p - vec2(-0.18, 0.01), 0.09);
    d3 = sdCircle(p - vec2(0.22, -0.01), 0.07);
  } else {
    d1 = sdCircle(p - vec2(-0.38, 0.01), 0.105);
    d2 = sdCircle(p - vec2(-0.14, 0.0), 0.12);
    d3 = sdCapsule(p, vec2(0.08, 0.0), vec2(0.4, 0.0), 0.112);
  }

  float merged = smin(smin(d1, d2, 0.07), d3, 0.08);
  float w1 = fieldWeight(d1, soft);
  float w2 = fieldWeight(d2, soft);
  float w3 = fieldWeight(d3, soft);
  float w = max(fieldWeight(merged, soft), max(w1, max(w2, w3)));

  vec3 c1 = mix(u_bloom_a, u_bloom_b, 0.55);
  vec3 c2 = u_bloom_b;
  vec3 c3 = mix(mix(u_bloom_c, u_bloom_a, smoothstep(0.45, 0.82, along)), u_bloom_b, smoothstep(0.78, 1.0, along));
  vec3 pigment = (c1 * w1 + c2 * w2 + c3 * w3) / max(w1 + w2 + w3, 0.0001);
  float core = fieldWeight(merged, soft * 0.46);
  pigment = mix(pigment, u_highlight, core * 0.22);
  alpha = smoothstep(0.04, 0.78, w);
  color = pigment;
}

float frameAlpha(vec2 uv, float width) {
  float alpha = smoothstep(0.0, width, uv.x) * smoothstep(1.0, 1.0 - width, uv.x);
  alpha *= smoothstep(0.0, width, uv.y) * smoothstep(1.0, 1.0 - width, uv.y);
  return alpha;
}

void main() {
  float offset = texture(u_disturbance, vUv).r;
  vec2 velocity = texture(u_velocity, vUv).xy;
  float velLen = length(velocity);

  // Smooth continuous direction computation (no direction flipping when velocity settles)
  vec2 velDir = velLen > 0.0001 ? velocity / velLen : vec2(0.0);
  float distL = texture(u_disturbance, vL).r;
  float distR = texture(u_disturbance, vR).r;
  float distB = texture(u_disturbance, vB).r;
  float distT = texture(u_disturbance, vT).r;
  vec2 grad = vec2(distR - distL, distT - distB);
  float gradLen = length(grad);
  vec2 gradDir = gradLen > 0.0001 ? grad / gradLen : vec2(0.0);

  vec2 flowDir = mix(gradDir, velDir, smoothstep(0.001, 0.05, velLen));
  float power = u_disturb_power;
  float distMag = offset * power * 0.32 + velLen * power * 0.24;
  vec2 warp = flowDir * distMag;

  vec2 imgUv = (vUv - 0.5) / u_inner_scale + 0.5 - warp;
  vec2 frameUv = (vUv - 0.5) / u_inner_scale + 0.5 - warp * 1.06;

  vec3 img;
  float shapeAlpha;
  if (u_has_media > 0.5 && u_composition == 4) {
    img = sampleMedia(imgUv);
    shapeAlpha = 1.0;
  } else {
    compose(imgUv, img, shapeAlpha);
  }

  float opacity = frameAlpha(frameUv, 0.006) * shapeAlpha;
  // Smooth spatial gradient liquid specular gloss without dFdx pixelation staircases
  float shear = gradLen * 16.0 + velLen * 1.1;
  float spec = pow(clamp(shear, 0.0, 1.0), 1.5) * u_gloss;
  img += u_highlight * spec * opacity * 0.75;
  vec3 color = mix(u_background, img, opacity);
  fragColor = vec4(color, 1.0);
}`;

function parseColor(hex: string) {
  const source = hex.replace("#", "");
  const normalized = source.length === 3 ? source.split("").map((c) => c + c).join("") : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return new Float32Array([((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create fluid distortion shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragment: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create fluid program.");
  const vs = compile(gl, gl.VERTEX_SHADER, QUAD);
  const fs = compile(gl, gl.FRAGMENT_SHADER, fragment);
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  gl.deleteShader(vs);
  gl.deleteShader(fs);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link fluid program.");
  }
  return program;
}

function sanitizeSvg(markup: string) {
  const documentNode = new DOMParser().parseFromString(markup, "image/svg+xml");
  const root = documentNode.documentElement;
  if (root.tagName.toLowerCase() !== "svg") return "";
  root.querySelectorAll("script, foreignObject, iframe, image, use").forEach((node) => node.remove());
  root.querySelectorAll("*").forEach((node) => {
    for (const attribute of [...node.attributes]) {
      if (attribute.name.toLowerCase().startsWith("on") || attribute.value.includes("url(")) node.removeAttribute(attribute.name);
    }
  });
  return new XMLSerializer().serializeToString(root);
}

function readSvgAspect(markup: string) {
  const root = new DOMParser().parseFromString(markup, "image/svg+xml").documentElement;
  const viewBox = root.getAttribute("viewBox")?.trim().split(/[\s,]+/).map(Number);
  if (viewBox?.length === 4 && viewBox.every(Number.isFinite) && viewBox[2] > 0 && viewBox[3] > 0) return viewBox[2] / viewBox[3];
  const width = Number.parseFloat(root.getAttribute("width") ?? "");
  const height = Number.parseFloat(root.getAttribute("height") ?? "");
  return Number.isFinite(width) && Number.isFinite(height) && width > 0 && height > 0 ? width / height : 1;
}

type Target = { fbo: WebGLFramebuffer; texture: WebGLTexture; width: number; height: number };

function createTarget(gl: WebGL2RenderingContext, width: number, height: number): Target {
  const texture = gl.createTexture();
  const fbo = gl.createFramebuffer();
  if (!texture || !fbo) throw new Error("Unable to allocate fluid buffer.");
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, width, height, 0, gl.RGBA, gl.FLOAT, null);
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  return { fbo, texture, width, height };
}

function createDouble(gl: WebGL2RenderingContext, width: number, height: number) {
  let read = createTarget(gl, width, height);
  let write = createTarget(gl, width, height);
  return {
    width,
    height,
    texelX: 1 / width,
    texelY: 1 / height,
    read: () => read,
    write: () => write,
    swap() {
      const tmp = read;
      read = write;
      write = tmp;
    },
  };
}

function compositionIndex(composition: FluidDistortionComposition) {
  if (composition === "capsule") return 1;
  if (composition === "orbs") return 2;
  if (composition === "ribbon") return 3;
  if (composition === "svg") return 5;
  if (composition === "media") return 4;
  return 0;
}

export function FluidDistortion({
  src = "/fluid-distortion-hero.png",
  mediaType = "auto",
  svgMask = DEFAULT_FLUID_DISTORTION_SVG,
  palette,
  settings,
  className,
  alt = "Interactive fluid distortion field",
  ...overrides
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolved = useMemo<FluidDistortionSettings>(() => {
    const paletteColors = palette ? FLUID_DISTORTION_PALETTES[palette] : undefined;
    const character = overrides.character ?? settings?.character ?? DEFAULT_SETTINGS.character;
    return {
      ...DEFAULT_SETTINGS,
      ...FLUID_DISTORTION_CHARACTERS[character],
      ...overrides,
      ...settings,
      colors: {
        ...DEFAULT_SETTINGS.colors,
        ...paletteColors,
        ...overrides.colors,
        ...settings?.colors,
      },
    };
  }, [overrides, palette, settings]);
  const settingsRef = useRef(resolved);

  useEffect(() => {
    settingsRef.current = resolved;
  }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) return;
    gl.getExtension("EXT_color_buffer_float");
    gl.getExtension("EXT_float_blend");
    gl.getExtension("OES_texture_float_linear");

    const programs = {
      splat: createProgram(gl, SPLAT),
      advect: createProgram(gl, ADVECT),
      divergence: createProgram(gl, DIVERGENCE),
      pressure: createProgram(gl, PRESSURE),
      project: createProgram(gl, PROJECT),
      curl: createProgram(gl, CURL),
      vorticity: createProgram(gl, VORTICITY),
      display: createProgram(gl, DISPLAY),
    };

    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);

    const bindProgram = (program: WebGLProgram, texelX: number, texelY: number) => {
      gl.useProgram(program);
      const loc = gl.getAttribLocation(program, "a_position");
      gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
      gl.enableVertexAttribArray(loc);
      gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);
      gl.uniform2f(gl.getUniformLocation(program, "u_texel"), texelX, texelY);
    };

    const mediaTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

    let mediaAspect = 1.6;
    let hasMedia = 0;
    let image: HTMLImageElement | null = null;
    let video: HTMLVideoElement | null = null;
    const inferredVideo = mediaType === "video" || Boolean(src?.match(/\.(mp4|webm|mov)(\?|$)/i));
    if (src && inferredVideo) {
      video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.src = src;
      video.addEventListener("loadeddata", () => {
        mediaAspect = video!.videoWidth / Math.max(video!.videoHeight, 1);
        hasMedia = 1;
        void video!.play().catch(() => undefined);
      }, { once: true });
    } else if (src) {
      image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        mediaAspect = image!.naturalWidth / Math.max(image!.naturalHeight, 1);
        gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image!);
        hasMedia = 1;
      };
      image.src = src;
    }

    const svgTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, svgTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

    let svgAspect = 64 / 38;
    let hasSvg = 0;
    let svgUrl = "";
    let svgImage: HTMLImageElement | null = null;
    const activeSvgMask = svgMask ?? DEFAULT_FLUID_DISTORTION_SVG;

    if (activeSvgMask) {
      const safeSvg = sanitizeSvg(activeSvgMask);
      if (safeSvg) {
        svgAspect = readSvgAspect(safeSvg);
        svgUrl = URL.createObjectURL(new Blob([safeSvg], { type: "image/svg+xml" }));
        svgImage = new Image();
        svgImage.onload = () => {
          hasSvg = 1;
          gl.bindTexture(gl.TEXTURE_2D, svgTexture);
          gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, svgImage!);
        };
        svgImage.src = svgUrl;
      }
    }

    let simW = 160;
    let simH = 96;
    let velocity = createDouble(gl, simW, simH);
    let disturbance = createDouble(gl, simW, simH);
    let pressure = createDouble(gl, simW, simH);
    let divergence = createTarget(gl, simW, simH);
    let curl = createTarget(gl, simW, simH);

    const destroySim = () => {
      for (const target of [velocity.read(), velocity.write(), disturbance.read(), disturbance.write(), pressure.read(), pressure.write(), divergence, curl]) {
        gl.deleteFramebuffer(target.fbo);
        gl.deleteTexture(target.texture);
      }
    };

    const ensureSim = () => {
      const bounds = canvas.getBoundingClientRect();
      const aspect = Math.max(bounds.width, 1) / Math.max(bounds.height, 1);
      const width = 176;
      const height = Math.max(88, Math.round(width / aspect));
      if (width === simW && height === simH) return;
      destroySim();
      simW = width;
      simH = height;
      velocity = createDouble(gl, simW, simH);
      disturbance = createDouble(gl, simW, simH);
      pressure = createDouble(gl, simW, simH);
      divergence = createTarget(gl, simW, simH);
      curl = createTarget(gl, simW, simH);
    };

    const blit = (program: WebGLProgram, destination: Target | null) => {
      if (destination) {
        gl.bindFramebuffer(gl.FRAMEBUFFER, destination.fbo);
        gl.viewport(0, 0, destination.width, destination.height);
      } else {
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
        gl.viewport(0, 0, canvas.width, canvas.height);
      }
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      void program;
    };

    const pointer = { x: 0.5, y: 0.5, lastX: 0.5, lastY: 0.5, dx: 0, dy: 0, moved: false, inside: false };
    const idle = { x: 0.5, y: 0.5 };
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      const y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      pointer.dx = x - pointer.x;
      pointer.dy = y - pointer.y;
      pointer.lastX = pointer.x;
      pointer.lastY = pointer.y;
      pointer.x = x;
      pointer.y = y;
      pointer.moved = true;
      pointer.inside = true;
    };
    const leave = () => {
      pointer.inside = false;
      pointer.moved = false;
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("pointerdown", move);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      ensureSim();
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let frame = 0;
    let disposed = false;
    let last = performance.now();
    let elapsed = 0;

    const splat = (x: number, y: number, dx: number, dy: number, power: number, radius: number) => {
      const ratio = simW / simH;
      bindProgram(programs.splat, velocity.texelX, velocity.texelY);
      gl.uniform1i(gl.getUniformLocation(programs.splat, "u_input"), 0);
      gl.uniform2f(gl.getUniformLocation(programs.splat, "u_point"), x, y);
      gl.uniform1f(gl.getUniformLocation(programs.splat, "u_radius"), radius);
      gl.uniform1f(gl.getUniformLocation(programs.splat, "u_ratio"), ratio);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      gl.uniform3f(gl.getUniformLocation(programs.splat, "u_value"), dx * 7.5, dy * 7.5, 0);
      blit(programs.splat, velocity.write());
      velocity.swap();
      gl.bindTexture(gl.TEXTURE_2D, disturbance.read().texture);
      gl.uniform3f(gl.getUniformLocation(programs.splat, "u_value"), power, 0, 0);
      blit(programs.splat, disturbance.write());
      disturbance.swap();
    };

    const render = (now: number) => {
      if (disposed) return;
      const current = settingsRef.current;
      const dt = Math.min(0.033, Math.max(0.008, (now - last) / 1000));
      last = now;
      elapsed += dt;
      const texelX = velocity.texelX;
      const texelY = velocity.texelY;

      if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
        mediaAspect = video.videoWidth / Math.max(video.videoHeight, 1);
        gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, 1);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        hasMedia = 1;
      }

      let sx = pointer.x;
      let sy = pointer.y;
      let sdx = pointer.dx;
      let sdy = pointer.dy;
      let shouldSplat = pointer.moved && (Math.abs(sdx) + Math.abs(sdy) > 0.0004);

      if (!pointer.inside && current.current !== "pointer") {
        const speed = current.current === "orbit" ? 0.85 : 0.42;
        const nextX = 0.5 + 0.26 * Math.sin(elapsed * speed);
        const nextY = 0.5 + 0.16 * Math.sin(elapsed * speed * 1.35 + 0.8);
        sdx = nextX - idle.x;
        sdy = nextY - idle.y;
        idle.x = nextX;
        idle.y = nextY;
        sx = nextX;
        sy = nextY;
        shouldSplat = true;
      }

      if (shouldSplat) {
        const dist = Math.hypot(sx - pointer.lastX, sy - pointer.lastY);
        const steps = Math.max(1, Math.min(8, Math.floor(dist / 0.014)));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          const px = pointer.lastX + (sx - pointer.lastX) * t;
          const py = pointer.lastY + (sy - pointer.lastY) * t;
          splat(px, py, sdx / steps, sdy / steps, current.cursorPower, current.cursorSize);
        }
        pointer.lastX = sx;
        pointer.lastY = sy;
        pointer.moved = false;
        pointer.dx = 0;
        pointer.dy = 0;
      }

      bindProgram(programs.advect, texelX, texelY);
      gl.uniform1i(gl.getUniformLocation(programs.advect, "u_velocity"), 0);
      gl.uniform1i(gl.getUniformLocation(programs.advect, "u_input"), 1);
      gl.uniform1f(gl.getUniformLocation(programs.advect, "u_dt"), dt);
      gl.uniform1f(gl.getUniformLocation(programs.advect, "u_dissipation"), current.dissipationVel);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      blit(programs.advect, velocity.write());
      velocity.swap();

      gl.uniform1f(gl.getUniformLocation(programs.advect, "u_dt"), dt * 1.8);
      gl.uniform1f(gl.getUniformLocation(programs.advect, "u_dissipation"), current.dissipationDist);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, disturbance.read().texture);
      blit(programs.advect, disturbance.write());
      disturbance.swap();

      bindProgram(programs.curl, texelX, texelY);
      gl.uniform1i(gl.getUniformLocation(programs.curl, "u_velocity"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      blit(programs.curl, curl);

      bindProgram(programs.vorticity, texelX, texelY);
      gl.uniform1i(gl.getUniformLocation(programs.vorticity, "u_velocity"), 0);
      gl.uniform1i(gl.getUniformLocation(programs.vorticity, "u_curl"), 1);
      gl.uniform1f(gl.getUniformLocation(programs.vorticity, "u_swirl"), current.swirl * 18.0);
      gl.uniform1f(gl.getUniformLocation(programs.vorticity, "u_dt"), dt);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, curl.texture);
      blit(programs.vorticity, velocity.write());
      velocity.swap();

      bindProgram(programs.divergence, texelX, texelY);
      gl.uniform1i(gl.getUniformLocation(programs.divergence, "u_velocity"), 0);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      blit(programs.divergence, divergence);

      bindProgram(programs.pressure, texelX, texelY);
      gl.uniform1i(gl.getUniformLocation(programs.pressure, "u_divergence"), 1);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, divergence.texture);
      for (let i = 0; i < 12; i += 1) {
        gl.uniform1i(gl.getUniformLocation(programs.pressure, "u_pressure"), 0);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, pressure.read().texture);
        blit(programs.pressure, pressure.write());
        pressure.swap();
      }

      bindProgram(programs.project, texelX, texelY);
      gl.uniform1i(gl.getUniformLocation(programs.project, "u_pressure"), 0);
      gl.uniform1i(gl.getUniformLocation(programs.project, "u_velocity"), 1);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, pressure.read().texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      blit(programs.project, velocity.write());
      velocity.swap();

      bindProgram(programs.display, texelX, texelY);
      gl.uniform1i(gl.getUniformLocation(programs.display, "u_disturbance"), 0);
      gl.uniform1i(gl.getUniformLocation(programs.display, "u_velocity"), 1);
      gl.uniform1i(gl.getUniformLocation(programs.display, "u_media"), 2);
      gl.uniform1i(gl.getUniformLocation(programs.display, "u_svg_mask"), 3);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, disturbance.read().texture);
      gl.activeTexture(gl.TEXTURE1);
      gl.bindTexture(gl.TEXTURE_2D, velocity.read().texture);
      gl.activeTexture(gl.TEXTURE2);
      gl.bindTexture(gl.TEXTURE_2D, mediaTexture);
      gl.activeTexture(gl.TEXTURE3);
      gl.bindTexture(gl.TEXTURE_2D, svgTexture);
      gl.uniform2f(gl.getUniformLocation(programs.display, "u_resolution"), canvas.width, canvas.height);
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_img_ratio"), mediaAspect);
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_svg_ratio"), svgAspect);
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_disturb_power"), current.distortion);
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_inner_scale"), 0.86);
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_softness"), current.softness);
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_gloss"), current.gloss);
      gl.uniform1i(gl.getUniformLocation(programs.display, "u_composition"), compositionIndex(current.composition));
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_has_media"), hasMedia);
      gl.uniform1f(gl.getUniformLocation(programs.display, "u_has_svg"), hasSvg);
      gl.uniform3fv(gl.getUniformLocation(programs.display, "u_background"), parseColor(current.colors.background));
      gl.uniform3fv(gl.getUniformLocation(programs.display, "u_bloom_a"), parseColor(current.colors.bloomA));
      gl.uniform3fv(gl.getUniformLocation(programs.display, "u_bloom_b"), parseColor(current.colors.bloomB));
      gl.uniform3fv(gl.getUniformLocation(programs.display, "u_bloom_c"), parseColor(current.colors.bloomC));
      gl.uniform3fv(gl.getUniformLocation(programs.display, "u_highlight"), parseColor(current.colors.highlight));
      blit(programs.display, null);

      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("pointerdown", move);
      if (image) image.onload = null;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      if (svgImage) svgImage.onload = null;
      if (svgUrl) URL.revokeObjectURL(svgUrl);
      destroySim();
      gl.deleteTexture(mediaTexture);
      gl.deleteTexture(svgTexture);
      gl.deleteBuffer(triangle);
      Object.values(programs).forEach((program) => gl.deleteProgram(program));
    };
  }, [mediaType, src, svgMask]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} />;
}
