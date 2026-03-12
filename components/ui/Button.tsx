"use client";

import { ButtonHTMLAttributes } from "react";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "danger" | "ghost";
  size?: "sm" | "md";
}

export function Button({
  variant = "primary",
  size = "md",
  className = "",
  children,
  ...props
}: ButtonProps) {
  const base =
    "inline-flex cursor-pointer items-center gap-2 rounded-lg font-medium transition-[transform,background-color,border-color,color,box-shadow] duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ff7d00] focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  const variants = {
    primary:
      "bg-[#ff7d00] text-white shadow-[0_10px_24px_rgba(255,125,0,0.18)] hover:-translate-y-0.5 hover:bg-[#e67200] hover:shadow-[0_16px_30px_rgba(255,125,0,0.24)] active:translate-y-0 active:bg-[#cc6600]",
    secondary:
      "border border-gray-200 bg-white text-[#001524] shadow-[0_8px_22px_rgba(0,21,36,0.06)] hover:-translate-y-0.5 hover:bg-gray-50 hover:shadow-[0_12px_28px_rgba(0,21,36,0.1)] active:translate-y-0",
    danger: "text-[#78290f] hover:bg-red-50 hover:text-red-700",
    ghost: "text-gray-500 hover:bg-gray-100 hover:text-[#001524]",
  };

  return (
    <button
      data-variant={variant}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
}
