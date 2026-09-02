"use client";

import { useEffect, useMemo, useRef } from "react";

export type SpecimenIndexStudy = "editorial" | "chromatic" | "material" | "exposure";
export type SpecimenIndexMode = "auto" | "pointer" | "pinned";
export type SpecimenIndexMediaType = "auto" | "image" | "video";
export type SpecimenIndexGeometry = "studio" | "chain" | "features" | "frames";

export type SpecimenIndexColors = {
  paper: string;
  ink: string;
  frame: string;
  accent: string;
  secondary: string;
};

export type SpecimenIndexSettings = {
  study: SpecimenIndexStudy;
  mode: SpecimenIndexMode;
  geometry: SpecimenIndexGeometry;
  probes: number;
  magnification: number;
  detail: number;
  frameWeight: number;
  connectors: number;
  grain: number;
  motion: number;
  response: number;
  geometryAmount: number;
  geometryDensity: number;
  geometryScale: number;
  pointerGeometry: number;
  colors: SpecimenIndexColors;
};

type Props = Partial<Omit<SpecimenIndexSettings, "colors">> & {
  src?: string;
  mediaType?: SpecimenIndexMediaType;
  colors?: Partial<SpecimenIndexColors>;
  settings?: SpecimenIndexSettings;
  className?: string;
  alt?: string;
};

const DEFAULT_COLORS: SpecimenIndexColors = {
  paper: "#F3F3EE",
  ink: "#050607",
  frame: "#FAFAF5",
  accent: "#7591FF",
  secondary: "#2E43F5",
};

const DEFAULT_SETTINGS: SpecimenIndexSettings = {
  study: "editorial",
  mode: "pointer",
  geometry: "studio",
  probes: 4,
  magnification: 1.38,
  detail: 0.78,
  frameWeight: 1,
  connectors: 0.86,
  grain: 0.18,
  motion: 0.24,
  response: 0.14,
  geometryAmount: 0.9,
  geometryDensity: 0.78,
  geometryScale: 0.84,
  pointerGeometry: 0.96,
  colors: DEFAULT_COLORS,
};

const PROBE_CENTERS = new Float32Array([
  0.62, 0.56,
  0.23, 0.34,
  0.20, 0.76,
  0.80, 0.25,
]);

const PROBE_SIZES = new Float32Array([
  0.30, 0.38,
  0.18, 0.18,
  0.16, 0.20,
  0.15, 0.15,
]);

const VERTEX = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;

uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform float u_sourceAspect;
uniform float u_time;
uniform float u_magnification;
uniform float u_detail;
uniform float u_frameWeight;
uniform float u_connectors;
uniform float u_grain;
uniform int u_study;
uniform int u_probeCount;
uniform vec2 u_probeCenters[4];
uniform vec2 u_probeSizes[4];
uniform vec2 u_probeSources[4];
uniform vec2 u_pointer;
uniform float u_pointerStrength;
uniform int u_geometry;
uniform float u_geometryAmount;
uniform float u_geometryDensity;
uniform float u_geometryScale;
uniform float u_pointerGeometry;
uniform int u_featureCount;
uniform vec2 u_featureNodes[24];
uniform float u_featureScores[24];
uniform vec3 u_paper;
uniform vec3 u_ink;
uniform vec3 u_frame;
uniform vec3 u_accent;
uniform vec3 u_secondary;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

vec2 coverUv(vec2 uv) {
  float viewportAspect = u_resolution.x / max(u_resolution.y, 1.0);
  if (viewportAspect > u_sourceAspect) {
    uv.y = 0.5 + (uv.y - 0.5) * (u_sourceAspect / viewportAspect);
  } else {
    uv.x = 0.5 + (uv.x - 0.5) * (viewportAspect / u_sourceAspect);
  }
  return clamp(uv, 0.001, 0.999);
}

vec3 sourceAt(vec2 uv) {
  return texture(u_source, coverUv(uv)).rgb;
}

float luminance(vec3 color) {
  return dot(color, vec3(0.299, 0.587, 0.114));
}

float sdRoundBox(vec2 point, vec2 halfSize, float radius) {
  vec2 q = abs(point) - halfSize + radius;
  return min(max(q.x, q.y), 0.0) + length(max(q, 0.0)) - radius;
}

