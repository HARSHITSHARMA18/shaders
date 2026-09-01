"use client";

import { useEffect, useMemo, useRef } from "react";

export type RefractiveLensShape = "rounded" | "circle" | "svg";
export type RefractiveLensMode = "static" | "pointer";
export type RefractiveLensMediaType = "auto" | "image" | "video";

export type RefractiveLensPalette =
  | "spectral"
  | "crystal"
  | "obsidian"
  | "amber"
  | "emerald"
  | "glacier"
  | "amethyst"
  | "rose";

export type RefractiveLensPaletteColors = {
  glassTint: string;
  tintStrength: number;
};

export const REFRACTIVE_LENS_PALETTES: Record<
  RefractiveLensPalette,
  RefractiveLensPaletteColors
> = {
  spectral: { glassTint: "#F8FFF8", tintStrength: 0.06 },
  crystal: { glassTint: "#FFFFFF", tintStrength: 0.02 },
  obsidian: { glassTint: "#1E2838", tintStrength: 0.34 },
  amber: { glassTint: "#F5C78E", tintStrength: 0.22 },
  emerald: { glassTint: "#85D3B2", tintStrength: 0.20 },
  glacier: { glassTint: "#79C7E3", tintStrength: 0.22 },
  amethyst: { glassTint: "#C084FC", tintStrength: 0.24 },
  rose: { glassTint: "#F5A3B7", tintStrength: 0.20 },
};

export type RefractiveLensSettings = {
  shape: RefractiveLensShape;
  mode: RefractiveLensMode;
  size: number;
  radius: number;
  refraction: number;
  magnification: number;
  frost: number;
  thickness: number;
  dispersion: number;
  glassTint: string;
  tintStrength: number;
  follow: number;
  position: [number, number];
};

type Props = Partial<RefractiveLensSettings> & {
  src?: string;
  mediaType?: RefractiveLensMediaType;
  svgMask?: string;
  palette?: RefractiveLensPalette;
  settings?: RefractiveLensSettings;
  className?: string;
  alt?: string;
};

export const DEFAULT_REFRACTIVE_LENS_SVG = `<svg viewBox="0 0 64 38" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 20.1032H39.8387C44.7808 20.1032 48.7871 24.1095 48.7871 29.0516C48.7871 33.9937 44.7808 38 39.8387 38H0V20.1032Z" fill="white"/>
  <path d="M63.4968 17.8968H23.6581C18.716 17.8968 14.7097 13.8904 14.7097 8.94839C14.7097 4.00633 18.716 0 23.6581 0H63.4968V17.8968Z" fill="white"/>
</svg>`;

const DEFAULT_SETTINGS: RefractiveLensSettings = {
  shape: "circle",
  mode: "pointer",
  size: 0.56,
  radius: 0.74,
  refraction: 1.28,
  magnification: 0.82,
  frost: 0.04,
  thickness: 0.78,
  dispersion: 0.8,
  glassTint: "#F8FFF8",
  tintStrength: 0.06,
  follow: 0.08,
  position: [0.5, 0.5],
};

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
uniform sampler2D u_mask;
uniform vec2 u_resolution;
uniform vec2 u_lensCenter;
uniform float u_active;
uniform float u_sourceAspect;
uniform float u_size;
uniform float u_radius;
uniform float u_refraction;
uniform float u_magnification;
uniform float u_frost;
uniform float u_thickness;
uniform float u_dispersion;
uniform float u_tintStrength;
uniform int u_shape;
uniform float u_hasMask;
uniform float u_maskAspect;
uniform vec3 u_glass;

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

float sdRoundedBox(vec2 p, vec2 b, float r) {
  vec2 q = abs(p) - b + r;
  return length(max(q, 0.0)) + min(max(q.x, q.y), 0.0) - r;
}

float builtInDistance(vec2 p, vec2 halfSize) {
  if (u_shape == 1) return length(p) - halfSize.y;
  float corner = mix(0.018, halfSize.y * 0.98, clamp(u_radius, 0.0, 1.0));
  return sdRoundedBox(p, halfSize, corner);
}

float svgMaskAt(vec2 p, vec2 halfSize) {
  vec2 uv = p / (halfSize * 2.0) + 0.5;
  float bounds = step(0.0, uv.x) * step(uv.x, 1.0) * step(0.0, uv.y) * step(uv.y, 1.0);
  return texture(u_mask, clamp(uv, 0.001, 0.999)).a * bounds;
}

