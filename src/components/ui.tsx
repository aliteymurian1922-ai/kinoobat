import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes } from "react";

export function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-bold text-ink-soft">{label}</span>
      {children}
      {hint && <span className="mt-1 block text-xs text-faint">{hint}</span>}
    </label>
  );
}

const inputBase =
  "w-full min-h-12 rounded-xl border border-line bg-surface px-4 text-base text-ink placeholder:text-faint focus:border-accent focus:outline-none transition-colors";

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className = "", ...rest } = props;
  return <input {...rest} className={`${inputBase} ${className}`} />;
}

export function SelectInput(props: SelectHTMLAttributes<HTMLSelectElement>) {
  const { className = "", children, ...rest } = props;
  return (
    <select {...rest} className={`${inputBase} appearance-none ${className}`}>
      {children}
    </select>
  );
}

export function ErrorText({ children }: { children: ReactNode }) {
  if (!children) return null;
  return (
    <p role="alert" className="rounded-xl bg-danger-soft px-4 py-3 text-sm font-bold text-danger">
      {children}
    </p>
  );
}

export function StatusChip({ status }: { status: "open" | "paused" | "closed" }) {
  const map = {
    open: { label: "صف امروز باز است", cls: "bg-ok-soft text-ok border-ok/25" },
    paused: { label: "صف موقتاً متوقفه", cls: "bg-warn-soft text-ink-soft border-warn/30" },
    closed: { label: "صف امروز بسته است", cls: "bg-cream-deep text-muted border-line" },
  } as const;
  const { label, cls } = map[status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${cls}`}>
      <span
        className={`h-1.5 w-1.5 rounded-full ${
          status === "open" ? "bg-ok" : status === "paused" ? "bg-warn soft-pulse" : "bg-faint"
        }`}
        aria-hidden
      />
      {label}
    </span>
  );
}