float segmentDistance(vec2 point, vec2 start, vec2 end) {
  vec2 pa = point - start;
  vec2 ba = end - start;
  float h = clamp(dot(pa, ba) / max(dot(ba, ba), 0.00001), 0.0, 1.0);
  return length(pa - ba * h);
}

float ringMask(float distanceToCenter, float radius, float pixel) {
  return 1.0 - smoothstep(pixel * 0.62, pixel * 1.5, abs(distanceToCenter - radius));
}

float squareRing(vec2 point, float radius, float pixel) {
  float distanceToSquare = sdRoundBox(point, vec2(radius), radius * 0.08);
  return 1.0 - smoothstep(pixel * 0.62, pixel * 1.5, abs(distanceToSquare));
}

vec3 clarify(vec2 uv) {
  vec2 px = 1.4 / max(u_resolution, vec2(1.0));
  vec3 center = sourceAt(uv);
  vec3 surround = (
    sourceAt(uv + vec2(px.x, 0.0)) +
    sourceAt(uv - vec2(px.x, 0.0)) +
    sourceAt(uv + vec2(0.0, px.y)) +
    sourceAt(uv - vec2(0.0, px.y))
  ) * 0.25;
  return clamp(center + (center - surround) * (0.25 + u_detail * 1.15), 0.0, 1.0);
}

float edgeAt(vec2 uv) {
  vec2 px = 2.2 / max(u_resolution, vec2(1.0));
  float center = luminance(sourceAt(uv));
  float dx = luminance(sourceAt(uv + vec2(px.x, 0.0))) - luminance(sourceAt(uv - vec2(px.x, 0.0)));
  float dy = luminance(sourceAt(uv + vec2(0.0, px.y))) - luminance(sourceAt(uv - vec2(0.0, px.y)));
  float laplace = abs(center - luminance(sourceAt(uv + px))) + abs(center - luminance(sourceAt(uv - px)));
  return clamp(length(vec2(dx, dy)) * 4.6 + laplace * 2.2, 0.0, 1.0);
}

vec3 trueDetail(vec2 uv) {
  vec3 color = clarify(uv);
  float luma = luminance(color);
  color = mix(vec3(luma), color, 1.06 + u_detail * 0.22);
  return clamp(color, 0.0, 1.0);
}

vec3 colorProof(vec2 uv) {
  vec2 offset = vec2(1.8, -1.1) / max(u_resolution, vec2(1.0));
  vec3 registered = vec3(sourceAt(uv + offset).r, sourceAt(uv).g, sourceAt(uv - offset).b);
  float luma = luminance(registered);
  float bands = floor(luma * 5.0) / 4.0;
  vec3 proof = mix(u_ink, u_secondary, smoothstep(0.05, 0.48, bands));
  proof = mix(proof, u_accent, smoothstep(0.48, 0.9, bands));
  proof = mix(proof, registered, 0.3 + u_detail * 0.2);
  return clamp(proof, 0.0, 1.0);
}

vec3 structureStudy(vec2 uv) {
  vec3 source = sourceAt(uv);
  float luma = luminance(source);
  float edge = edgeAt(uv);
  vec3 paperTone = mix(u_paper, source, 0.12);
  vec3 structure = mix(paperTone, u_ink, smoothstep(0.08, 0.68, edge));
  structure = mix(structure, u_secondary, edge * 0.22);
  structure *= mix(0.88, 1.06, luma);
  return clamp(structure, 0.0, 1.0);
}

vec3 exposureStudy(vec2 uv) {
  vec3 source = clarify(uv);
  float luma = luminance(source);
  vec3 lifted = pow(max(source * 1.28, 0.0), vec3(0.86));
  vec3 printed = mix(u_ink, u_paper, smoothstep(0.18, 0.88, luma));
  return mix(printed, lifted, 0.62 + u_detail * 0.18);
}

