"use client";

import { useEffect, useMemo, useRef } from "react";

export type ThermalEtchColors = {
  ink: string;
  paper: string;
  cool: string;
  warm: string;
  hot: string;
  peak: string;
};

export type ThermalEtchSettings = {
  progress: number;
  speed: number;
  edgeWidth: number;
  heat: number;
  turbulence: number;
  grain: number;
  contrast: number;
  detail: number;
  colors: ThermalEtchColors;
};

type Props = Partial<Omit<ThermalEtchSettings, "colors">> & {
  src?: string;
  colors?: Partial<ThermalEtchColors>;
  settings?: ThermalEtchSettings;
  className?: string;
  alt?: string;
};

const DEFAULT_COLORS: ThermalEtchColors = {
  ink: "#10251A",
  paper: "#78935F",
  cool: "#23604B",
  warm: "#F2E85B",
  hot: "#FF654F",
  peak: "#A535FF",
};

const DEFAULT_SETTINGS: ThermalEtchSettings = {
  progress: 0.12,
  speed: 0.42,
  edgeWidth: 0.075,
  heat: 1.05,
  turbulence: 0.62,
  grain: 0.58,
  contrast: 1.18,
  detail: 0.82,
  colors: DEFAULT_COLORS,
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

uniform sampler2D u_image;
uniform float u_hasImage;
uniform vec2 u_resolution;
uniform vec2 u_mouse;
uniform float u_pointer;
uniform float u_imageAspect;
uniform float u_time;
uniform float u_progress;
uniform float u_speed;
uniform float u_edgeWidth;
uniform float u_heat;
uniform float u_turbulence;
uniform float u_grain;
uniform float u_contrast;
uniform float u_detail;
uniform vec3 u_ink;
uniform vec3 u_paper;
uniform vec3 u_cool;
uniform vec3 u_warm;
uniform vec3 u_hot;
uniform vec3 u_peak;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

float noise(vec2 p) {
  vec2 i = floor(p);
  vec2 f = fract(p);
  f = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(hash(i), hash(i + vec2(1.0, 0.0)), f.x),
    mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), f.x),
    f.y
  );
}

float fbm(vec2 p) {
  float value = 0.0;
  float amplitude = 0.52;
  for (int i = 0; i < 4; i++) {
    value += noise(p) * amplitude;
    p = mat2(1.72, 1.18, -1.18, 1.72) * p + 1.7;
    amplitude *= 0.5;
  }
  return value;
}

vec3 thermalPalette(float value) {
  value = clamp(value, 0.0, 1.0);
  vec3 color = mix(u_ink, u_cool, smoothstep(0.04, 0.28, value));
  color = mix(color, u_warm, smoothstep(0.3, 0.55, value));
  color = mix(color, u_hot, smoothstep(0.56, 0.76, value));
  color = mix(color, u_peak, smoothstep(0.78, 0.94, value));
  return color;
}

vec2 coverUv(vec2 uv) {
  float viewportAspect = u_resolution.x / max(u_resolution.y, 1.0);
  if (viewportAspect > u_imageAspect) {
    uv.y = 0.5 + (uv.y - 0.5) * (u_imageAspect / viewportAspect);
  } else {
    uv.x = 0.5 + (uv.x - 0.5) * (viewportAspect / u_imageAspect);
  }
  return uv;
}

