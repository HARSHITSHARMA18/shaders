"use client";

import { useEffect, useMemo, useRef } from "react";

export type ParticleMorphPreset = "word" | "svg";
export type ParticleMorphPalette = "rose" | "pearl" | "cobalt" | "acid";

export type ParticleMorphColors = {
  background: string;
  shadow: string;
  surface: string;
  highlight: string;
};

export type ParticleMorphSettings = {
  preset: ParticleMorphPreset;
  text: string;
  svg: string;
  particleCount: number;
  size: number;
  gloss: number;
  scatter: number;
  duration: number;
  turbulence: number;
  interaction: number;
  palette: ParticleMorphPalette;
  colors?: ParticleMorphColors;
};

type Props = Partial<ParticleMorphSettings> & {
  settings?: ParticleMorphSettings;
  className?: string;
};

export const PARTICLE_MORPH_PALETTES: Record<ParticleMorphPalette, ParticleMorphColors> = {
  rose: {
    background: "#2c0a18",
    shadow: "#b92f61",
    surface: "#ef5f91",
    highlight: "#ffd1df",
  },
  pearl: {
    background: "#111311",
    shadow: "#777d79",
    surface: "#d7ddd8",
    highlight: "#ffffff",
  },
  cobalt: {
    background: "#080d24",
    shadow: "#2547a8",
    surface: "#5f86ff",
    highlight: "#dbe5ff",
  },
  acid: {
    background: "#111408",
    shadow: "#7b851d",
    surface: "#d7eb36",
    highlight: "#f8ffd0",
  },
};

export const SOLACE_MARK_SVG = `<svg viewBox="0 0 64 38" xmlns="http://www.w3.org/2000/svg">
  <path d="M0 20.1032H39.8387C44.7808 20.1032 48.7871 24.1095 48.7871 29.0516C48.7871 33.9937 44.7808 38 39.8387 38H0V20.1032Z" fill="white"/>
  <path d="M63.4968 17.8968H23.6581C18.716 17.8968 14.7097 13.8904 14.7097 8.94839C14.7097 4.00633 18.716 0 23.6581 0H63.4968V17.8968Z" fill="white"/>
</svg>`;

const VERTEX = `#version 300 es
precision highp float;
in vec2 a_scatter;
in vec2 a_target;
in vec2 a_data;
uniform float u_time;
uniform float u_aspect;
uniform float u_pointSize;
uniform float u_duration;
uniform float u_scatter;
uniform float u_turbulence;
uniform float u_interaction;
uniform vec2 u_pointer;
out float v_seed;
out float v_form;

const float TAU = 6.28318530718;

void main() {
  float cycle = mod(u_time, max(u_duration, 0.1)) / max(u_duration, 0.1);
  float delay = (a_data.x - 0.5) * 0.055;
  float assemble = smoothstep(0.16 + delay, 0.38 + delay, cycle);
  float disperse = smoothstep(0.64 + delay, 0.94 + delay, cycle);
  float form = assemble * (1.0 - disperse);
  form = form * form * (3.0 - 2.0 * form);

  vec2 scattered = vec2(a_scatter.x * u_aspect, a_scatter.y) * u_scatter;
  float orbit = cycle * TAU + a_data.x * TAU;
  vec2 drift = vec2(cos(orbit * 0.83), sin(orbit * 1.07));
  drift *= (0.025 + a_data.y * 0.045) * u_turbulence;
  scattered += drift;

  vec2 position = mix(scattered, a_target, form);
  vec2 outward = normalize(a_target + vec2(0.0001));
  position += outward * sin(disperse * 3.14159265) * 0.1 * u_turbulence;

  vec2 pointerDelta = position - u_pointer;
  float pointerDistance = length(pointerDelta);
  float pointerForce = exp(-pointerDistance * pointerDistance * 12.0) * u_interaction;
  position += pointerDelta / max(pointerDistance, 0.001) * pointerForce * 0.085;

  gl_Position = vec4(position.x / max(u_aspect, 0.001), position.y, 0.0, 1.0);
  gl_PointSize = u_pointSize * mix(0.42, 2.2, a_data.y) * mix(0.9, 1.08, form);
  v_seed = a_data.x;
  v_form = form;
}`;