vec3 baseTreatment(vec2 uv) {
  vec3 source = sourceAt(uv);
  float luma = luminance(source);
  float edge = edgeAt(uv);
  if (u_study == 1) {
    vec3 registered = vec3(
      sourceAt(uv + vec2(1.5, 0.0) / u_resolution).r,
      source.g,
      sourceAt(uv - vec2(1.5, 0.0) / u_resolution).b
    );
    float steps = floor(luminance(registered) * 6.0) / 5.0;
    vec3 proof = mix(u_ink, u_secondary, smoothstep(0.08, 0.54, steps));
    proof = mix(proof, u_accent, smoothstep(0.52, 0.96, steps));
    return mix(proof, registered, 0.24);
  }
  if (u_study == 2) {
    vec3 quiet = mix(u_paper, source, 0.2);
    return mix(quiet, u_ink, edge * 0.52);
  }
  if (u_study == 3) {
    float threshold = smoothstep(0.24, 0.76, luma);
    return mix(mix(u_ink, source, 0.12), mix(source, u_paper, 0.28), threshold);
  }
  vec3 monochrome = mix(u_ink, u_paper, smoothstep(0.07, 0.96, luma));
  return mix(monochrome, source, 0.16);
}

vec3 probeTreatment(int index, vec2 uv) {
  int treatment = (index + u_study) % 4;
  if (treatment == 0) return trueDetail(uv);
  if (treatment == 1) return colorProof(uv);
  if (treatment == 2) return structureStudy(uv);
  return exposureStudy(uv);
}