float lensMaskAt(vec2 p, vec2 halfSize, float aa) {
  if (u_shape == 2 && u_hasMask > 0.5) return smoothstep(0.42, 0.58, svgMaskAt(p, halfSize));
  return 1.0 - smoothstep(-aa, aa, builtInDistance(p, halfSize));
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (v_uv - u_lensCenter) * vec2(aspect, 1.0);
  vec2 svgHalfSize = u_maskAspect >= 1.0
    ? vec2(u_size * 0.52, u_size * 0.52 / max(u_maskAspect, 0.001))
    : vec2(u_size * 0.52 * u_maskAspect, u_size * 0.52);
  vec2 halfSize = u_shape == 0
    ? vec2(u_size * 0.78, u_size * 0.48)
    : u_shape == 2 ? svgHalfSize : vec2(u_size * 0.52);
  float aa = 2.0 / max(min(u_resolution.x, u_resolution.y), 1.0);

  float distanceField = builtInDistance(p, halfSize);
  float mask = lensMaskAt(p, halfSize, aa);
  float epsilon = 0.0025;
  vec2 normal;
  float edge;
  if (u_shape == 2 && u_hasMask > 0.5) {
    float left = svgMaskAt(p - vec2(epsilon, 0.0), halfSize);
    float right = svgMaskAt(p + vec2(epsilon, 0.0), halfSize);
    float down = svgMaskAt(p - vec2(0.0, epsilon), halfSize);
    float up = svgMaskAt(p + vec2(0.0, epsilon), halfSize);
    normal = normalize(vec2(left - right, down - up) + normalize(p + vec2(0.0001)) * 0.08);
    edge = clamp(length(vec2(right - left, up - down)) * 4.5, 0.0, 1.0);
  } else {
    float dx = builtInDistance(p + vec2(epsilon, 0.0), halfSize) - builtInDistance(p - vec2(epsilon, 0.0), halfSize);
    float dy = builtInDistance(p + vec2(0.0, epsilon), halfSize) - builtInDistance(p - vec2(0.0, epsilon), halfSize);
    normal = normalize(vec2(dx, dy) + vec2(0.0001));
    edge = exp(-abs(distanceField) * 42.0 / max(u_size, 0.1));
  }

  vec2 normalizedP = p / max(halfSize, vec2(0.001));
  float radial = u_shape == 1
    ? clamp(length(normalizedP), 0.0, 1.0)
    : clamp(max(abs(normalizedP.x), abs(normalizedP.y)), 0.0, 1.0);
  float curvature = pow(smoothstep(0.18, 1.0, radial), 3.0) * mask;
  float opticalEdge = clamp(pow(edge, 2.2) * 0.74 + curvature * 0.44, 0.0, 1.0);
  vec2 centeredUv = u_lensCenter + (v_uv - u_lensCenter) * (1.0 - u_magnification * 0.075);
  vec2 displacement = normal / vec2(aspect, 1.0)
    * u_refraction * (0.0015 + opticalEdge * 0.0105) * (0.96 + u_active * 0.04);
  vec2 refractedUv = centeredUv - displacement;

  float blur = u_frost * 0.0045;
  vec2 bx = vec2(blur / max(aspect, 0.6), 0.0);
  vec2 by = vec2(0.0, blur);
  vec3 lensColor = sourceAt(refractedUv) * 0.46;
  lensColor += sourceAt(refractedUv + bx) * 0.135;
  lensColor += sourceAt(refractedUv - bx) * 0.135;
  lensColor += sourceAt(refractedUv + by) * 0.135;
  lensColor += sourceAt(refractedUv - by) * 0.135;

  vec2 chroma = normal / vec2(aspect, 1.0) * u_dispersion * pow(opticalEdge, 1.5) * 0.0022;
  lensColor.r = sourceAt(refractedUv + chroma).r;
  lensColor.b = sourceAt(refractedUv - chroma).b;
  lensColor = (lensColor - 0.5) * 1.018 + 0.5;

  vec2 lightDirection = normalize(vec2(-0.72, 0.7));
  float rim = pow(edge, 2.8);
  float upperLight = pow(max(dot(normal, lightDirection), 0.0), 3.0) * rim;
  float lowerShade = pow(max(dot(normal, -lightDirection), 0.0), 2.2) * rim;
  float caustic = pow(max(dot(normal, -lightDirection), 0.0), 5.0) * rim * mask;
  lensColor = mix(lensColor, lensColor * u_glass, u_tintStrength * 0.62);
  lensColor = mix(lensColor, u_glass, u_tintStrength * (0.08 + u_frost * 0.18));
  lensColor += u_glass * upperLight * u_thickness * 0.15;
  lensColor += u_glass * caustic * u_thickness * 0.045;
  lensColor *= 1.0 - lowerShade * u_thickness * 0.055;

  vec3 base = sourceAt(v_uv);
  vec2 shadowOffset = vec2(-0.006 / max(aspect, 0.6), 0.009);
  vec2 shadowP = (v_uv - shadowOffset - u_lensCenter) * vec2(aspect, 1.0);
  float shadow;
  if (u_shape == 2 && u_hasMask > 0.5) {
    float shadowMask = lensMaskAt(shadowP, halfSize * 1.018, aa * 2.0);
    shadow = max(0.0, shadowMask - mask);
  } else {
    float shadowDistance = builtInDistance(shadowP, halfSize);
    float castShadow = (1.0 - smoothstep(0.0, 0.035, shadowDistance)) * (1.0 - mask);
    float contactShadow = (1.0 - smoothstep(0.0, 0.018, distanceField)) * (1.0 - mask);
    shadow = max(castShadow * 0.72, contactShadow * 0.38);
  }
  base *= 1.0 - shadow * u_thickness * 0.07;

  vec3 color = mix(base, lensColor, mask);
  float hairline = rim * mask;
  color = mix(color, u_glass, hairline * (0.025 + upperLight * 0.11));
  outColor = vec4(color, 1.0);
}`;

function parseColor(hex: string) {
  const source = hex.replace("#", "");
  const normalized = source.length === 3 ? source.split("").map((c) => c + c).join("") : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return new Float32Array([((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create refractive lens shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function drawPoster(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.fillStyle = "#EAE9E3";
  ctx.fillRect(0, 0, width, height);
  ctx.strokeStyle = "rgba(23, 25, 21, 0.09)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 100) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke(); }
  for (let y = 0; y <= height; y += 100) { ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke(); }
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

export function RefractiveLens({
  src = "/solaceui-renaissance.webp",
  mediaType = "auto",
  svgMask = DEFAULT_REFRACTIVE_LENS_SVG,
  palette,
  settings,
  className,
  alt = "Interactive refractive glass lens over an editorial composition",
  ...overrides
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolved = useMemo<RefractiveLensSettings>(() => {
    const paletteDefaults = palette ? REFRACTIVE_LENS_PALETTES[palette] : undefined;
    return {
      ...DEFAULT_SETTINGS,
      ...paletteDefaults,
      ...overrides,
      ...settings,
      position: overrides.position ?? settings?.position ?? DEFAULT_SETTINGS.position,
    };
  }, [overrides, palette, settings]);
  const settingsRef = useRef(resolved);

  useEffect(() => { settingsRef.current = resolved; }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (src) {
      canvas.style.backgroundImage = `url(${JSON.stringify(src).slice(1, -1)})`;
      canvas.style.backgroundPosition = "center";
      canvas.style.backgroundSize = "cover";
    }
    const gl = canvas.getContext("webgl2", { alpha: true, antialias: false, powerPreference: "high-performance" });
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
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link refractive lens shader.");

    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const positionAttribute = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(positionAttribute);
    gl.vertexAttribPointer(positionAttribute, 2, gl.FLOAT, false, 0, 0);

    const sourceTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0);
    gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const poster = document.createElement("canvas");
    poster.width = 1600;
    poster.height = 1000;
    drawPoster(poster);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);

    const maskTexture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE1);
    gl.bindTexture(gl.TEXTURE_2D, maskTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255, 255]));

    let sourceAspect = 1.6;
    let sourceReady = !src;
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
        sourceReady = true;
        canvas.style.backgroundImage = "none";
        void video!.play().catch(() => undefined);
      }, { once: true });
    } else if (src) {
      image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        sourceAspect = image!.naturalWidth / Math.max(image!.naturalHeight, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image!);
        sourceReady = true;
        canvas.style.backgroundImage = "none";
      };
      image.src = src;
    }

    let hasMask = 0;
    let maskAspect = 64 / 38;
    let maskUrl = "";
    let maskImage: HTMLImageElement | null = null;
    if (svgMask) {
      const safeSvg = sanitizeSvg(svgMask);
      if (safeSvg) {
        maskAspect = readSvgAspect(safeSvg);
        maskUrl = URL.createObjectURL(new Blob([safeSvg], { type: "image/svg+xml" }));
        maskImage = new Image();
        maskImage.onload = () => {
          hasMask = 1;
          gl.activeTexture(gl.TEXTURE1);
          gl.bindTexture(gl.TEXTURE_2D, maskTexture);
          gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, maskImage!);
        };
        maskImage.src = maskUrl;
      }
    }

    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      source: uniform("u_source"), mask: uniform("u_mask"), resolution: uniform("u_resolution"), lensCenter: uniform("u_lensCenter"),
      active: uniform("u_active"), sourceAspect: uniform("u_sourceAspect"), size: uniform("u_size"), radius: uniform("u_radius"),
      refraction: uniform("u_refraction"), magnification: uniform("u_magnification"), frost: uniform("u_frost"), thickness: uniform("u_thickness"),
      dispersion: uniform("u_dispersion"), tintStrength: uniform("u_tintStrength"), shape: uniform("u_shape"), hasMask: uniform("u_hasMask"), maskAspect: uniform("u_maskAspect"), glass: uniform("u_glass"),
    };
    gl.uniform1i(uniforms.source, 0);
    gl.uniform1i(uniforms.mask, 1);

    const target = { x: settingsRef.current.position[0], y: settingsRef.current.position[1], active: 0 };
    const lens = { ...target };
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const current = settingsRef.current;
      const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      const y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      if (current.mode === "pointer") { target.x = x; target.y = y; }
      target.active = 1;
    };
    const leave = () => {
      const current = settingsRef.current;
      target.active = 0;
      if (current.mode === "pointer") { target.x = current.position[0]; target.y = current.position[1]; }
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 1.75);
      const width = Math.max(1, Math.round(bounds.width * ratio));
      const height = Math.max(1, Math.round(bounds.height * ratio));
      if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    let frame = 0;
    let disposed = false;
    const render = () => {
      if (disposed) return;
      const current = settingsRef.current;
      const ease = 0.035 + current.follow * 0.13;
      lens.x += (target.x - lens.x) * ease;
      lens.y += (target.y - lens.y) * ease;
      lens.active += (target.active - lens.active) * 0.09;
      if (current.mode === "static") { lens.x += (current.position[0] - lens.x) * 0.12; lens.y += (current.position[1] - lens.y) * 0.12; }
      if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
        sourceAspect = video.videoWidth / Math.max(video.videoHeight, 1);
        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
      }
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, sourceTexture);
      gl.activeTexture(gl.TEXTURE1); gl.bindTexture(gl.TEXTURE_2D, maskTexture);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.lensCenter, lens.x, lens.y);
      gl.uniform1f(uniforms.active, lens.active);
      gl.uniform1f(uniforms.sourceAspect, sourceAspect);
      gl.uniform1f(uniforms.size, current.size);
      gl.uniform1f(uniforms.radius, current.radius);
      gl.uniform1f(uniforms.refraction, current.refraction);
      gl.uniform1f(uniforms.magnification, current.magnification);
      gl.uniform1f(uniforms.frost, current.frost);
      gl.uniform1f(uniforms.thickness, current.thickness);
      gl.uniform1f(uniforms.dispersion, current.dispersion);
      gl.uniform1f(uniforms.tintStrength, current.tintStrength);
      gl.uniform1i(uniforms.shape, current.shape === "circle" ? 1 : current.shape === "svg" ? 2 : 0);
      gl.uniform1f(uniforms.hasMask, hasMask);
      gl.uniform1f(uniforms.maskAspect, maskAspect);
      gl.uniform3fv(uniforms.glass, parseColor(current.glassTint));
      if (sourceReady) gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      if (image) image.onload = null;
      if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      if (maskImage) maskImage.onload = null;
      if (maskUrl) URL.revokeObjectURL(maskUrl);
      canvas.style.backgroundImage = "";
      gl.deleteTexture(sourceTexture);
      gl.deleteTexture(maskTexture);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(program);
    };
  }, [mediaType, src, svgMask]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} />;
}