const FRAGMENT = `#version 300 es
precision highp float;
in float v_seed;
in float v_form;
uniform float u_gloss;
uniform vec3 u_shadow;
uniform vec3 u_surface;
uniform vec3 u_highlight;
out vec4 outColor;

void main() {
  vec2 uv = gl_PointCoord * 2.0 - 1.0;
  float radiusSquared = dot(uv, uv);
  if (radiusSquared > 1.0) discard;

  vec3 normal = normalize(vec3(uv.x, -uv.y, sqrt(max(0.0, 1.0 - radiusSquared))));
  vec3 lightDirection = normalize(vec3(-0.58, 0.72, 0.64));
  float diffuse = max(dot(normal, lightDirection), 0.0);
  vec3 reflected = reflect(-lightDirection, normal);
  float specular = pow(max(reflected.z, 0.0), mix(12.0, 54.0, u_gloss));
  float rim = pow(1.0 - max(normal.z, 0.0), 2.4);

  vec3 color = mix(u_shadow, u_surface, 0.24 + diffuse * 0.76);
  color = mix(color, u_highlight, specular * (0.28 + u_gloss * 0.62));
  color += u_highlight * rim * 0.055;
  color *= 0.94 + 0.08 * v_seed + 0.04 * v_form;

  float alpha = 1.0 - smoothstep(0.86, 1.0, sqrt(radiusSquared));
  outColor = vec4(color, alpha);
}`;

function rgb(hex: string) {
  const source = hex.replace("#", "");
  const normalized = source.length === 3
    ? source.split("").map((character) => character + character).join("")
    : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function random(index: number, salt = 0) {
  const value = Math.sin(index * 127.1 + salt * 311.7) * 43758.5453123;
  return value - Math.floor(value);
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const result = gl.createShader(type);
  if (!result) throw new Error("Unable to create shader");
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(result) ?? "Shader compilation failed");
  }
  return result;
}

function createProgram(gl: WebGL2RenderingContext) {
  const result = gl.createProgram();
  if (!result) throw new Error("Unable to create shader program");
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
  gl.attachShader(result, vertex);
  gl.attachShader(result, fragment);
  gl.linkProgram(result);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(result, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(result) ?? "Shader link failed");
  }
  return result;
}

function rasterTargets(label: string, count: number, aspect: number) {
  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 420;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) return new Float32Array(count * 2);

  const safeLabel = (label.trim() || "FORM").slice(0, 12);
  let fontSize = 250;
  context.textAlign = "center";
  context.textBaseline = "middle";
  while (fontSize > 68) {
    context.font = `900 ${fontSize}px ui-rounded, "Arial Rounded MT Bold", "Helvetica Neue", Arial, sans-serif`;
    if (context.measureText(safeLabel).width < canvas.width * 0.88) break;
    fontSize -= 6;
  }
  context.fillStyle = "#ffffff";
  context.fillText(safeLabel, canvas.width / 2, canvas.height / 2 + fontSize * 0.035);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const candidates: Array<[number, number]> = [];
  for (let y = 2; y < canvas.height; y += 3) {
    for (let x = 2; x < canvas.width; x += 3) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 128) candidates.push([x, y]);
    }
  }

  const targets = new Float32Array(count * 2);
  const width = Math.min(aspect * 1.72, 2.72);
  const height = Math.min(0.82, width / 2.45);
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates[Math.floor(random(index, 19) * candidates.length)] ?? [512, 210];
    targets[index * 2] = ((candidate[0] / canvas.width) - 0.5) * width;
    targets[index * 2 + 1] = (0.5 - candidate[1] / canvas.height) * height;
  }
  return targets;
}

