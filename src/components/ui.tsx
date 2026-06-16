"use client";

import { ReactNode, useEffect, useState } from "react";

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

// Number input that accepts BOTH "." and "," as the decimal separator
// (fixes iOS keyboards that only offer a comma).
export function DecimalInput({
  value,
  onChange,
  className = "",
  placeholder,
  ...rest
}: {
  value: number | undefined;
  onChange: (n: number) => void;
  className?: string;
  placeholder?: string;
} & Omit<
  React.InputHTMLAttributes<HTMLInputElement>,
  "value" | "onChange" | "type"
>) {
  const [str, setStr] = useState(value ? String(value) : "");

  useEffect(() => {
    const cur = parseFloat(str.replace(",", "."));
    const curNum = isNaN(cur) ? 0 : cur;
    if (curNum !== (value ?? 0)) setStr(value != null && value !== 0 ? String(value) : str === "" ? "" : str);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <input
      {...rest}
      type="text"
      inputMode="decimal"
      placeholder={placeholder}
      value={str}
      onChange={(e) => {
        const v = e.target.value;
        if (!/^[0-9]*[.,]?[0-9]*$/.test(v)) return; // digits + one separator only
        setStr(v);
        const n = parseFloat(v.replace(",", "."));
        onChange(isNaN(n) ? 0 : n);
      }}
      className={`${inputBase} ${className}`}
    />
  );
}

export function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className="flex items-center gap-2 text-sm active:opacity-70"
    >
      <span
        className={`relative h-5 w-9 rounded-full transition-colors ${
          checked ? "bg-accent" : "bg-line"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-4" : "translate-x-0.5"
          }`}
        />
      </span>
      <span className={checked ? "text-foreground" : "text-muted"}>{label}</span>
    </button>
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
