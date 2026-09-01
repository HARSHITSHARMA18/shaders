"use client";

import { useEffect, useMemo, useRef } from "react";

export type ExposureGridTreatment = "chroma" | "exposure" | "monochrome";
export type ExposureGridMediaType = "auto" | "image" | "video";
export type ExposureGridColors = { grid: string; accent: string; secondary: string; ink: string; paper: string };
export type ExposureGridSettings = {
  treatment: ExposureGridTreatment; columns: number; rows: number; lineWidth: number; lineOpacity: number;
  activity: number; tempo: number; intensity: number; zoom: number; grain: number; interaction: number; colors: ExposureGridColors;
};

type Props = Partial<Omit<ExposureGridSettings, "colors">> & {
  src?: string; mediaType?: ExposureGridMediaType; colors?: Partial<ExposureGridColors>;
  settings?: ExposureGridSettings; className?: string; alt?: string;
};

const DEFAULT_COLORS: ExposureGridColors = {
  grid: "#EAF1EC", accent: "#FF008B", secondary: "#2600FF", ink: "#17211B", paper: "#F0EAE4",
};
const DEFAULT_SETTINGS: ExposureGridSettings = {
  treatment: "chroma", columns: 4, rows: 4, lineWidth: 2.5, lineOpacity: 0.4,
  activity: 0.4, tempo: 0.96, intensity: 0.78, zoom: 0.68, grain: 0.68, interaction: 0.82, colors: DEFAULT_COLORS,
};

const VERTEX = `#version 300 es
in vec2 a_position;
out vec2 v_uv;
void main() { v_uv = a_position * 0.5 + 0.5; gl_Position = vec4(a_position, 0.0, 1.0); }`;

