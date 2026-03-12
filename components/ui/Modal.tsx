"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  size?: "md" | "lg" | "xl" | "full";
  bodyClassName?: string;
  panelClassName?: string;
}

const SIZE_CLASSES = {
  md: "max-w-lg",
  lg: "max-w-3xl",
  xl: "max-w-6xl",
  full: "max-w-[min(96rem,calc(100vw-2rem))]",
} as const;

export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  size = "md",
  bodyClassName = "",
  panelClassName = "",
}: ModalProps) {
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto p-4 sm:p-6">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`relative mx-auto flex w-full max-h-[calc(100dvh-2rem)] flex-col overflow-hidden rounded-[28px] border border-gray-200 bg-white shadow-2xl ${SIZE_CLASSES[size]} ${panelClassName}`}
      >
        <div className="flex items-center justify-between border-b border-gray-100 px-6 py-4">
          <h2 className="text-lg font-semibold text-[#001524] font-forum">{title}</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 p-1 rounded-lg hover:bg-gray-100 transition-colors"
            aria-label="Close modal"
          >
            <X size={18} />
          </button>
        </div>
        <div className={`min-h-0 flex-1 overflow-y-auto p-6 ${bodyClassName}`}>
          {children}
        </div>
        {footer && (
          <div className="border-t border-gray-100 bg-white px-6 py-4">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