function sanitizeSvg(markup: string) {
  const documentNode = new DOMParser().parseFromString(markup.trim(), "image/svg+xml");
  const root = documentNode.documentElement;
  if (root.tagName.toLowerCase() !== "svg" || documentNode.querySelector("parsererror")) {
    return SOLACE_MARK_SVG;
  }
  root.querySelectorAll("script, foreignObject, iframe, object, embed, image, audio, video").forEach((node) => node.remove());
  root.querySelectorAll("*").forEach((node) => {
    for (const attribute of Array.from(node.attributes)) {
      const name = attribute.name.toLowerCase();
      const value = attribute.value.trim();
      if (name.startsWith("on")) node.removeAttribute(attribute.name);
      if ((name === "href" || name === "xlink:href") && !value.startsWith("#")) node.removeAttribute(attribute.name);
      if (name === "style" && /url\s*\(/i.test(value)) node.removeAttribute(attribute.name);
    }
  });
  root.setAttribute("xmlns", "http://www.w3.org/2000/svg");
  return new XMLSerializer().serializeToString(root);
}

async function svgTargets(markup: string, count: number, aspect: number) {
  const safeSvg = sanitizeSvg(markup || SOLACE_MARK_SVG);
  const parsed = new DOMParser().parseFromString(safeSvg, "image/svg+xml");
  const viewBox = parsed.documentElement.getAttribute("viewBox")?.split(/[ ,]+/).map(Number);
  const sourceAspect = viewBox && viewBox.length === 4 && viewBox[3] > 0
    ? viewBox[2] / viewBox[3]
    : 1;
  const image = new Image();
  const source = URL.createObjectURL(new Blob([safeSvg], { type: "image/svg+xml" }));

  try {
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Unable to rasterize SVG target"));
      image.src = source;
    });
  } catch {
    URL.revokeObjectURL(source);
    return rasterTargets("SVG", count, aspect);
  }

  const canvas = document.createElement("canvas");
  canvas.width = 1024;
  canvas.height = 420;
  const context = canvas.getContext("2d", { willReadFrequently: true });
  if (!context) {
    URL.revokeObjectURL(source);
    return rasterTargets("SVG", count, aspect);
  }
  const maxWidth = canvas.width * 0.78;
  const maxHeight = canvas.height * 0.72;
  const drawWidth = Math.min(maxWidth, maxHeight * sourceAspect);
  const drawHeight = drawWidth / sourceAspect;
  context.drawImage(image, (canvas.width - drawWidth) / 2, (canvas.height - drawHeight) / 2, drawWidth, drawHeight);
  URL.revokeObjectURL(source);

  const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data;
  const candidates: Array<[number, number]> = [];
  for (let y = 2; y < canvas.height; y += 3) {
    for (let x = 2; x < canvas.width; x += 3) {
      if (pixels[(y * canvas.width + x) * 4 + 3] > 96) candidates.push([x, y]);
    }
  }
  if (!candidates.length) return rasterTargets("SVG", count, aspect);

  const targets = new Float32Array(count * 2);
  const width = Math.min(aspect * 1.62, 2.45);
  const height = 0.86;
  for (let index = 0; index < count; index += 1) {
    const candidate = candidates[Math.floor(random(index, 67) * candidates.length)];
    targets[index * 2] = ((candidate[0] / canvas.width) - 0.5) * width;
    targets[index * 2 + 1] = (0.5 - candidate[1] / canvas.height) * height;
  }
  return targets;
}

async function createTargets(preset: ParticleMorphPreset, text: string, svg: string, count: number, aspect: number) {
  if (preset === "word") return rasterTargets(text, count, aspect);
  return svgTargets(svg, count, aspect);
}