void main() {
  vec2 imageUv = coverUv(v_uv);
  vec2 texel = 1.0 / max(u_resolution, vec2(1.0));
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  vec2 p = (v_uv - 0.5) * vec2(aspect, 1.0);
  float slowTime = u_time * 0.035;
  vec2 drift = vec2(slowTime, -slowTime * 0.72);
  float terrain = fbm(p * 2.7 + drift);
  float secondaryTerrain = fbm(p * 6.2 - drift * 0.55);
  float contourCoordinate = terrain * 27.0
    + secondaryTerrain * 5.5
    + p.y * 12.0
    + sin(p.x * 5.2 + p.y * 2.4) * 0.52;
  float contourDistance = abs(fract(contourCoordinate) - 0.5);
  float contour = 1.0 - smoothstep(0.032, 0.09, contourDistance);
  float woven = 1.0 - smoothstep(
    0.025,
    0.075,
    abs(sin((p.x * 0.86 + p.y * 0.28 + terrain * 0.1) * 190.0))
  );
  float orbital = 1.0 - smoothstep(
    0.02,
    0.07,
    abs(sin(length(p - vec2(0.28, -0.08)) * 96.0 + terrain * 5.0))
  );
  float paperFiber = noise(v_uv * vec2(260.0, 190.0));
  float proceduralLuminance = clamp(
    0.76
      + (terrain - 0.5) * 0.24
      + (paperFiber - 0.5) * 0.08
      - contour * 0.44
      - woven * 0.1
      - orbital * contour * 0.1,
    0.03,
    0.98
  );
  float proceduralEngraving = clamp(contour * 0.88 + woven * 0.16 + orbital * contour * 0.2, 0.0, 1.0);

  vec3 source = texture(u_image, imageUv).rgb;
  float imageLuminance = dot(source, vec3(0.299, 0.587, 0.114));
  float luminanceX = dot(texture(u_image, imageUv + vec2(texel.x * 1.6, 0.0)).rgb, vec3(0.299, 0.587, 0.114));
  float luminanceY = dot(texture(u_image, imageUv + vec2(0.0, texel.y * 1.6)).rgb, vec3(0.299, 0.587, 0.114));
  float imageEngraving = clamp((abs(imageLuminance - luminanceX) + abs(imageLuminance - luminanceY)) * 5.5, 0.0, 1.0);
  float luminance = mix(proceduralLuminance, imageLuminance, u_hasImage);
  float engraving = mix(proceduralEngraving, imageEngraving, u_hasImage);

  float t = u_time * max(u_speed, 0.0);
  float cycle = 0.5 - 0.5 * cos((u_progress + t * 0.085) * 6.2831853);
  float front = mix(-0.2, 1.2, cycle);
  float broadWarp = fbm(vec2(imageUv.x * 2.25, imageUv.y * 1.4) + vec2(t * 0.035, -t * 0.025));
  float ribbonWarp = noise(vec2(imageUv.x * 7.5 - t * 0.08, imageUv.y * 2.2));
  float warpedY = imageUv.y
    + (broadWarp - 0.5) * u_turbulence * 0.2
    + (ribbonWarp - 0.5) * u_turbulence * 0.055;
  float signedDistance = front - warpedY;
  float width = max(0.012, u_edgeWidth);
  float burned = smoothstep(-width, width, signedDistance);
  float activeEdge = exp(-abs(signedDistance) / max(width * 0.55, 0.008));

  vec2 pointerDelta = (v_uv - u_mouse) * vec2(aspect, 1.0);
  float cursorHeat = exp(-dot(pointerDelta, pointerDelta) * 18.0) * u_pointer;
  float coarseGrain = noise(imageUv * vec2(170.0, 210.0) + floor(u_time * 10.0));
  float fineGrain = hash(gl_FragCoord.xy + floor(u_time * 17.0));
  float grain = ((coarseGrain - 0.5) * 0.65 + (fineGrain - 0.5) * 0.35) * u_grain;

  float shapedLuminance = pow(clamp(luminance, 0.0, 1.0), max(0.3, u_contrast));
  vec3 baseDuotone = mix(u_ink, u_paper, shapedLuminance);
  baseDuotone *= 1.0 - engraving * u_detail * 0.34;

  float thermalValue = shapedLuminance * 0.68
    + burned * u_heat * 0.24
    + activeEdge * u_heat * 0.42
    + cursorHeat * u_heat * 0.24
    + grain * 0.42;
  vec3 burnedColor = thermalPalette(thermalValue);
  burnedColor *= 1.0 - engraving * u_detail * 0.46;
  burnedColor += grain * vec3(0.22, 0.18, 0.08);

  float reveal = clamp(burned + cursorHeat * 0.38, 0.0, 1.0);
  vec3 color = mix(baseDuotone, burnedColor, reveal);
  vec3 edgeColor = mix(u_warm, u_peak, smoothstep(0.25, 0.85, shapedLuminance + grain));
  color = mix(color, edgeColor, activeEdge * (0.3 + u_heat * 0.34));
  color += activeEdge * u_warm * 0.12 * u_heat;
  color = mix(color, thermalPalette(shapedLuminance + cursorHeat * 0.55 + grain * 0.25), cursorHeat * 0.28);

  float vignette = smoothstep(0.95, 0.34, length((v_uv - 0.5) * vec2(aspect, 1.0)));
  color *= mix(0.86, 1.04, vignette);
  outColor = vec4(color, 1.0);
}`;

function parseColor(hex: string) {
  const source = hex.replace("#", "");
  const normalized = source.length === 3
    ? source.split("").map((character) => character + character).join("")
    : source.slice(0, 6);
  const value = Number.parseInt(normalized, 16);
  return new Float32Array([
    ((value >> 16) & 255) / 255,
    ((value >> 8) & 255) / 255,
    (value & 255) / 255,
  ]);
}

function compile(gl: WebGL2RenderingContext, type: number, source: string) {
  const shader = gl.createShader(type);
  if (!shader) throw new Error("Unable to create thermal etch shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}

export function ThermalEtchBurn({
  src,
  className,
  alt = "Interactive procedural thermal etch burn",
  settings,
  colors,
  ...overrides
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolved = useMemo<ThermalEtchSettings>(() => ({
    ...DEFAULT_SETTINGS,
    ...overrides,
    ...settings,
    colors: {
      ...DEFAULT_COLORS,
      ...colors,
      ...settings?.colors,
    },
  }), [colors, overrides, settings]);
  const settingsRef = useRef(resolved);

  useEffect(() => {
    settingsRef.current = resolved;
  }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", {
      alpha: false,
      antialias: false,
      powerPreference: "high-performance",
    });
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
      throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link thermal etch shader.");
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
    gl.texImage2D(
      gl.TEXTURE_2D,
      0,
      gl.RGBA,
      1,
      1,
      0,
      gl.RGBA,
      gl.UNSIGNED_BYTE,
      new Uint8Array([116, 136, 95, 255]),
    );

    let imageAspect = 1;
    let hasImage = 0;
    const image = src ? new Image() : null;
    if (image && src) {
      image.crossOrigin = "anonymous";
      image.decoding = "async";
      image.onload = () => {
        if (!texture) return;
        imageAspect = image.naturalWidth / Math.max(image.naturalHeight, 1);
        hasImage = 1;
        gl.bindTexture(gl.TEXTURE_2D, texture);
        gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      };
      image.src = src;
    }

    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      image: uniform("u_image"),
      hasImage: uniform("u_hasImage"),
      resolution: uniform("u_resolution"),
      mouse: uniform("u_mouse"),
      pointer: uniform("u_pointer"),
      imageAspect: uniform("u_imageAspect"),
      time: uniform("u_time"),
      progress: uniform("u_progress"),
      speed: uniform("u_speed"),
      edgeWidth: uniform("u_edgeWidth"),
      heat: uniform("u_heat"),
      turbulence: uniform("u_turbulence"),
      grain: uniform("u_grain"),
      contrast: uniform("u_contrast"),
      detail: uniform("u_detail"),
      ink: uniform("u_ink"),
      paper: uniform("u_paper"),
      cool: uniform("u_cool"),
      warm: uniform("u_warm"),
      hot: uniform("u_hot"),
      peak: uniform("u_peak"),
    };
    gl.uniform1i(uniforms.image, 0);

    const target = { x: 0.5, y: 0.5, strength: 0 };
    const pointer = { x: 0.5, y: 0.5, strength: 0 };
    const move = (event: PointerEvent) => {
      const bounds = canvas.getBoundingClientRect();
      target.x = (event.clientX - bounds.left) / Math.max(bounds.width, 1);
      target.y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1);
      target.strength = 1;
    };
    const enter = () => { target.strength = 1; };
    const leave = () => { target.strength = 0; };
    canvas.addEventListener("pointermove", move);
    canvas.addEventListener("pointerenter", enter);
    canvas.addEventListener("pointerleave", leave);

    const resize = () => {
      const bounds = canvas.getBoundingClientRect();
      const ratio = Math.min(window.devicePixelRatio || 1, 2);
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
      pointer.x += (target.x - pointer.x) * 0.1;
      pointer.y += (target.y - pointer.y) * 0.1;
      pointer.strength += (target.strength - pointer.strength) * 0.08;
      const current = settingsRef.current;
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.useProgram(program);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height);
      gl.uniform2f(uniforms.mouse, pointer.x, pointer.y);
      gl.uniform1f(uniforms.pointer, pointer.strength);
      gl.uniform1f(uniforms.imageAspect, imageAspect);
      gl.uniform1f(uniforms.hasImage, hasImage);
      gl.uniform1f(uniforms.time, (now - started) / 1000);
      gl.uniform1f(uniforms.progress, current.progress);
      gl.uniform1f(uniforms.speed, current.speed);
      gl.uniform1f(uniforms.edgeWidth, current.edgeWidth);
      gl.uniform1f(uniforms.heat, current.heat);
      gl.uniform1f(uniforms.turbulence, current.turbulence);
      gl.uniform1f(uniforms.grain, current.grain);
      gl.uniform1f(uniforms.contrast, current.contrast);
      gl.uniform1f(uniforms.detail, current.detail);
      gl.uniform3fv(uniforms.ink, parseColor(current.colors.ink));
      gl.uniform3fv(uniforms.paper, parseColor(current.colors.paper));
      gl.uniform3fv(uniforms.cool, parseColor(current.colors.cool));
      gl.uniform3fv(uniforms.warm, parseColor(current.colors.warm));
      gl.uniform3fv(uniforms.hot, parseColor(current.colors.hot));
      gl.uniform3fv(uniforms.peak, parseColor(current.colors.peak));
      gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);

    return () => {
      disposed = true;
      if (image) image.onload = null;
      cancelAnimationFrame(frame);
      observer.disconnect();
      canvas.removeEventListener("pointermove", move);
      canvas.removeEventListener("pointerenter", enter);
      canvas.removeEventListener("pointerleave", leave);
      gl.deleteTexture(texture);
      gl.deleteBuffer(triangle);
      gl.deleteProgram(program);
    };
  }, [src]);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      role="img"
      aria-label={alt}
    />
  );
}
