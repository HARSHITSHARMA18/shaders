"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { MovingProofAnnouncement } from "./MovingProofAnnouncement";
import "./announcements.css";

export function BrandLabAnnouncement({ isOpen: controlledOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const [internalOpen, setInternalOpen] = useState(true);
  const dialog = useRef<HTMLDialogElement>(null);
  const open = controlledOpen ?? internalOpen;
  const close = useCallback(() => { setInternalOpen(false); onClose?.(); }, [onClose]);
  useEffect(() => {
    const element = dialog.current;
    if (!open || !element) return;
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    element.showModal();
    document.body.style.overflow = "hidden";
    return () => { element.close(); document.body.style.overflow = overflow; previous?.focus({ preventScroll: true }); };
  }, [open]);
  return <dialog ref={dialog} className="proof-dialog" aria-labelledby="proof-title" aria-describedby="proof-description" onCancel={event => { event.preventDefault(); close(); }} onClick={event => { if (event.target === event.currentTarget) { const rect = event.currentTarget.getBoundingClientRect(); if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) close(); } }}>
    {open && <MovingProofAnnouncement onClose={close} />}
  </dialog>;
}
