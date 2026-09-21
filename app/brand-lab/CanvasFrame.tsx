"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const GUTTER = 22;
type Edge = "top" | "right" | "bottom" | "left";

function Ruler({ edge, length }: { edge: Edge; length: number }) {
  const vertical = edge === "left" || edge === "right";
  const extent = Math.max(0, length - GUTTER * 2);
  const ticks = Array.from({ length: Math.floor(extent / 10) + 1 }, (_, index) => index * 10);
  const path = ticks.map(value => {
    const size = value % 100 === 0 ? 9 : value % 50 === 0 ? 6 : 3;
    if (edge === "top") return `M${value} ${GUTTER}v-${size}`;
    if (edge === "bottom") return `M${value} 0v${size}`;
    if (edge === "left") return `M${GUTTER} ${value}h-${size}`;
    return `M0 ${value}h${size}`;
  }).join(" ");
  return <svg className={`bl-ruler bl-ruler-${edge}`} width={vertical ? GUTTER : extent} height={vertical ? extent : GUTTER}>
    <path d={path} fill="none" stroke="currentColor" strokeWidth="1" />
    {ticks.filter(value => value % 100 === 0 && value + 25 < extent).map(value => vertical
      ? <text key={value} x={edge === "left" ? 9 : 13} y={value + 6} transform={`rotate(${edge === "left" ? -90 : 90} ${edge === "left" ? 9 : 13} ${value + 6})`}>{value}</text>
      : <text key={value} x={value + 4} y={edge === "top" ? 9 : 19}>{value}</text>)}
  </svg>;
}

export function CanvasFrame({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  useEffect(() => {
    const element = ref.current;
    if (!element) return;
    const observer = new ResizeObserver(() => {
      const { width, height } = element.getBoundingClientRect();
      setSize(previous => previous.width === Math.ceil(width) && previous.height === Math.ceil(height) ? previous : { width: Math.ceil(width), height: Math.ceil(height) });
    });
    observer.observe(element);
    return () => observer.disconnect();
  }, []);
  return <div className="bl-canvas-frame" ref={ref}>
    <div className="bl-canvas-rulers" aria-hidden="true">
      <span className="bl-ruler-corner bl-ruler-origin">PX</span>
      <Ruler edge="top" length={size.width} />
      <span className="bl-ruler-corner bl-ruler-corner-tr" />
      <Ruler edge="left" length={size.height} />
      <Ruler edge="right" length={size.height} />
      <span className="bl-ruler-corner bl-ruler-corner-bl" />
      <Ruler edge="bottom" length={size.width} />
      <span className="bl-ruler-corner bl-ruler-corner-br" />
    </div>
    {children}
  </div>;
}