const FRAGMENT = `#version 300 es
precision highp float;
in vec2 v_uv;
out vec4 outColor;
uniform sampler2D u_source;
uniform vec2 u_resolution;
uniform vec2 u_pointer;
uniform float u_pointerStrength;
uniform float u_sourceAspect;
uniform float u_time;
uniform float u_columns;
uniform float u_rows;
uniform float u_lineWidth;
uniform float u_lineOpacity;
uniform float u_activity;
uniform float u_tempo;
uniform float u_intensity;
uniform float u_zoom;
uniform float u_grain;
uniform float u_interaction;
uniform int u_treatment;
uniform vec3 u_grid;
uniform vec3 u_accent;
uniform vec3 u_secondary;
uniform vec3 u_ink;
uniform vec3 u_paper;

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}
vec2 coverUv(vec2 uv) {
  float viewportAspect = u_resolution.x / max(u_resolution.y, 1.0);
  if (viewportAspect > u_sourceAspect) uv.y = 0.5 + (uv.y - 0.5) * (u_sourceAspect / viewportAspect);
  else uv.x = 0.5 + (uv.x - 0.5) * (viewportAspect / u_sourceAspect);
  return clamp(uv, 0.001, 0.999);
}
vec3 sourceAt(vec2 uv) { return texture(u_source, coverUv(uv)).rgb; }

void main() {
  vec2 cells = vec2(max(u_columns, 1.0), max(u_rows, 1.0));
  vec2 cellSpace = v_uv * cells;
  vec2 cellId = floor(cellSpace);
  vec2 local = fract(cellSpace);
  vec2 center = (cellId + 0.5) / cells;
  float seed = hash(cellId + 3.17);
  float totalCells = cells.x * cells.y;
  float cellIndex = cellId.y * cells.x + cellId.x;
  float sequence = u_time * max(u_tempo, 0.0);
  float sequenceIndex = floor(sequence);
  float sequenceLife = fract(sequence);
  float primaryA = floor(hash(vec2(sequenceIndex + 0.71, 8.17)) * totalCells);
  float primaryB = floor(hash(vec2(sequenceIndex + 1.71, 8.17)) * totalCells);
  float primaryMatchA = 1.0 - step(0.1, abs(cellIndex - primaryA));
  float primaryMatchB = 1.0 - step(0.1, abs(cellIndex - primaryB));
  float handoff = smoothstep(0.72, 0.96, sequenceLife);
  float primaryPresence = mix(primaryMatchA, primaryMatchB, handoff);
  float echoIndex = floor(hash(vec2(sequenceIndex + 4.37, 2.91)) * totalCells);
  float echoMatch = 1.0 - step(0.1, abs(cellIndex - echoIndex));
  float echoGate = step(hash(vec2(sequenceIndex + 7.23, 5.14)), u_activity);
  float echoPresence = echoMatch * echoGate * 0.32 * (1.0 - handoff);
  float randomPresence = max(primaryPresence, echoPresence);
  vec2 pointerCell = floor(clamp(u_pointer, 0.0, 0.9999) * cells);
  float pointerCellMatch = 1.0 - step(0.1, length(cellId - pointerCell));
  float focusedPresence = pointerCellMatch * u_pointerStrength * u_interaction;
  float presence = clamp(max(randomPresence * (1.0 - u_pointerStrength * u_interaction), focusedPresence), 0.0, 1.0);

  float scale = 1.0 - u_zoom * (0.055 + seed * 0.035) * presence;
  vec2 direction = vec2(hash(cellId + sequenceIndex + 9.1), hash(cellId - sequenceIndex + 4.2)) - 0.5;
  vec2 sampleUv = center + (v_uv - center) * scale + direction / cells * u_zoom * 0.025 * presence;
  vec3 source = sourceAt(v_uv);
  vec3 sampled = sourceAt(sampleUv);
  float luminance = dot(sampled, vec3(0.299, 0.587, 0.114));
  vec2 sourceTexel = 1.4 / max(u_resolution, vec2(1.0));
  float luminanceX = dot(sourceAt(sampleUv + vec2(sourceTexel.x, 0.0)), vec3(0.299, 0.587, 0.114));
  float luminanceY = dot(sourceAt(sampleUv + vec2(0.0, sourceTexel.y)), vec3(0.299, 0.587, 0.114));
  float relief = clamp((abs(luminance - luminanceX) + abs(luminance - luminanceY)) * 5.5, 0.0, 1.0);
  vec3 treated;
  if (u_treatment == 1) {
    float exposure = mix(0.78, 1.34, seed);
    treated = pow(max(sampled * exposure, 0.0), vec3(mix(1.08, 0.88, seed)));
    treated = mix(treated, u_paper, max(0.0, exposure - 1.0) * 0.08);
  } else if (u_treatment == 2) {
    treated = mix(u_ink, u_paper, smoothstep(0.12, 0.92, luminance));
    treated = mix(treated, sampled, 0.08);
  } else {
    // A photographic ink separation rather than a flat color overlay. Tiny
    // channel offsets keep fine source detail while giving the sampled cell a
    // tactile, printed character at any scale.
    vec2 registration = direction / cells * (0.006 + u_zoom * 0.008);
    vec3 registered = vec3(
      sourceAt(sampleUv + registration).r,
      sampled.g,
      sourceAt(sampleUv - registration).b
    );
    float registeredLuma = dot(registered, vec3(0.299, 0.587, 0.114));
    float surround = (
      dot(sourceAt(sampleUv + vec2(sourceTexel.x * 4.0, 0.0)), vec3(0.299, 0.587, 0.114)) +
      dot(sourceAt(sampleUv - vec2(sourceTexel.x * 4.0, 0.0)), vec3(0.299, 0.587, 0.114)) +
      dot(sourceAt(sampleUv + vec2(0.0, sourceTexel.y * 4.0)), vec3(0.299, 0.587, 0.114)) +
      dot(sourceAt(sampleUv - vec2(0.0, sourceTexel.y * 4.0)), vec3(0.299, 0.587, 0.114))
    ) * 0.25;
    float photographicDetail = clamp((registeredLuma - surround) * 3.2, -0.22, 0.22);
    float tone = smoothstep(0.07, 0.93, registeredLuma + photographicDetail * 1.7 + relief * 0.035);
    float highlight = smoothstep(0.58, 0.98, registeredLuma);
    vec3 shadowInk = mix(u_secondary, u_ink, 0.14);
    vec3 lightInk = mix(u_accent, u_paper, 0.16);
    vec3 inkSeparation = mix(shadowInk, lightInk, tone);
    inkSeparation = mix(inkSeparation, u_paper, highlight * 0.46);

    vec3 multiplyPass = registered * (0.56 + inkSeparation * 0.78);
    vec3 screenPass = 1.0 - (1.0 - registered) * (1.0 - inkSeparation);
    vec3 photographicPass = mix(multiplyPass, screenPass, smoothstep(0.22, 0.78, registeredLuma));
    treated = mix(inkSeparation, photographicPass, 0.48);
    treated *= mix(0.78, 1.1, tone);
    treated += photographicDetail * mix(vec3(0.62), u_paper, 0.24);
    treated += relief * mix(u_secondary, u_accent, tone) * 0.055;
  }
  float stableGrain = hash(gl_FragCoord.xy + cellId * 37.0);
  float paperGrain = (stableGrain - 0.5) * u_grain;
  float raster = sin((gl_FragCoord.x + gl_FragCoord.y) * 1.05) * 0.5 + 0.5;
  treated += paperGrain * vec3(0.1, 0.08, 0.12);
  treated = mix(treated, treated * (0.94 + raster * 0.06), u_grain * 0.28);
  vec3 color = mix(source, treated, presence * u_intensity);

  vec2 edgeDistance = min(local, 1.0 - local);
  vec2 pixelInCell = 1.0 / max(u_resolution / cells, vec2(1.0));
  float verticalLine = 1.0 - smoothstep(0.0, pixelInCell.x * u_lineWidth, edgeDistance.x);
  float horizontalLine = 1.0 - smoothstep(0.0, pixelInCell.y * u_lineWidth, edgeDistance.y);
  float gridLine = max(verticalLine, horizontalLine);
  float verticalGlow = 1.0 - smoothstep(0.0, pixelInCell.x * u_lineWidth * 3.8, edgeDistance.x);
  float horizontalGlow = 1.0 - smoothstep(0.0, pixelInCell.y * u_lineWidth * 3.8, edgeDistance.y);
  float gridGlow = max(verticalGlow, horizontalGlow);
  color = mix(color, u_grid, gridGlow * u_lineOpacity * 0.07);
  color = mix(color, u_grid, gridLine * u_lineOpacity * 0.52);
  color = mix(color, u_paper, gridLine * presence * u_lineOpacity * 0.2);
  float vignette = smoothstep(0.92, 0.28, length((v_uv - 0.5) * vec2(0.72, 1.0)));
  color *= mix(0.96, 1.01, vignette);
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
  if (!shader) throw new Error("Unable to create exposure grid shader.");
  gl.shaderSource(shader, source);
  gl.compileShader(shader);
  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    const message = gl.getShaderInfoLog(shader) ?? "Unknown shader compilation error.";
    gl.deleteShader(shader);
    throw new Error(message);
  }
  return shader;
}
function drawFallback(canvas: HTMLCanvasElement, colors: ExposureGridColors) {
  const context = canvas.getContext("2d");
  if (!context) return;
  const sky = context.createLinearGradient(0, 0, 0, canvas.height);
  sky.addColorStop(0, "#77A8C8"); sky.addColorStop(0.58, colors.paper); sky.addColorStop(1, "#58745A");
  context.fillStyle = sky; context.fillRect(0, 0, canvas.width, canvas.height);
  context.fillStyle = "#E9ECE2"; context.beginPath();
  context.arc(canvas.width * 0.55, canvas.height * 0.46, canvas.height * 0.31, Math.PI, Math.PI * 2); context.fill();
  context.fillStyle = "#415D42"; context.beginPath(); context.moveTo(0, canvas.height * 0.72);
  context.quadraticCurveTo(canvas.width * 0.25, canvas.height * 0.5, canvas.width * 0.52, canvas.height * 0.77);
  context.quadraticCurveTo(canvas.width * 0.76, canvas.height * 0.55, canvas.width, canvas.height * 0.68);
  context.lineTo(canvas.width, canvas.height); context.lineTo(0, canvas.height); context.closePath(); context.fill();
}

export function ExposureGrid({
  src = "/exposure-grid-mountain.jpg", mediaType = "auto", colors, settings, className,
  alt = "Editorial image grid with changing sampled cells", ...overrides
}: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const resolved = useMemo<ExposureGridSettings>(() => ({
    ...DEFAULT_SETTINGS, ...overrides, ...settings, colors: { ...DEFAULT_COLORS, ...colors, ...settings?.colors },
  }), [colors, overrides, settings]);
  const settingsRef = useRef(resolved);
  useEffect(() => { settingsRef.current = resolved; }, [resolved]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const gl = canvas.getContext("webgl2", { alpha: false, antialias: false, powerPreference: "high-performance" });
    if (!gl) return;
    const vertex = compile(gl, gl.VERTEX_SHADER, VERTEX);
    const fragment = compile(gl, gl.FRAGMENT_SHADER, FRAGMENT);
    const program = gl.createProgram();
    if (!program) return;
    gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program);
    gl.deleteShader(vertex); gl.deleteShader(fragment);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program) ?? "Unable to link exposure grid shader.");
    const triangle = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, triangle);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
    const position = gl.getAttribLocation(program, "a_position");
    gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);

    const texture = gl.createTexture();
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    const fallback = document.createElement("canvas"); fallback.width = 1600; fallback.height = 1000;
    drawFallback(fallback, settingsRef.current.colors); gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, fallback);
    let sourceAspect = 1.6;
    let image: HTMLImageElement | null = null;
    let video: HTMLVideoElement | null = null;
    const inferredVideo = mediaType === "video" || (mediaType === "auto" && Boolean(src?.match(/\.(mp4|webm|mov)(\?|$)/i)));
    if (src && inferredVideo) {
      video = document.createElement("video"); video.crossOrigin = "anonymous"; video.muted = true; video.loop = true; video.playsInline = true; video.src = src;
      video.addEventListener("loadeddata", () => { sourceAspect = video!.videoWidth / Math.max(video!.videoHeight, 1); void video!.play().catch(() => undefined); }, { once: true });
    } else if (src) {
      image = new Image(); image.crossOrigin = "anonymous"; image.decoding = "async";
      image.onload = () => { sourceAspect = image!.naturalWidth / Math.max(image!.naturalHeight, 1); gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image!); };
      image.src = src;
    }
    gl.useProgram(program);
    const uniform = (name: string) => gl.getUniformLocation(program, name);
    const uniforms = {
      source: uniform("u_source"), resolution: uniform("u_resolution"), pointer: uniform("u_pointer"), pointerStrength: uniform("u_pointerStrength"),
      sourceAspect: uniform("u_sourceAspect"), time: uniform("u_time"), columns: uniform("u_columns"), rows: uniform("u_rows"),
      lineWidth: uniform("u_lineWidth"), lineOpacity: uniform("u_lineOpacity"), activity: uniform("u_activity"), tempo: uniform("u_tempo"),
      intensity: uniform("u_intensity"), zoom: uniform("u_zoom"), grain: uniform("u_grain"), interaction: uniform("u_interaction"),
      treatment: uniform("u_treatment"), grid: uniform("u_grid"), accent: uniform("u_accent"), secondary: uniform("u_secondary"), ink: uniform("u_ink"), paper: uniform("u_paper"),
    };
    gl.uniform1i(uniforms.source, 0);
    const target = { x: 0.5, y: 0.5, strength: 0 };
    const pointer = { ...target };
    const move = (event: PointerEvent) => { const bounds = canvas.getBoundingClientRect(); target.x = (event.clientX - bounds.left) / Math.max(bounds.width, 1); target.y = 1 - (event.clientY - bounds.top) / Math.max(bounds.height, 1); target.strength = 1; };
    const leave = () => { target.strength = 0; };
    canvas.addEventListener("pointermove", move); canvas.addEventListener("pointerleave", leave);
    const resize = () => { const bounds = canvas.getBoundingClientRect(); const ratio = Math.min(window.devicePixelRatio || 1, 1.75); const width = Math.max(1, Math.round(bounds.width * ratio)); const height = Math.max(1, Math.round(bounds.height * ratio)); if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; } };
    const observer = new ResizeObserver(resize); observer.observe(canvas); resize();
    let frame = 0; let disposed = false; const started = performance.now();
    const render = (now: number) => {
      if (disposed) return;
      const current = settingsRef.current;
      pointer.x += (target.x - pointer.x) * 0.13; pointer.y += (target.y - pointer.y) * 0.13; pointer.strength += (target.strength - pointer.strength) * 0.1;
      if (video && video.readyState >= video.HAVE_CURRENT_DATA) { sourceAspect = video.videoWidth / Math.max(video.videoHeight, 1); gl.bindTexture(gl.TEXTURE_2D, texture); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video); }
      gl.viewport(0, 0, canvas.width, canvas.height); gl.useProgram(program); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.uniform2f(uniforms.resolution, canvas.width, canvas.height); gl.uniform2f(uniforms.pointer, pointer.x, pointer.y); gl.uniform1f(uniforms.pointerStrength, pointer.strength);
      gl.uniform1f(uniforms.sourceAspect, sourceAspect); gl.uniform1f(uniforms.time, (now - started) / 1000); gl.uniform1f(uniforms.columns, Math.round(current.columns)); gl.uniform1f(uniforms.rows, Math.round(current.rows));
      gl.uniform1f(uniforms.lineWidth, current.lineWidth); gl.uniform1f(uniforms.lineOpacity, current.lineOpacity); gl.uniform1f(uniforms.activity, current.activity); gl.uniform1f(uniforms.tempo, current.tempo);
      gl.uniform1f(uniforms.intensity, current.intensity); gl.uniform1f(uniforms.zoom, current.zoom); gl.uniform1f(uniforms.grain, current.grain); gl.uniform1f(uniforms.interaction, current.interaction);
      gl.uniform1i(uniforms.treatment, current.treatment === "exposure" ? 1 : current.treatment === "monochrome" ? 2 : 0);
      gl.uniform3fv(uniforms.grid, parseColor(current.colors.grid)); gl.uniform3fv(uniforms.accent, parseColor(current.colors.accent)); gl.uniform3fv(uniforms.secondary, parseColor(current.colors.secondary));
      gl.uniform3fv(uniforms.ink, parseColor(current.colors.ink)); gl.uniform3fv(uniforms.paper, parseColor(current.colors.paper)); gl.drawArrays(gl.TRIANGLES, 0, 3);
      frame = requestAnimationFrame(render);
    };
    frame = requestAnimationFrame(render);
    return () => {
      disposed = true; cancelAnimationFrame(frame); observer.disconnect(); canvas.removeEventListener("pointermove", move); canvas.removeEventListener("pointerleave", leave);
      if (image) image.onload = null; if (video) { video.pause(); video.removeAttribute("src"); video.load(); }
      gl.deleteTexture(texture); gl.deleteBuffer(triangle); gl.deleteProgram(program);
    };
  }, [mediaType, src]);
  return <canvas ref={canvasRef} className={className} role="img" aria-label={alt} />;
}