export function ParticleMorphShader({
  settings: suppliedSettings,
  preset = "word",
  text = "SOLACE",
  svg = SOLACE_MARK_SVG,
  particleCount = 1280,
  size = 5.2,
  gloss = 0.72,
  scatter = 1.12,
  duration = 5.2,
  turbulence = 0.58,
  interaction = 0.35,
  palette = "rose",
  colors,
  className,
}: Props) {
  const settings = useMemo<ParticleMorphSettings>(
    () => suppliedSettings ?? {
      preset,
      text,
      svg,
      particleCount,
      size,
      gloss,
      scatter,
      duration,
      turbulence,
      interaction,
      palette,
      colors,
    },
    [suppliedSettings, preset, text, svg, particleCount, size, gloss, scatter, duration, turbulence, interaction, palette, colors],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: true });
    if (!gl) return;

    let shaderProgram: WebGLProgram;
    try {
      shaderProgram = createProgram(gl);
    } catch (error) {
      console.error(error);
      return;
    }

    const count = Math.max(300, Math.min(2200, Math.round(settings.particleCount)));
    const scatterData = new Float32Array(count * 2);
    const particleData = new Float32Array(count * 2);
    for (let index = 0; index < count; index += 1) {
      scatterData[index * 2] = random(index, 3) * 2 - 1;
      scatterData[index * 2 + 1] = random(index, 7) * 2 - 1;
      particleData[index * 2] = random(index, 11);
      particleData[index * 2 + 1] = Math.pow(random(index, 13), 1.35);
    }

    const bindAttribute = (name: string, data: Float32Array, usage: number = gl.STATIC_DRAW) => {
      const buffer = gl.createBuffer();
      if (!buffer) throw new Error(`Unable to create ${name} buffer`);
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(gl.ARRAY_BUFFER, data, usage);
      const location = gl.getAttribLocation(shaderProgram, name);
      gl.enableVertexAttribArray(location);
      gl.vertexAttribPointer(location, 2, gl.FLOAT, false, 0, 0);
      return buffer;
    };

    gl.useProgram(shaderProgram);
    const scatterBuffer = bindAttribute("a_scatter", scatterData);
    const targetBuffer = bindAttribute("a_target", new Float32Array(count * 2), gl.DYNAMIC_DRAW);
    const dataBuffer = bindAttribute("a_data", particleData);
    const location = (name: string) => gl.getUniformLocation(shaderProgram, name);
    const uniforms = {
      time: location("u_time"),
      aspect: location("u_aspect"),
      pointSize: location("u_pointSize"),
      duration: location("u_duration"),
      scatter: location("u_scatter"),
      turbulence: location("u_turbulence"),
      interaction: location("u_interaction"),
      pointer: location("u_pointer"),
      gloss: location("u_gloss"),
      shadow: location("u_shadow"),
      surface: location("u_surface"),
      highlight: location("u_highlight"),
    };

    let aspect = 1;
    let pixelRatio = 1;
    const pointerTarget = { x: 4, y: 4 };
    const pointer = { x: 4, y: 4 };
    let frame = 0;
    let disposed = false;
    let targetRequest = 0;
    const started = performance.now();

    const updateTargets = async () => {
      const request = ++targetRequest;
      const targets = await createTargets(settings.preset, settings.text, settings.svg, count, aspect);
      if (disposed || request !== targetRequest) return;
      gl.bindBuffer(gl.ARRAY_BUFFER, targetBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, targets, gl.DYNAMIC_DRAW);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * pixelRatio));
      const height = Math.max(1, Math.round(rect.height * pixelRatio));
      const nextAspect = rect.width / Math.max(rect.height, 1);
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
      if (Math.abs(nextAspect - aspect) > 0.01) {
        aspect = nextAspect;
        updateTargets();
      }
    };

    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      pointerTarget.x = ((event.clientX - rect.left) / rect.width * 2 - 1) * aspect;
      pointerTarget.y = 1 - (event.clientY - rect.top) / rect.height * 2;
    };
    const leave = () => {
      pointerTarget.x = 4;
      pointerTarget.y = 4;
    };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerleave", leave);
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();
    updateTargets();

    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    const render = (now: number) => {
      if (disposed) return;
      pointer.x += (pointerTarget.x - pointer.x) * 0.12;
      pointer.y += (pointerTarget.y - pointer.y) * 0.12;
      const current = settingsRef.current;
      const paletteColors = current.colors ?? PARTICLE_MORPH_PALETTES[current.palette];
      const background = rgb(paletteColors.background);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clearColor(background[0], background[1], background[2], 1);
      gl.clear(gl.COLOR_BUFFER_BIT);
      gl.useProgram(shaderProgram);
      gl.uniform1f(uniforms.time, (now - started) / 1000);
      gl.uniform1f(uniforms.aspect, aspect);
      gl.uniform1f(uniforms.pointSize, current.size * pixelRatio);
      gl.uniform1f(uniforms.duration, current.duration);
      gl.uniform1f(uniforms.scatter, current.scatter);
      gl.uniform1f(uniforms.turbulence, current.turbulence);
      gl.uniform1f(uniforms.interaction, current.interaction);
      gl.uniform2f(uniforms.pointer, pointer.x, pointer.y);
      gl.uniform1f(uniforms.gloss, current.gloss);
      gl.uniform3fv(uniforms.shadow, rgb(paletteColors.shadow));
      gl.uniform3fv(uniforms.surface, rgb(paletteColors.surface));
      gl.uniform3fv(uniforms.highlight, rgb(paletteColors.highlight));
      gl.drawArrays(gl.POINTS, 0, count);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      targetRequest += 1;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerleave", leave);
      gl.deleteBuffer(scatterBuffer);
      gl.deleteBuffer(targetBuffer);
      gl.deleteBuffer(dataBuffer);
      gl.deleteProgram(shaderProgram);
    };
  }, [settings.particleCount, settings.preset, settings.svg, settings.text]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={`Glossy particles assembling into the ${settings.preset} target.`}
    />
  );
}
