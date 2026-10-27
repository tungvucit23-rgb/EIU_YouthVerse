"use client";

import { useEffect, useRef, type ReactNode } from "react";

/** Native modal supplies focus trapping, inert background and focus restoration. */
export function Modal({ children, labelId, className = "", onClose }: { children: ReactNode; labelId: string; className?: string; onClose: () => void }) {
  const dialog = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const element = dialog.current;
    element?.showModal();
    return () => element?.close();
  }, []);
  return <dialog ref={dialog} className={className} aria-labelledby={labelId} onCancel={(event) => { event.preventDefault(); onClose(); }} onClick={(event) => { if (event.target === event.currentTarget) onClose(); }}>{children}</dialog>;
}
