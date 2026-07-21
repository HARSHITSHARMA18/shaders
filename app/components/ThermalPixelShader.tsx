"use client";

import { useEffect, useMemo, useRef } from "react";

export type PaletteName = "wild" | "ember" | "mono";

export type ThermalPixelSettings = {
  cellSize: number;
  brushRadius: number;
  heat: number;
  decay: number;
  noise: number;
  speed: number;
  palette: PaletteName;
};

type Props = Partial<ThermalPixelSettings> & {
  settings?: ThermalPixelSettings;
  resetKey?: number;
  className?: string;
};

const VERTEX = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() {
  v_uv = a_position * 0.5 + 0.5;
  gl_Position = vec4(a_position, 0.0, 1.0);
}`;

const UPDATE = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_previous;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform vec2 u_previousMouse;
uniform float u_active;
uniform float u_radius;
uniform float u_heat;
uniform float u_decay;
uniform float u_delta;
uniform float u_pressed;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float segmentDistance(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float t = clamp(dot(p - a, ab) / max(dot(ab, ab), 0.0001), 0.0, 1.0);
  return length(p - (a + ab * t));
}

void main() {
  float previous = texture(u_previous, v_uv).r;
  float retained = previous * pow(u_decay, u_delta * 60.0);
  vec2 cell = v_uv * u_resolution;
  float d = segmentDistance(cell, u_previousMouse, u_mouse);
  float brush = exp(-d * d / max(u_radius * u_radius, 0.001));
  float grain = mix(0.72, 1.28, hash(floor(cell)));
  float pressure = mix(1.0, 1.55, u_pressed);
  float deposit = brush * grain * u_heat * pressure * 0.085 * u_delta * 60.0 * u_active;
  float value = clamp(retained + deposit, 0.0, 1.0);
  outColor = vec4(value, value, value, 1.0);
}`;

const DISPLAY = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_state;
uniform vec2 u_simulationResolution;
uniform float u_time;
uniform float u_noise;
uniform float u_speed;
uniform vec3 u_background;
uniform vec3 u_color1;
uniform vec3 u_color2;
uniform vec3 u_color3;
uniform vec3 u_color4;
uniform vec3 u_color5;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

