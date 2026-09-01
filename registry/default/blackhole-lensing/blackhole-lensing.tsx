"use client";

import { useEffect, useMemo, useRef } from "react";

export type BlackholeLensingMode = "click" | "pointer" | "orbit" | "fixed";
export type BlackholeLensingPalette = "editorial" | "cinematic" | "chromatic" | "signal";
export type BlackholeLensingMediaType = "auto" | "image" | "video";

export type BlackholeLensingColors = {
  background: string;
  accretion: string;
  photonRing: string;
  singularity: string;
};

export type BlackholeLensingSettings = {
  mode: BlackholeLensingMode;
  progress: number;
  radius: number;
  lens: number;
  reach: number;
  orbit: number;
  aberration: number;
  wobble: number;
  squash: number;
  breath: number;
  position: [number, number];
  palette: BlackholeLensingPalette;
  colors: BlackholeLensingColors;
};

type BlackholeLensingPreset = Pick<BlackholeLensingSettings, "radius" | "lens" | "reach" | "orbit" | "aberration" | "wobble" | "squash"> & {
  colors: BlackholeLensingColors;
};

type Props = Partial<Omit<BlackholeLensingSettings, "colors">> & {
  src?: string;
  mediaType?: BlackholeLensingMediaType;
  colors?: Partial<BlackholeLensingColors>;
  settings?: BlackholeLensingSettings;
  className?: string;
  alt?: string;
};

export const BLACKHOLE_LENSING_PRESETS: Record<BlackholeLensingPalette, BlackholeLensingPreset> = {
  editorial: {
    radius: 0.16, lens: 0.24, reach: 0.34, orbit: 0.28, aberration: 0.01, wobble: 0.01, squash: 0.02,
    colors: { background: "#050505", accretion: "#F4F4F0", photonRing: "#FFFFFF", singularity: "#000000" },
  },
  cinematic: {
    radius: 0.18, lens: 0.36, reach: 0.46, orbit: 1.1, aberration: 0.04, wobble: 0.025, squash: 0.16,
    colors: { background: "#0B0805", accretion: "#F5A34F", photonRing: "#FFF0C2", singularity: "#010100" },
  },
  chromatic: {
    radius: 0.15, lens: 0.38, reach: 0.54, orbit: 1.35, aberration: 0.26, wobble: 0.06, squash: 0.04,
    colors: { background: "#07060D", accretion: "#00E5FF", photonRing: "#FF3DAE", singularity: "#000000" },
  },
  signal: {
    radius: 0.12, lens: 0.28, reach: 0.62, orbit: 0.55, aberration: 0.08, wobble: 0.1, squash: 0.08,
    colors: { background: "#070B08", accretion: "#B9FF38", photonRing: "#EFFFFF", singularity: "#020302" },
  },
};

export const BLACKHOLE_LENSING_PALETTES: Record<BlackholeLensingPalette, BlackholeLensingColors> = {
  editorial: BLACKHOLE_LENSING_PRESETS.editorial.colors,
  cinematic: BLACKHOLE_LENSING_PRESETS.cinematic.colors,
  chromatic: BLACKHOLE_LENSING_PRESETS.chromatic.colors,
  signal: BLACKHOLE_LENSING_PRESETS.signal.colors,
};

const DEFAULT_SETTINGS: BlackholeLensingSettings = {
  mode: "click",
  progress: 1.0,
  radius: BLACKHOLE_LENSING_PRESETS.editorial.radius,
  lens: BLACKHOLE_LENSING_PRESETS.editorial.lens,
  reach: BLACKHOLE_LENSING_PRESETS.editorial.reach,
  orbit: BLACKHOLE_LENSING_PRESETS.editorial.orbit,
  aberration: BLACKHOLE_LENSING_PRESETS.editorial.aberration,
  wobble: BLACKHOLE_LENSING_PRESETS.editorial.wobble,
  squash: BLACKHOLE_LENSING_PRESETS.editorial.squash,
  breath: 0.02,
  position: [0.5, 0.5],
  palette: "editorial",
  colors: BLACKHOLE_LENSING_PALETTES.editorial,
};

const VERTEX = `#version 300 es
in vec2 a_position;
out vec2 vUv;
void main() {
  vUv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const FRAGMENT = `#version 300 es
