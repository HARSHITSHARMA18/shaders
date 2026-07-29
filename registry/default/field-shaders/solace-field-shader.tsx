"use client";

import { useEffect, useMemo, useRef } from "react";

export type FieldShaderVariant =
  | "viscous"
  | "reaction"
  | "cellular"
  | "repulsion"
  | "magnetic"
  | "chromatic";
export type FieldShaderPalette = "signal" | "acid" | "ember" | "glacier" | "mono";

export type FieldShaderColors = {
  background: string;
  primary: string;
  secondary: string;
  highlight: string;
};

export type FieldShaderSettings = {
  scale: number;
  intensity: number;
  speed: number;
  distortion: number;
  trail: number;
  palette: FieldShaderPalette;
  colors?: FieldShaderColors;
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

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 segment = b - a;
  float amount = clamp(dot(p - a, segment) / max(dot(segment, segment), 0.00001), 0.0, 1.0);
  return length(p - (a + segment * amount));
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
  } else if (u_variant == 2) {
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
  } else if (u_variant == 3) {
    float density = 34.0 + u_scale * 18.0;
    vec2 bounds = vec2(aspect, 1.0);
    vec2 baseCell = floor((p + bounds * 0.5) * density);
    float velocityAmount = min(1.0, length(u_velocity) * 5.0);
    float coverage = 0.0;
    float totalWeight = 0.0;
    vec3 weightedColor = vec3(0.0);

    for (int offsetY = -4; offsetY <= 4; offsetY++) {
      for (int offsetX = -4; offsetX <= 4; offsetX++) {
        vec2 cell = baseCell + vec2(float(offsetX), float(offsetY));
        vec2 resting = (cell + 0.5) / density - bounds * 0.5;
        vec2 away = resting - mouse;
        float distanceToMouse = length(away);
        vec2 direction = away / max(distanceToMouse, 0.001);
        float angle = atan(away.y, away.x);

        // The axis-weighted force creates the four soft lobes by moving dots,
        // rather than removing fragments from a pre-cut shape.
        float axisBias = 0.72 + 0.28 * pow(abs(cos(angle * 2.0)), 2.0);
        float influenceRadius = 0.115 + u_trail * 0.055;
        float falloff = exp(-pow(distanceToMouse / influenceRadius, 2.0) * 1.55);
        float force = falloff * axisBias;
        vec2 tangent = vec2(-direction.y, direction.x);
        float wake = sin(angle * 2.0 - t * 0.9) * velocityAmount * falloff;
        vec2 displaced = resting
          + direction * force * (0.052 + u_distortion * 0.026)
          + tangent * wake * 0.012
          + u_velocity * falloff * (0.018 + u_trail * 0.025);

        float pointDistance = length((p - displaced) * density);
        float lowerField = 1.0 - smoothstep(-0.5, 0.4, resting.y);
        float horizon = smoothstep(0.0, 0.36, lowerField);
        float pointSize = mix(0.05, 0.18, lowerField) * (0.82 + u_intensity * 0.18);
        float point = 1.0 - smoothstep(pointSize, pointSize + 0.072, pointDistance);
        float grain = hash(cell);
        float shimmer = 0.5 + 0.5 * sin(t * 1.1 + grain * 18.0 + resting.y * 9.0);
        float verticalGlow = pow(lowerField, 2.2);
        float compression = smoothstep(0.32, 0.82, force * density * 0.18);
        vec3 pointColor = mix(u_colorA, u_colorB, lowerField);
        pointColor = mix(pointColor, u_colorC, verticalGlow * (0.32 + shimmer * 0.28));
        pointColor = mix(pointColor, u_colorC, compression * 0.42);
        float visibility = mix(0.08, 1.0, horizon);

        float weight = point * visibility;
        weightedColor += pointColor * weight;
        totalWeight += weight;
        coverage = max(coverage, weight);
      }
    }

    color = mix(u_background, weightedColor / max(totalWeight, 0.0001), clamp(coverage, 0.0, 1.0));
  } else if (u_variant == 4) {
    float density = 16.0 + u_scale * 13.0;
    vec2 bounds = vec2(aspect, 1.0);
    vec2 grid = (p + bounds * 0.5) * density;
    vec2 cell = floor(grid);
    vec2 resting = (cell + 0.5) / density - bounds * 0.5;
    float seed = hash(cell);
    vec2 toMouse = mouse - resting;
    float distanceToMouse = length(toMouse);
    vec2 direction = toMouse / max(distanceToMouse, 0.001);
    vec2 tangent = vec2(-direction.y, direction.x);
    float influence = 1.0 - smoothstep(0.05, 0.66 + u_trail * 0.22, distanceToMouse);
    float polarity = sin(seed * 12.0 + t * 1.35);
    vec2 displacement = direction * influence * polarity * (0.035 + u_distortion * 0.09)
      + tangent * influence * (u_velocity.x - u_velocity.y) * 0.16;
    vec2 displaced = resting + displacement;
    vec2 local = (p - displaced) * density;
    float diamond = abs(local.x) + abs(local.y);
    float particle = 1.0 - smoothstep(0.18, 0.29, diamond);
    float spring = 1.0 - smoothstep(0.006, 0.018, segmentDistance(p, resting, displaced));
    spring *= smoothstep(0.006, 0.035, length(displacement));
    float tension = clamp(length(displacement) * density * 0.9, 0.0, 1.0);
    color = mix(color, u_colorA, spring * (0.28 + tension * 0.5));
    color = mix(color, mix(u_colorB, u_colorC, tension), particle * (0.7 + u_intensity * 0.3));
    float magneticHalo = (1.0 - smoothstep(0.12, 0.75, distanceToMouse))
      * (0.5 + 0.5 * sin(distanceToMouse * 27.0 - t * 2.2));
    color = mix(color, u_colorA, magneticHalo * 0.08);
  } else {
    vec2 q = p - mouse;
    float radius = length(q);
    vec2 normal = q / max(radius, 0.001);
    float lens = 1.0 - smoothstep(0.03, 0.72 + u_trail * 0.18, radius);
    float velocity = min(1.0, length(u_velocity) * 7.0);
    vec2 slip = normal * (0.012 + u_distortion * 0.034) * lens
      + u_velocity * (0.05 + u_trail * 0.1);
    float fieldA = fbm((p + slip) * (4.2 + u_scale * 1.8) + vec2(t * 0.08, 0.0));
    float fieldB = fbm((p - slip) * (4.2 + u_scale * 1.8) + vec2(-t * 0.06, 4.1));
    float fieldC = fbm((p + vec2(-slip.y, slip.x)) * (5.0 + u_scale) + vec2(7.3, t * 0.05));
    float bandA = smoothstep(0.48, 0.72, fieldA + lens * 0.2);
    float bandB = smoothstep(0.5, 0.75, fieldB + lens * 0.16);
    float bandC = smoothstep(0.57, 0.8, fieldC + lens * (0.1 + velocity * 0.18));
    color = mix(color, u_colorA, bandA * 0.54);
    color = mix(color, u_colorB, bandB * lens * (0.5 + u_intensity * 0.38));
    color = mix(color, u_colorC, bandC * lens * (0.42 + u_intensity * 0.48));
    float rim = 1.0 - smoothstep(0.012, 0.045, abs(radius - (0.27 + u_distortion * 0.11)));
    float prism = pow(max(0.0, 0.5 + 0.5 * sin(atan(q.y, q.x) * 7.0 + radius * 30.0 - t)), 8.0);
    color = mix(color, mix(u_colorB, u_colorC, prism), rim * (0.38 + velocity * 0.42));
  }

  outColor = vec4(color, 1.0);
}`;

export const FIELD_PALETTES: Record<FieldShaderPalette, FieldShaderColors> = {
  signal: { background: "#090b0a", primary: "#1236ff", secondary: "#f0432f", highlight: "#d8ff2f" },
  acid: { background: "#0e0d17", primary: "#7638fa", secondary: "#ff4c91", highlight: "#eaff38" },
  ember: { background: "#120b08", primary: "#6f1d12", secondary: "#f26a1b", highlight: "#ffd166" },
  glacier: { background: "#071519", primary: "#155e75", secondary: "#67e8f9", highlight: "#ecfeff" },
  mono: { background: "#0d0f0e", primary: "#3f4541", secondary: "#9ba39d", highlight: "#f4f6f2" },
};

function rgb(hex: string) {
  const source = hex.replace("#", "");
  const normalized = source.length === 3
    ? source.split("").map((character) => character + character).join("")
    : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
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
  colors,
  className,
}: Props) {
  const settings = useMemo(
    () => suppliedSettings ?? { scale, intensity, speed, distortion, trail, palette, colors },
    [suppliedSettings, scale, intensity, speed, distortion, trail, palette, colors],
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
      const paletteColors = current.colors ?? FIELD_PALETTES[current.palette];
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
      const variantIndex = {
        viscous: 0,
        reaction: 1,
        cellular: 2,
        repulsion: 3,
        magnetic: 4,
        chromatic: 5,
      }[variant];
      gl.uniform1i(uniforms.variant, variantIndex);
      gl.uniform3fv(uniforms.background, rgb(paletteColors.background));
      gl.uniform3fv(uniforms.colorA, rgb(paletteColors.primary));
      gl.uniform3fv(uniforms.colorB, rgb(paletteColors.secondary));
      gl.uniform3fv(uniforms.colorC, rgb(paletteColors.highlight));
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
