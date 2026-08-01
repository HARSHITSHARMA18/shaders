"use client";

import {
  useCallback,
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";
import { createPortal } from "react-dom";

type Props = {
  children: ReactNode;
  className?: string;
  content: ReactNode;
  side?: "top" | "bottom";
};

type Position = {
  arrowOffset: number;
  x: number;
  y: number;
};

export function Tooltip({ children, className, content, side = "top" }: Props) {
  const tooltipId = useId();
  const triggerRef = useRef<HTMLSpanElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState<Position | null>(null);

  const updatePosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) return;
    const bounds = trigger.getBoundingClientRect();
    const naturalX = bounds.left + bounds.width / 2;
    const tooltipWidth = contentRef.current?.offsetWidth ?? 0;
    const edge = tooltipWidth / 2 + 10;
    const x = tooltipWidth
      ? Math.min(window.innerWidth - edge, Math.max(edge, naturalX))
      : naturalX;

    setPosition({
      arrowOffset: naturalX - x,
      x,
      y: side === "top" ? bounds.top - 8 : bounds.bottom + 8,
    });
  }, [side]);

  useLayoutEffect(() => {
    if (!open) return;

    const frame = window.requestAnimationFrame(updatePosition);
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
    };
  }, [content, open, updatePosition]);

  const close = () => {
    setOpen(false);
    setPosition(null);
  };

  return (
    <>
      <span
        className={`solaceTooltipTrigger${className ? ` ${className}` : ""}`}
        ref={triggerRef}
        aria-describedby={open ? tooltipId : undefined}
        onPointerEnter={(event) => {
          if (event.pointerType !== "touch") setOpen(true);
        }}
        onPointerLeave={close}
        onFocusCapture={() => setOpen(true)}
        onBlurCapture={close}
        onKeyDown={(event) => {
          if (event.key === "Escape") close();
        }}
      >
        {children}
      </span>
      {open && typeof document !== "undefined"
        ? createPortal(
            <div
              className="solaceTooltip"
              data-positioned={position ? "true" : "false"}
              data-side={side}
              id={tooltipId}
              ref={contentRef}
              role="tooltip"
              style={{
                "--tooltip-arrow-offset": `${position?.arrowOffset ?? 0}px`,
                left: position?.x ?? 0,
                top: position?.y ?? 0,
              } as CSSProperties}
            >
              {content}
            </div>,
            document.body,
          )
        : null}
    </>
  );
}
