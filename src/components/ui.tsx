"use client";

import { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-2xl bg-card border border-line p-4 ${className}`}
    >
      {children}
    </div>
  );
}

export function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-medium uppercase tracking-wide text-muted">
        {label}
      </span>
      {children}
    </label>
  );
}

const inputBase =
  "w-full rounded-xl bg-card2 border border-line px-3 py-2.5 text-foreground placeholder:text-muted outline-none focus:border-accent transition-colors";

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return <input {...props} className={`${inputBase} ${props.className ?? ""}`} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  return (
    <textarea
      {...props}
      className={`${inputBase} resize-none ${props.className ?? ""}`}
    />
  );
}

export function Button({
  children,
  variant = "primary",
  className = "",
  ...props
}: {
  children: ReactNode;
  variant?: "primary" | "ghost" | "danger";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const styles = {
    primary: "bg-accent text-black font-semibold active:opacity-80",
    ghost: "bg-card2 border border-line text-foreground active:opacity-70",
    danger: "bg-card2 border border-line text-red-400 active:opacity-70",
  }[variant];
  return (
    <button
      {...props}
      className={`rounded-xl px-4 py-2.5 text-sm transition active:scale-[0.98] disabled:opacity-40 ${styles} ${className}`}
    >
      {children}
    </button>
  );
}

export function Stat({
  label,
  value,
  sub,
  accent,
}: {
  label: string;
  value: ReactNode;
  sub?: string;
  accent?: boolean;
}) {
  return (
    <div className="rounded-2xl bg-card border border-line p-4">
      <div className="text-xs uppercase tracking-wide text-muted">{label}</div>
      <div
        className={`mt-1 text-2xl font-bold tabular-nums ${
          accent ? "text-accent" : ""
        }`}
      >
        {value}
      </div>
      {sub && <div className="mt-0.5 text-xs text-muted">{sub}</div>}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-2xl border border-dashed border-line p-8 text-center text-sm text-muted">
      {children}
    </div>
  );
}