precision highp float;

in vec2 vUv;
out vec4 fragColor;

uniform sampler2D u_scene;
uniform vec2 u_resolution;
uniform float u_source_aspect;
uniform float u_time;
uniform vec2 u_center;
uniform float u_p;
uniform float u_click;
uniform float u_radius;
uniform float u_lens;
uniform float u_reach;
uniform float u_orbit;
uniform float u_wave;
uniform float u_aberr;
uniform float u_squash;
uniform float u_breath;
uniform float u_has_scene;

uniform vec3 u_bg_color;
uniform vec3 u_accretion_color;
uniform vec3 u_ring_color;
uniform vec3 u_core_color;

#define PI 3.14159265359

vec2 spin(vec2 v, float a) {
  float c = cos(a);
  float s = sin(a);
  return mat2(c, -s, s, c) * v;
}

vec2 squash() {
  return vec2(1.0 + u_squash, 1.0 - u_squash);
}

vec2 coverUv(vec2 uv) {
  float viewportAspect = u_resolution.x / max(u_resolution.y, 1.0);
  if (viewportAspect > u_source_aspect) uv.y = 0.5 + (uv.y - 0.5) * (u_source_aspect / viewportAspect);
  else uv.x = 0.5 + (uv.x - 0.5) * (viewportAspect / u_source_aspect);
  return clamp(uv, 0.001, 0.999);
}

float lobes(float a) {
  return sin(a * 3.0 + u_time * 0.7) * 0.6 + sin(a * 5.0 - u_time * 0.45) * 0.4;
}

vec4 grab(vec2 dir, float rad, float aspect) {
  vec2 p = dir * rad;
  vec2 uv = p / squash() / vec2(aspect, 1.0) + u_center;

  if (uv.x < 0.0 || uv.x > 1.0 || uv.y < 0.0 || uv.y > 1.0) {
    return vec4(u_bg_color, 1.0);
  }
  
  if (u_has_scene > 0.5) {
    return texture(u_scene, coverUv(uv));
  } else {
    vec2 grid = abs(fract(uv * 14.0 - 0.5) - 0.5) / max(fwidth(uv * 14.0), vec2(0.001));
    float line = min(grid.x, grid.y);
    float c = 1.0 - min(line, 1.0);
    vec3 base = mix(u_bg_color, u_accretion_color * 0.45, c * 0.6);
    return vec4(base, 1.0);
  }
}