void main() {
  vec2 gridPosition = v_uv * u_simulationResolution;
  vec2 cell = floor(gridPosition);
  vec2 sampleUv = (cell + 0.5) / u_simulationResolution;
  float state = texture(u_state, sampleUv).r;
  float t = u_time * u_speed;
  float waves = sin(cell.x * 0.115 + t) * 0.24
    + sin(cell.y * 0.087 - t * 0.72) * 0.22
    + sin((cell.x + cell.y) * 0.052 + t * 0.38) * 0.18;
  float grain = (hash(cell) - 0.5) * u_noise * 0.38;
  float ambient = smoothstep(0.28, 0.62, waves + grain + 0.24) * 0.42;
  float value = state + ambient;
  vec3 color = u_background;
  if (value > 0.20) color = u_color1;
  if (value > 0.36) color = u_color2;
  if (value > 0.55) color = u_color3;
  if (value > 0.76) color = u_color4;
  if (value > 0.94) color = u_color5;
  vec2 local = fract(gridPosition);
  float gap = 0.085;
  float tile = step(gap, local.x) * step(gap, local.y);
  outColor = vec4(mix(u_background, color, tile), 1.0);
}`;

const PALETTES: Record<PaletteName, string[]> = {
  wild: ["#efeee8", "#101932", "#1236ff", "#ffd522", "#f0432f", "#d8ff2f"],
  ember: ["#f2ede3", "#2d1018", "#8f1d27", "#ed5b2a", "#ffae19", "#fff08a"],
  mono: ["#eeeee8", "#181a18", "#3d423e", "#737b74", "#b5bdb3", "#f8faf3"],
};

function hexToRgb(hex: string) {
  const value = Number.parseInt(hex.slice(1), 16);
  return [((value >> 16) & 255) / 255, ((value >> 8) & 255) / 255, (value & 255) / 255];
}

function createShader(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create shader");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Shader compilation failed";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

function createProgram(gl: WebGL2RenderingContext, fragmentSource: string) {
  const program = gl.createProgram();
  if (!program) throw new Error("Unable to create shader program");
  const vertex = createShader(gl, gl.VERTEX_SHADER, VERTEX);
  const fragment = createShader(gl, gl.FRAGMENT_SHADER, fragmentSource);
  gl.attachShader(program, vertex);
  gl.attachShader(program, fragment);
  gl.linkProgram(program);
  gl.deleteShader(vertex);
  gl.deleteShader(fragment);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    throw new Error(gl.getProgramInfoLog(program) ?? "Shader link failed");
  }
  return program;
}

function uniform(gl: WebGL2RenderingContext, program: WebGLProgram, name: string) {
  const location = gl.getUniformLocation(program, name);
  if (location === null) throw new Error(`Missing shader uniform: ${name}`);
  return location;
}

export function ThermalPixelShader({
  settings: suppliedSettings,
  cellSize = 10,
  brushRadius = 82,
  heat = 1.05,
  decay = 0.925,
  noise = 0.46,
  speed = 0.68,
  palette = "wild",
  resetKey = 0,
  className,
}: Props) {
  const settings = useMemo(
    () => suppliedSettings ?? {
      cellSize,
      brushRadius,
      heat,
      decay,
      noise,
      speed,
      palette,
    },
    [suppliedSettings, cellSize, brushRadius, heat, decay, noise, speed, palette],
  );
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const settingsRef = useRef(settings);

  useEffect(() => {
    settingsRef.current = settings;
  }, [settings]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
    });
    if (!gl) return;

    let updateProgram: WebGLProgram;
    let displayProgram: WebGLProgram;
    try {
      updateProgram = createProgram(gl, UPDATE);
      displayProgram = createProgram(gl, DISPLAY);
    } catch (error) {
      console.error(error);
      return;
    }

    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    for (const program of [updateProgram, displayProgram]) {
      gl.useProgram(program);
      const position = gl.getAttribLocation(program, "a_position");
      gl.enableVertexAttribArray(position);
      gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
    }

    const updateUniforms = {
      previous: uniform(gl, updateProgram, "u_previous"),
      resolution: uniform(gl, updateProgram, "u_resolution"),
      mouse: uniform(gl, updateProgram, "u_mouse"),
      previousMouse: uniform(gl, updateProgram, "u_previousMouse"),
      active: uniform(gl, updateProgram, "u_active"),
      radius: uniform(gl, updateProgram, "u_radius"),
      heat: uniform(gl, updateProgram, "u_heat"),
      decay: uniform(gl, updateProgram, "u_decay"),
      delta: uniform(gl, updateProgram, "u_delta"),
      pressed: uniform(gl, updateProgram, "u_pressed"),
    };
    const displayUniforms = {
      state: uniform(gl, displayProgram, "u_state"),
      simulationResolution: uniform(gl, displayProgram, "u_simulationResolution"),
      time: uniform(gl, displayProgram, "u_time"),
      noise: uniform(gl, displayProgram, "u_noise"),
      speed: uniform(gl, displayProgram, "u_speed"),
      background: uniform(gl, displayProgram, "u_background"),
      color1: uniform(gl, displayProgram, "u_color1"),
      color2: uniform(gl, displayProgram, "u_color2"),
      color3: uniform(gl, displayProgram, "u_color3"),
      color4: uniform(gl, displayProgram, "u_color4"),
      color5: uniform(gl, displayProgram, "u_color5"),
    };

    let textures: WebGLTexture[] = [];
    let framebuffers: WebGLFramebuffer[] = [];
    let readIndex = 0;
    let simulationWidth = 1;
    let simulationHeight = 1;
    let animationFrame = 0;
    let previousTime = performance.now();
    let disposed = false;
    const pointer = { active: false, pressed: false, x: 0, y: 0, previousX: 0, previousY: 0 };

    const destroyTargets = () => {
      textures.forEach((texture) => gl.deleteTexture(texture));
      framebuffers.forEach((framebuffer) => gl.deleteFramebuffer(framebuffer));
      textures = [];
      framebuffers = [];
    };

    const createTargets = (width: number, height: number) => {
      destroyTargets();
      simulationWidth = width;
      simulationHeight = height;
      for (let index = 0; index < 2; index += 1) {
        const texture = gl.createTexture();
        const framebuffer = gl.createFramebuffer();
        if (!texture || !framebuffer) continue;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, width, height, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
        gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
        gl.viewport(0, 0, width, height);
        gl.clearColor(0, 0, 0, 1);
        gl.clear(gl.COLOR_BUFFER_BIT);
        textures.push(texture);
        framebuffers.push(framebuffer);
      }
      readIndex = 0;
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    };

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = Math.max(1, Math.floor(rect.width * pixelRatio));
      canvas.height = Math.max(1, Math.floor(rect.height * pixelRatio));
      createTargets(
        Math.max(24, Math.ceil(rect.width / settingsRef.current.cellSize)),
        Math.max(16, Math.ceil(rect.height / settingsRef.current.cellSize)),
      );
    };

    const updatePointer = (event: PointerEvent) => {
      const rect = canvas.getBoundingClientRect();
      const nextX = ((event.clientX - rect.left) / rect.width) * simulationWidth;
      const nextY = (1 - (event.clientY - rect.top) / rect.height) * simulationHeight;
      if (!pointer.active) {
        pointer.previousX = nextX;
        pointer.previousY = nextY;
      } else {
        pointer.previousX = pointer.x;
        pointer.previousY = pointer.y;
      }
      pointer.x = nextX;
      pointer.y = nextY;
      pointer.active = true;
    };
    const onPointerEnter = (event: PointerEvent) => updatePointer(event);
    const onPointerMove = (event: PointerEvent) => updatePointer(event);
    const onPointerLeave = () => { if (!pointer.pressed) pointer.active = false; };
    const onPointerDown = (event: PointerEvent) => {
      updatePointer(event);
      pointer.pressed = true;
      canvas.setPointerCapture(event.pointerId);
    };
    const onPointerUp = (event: PointerEvent) => {
      pointer.pressed = false;
      if (canvas.hasPointerCapture(event.pointerId)) canvas.releasePointerCapture(event.pointerId);
    };

    canvas.addEventListener("pointerenter", onPointerEnter);
    canvas.addEventListener("pointermove", onPointerMove);
    canvas.addEventListener("pointerleave", onPointerLeave);
    canvas.addEventListener("pointerdown", onPointerDown);
    canvas.addEventListener("pointerup", onPointerUp);
    canvas.addEventListener("pointercancel", onPointerUp);
    const resizeObserver = new ResizeObserver(resize);
    resizeObserver.observe(canvas);
    resize();

    const render = (time: number) => {
      if (disposed || textures.length < 2 || framebuffers.length < 2) return;
      const delta = Math.min((time - previousTime) / 1000, 0.05);
      previousTime = time;
      const current = settingsRef.current;
      const writeIndex = 1 - readIndex;

      gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
      gl.useProgram(updateProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffers[writeIndex]);
      gl.viewport(0, 0, simulationWidth, simulationHeight);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[readIndex]);
      gl.uniform1i(updateUniforms.previous, 0);
      gl.uniform2f(updateUniforms.resolution, simulationWidth, simulationHeight);
      gl.uniform2f(updateUniforms.mouse, pointer.x, pointer.y);
      gl.uniform2f(updateUniforms.previousMouse, pointer.previousX, pointer.previousY);
      gl.uniform1f(updateUniforms.active, pointer.active ? 1 : 0);
      gl.uniform1f(updateUniforms.radius, current.brushRadius / current.cellSize);
      gl.uniform1f(updateUniforms.heat, current.heat);
      gl.uniform1f(updateUniforms.decay, current.decay);
      gl.uniform1f(updateUniforms.delta, delta);
      gl.uniform1f(updateUniforms.pressed, pointer.pressed ? 1 : 0);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      readIndex = writeIndex;
      pointer.previousX = pointer.x;
      pointer.previousY = pointer.y;

      gl.useProgram(displayProgram);
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, textures[readIndex]);
      gl.uniform1i(displayUniforms.state, 0);
      gl.uniform2f(displayUniforms.simulationResolution, simulationWidth, simulationHeight);
      gl.uniform1f(displayUniforms.time, time / 1000);
      gl.uniform1f(displayUniforms.noise, current.noise);
      gl.uniform1f(displayUniforms.speed, current.speed);
      const colors = PALETTES[current.palette].map(hexToRgb);
      gl.uniform3fv(displayUniforms.background, colors[0]);
      gl.uniform3fv(displayUniforms.color1, colors[1]);
      gl.uniform3fv(displayUniforms.color2, colors[2]);
      gl.uniform3fv(displayUniforms.color3, colors[3]);
      gl.uniform3fv(displayUniforms.color4, colors[4]);
      gl.uniform3fv(displayUniforms.color5, colors[5]);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      animationFrame = requestAnimationFrame(render);
    };
    animationFrame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      cancelAnimationFrame(animationFrame);
      resizeObserver.disconnect();
      canvas.removeEventListener("pointerenter", onPointerEnter);
      canvas.removeEventListener("pointermove", onPointerMove);
      canvas.removeEventListener("pointerleave", onPointerLeave);
      canvas.removeEventListener("pointerdown", onPointerDown);
      canvas.removeEventListener("pointerup", onPointerUp);
      canvas.removeEventListener("pointercancel", onPointerUp);
      destroyTargets();
      gl.deleteBuffer(triangle);
      gl.deleteProgram(updateProgram);
      gl.deleteProgram(displayProgram);
    };
  }, [settings.cellSize, resetKey]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-label="Interactive thermal pixel shader. Move or press across the field to add heat."
    />
  );
}
