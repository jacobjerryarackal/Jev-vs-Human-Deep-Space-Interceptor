import * as React from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "cyan" | "amber" | "rose" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variantStyles = {
    default: "bg-slate-800 text-slate-200 border-slate-700",
    cyan: "bg-cyan-950/80 text-cyan-300 border-cyan-800",
    amber: "bg-amber-950/80 text-amber-300 border-amber-800",
    rose: "bg-rose-950/80 text-rose-300 border-rose-800",
    outline: "border-slate-800 text-slate-400 bg-transparent",
  };

  return (
    <div
      className={cn(
        "inline-flex items-center rounded border px-2 py-0.5 text-[10px] font-mono font-medium transition-colors",
        variantStyles[variant],
        className
      )}
      {...props}
    />
  );
}

export function Card({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-lg border border-slate-800 bg-[#060c1c]/90 text-slate-100 shadow-md",
        className
      )}
      {...props}
    />
  );
}
