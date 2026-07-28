"use client";

import { useEffect, useMemo, useRef } from "react";

export type FieldShaderVariant = "viscous" | "reaction" | "cellular";
export type FieldShaderPalette = "signal" | "acid" | "mono";

export type FieldShaderSettings = {
  scale: number;
  intensity: number;
  speed: number;
  distortion: number;
  trail: number;
  palette: FieldShaderPalette;
};

type Props = Partial<FieldShaderSettings> & {
  variant: FieldShaderVariant;
  settings?: FieldShaderSettings;
  className?: string;
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
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec2 u_velocity;
uniform float u_time;
uniform float u_scale;
uniform float u_intensity;
uniform float u_speed;
uniform float u_distortion;
uniform float u_trail;
uniform int u_variant;
uniform vec3 u_background;
uniform vec3 u_colorA;
uniform vec3 u_colorB;
uniform vec3 u_colorC;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + 1.0), f.x), f.y);
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.5;
  for (int i = 0; i < 4; i++) {
    value += amplitude * noise(p);
    p = mat2(1.6, 1.2, -1.2, 1.6) * p;
    amplitude *= 0.5;
  }
  return value;
}

void main() {
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (v_uv - 0.5) * vec2(aspect, 1.0);
  vec2 mouse = (u_mouse - 0.5) * vec2(aspect, 1.0);
  float t = u_time * u_speed;
  vec3 color = u_background;

  if (u_variant == 0) {
    vec2 q = p - mouse;
    float radius = length(q);
    float angle = atan(q.y, q.x);
    float flow = sin(angle * 4.0 + t * 1.4 + fbm(p * 3.0) * 5.0);
    vec2 drag = u_velocity * (0.18 + u_trail * 0.45);
    float wake = length(q + drag * smoothstep(0.8, 0.0, radius));
    float dye = 1.0 - smoothstep(0.02, 0.72 + u_trail * 0.28, wake + flow * 0.055 * u_distortion);
    float fold = 0.5 + 0.5 * sin((radius * 19.0 - angle * 2.0) * u_scale - t * 2.0);
    float ambient = fbm(p * (2.3 + u_scale) + vec2(t * 0.08, -t * 0.06));
    color = mix(color, u_colorA, smoothstep(0.48, 0.78, ambient) * 0.48);
    color = mix(color, u_colorB, dye * (0.4 + fold * 0.55));
    color = mix(color, u_colorC, dye * smoothstep(0.7, 1.0, fold) * u_intensity);
  } else if (u_variant == 1) {
    vec2 warp = vec2(
      fbm(p * 3.2 + vec2(t * 0.12, 0.0)),
      fbm(p * 3.2 + vec2(5.2, -t * 0.1))
    ) - 0.5;
    vec2 q = p + warp * 0.24 * u_distortion - mouse;
    float radius = length(q);
    float cells = fbm((p + warp * 0.3) * (5.0 + u_scale * 2.0));
    float rings = 0.5 + 0.5 * sin(radius * (33.0 + u_scale * 7.0) - t * 3.2 + cells * 8.0);
    float bloom = 1.0 - smoothstep(0.03, 0.75 + u_trail * 0.3, radius);
    float membrane = smoothstep(0.38, 0.62, rings + (cells - 0.5) * u_distortion);
    color = mix(color, u_colorA, smoothstep(0.42, 0.72, cells) * 0.6);
    color = mix(color, u_colorB, bloom * membrane * u_intensity);
    color = mix(color, u_colorC, bloom * smoothstep(0.78, 0.98, rings) * u_intensity);
  } else {
    float cellScale = 28.0 + u_scale * 16.0;
    vec2 cell = floor((p + vec2(aspect, 1.0) * 0.5) * cellScale);
    vec2 center = (cell + 0.5) / cellScale - vec2(aspect, 1.0) * 0.5;
    float seed = hash(cell);
    float distanceToMouse = length(center - mouse);
    float wave = sin(distanceToMouse * (28.0 + u_distortion * 12.0) - t * 4.0 + seed * 7.0);
    float contagion = 1.0 - smoothstep(0.0, 0.72 + u_trail * 0.42, distanceToMouse);
    float state = floor(clamp((wave * 0.5 + 0.5) * contagion * u_intensity + seed * 0.38, 0.0, 0.999) * 4.0);
    vec2 local = fract((p + vec2(aspect, 1.0) * 0.5) * cellScale);
    float tile = step(0.07, local.x) * step(0.07, local.y);
    if (state < 1.0) color = mix(color, u_colorA, seed * 0.24);
    else if (state < 2.0) color = u_colorA;
    else if (state < 3.0) color = u_colorB;
    else color = u_colorC;
    color = mix(u_background, color, tile);
  }

  outColor = vec4(color, 1.0);
}`;

const PALETTES: Record<FieldShaderPalette, [string, string, string, string]> = {
  signal: ["#090b0a", "#1236ff", "#f0432f", "#d8ff2f"],
  acid: ["#0e0d17", "#7638fa", "#ff4c91", "#eaff38"],
  mono: ["#0d0f0e", "#3f4541", "#9ba39d", "#f4f6f2"],
};

function rgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function shader(gl: WebGL2RenderingContext, type: number, source: string) {
  const result = gl.createShader(type);
  if (!result) throw new Error("Unable to create shader");
  gl.shaderSource(result, source);
  gl.compileShader(result);
  if (!gl.getShaderParameter(result, gl.COMPILE_STATUS)) {
    throw new Error(gl.getShaderInfoLog(result) ?? "Shader compilation failed");
  }
  return result;
}

function program(gl: WebGL2RenderingContext) {
  const result = gl.createProgram();
  if (!result) throw new Error("Unable to create shader program");
  const vertex = shader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = shader(gl, gl.FRAGMENT_SHADER, FRAGMENT);
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

export function SolaceFieldShader({
  variant,
  settings: suppliedSettings,
  scale = 1,
  intensity = 1,
  speed = 0.7,
  distortion = 0.7,
  trail = 0.45,
  palette = "signal",
  className,
}: Props) {
  const settings = useMemo(
    () => suppliedSettings ?? { scale, intensity, speed, distortion, trail, palette },
    [suppliedSettings, scale, intensity, speed, distortion, trail, palette],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false });
    if (!gl) return;

    let shaderProgram: WebGLProgram;
    try {
      shaderProgram = program(gl);
    } catch (error) {
      console.error(error);
      return;
    }

    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    gl.useProgram(shaderProgram);
    const position = gl.getAttribLocation(shaderProgram, "a_position");
    gl.enableVertexAttribArray(position);
    gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const location = (name: string) => gl.getUniformLocation(shaderProgram, name);
    const uniforms = {
      resolution: location("u_resolution"),
      mouse: location("u_mouse"),
      velocity: location("u_velocity"),
      time: location("u_time"),
      scale: location("u_scale"),
      intensity: location("u_intensity"),
      speed: location("u_speed"),
      distortion: location("u_distortion"),
      trail: location("u_trail"),
      variant: location("u_variant"),
      background: location("u_background"),
      colorA: location("u_colorA"),
      colorB: location("u_colorB"),
      colorC: location("u_colorC"),
    };

    const target = { x: 0.5, y: 0.5 };
    const mouse = { x: 0.5, y: 0.5 };
    const previous = { x: 0.5, y: 0.5 };
    let frame = 0;
    let disposed = false;
    const started = performance.now();

    const move = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      target.x = (event.clientX - rect.left) / rect.width;
      target.y = 1 - (event.clientY - rect.top) / rect.height;
    };
    canvas.addEventListener("pointermove", move);

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
      const width = Math.max(1, Math.round(rect.width * ratio));
      const height = Math.max(1, Math.round(rect.height * ratio));
      if (canvas.width !== width || canvas.height !== height) {
        canvas.width = width;
        canvas.height = height;
      }
    };
    const observer = new ResizeObserver(resize);
    observer.observe(canvas);
    resize();

    const render = (now: number) => {
      if (disposed) return;
      mouse.x += (target.x - mouse.x) * 0.09;
      mouse.y += (target.y - mouse.y) * 0.09;
      const velocityX = mouse.x - previous.x;
      const velocityY = mouse.y - previous.y;
      previous.x = mouse.x;
      previous.y = mouse.y;
      const current = settingsRef.current;
      const colors = PALETTES[current.palette];
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(shaderProgram);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.mouse, mouse.x, mouse.y);
      gl.uniform2f(uniforms.velocity, velocityX * 24, velocityY * 24);
      gl.uniform1f(uniforms.time, (now - started) / 1000);
      gl.uniform1f(uniforms.scale, current.scale);
      gl.uniform1f(uniforms.intensity, current.intensity);
      gl.uniform1f(uniforms.speed, current.speed);
      gl.uniform1f(uniforms.distortion, current.distortion);
      gl.uniform1f(uniforms.trail, current.trail);
      gl.uniform1i(uniforms.variant, variant === "viscous" ? 0 : variant === "reaction" ? 1 : 2);
      gl.uniform3fv(uniforms.background, rgb(colors[0]));
      gl.uniform3fv(uniforms.colorA, rgb(colors[1]));
      gl.uniform3fv(uniforms.colorB, rgb(colors[2]));
      gl.uniform3fv(uniforms.colorC, rgb(colors[3]));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(shaderProgram);
    };
  }, [variant]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label={`Interactive ${variant} shader. Move across the field to change its focus.`}
    />
  );
}
