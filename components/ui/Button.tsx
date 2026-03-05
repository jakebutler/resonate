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
    "inline-flex items-center gap-2 font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer";

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
  };

  const variants = {
    primary:
      "bg-[#ff7d00] text-white hover:bg-[#e67200] active:bg-[#cc6600]",
    secondary:
      "bg-white text-[#001524] border border-gray-200 hover:bg-gray-50",
    danger: "text-[#78290f] hover:text-red-700 hover:bg-red-50",
    ghost: "text-gray-500 hover:text-[#001524] hover:bg-gray-100",
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