void main() {
  vec2 uv = v_uv;
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 aspectScale = vec2(aspect, 1.0);
  vec3 color = baseTreatment(uv);
  float veil = smoothstep(1.05, 0.16, length((uv - 0.5) * vec2(0.74, 1.0)));
  color *= mix(0.91, 1.025, veil);

  vec3 overlay = vec3(0.0);
  float overlayAmount = 0.0;
  for (int index = 0; index < 4; index++) {
    if (index >= u_probeCount) break;
    float arrival = smoothstep(float(index) * 0.17, float(index) * 0.17 + 0.42, min(u_time * 0.5, 1.4));
    vec2 center = u_probeCenters[index];
    vec2 halfSize = u_probeSizes[index] * 0.5;
    float distanceToBox = sdRoundBox(uv - center, halfSize, 0.006);
    float pixel = 1.0 / max(u_resolution.y, 1.0);
    float inside = (1.0 - smoothstep(-pixel, pixel, distanceToBox)) * arrival;
    float magnification = max(1.01, u_magnification + float(index) * 0.08);
    vec2 sampleUv = u_probeSources[index] + (uv - center) / magnification;
    vec3 sampleColor = probeTreatment(index, sampleUv);
    color = mix(color, sampleColor, inside);

    vec2 localBox = abs(uv - center);
    float edgeWidth = pixel * (0.42 + u_frameWeight * 0.48);
    float horizontalEdge = 1.0 - smoothstep(edgeWidth, edgeWidth + pixel * 0.8, abs(localBox.y - halfSize.y));
    float verticalEdge = 1.0 - smoothstep(edgeWidth, edgeWidth + pixel * 0.8, abs(localBox.x - halfSize.x));
    horizontalEdge *= 1.0 - step(halfSize.x + pixel * 1.8, localBox.x);
    verticalEdge *= 1.0 - step(halfSize.y + pixel * 1.8, localBox.y);
    float hairline = max(horizontalEdge, verticalEdge);
    float bracketLength = min(0.026, min(halfSize.x, halfSize.y) * 0.32);
    float cornerZoneX = smoothstep(halfSize.x - bracketLength, halfSize.x - bracketLength * 0.35, localBox.x);
    float cornerZoneY = smoothstep(halfSize.y - bracketLength, halfSize.y - bracketLength * 0.35, localBox.y);
    float brackets = max(horizontalEdge * cornerZoneX, verticalEdge * cornerZoneY);
    float frameStrength = index == 0 ? 0.74 : 0.48;
    float frame = max(hairline * 0.24, brackets * 0.86) * frameStrength;
    vec3 frameColor = index == 0 ? mix(u_frame, u_accent, 0.08) : mix(u_frame, u_paper, 0.12);
    overlay += frameColor * frame * arrival;
    overlayAmount = max(overlayAmount, frame * arrival);

    vec2 q = uv * aspectScale;
    vec2 sourcePoint = u_probeSources[index] * aspectScale;
    vec2 edgeTarget = vec2(
      center.x + sign(u_probeSources[index].x - center.x) * halfSize.x,
      clamp(u_probeSources[index].y, center.y - halfSize.y * 0.72, center.y + halfSize.y * 0.72)
    ) * aspectScale;
    float connectorDistance = segmentDistance(q, sourcePoint, edgeTarget);
    float connector = 1.0 - smoothstep(pixel * 0.55, pixel * 1.45, connectorDistance);
    float sourceRing = abs(length(q - sourcePoint) - pixel * 4.8);
    float ring = 1.0 - smoothstep(pixel * 0.65, pixel * 1.45, sourceRing);
    float crossH = (1.0 - smoothstep(pixel * 0.5, pixel * 1.2, abs(q.y - sourcePoint.y))) * (1.0 - step(pixel * 9.0, abs(q.x - sourcePoint.x)));
    float crossV = (1.0 - smoothstep(pixel * 0.5, pixel * 1.2, abs(q.x - sourcePoint.x))) * (1.0 - step(pixel * 9.0, abs(q.y - sourcePoint.y)));
    float annotation = max(connector * 0.54, max(ring, max(crossH, crossV)) * 0.82) * u_connectors * arrival;
    overlay += frameColor * annotation;
    overlayAmount = max(overlayAmount, annotation);

    vec2 corner = vec2(sign(uv.x - center.x) * halfSize.x, sign(uv.y - center.y) * halfSize.y);
    vec2 handlePoint = (uv - center - corner) * aspectScale;
    float handleDistance = sdRoundBox(handlePoint, vec2(pixel * 2.35), pixel * 0.42);
    float handleRing = 1.0 - smoothstep(pixel * 0.48, pixel * 1.18, abs(handleDistance));
    float handle = handleRing * arrival * (index == 0 ? 0.72 : 0.42);
    overlay += frameColor * handle;
    overlayAmount = max(overlayAmount, handle);
  }

  float geometryVisibility = u_geometry == 3 ? 0.0 : u_geometryAmount;
  float featureVisibility = u_geometry == 1 ? 0.14 : geometryVisibility;
  float chainVisibility = u_geometry == 2 ? 0.0 : geometryVisibility;
  if (u_geometry == 2) featureVisibility = geometryVisibility;
  if (u_geometry == 1) chainVisibility = geometryVisibility;

  vec2 geometryPoint = uv * aspectScale;
  vec3 geometryColor = mix(u_frame, u_accent, 0.1);
  int visibleFeatures = int(mix(6.0, 24.0, clamp(u_geometryDensity, 0.0, 1.0)) + 0.5);
  for (int index = 0; index < 24; index++) {
    if (index >= u_featureCount || index >= visibleFeatures) break;
    vec2 node = u_featureNodes[index] * aspectScale;
    float score = u_featureScores[index];
    float nodeRadius = (0.006 + score * 0.0145) * mix(0.65, 1.35, u_geometryScale);
    float nodeShape = index % 3 == 0
      ? squareRing(geometryPoint - node, nodeRadius, 1.0 / u_resolution.y)
      : ringMask(length(geometryPoint - node), nodeRadius, 1.0 / u_resolution.y);
    float nodeDot = 1.0 - smoothstep(1.1 / u_resolution.y, 2.2 / u_resolution.y, length(geometryPoint - node));

    vec2 anchor = u_probeSources[0] * aspectScale;
    float anchorDistance = distance(node, anchor);
    for (int probeIndex = 1; probeIndex < 4; probeIndex++) {
      if (probeIndex >= u_probeCount) break;
      vec2 candidate = u_probeSources[probeIndex] * aspectScale;
      float candidateDistance = distance(node, candidate);
      if (candidateDistance < anchorDistance) {
        anchor = candidate;
        anchorDistance = candidateDistance;
      }
    }
    float branchDistance = segmentDistance(geometryPoint, node, anchor);
    float branch = 1.0 - smoothstep(0.45 / u_resolution.y, 1.2 / u_resolution.y, branchDistance);
    float branchGate = smoothstep(0.58, 0.1, anchorDistance);
    float network = 0.0;
    if (index + 1 < u_featureCount && index + 1 < visibleFeatures) {
      vec2 nextNode = u_featureNodes[index + 1] * aspectScale;
      float networkLength = distance(node, nextNode);
      float networkDistance = segmentDistance(geometryPoint, node, nextNode);
      float networkLine = 1.0 - smoothstep(0.38 / u_resolution.y, 1.05 / u_resolution.y, networkDistance);
      network = networkLine * smoothstep(0.46, 0.12, networkLength) * 0.38;
    }
    float feature = max(nodeShape * 0.94, max(nodeDot, max(branch * branchGate * 0.56, network)));
    feature *= featureVisibility * smoothstep(0.0, 0.7, min(u_time * 0.38 - float(index) * 0.035, 1.0));
    vec3 nodeColor = index % 4 == 0 ? mix(geometryColor, u_secondary, 0.22) : geometryColor;
    overlay += nodeColor * feature;
    overlayAmount = max(overlayAmount, feature);
  }

  vec2 livePoint = mix(u_probeSources[0], u_pointer, u_pointerStrength) * aspectScale;
  float chainAngle = 0.58 + sin(u_time * 0.18) * 0.055;
  vec2 chainDirection = vec2(cos(chainAngle), sin(chainAngle));
  vec2 chainNormal = vec2(-chainDirection.y, chainDirection.x);
  float chainScale = mix(0.68, 1.28, u_geometryScale);
  float baseRadius = 0.062 * chainScale;
  float spacing = baseRadius * 0.7;
  float chainOverlay = 0.0;
  for (int index = 0; index < 7; index++) {
    float offsetIndex = float(index) - 3.0;
    float radius = baseRadius * pow(0.78, abs(offsetIndex));
    vec2 circleCenter = livePoint + chainDirection * offsetIndex * spacing;
    float circle = ringMask(length(geometryPoint - circleCenter), radius, 1.0 / u_resolution.y);
    chainOverlay = max(chainOverlay, circle * mix(0.4, 0.84, 1.0 - abs(offsetIndex) / 4.0));
    if (index < 6) {
      float nextOffset = offsetIndex + 1.0;
      float nextRadius = baseRadius * pow(0.78, abs(nextOffset));
      vec2 nextCenter = livePoint + chainDirection * nextOffset * spacing;
      float along = (radius * radius - nextRadius * nextRadius + spacing * spacing) / max(2.0 * spacing, 0.0001);
      float height = sqrt(max(radius * radius - along * along, 0.0));
      vec2 intersectionA = circleCenter + chainDirection * along + chainNormal * height;
      vec2 intersectionB = circleCenter + chainDirection * along - chainNormal * height;
      float markerA = 1.0 - smoothstep(1.2 / u_resolution.y, 2.8 / u_resolution.y, length(geometryPoint - intersectionA));
      float markerB = 1.0 - smoothstep(1.2 / u_resolution.y, 2.8 / u_resolution.y, length(geometryPoint - intersectionB));
      chainOverlay = max(chainOverlay, max(markerA, markerB));
    }
  }
  float liveCrossH = (1.0 - smoothstep(0.5 / u_resolution.y, 1.15 / u_resolution.y, abs(geometryPoint.y - livePoint.y))) * (1.0 - step(baseRadius * 1.38, abs(geometryPoint.x - livePoint.x)));
  float liveCrossV = (1.0 - smoothstep(0.5 / u_resolution.y, 1.15 / u_resolution.y, abs(geometryPoint.x - livePoint.x))) * (1.0 - step(baseRadius * 1.38, abs(geometryPoint.y - livePoint.y)));
  chainOverlay = max(chainOverlay, max(liveCrossH, liveCrossV) * 0.7);
  chainOverlay *= chainVisibility * u_pointerGeometry * smoothstep(0.08, 0.72, min(u_time * 0.42, 1.0));
  overlay += geometryColor * chainOverlay;
  overlayAmount = max(overlayAmount, chainOverlay);

  color = mix(color, overlay / max(overlayAmount, 0.0001), clamp(overlayAmount, 0.0, 1.0));
  float noise = hash(gl_FragCoord.xy + floor(u_time * 12.0)) - 0.5;
  color += noise * u_grain * 0.055;
  outColor = vec4(clamp(color, 0.0, 1.0), 1.0);
}`;

function parseColor(hex: string) {
  const source = hex.replace("#", "");
  const normalized = source.length === 3 ? source.split("").map((character) => character + character).join("") : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return new Float32Array([((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create the Specimen Index shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function drawFallback(canvas: HTMLCanvasElement, colors: SpecimenIndexColors) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const gradient = context.createLinearGradient(0, 0, canvas.width, canvas.height);
  gradient.addColorStop(0, colors.paper);
  gradient.addColorStop(0.48, "#838878");
  gradient.addColorStop(1, colors.ink);
  context.fillStyle = gradient;
  context.fillRect(0, 0, canvas.width, canvas.height);
}

function analyzeFeatures(source: CanvasImageSource) {
  const width = 72;
  const height = 48;
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return null;
  try {
    context.drawImage(source, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const lumaAt = (x: number, y: number) => {
      const offset = (Math.max(0, Math.min(height - 1, y)) * width + Math.max(0, Math.min(width - 1, x))) * 4;
      return (pixels[offset] * 0.299 + pixels[offset + 1] * 0.587 + pixels[offset + 2] * 0.114) / 255;
    };
    const candidates: Array<{ x: number; y: number; score: number }> = [];
    for (let y = 4; y < height - 4; y += 4) {
      for (let x = 4; x < width - 4; x += 4) {
        const offset = (y * width + x) * 4;
        const maximum = Math.max(pixels[offset], pixels[offset + 1], pixels[offset + 2]) / 255;
        const minimum = Math.min(pixels[offset], pixels[offset + 1], pixels[offset + 2]) / 255;
        const contrast = Math.abs(lumaAt(x + 3, y) - lumaAt(x - 3, y)) + Math.abs(lumaAt(x, y + 3) - lumaAt(x, y - 3));
        const diagonal = Math.abs(lumaAt(x + 2, y + 2) - lumaAt(x - 2, y - 2));
        candidates.push({ x: x / width, y: 1 - y / height, score: contrast * 0.72 + diagonal * 0.2 + (maximum - minimum) * 0.22 });
      }
    }
    candidates.sort((a, b) => b.score - a.score);
    const selected: typeof candidates = [];
    for (const candidate of candidates) {
      if (selected.every((point) => Math.hypot(candidate.x - point.x, candidate.y - point.y) > 0.105)) selected.push(candidate);
      if (selected.length === 24) break;
    }
    const maximumScore = Math.max(...selected.map((point) => point.score), 0.001);
    return {
      nodes: new Float32Array(selected.flatMap((point) => [point.x, point.y])),
      scores: new Float32Array(selected.map((point) => Math.max(0.18, Math.min(1, point.score / maximumScore)))),
      count: selected.length,
    };
  } catch {
    return null;
  }
}

export function SpecimenIndex({
  src = "/specimen-index-flax.png",
  mediaType = "auto",
  colors,
  settings,
  className,
  alt = "An image study with connected optical sampling windows",
  ...overrides
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolved = useMemo<SpecimenIndexSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...overrides,
    ...settings,
    colors: { ...DEFAULT_COLORS, ...colors, ...settings?.colors },
  }), [colors, overrides, settings]);
  const settingsRef = useRef(resolved);
  useEffect(() => { settingsRef.current = resolved; }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: true, powerPreference: "high-performance" });
    if (!gl) return;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex);
    gl.attachShader(program, fragment);
    gl.linkProgram(program);
    gl.deleteShader(vertex);
    gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link the Specimen Index shader.");
    }

    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fallback = document.createElement("canvas");
    fallback.width = 1200;
    fallback.height = 800;
    drawFallback(fallback, settingsRef.current.colors);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fallback);

    let sourceAspect = 1.5;
    let featureCount = 24;
    const featureNodes = new Float32Array([
      0.24, 0.72, 0.38, 0.62, 0.56, 0.74, 0.72, 0.66,
      0.82, 0.49, 0.64, 0.39, 0.47, 0.29, 0.29, 0.36,
      0.16, 0.52, 0.76, 0.25, 0.53, 0.53, 0.88, 0.72,
      0.44, 0.84, 0.59, 0.87, 0.69, 0.80, 0.86, 0.60,
      0.67, 0.17, 0.42, 0.18, 0.34, 0.48, 0.91, 0.36,
      0.12, 0.28, 0.57, 0.45, 0.73, 0.55, 0.25, 0.89,
    ]);
    const featureScores = new Float32Array([
      0.9, 0.74, 0.82, 0.66, 0.78, 0.62, 0.86, 0.58, 0.7, 0.72, 0.64, 0.56,
      0.76, 0.68, 0.72, 0.6, 0.82, 0.54, 0.7, 0.58, 0.66, 0.74, 0.62, 0.56,
    ]);
    const updateFeatures = (source: CanvasImageSource) => {
      const analysis = analyzeFeatures(source);
      if (!analysis) return;
      featureNodes.fill(0);
      featureScores.fill(0);
      featureNodes.set(analysis.nodes.slice(0, featureNodes.length));
      featureScores.set(analysis.scores.slice(0, featureScores.length));
      featureCount = analysis.count;
    };
    let image: HTMLImageElement | null = null;
    let video: HTMLVideoElement | null = null;
    const inferredVideo = mediaType === "video" || (mediaType === "auto" && Boolean(src?.match(/\.(mp4|webm|mov)(\?|$)/i)));
    if (src && inferredVideo) {
      video = document.createElement("video");
      video.crossOrigin = "anonymous";
      video.muted = true;
      video.loop = true;
      video.playsInline = true;
      video.src = src;
      video.addEventListener("loadeddata", () => {
        sourceAspect = video!.videoWidth / Math.max(video!.videoHeight, 1);
        updateFeatures(video!);
        void video!.play().catch(() => undefined);
      }, { once: true });
    } else if (src) {
      image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        sourceAspect = image!.naturalWidth / Math.max(image!.naturalHeight, 1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image!);
        updateFeatures(image!);
      };
      image.src = src;
    }

    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      source: uniform("u_source"),
      resolution: uniform("u_resolution"),
      sourceAspect: uniform("u_sourceAspect"),
      time: uniform("u_time"),
      magnification: uniform("u_magnification"),
      detail: uniform("u_detail"),
      frameWeight: uniform("u_frameWeight"),
      connectors: uniform("u_connectors"),
      grain: uniform("u_grain"),
      study: uniform("u_study"),
      probeCount: uniform("u_probeCount"),
      probeCenters: uniform("u_probeCenters[0]"),
      probeSizes: uniform("u_probeSizes[0]"),
      probeSources: uniform("u_probeSources[0]"),
      pointer: uniform("u_pointer"),
      pointerStrength: uniform("u_pointerStrength"),
      geometry: uniform("u_geometry"),
      geometryAmount: uniform("u_geometryAmount"),
      geometryDensity: uniform("u_geometryDensity"),
      geometryScale: uniform("u_geometryScale"),
      pointerGeometry: uniform("u_pointerGeometry"),
      featureCount: uniform("u_featureCount"),
      featureNodes: uniform("u_featureNodes[0]"),
      featureScores: uniform("u_featureScores[0]"),
      paper: uniform("u_paper"),
      ink: uniform("u_ink"),
      frame: uniform("u_frame"),
      accent: uniform("u_accent"),
      secondary: uniform("u_secondary"),
    };
    gl.uniform1i(uniforms.source, 0);

    const target = { x: 0.55, y: 0.54, strength: 0, pinned: false };
    const pointer = { x: target.x, y: target.y, strength: 0 };
    const probeCenters = new Float32Array(PROBE_CENTERS);
    const probeSources = new Float32Array([0.61, 0.61, 0.43, 0.63, 0.68, 0.48, 0.60, 0.76]);
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const nextX = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      const nextY = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      if (!target.pinned || settingsRef.current.mode === "pinned") {
        target.x = nextX;
        target.y = nextY;
      }
      target.strength = 1;
    };
    const leave = () => { target.strength = 0; };
    const activate = (event?: PointerEvent) => {
      const current = settingsRef.current;
      if (current.mode === "auto") return;
      if (event) {
        const bounds = canvas.getBoundingClientRect();
        target.x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
        target.y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      }
      target.pinned = current.mode === "pinned" ? true : !target.pinned;
      target.strength = 1;
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        activate();
      }
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("click", activate);
    canvas.addEventListener("keydown", keydown);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let frame = 0;
    let disposed = false;
    const started = performance.now();
    const render = (now: number) => {
      if (disposed) return;
      const current = settingsRef.current;
      const elapsed = (now - started) / 1000;
      const response = Math.max(0.025, Math.min(0.28, current.response));
      pointer.x += (target.x - pointer.x) * response;
      pointer.y += (target.y - pointer.y) * response;
      pointer.strength += (target.strength - pointer.strength) * response;

      const drift = current.motion * 0.035;
      const frameDrift = current.motion * 0.012;
      probeCenters[0] = 0.62 + Math.sin(elapsed * 0.17) * frameDrift;
      probeCenters[1] = 0.56 + Math.cos(elapsed * 0.14) * frameDrift;
      probeCenters[2] = 0.23 + Math.sin(elapsed * 0.13 + 1.4) * frameDrift;
      probeCenters[3] = 0.34 + Math.cos(elapsed * 0.16 + 2.1) * frameDrift;
      probeCenters[4] = 0.20 + Math.sin(elapsed * 0.12 + 3.2) * frameDrift;
      probeCenters[5] = 0.76 + Math.cos(elapsed * 0.15 + 0.8) * frameDrift;
      probeCenters[6] = 0.80 + Math.sin(elapsed * 0.15 + 2.7) * frameDrift;
      probeCenters[7] = 0.25 + Math.cos(elapsed * 0.11 + 1.8) * frameDrift;
      if (current.mode === "auto") {
        probeSources[0] = 0.61 + Math.sin(elapsed * 0.31) * drift * 1.4;
        probeSources[1] = 0.61 + Math.cos(elapsed * 0.27) * drift;
      } else {
        const influence = current.mode === "pinned" || target.pinned ? 1 : pointer.strength;
        probeSources[0] += (pointer.x - probeSources[0]) * response * influence;
        probeSources[1] += (pointer.y - probeSources[1]) * response * influence;
      }
      probeSources[2] = 0.43 + Math.sin(elapsed * 0.22 + 1.7) * drift;
      probeSources[3] = 0.63 + Math.cos(elapsed * 0.19 + 0.4) * drift;
      probeSources[4] = 0.68 + Math.sin(elapsed * 0.17 + 3.2) * drift;
      probeSources[5] = 0.48 + Math.cos(elapsed * 0.21 + 2.3) * drift;
      probeSources[6] = 0.60 + Math.sin(elapsed * 0.25 + 0.9) * drift;
      probeSources[7] = 0.76 + Math.cos(elapsed * 0.18 + 1.1) * drift;

      if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
        sourceAspect = video.videoWidth / Math.max(video.videoHeight, 1);
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform1f(uniforms.sourceAspect, sourceAspect);
      gl.uniform1f(uniforms.time, elapsed);
      gl.uniform1f(uniforms.magnification, current.magnification);
      gl.uniform1f(uniforms.detail, current.detail);
      gl.uniform1f(uniforms.frameWeight, current.frameWeight);
      gl.uniform1f(uniforms.connectors, current.connectors);
      gl.uniform1f(uniforms.grain, current.grain);
      gl.uniform1i(uniforms.study, current.study === "chromatic" ? 1 : current.study === "material" ? 2 : current.study === "exposure" ? 3 : 0);
      gl.uniform1i(uniforms.probeCount, Math.max(1, Math.min(4, Math.round(current.probes))));
      gl.uniform2fv(uniforms.probeCenters, probeCenters);
      gl.uniform2fv(uniforms.probeSizes, PROBE_SIZES);
      gl.uniform2fv(uniforms.probeSources, probeSources);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.pointerStrength, pointer.strength);
      gl.uniform1i(uniforms.geometry, current.geometry === "chain" ? 1 : current.geometry === "features" ? 2 : current.geometry === "frames" ? 3 : 0);
      gl.uniform1f(uniforms.geometryAmount, current.geometryAmount);
      gl.uniform1f(uniforms.geometryDensity, current.geometryDensity);
      gl.uniform1f(uniforms.geometryScale, current.geometryScale);
      gl.uniform1f(uniforms.pointerGeometry, current.pointerGeometry);
      gl.uniform1i(uniforms.featureCount, featureCount);
      gl.uniform2fv(uniforms.featureNodes, featureNodes);
      gl.uniform1fv(uniforms.featureScores, featureScores);
      gl.uniform3fv(uniforms.paper, parseColor(current.colors.paper));
      gl.uniform3fv(uniforms.ink, parseColor(current.colors.ink));
      gl.uniform3fv(uniforms.frame, parseColor(current.colors.frame));
      gl.uniform3fv(uniforms.accent, parseColor(current.colors.accent));
      gl.uniform3fv(uniforms.secondary, parseColor(current.colors.secondary));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      canvas.removeEventListener("click", activate);
      canvas.removeEventListener("keydown", keydown);
      if (image) image.onload = null;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      gl.deleteTexture(texture);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(program);
    };
  }, [mediaType, src]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} tabIndex={0} />;
}