float pull(float t, float e, float fall) {
  return fall * (e * e) / max(t, 0.001);
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  float gate = clamp(u_p, 0.0, 1.0);
  float pulsePhase = clamp(u_click, 0.0, 1.0);
  float impulse = step(0.0, u_click) * sin(PI * pulsePhase);
  
  if (gate < 0.0001) {
    if (u_has_scene > 0.5) {
      fragColor = texture(u_scene, coverUv(vUv));
    } else {
      fragColor = grab(vec2(0.0), 0.0, aspect);
    }
    return;
  }

  vec2 q = (vUv - u_center) * vec2(aspect, 1.0) * squash();
  float t = length(q);
  vec2 dir = t > 0.00001 ? normalize(q) : vec2(1.0, 0.0);
  float angle = atan(dir.y, dir.x);

  float r = u_radius * gate * (1.0 + impulse * 0.09) * (1.0 + u_breath * sin(u_time * 1.5));
  float e = u_lens * gate * (1.0 + impulse * 0.32) * (1.0 + u_wave * lobes(angle));

  float fall = smoothstep(r + e + u_reach, r, t);

  float draw = pull(t, e, fall);
  vec2 sdir = spin(dir, draw * u_orbit * (0.82 + sin(u_time * 0.22) * 0.18));

  float split = e * u_aberr;
  vec4 cr = grab(sdir, t - pull(t, e + split, fall), aspect);
  vec4 cg = grab(sdir, t - draw, aspect);
  vec4 cb = grab(sdir, t - pull(t, e - split, fall), aspect);
  vec4 col = vec4(cr.r, cg.g, cb.b, 1.0);

  float ringDist = abs(t - r);
  float ringGlow = exp(-ringDist * 32.0 / max(e, 0.04)) * fall;
  col.rgb += mix(u_accretion_color, u_ring_color, ringGlow) * ringGlow * 1.35;

  float pulseRadius = r + pulsePhase * u_reach * 0.82;
  float pulseRing = exp(-abs(t - pulseRadius) * 88.0 / max(u_reach, 0.12)) * impulse;
  col.rgb += u_ring_color * pulseRing * 0.52;

  float d = t - r;
  float aa = max(fwidth(d), 0.001);
  float inside = 1.0 - smoothstep(-aa, aa, d);

  vec4 finalColor = mix(col, vec4(u_core_color, 1.0), inside);
  fragColor = finalColor;
}`;

function parseColor(hex: string) {
  const source = hex.replace("#", "");
  const normalized = source.length === 3 ? source.split("").map((c) => c + c).join("") : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return new Float32Array([((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255]);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create black hole shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function drawDefaultPoster(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const { width, height } = canvas;
  ctx.fillStyle = "#0A0D14";
  ctx.fillRect(0, 0, width, height);

  ctx.strokeStyle = "rgba(94, 234, 212, 0.12)";
  ctx.lineWidth = 1;
  for (let x = 0; x <= width; x += 80) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y <= height; y += 80) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 64px sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("SINGULARITY", width / 2, height / 2);
}

export function BlackholeLensing({
  src = "/blackhole-halftone.webp",
  mediaType = "auto",
  palette,
  settings,
  className,
  alt = "Gravitational lensing black hole portal",
  ...overrides
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolved = useMemo<BlackholeLensingSettings>(() => {
    const selectedPalette = palette ?? settings?.palette ?? DEFAULT_SETTINGS.palette;
    const preset = BLACKHOLE_LENSING_PRESETS[selectedPalette];
    return {
      ...DEFAULT_SETTINGS,
      ...preset,
      ...overrides,
      ...settings,
      palette: selectedPalette,
      colors: {
        ...DEFAULT_SETTINGS.colors,
        ...preset.colors,
        ...overrides.colors,
        ...settings?.colors,
      },
      position: overrides.position ?? settings?.position ?? DEFAULT_SETTINGS.position,
    };
  }, [overrides, palette, settings]);
  const settingsRef = useRef(resolved);

  useEffect(() => {
    settingsRef.current = resolved;
  }, [resolved]);

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

    const vs = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vs);
    gl.attachShader(program, fs);
    gl.linkProgram(program);
    gl.deleteShader(vs);
    gl.deleteShader(fs);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
      throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link black hole shader.");
    }

    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const posLoc = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(posLoc);
    gl.vertexAttribPointer(posLoc, 2, gl.FLOAT, false, 0, 0);

    const sceneTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

    const poster = document.createElement("canvas");
    poster.width = 1200;
    poster.height = 800;
    drawDefaultPoster(poster);
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, poster);

    let hasScene = 0;
    let sourceReady = !src;
    let sourceAspect = 1.5;
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
        hasScene = 1;
        sourceReady = true;
        sourceAspect = video!.videoWidth / Math.max(video!.videoHeight, 1);
        canvas.style.backgroundImage = "none";
        void video!.play().catch(() => undefined);
      }, { once: true });
    } else if (src) {
      image = new Image();
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        sourceAspect = image!.naturalWidth / Math.max(image!.naturalHeight, 1);
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image!);
        hasScene = 1;
        sourceReady = true;
        canvas.style.backgroundImage = "none";
      };
      image.src = src;
    }

    const unifs = {
      scene: gl.getUniformLocation(program, "u_scene"),
      resolution: gl.getUniformLocation(program, "u_resolution"),
      sourceAspect: gl.getUniformLocation(program, "u_source_aspect"),
      time: gl.getUniformLocation(program, "u_time"),
      center: gl.getUniformLocation(program, "u_center"),
      p: gl.getUniformLocation(program, "u_p"),
      click: gl.getUniformLocation(program, "u_click"),
      radius: gl.getUniformLocation(program, "u_radius"),
      lens: gl.getUniformLocation(program, "u_lens"),
      reach: gl.getUniformLocation(program, "u_reach"),
      orbit: gl.getUniformLocation(program, "u_orbit"),
      wave: gl.getUniformLocation(program, "u_wave"),
      aberr: gl.getUniformLocation(program, "u_aberr"),
      squash: gl.getUniformLocation(program, "u_squash"),
      breath: gl.getUniformLocation(program, "u_breath"),
      hasScene: gl.getUniformLocation(program, "u_has_scene"),
      bgColor: gl.getUniformLocation(program, "u_bg_color"),
      accretionColor: gl.getUniformLocation(program, "u_accretion_color"),
      ringColor: gl.getUniformLocation(program, "u_ring_color"),
      coreColor: gl.getUniformLocation(program, "u_core_color"),
    };

    const target = { x: settingsRef.current.position[0], y: settingsRef.current.position[1] };
    const center = { ...target };
    let pulseStarted = Number.NEGATIVE_INFINITY;

    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      const current = settingsRef.current;
      const x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      const y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      if (current.mode === "pointer") {
        target.x = x;
        target.y = y;
      }
    };
    const leave = () => {
      const current = settingsRef.current;
      if (current.mode === "pointer") {
        target.x = current.position[0];
        target.y = current.position[1];
      }
    };
    const activate = (event: PointerEvent) => {
      const current = settingsRef.current;
      if (current.mode === "click") {
        const bounds = canvas.getBoundingClientRect();
        target.x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
        target.y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      }
      pulseStarted = performance.now();
    };
    const keydown = (event: KeyboardEvent) => {
      if (event.key !== "Enter" && event.key !== " ") return;
      event.preventDefault();
      pulseStarted = performance.now();
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    canvas.addEventListener("pointerdown", activate);
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

      if (current.mode === "orbit") {
        target.x = 0.5 + 0.22 * Math.sin(elapsed * 0.65);
        target.y = 0.5 + 0.14 * Math.sin(elapsed * 0.95 + 0.4);
      } else if (current.mode === "fixed") {
        target.x = current.position[0];
        target.y = current.position[1];
      }

      canvas.style.cursor = current.mode === "click" ? "crosshair" : current.mode === "pointer" ? "none" : "default";

      center.x += (target.x - center.x) * 0.08;
      center.y += (target.y - center.y) * 0.08;

      if (video && video.readyState >= video.HAVE_CURRENT_DATA) {
        gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video);
        hasScene = 1;
      }

      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, sceneTexture);
      gl.uniform1i(unifs.scene, 0);

      gl.uniform2f(unifs.resolution, canvas.width, canvas.height);
      gl.uniform1f(unifs.sourceAspect, sourceAspect);
      gl.uniform1f(unifs.time, elapsed);
      gl.uniform2f(unifs.center, center.x, center.y);
      gl.uniform1f(unifs.p, current.progress);
      const clickPhase = (now - pulseStarted) / 920;
      gl.uniform1f(unifs.click, clickPhase >= 0 && clickPhase <= 1 ? clickPhase : -1);
      gl.uniform1f(unifs.radius, current.radius);
      gl.uniform1f(unifs.lens, current.lens);
      gl.uniform1f(unifs.reach, current.reach);
      gl.uniform1f(unifs.orbit, current.orbit);
      gl.uniform1f(unifs.wave, current.wobble);
      gl.uniform1f(unifs.aberr, current.aberration);
      gl.uniform1f(unifs.squash, current.squash);
      gl.uniform1f(unifs.breath, current.breath);
      gl.uniform1f(unifs.hasScene, hasScene);

      gl.uniform3fv(unifs.bgColor, parseColor(current.colors.background));
      gl.uniform3fv(unifs.accretionColor, parseColor(current.colors.accretion));
      gl.uniform3fv(unifs.ringColor, parseColor(current.colors.photonRing));
      gl.uniform3fv(unifs.coreColor, parseColor(current.colors.singularity));

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
      canvas.removeEventListener("pointerdown", activate);
      canvas.removeEventListener("keydown", keydown);
      if (image) image.onload = null;
      if (video) {
        video.pause();
        video.removeAttribute("src");
        video.load();
      }
      gl.deleteTexture(sceneTexture);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(program);
      canvas.style.backgroundImage = "";
    };
  }, [mediaType, src]);

  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} tabIndex={0} />;
}
