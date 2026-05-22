import React, { type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type TextareaHTMLAttributes, type SelectHTMLAttributes } from "react";
import { cn, STATUS_COLOR } from "../../lib/utils";
import { Loader2, X } from "lucide-react";

// ── Button ────────────────────────────────────────────────────────────────────
type BtnVariant = "primary" | "outline" | "ghost" | "danger" | "success";
type BtnSize    = "xs" | "sm" | "md" | "lg";

interface BtnProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: BtnVariant;
  size?: BtnSize;
  loading?: boolean;
  children: ReactNode;
}

const VARIANT: Record<BtnVariant, string> = {
  primary: "bg-red-600 text-white hover:bg-red-700 shadow-sm shadow-red-900/20",
  outline: "border border-zinc-700 text-zinc-200 hover:border-zinc-500 hover:bg-zinc-800/60",
  ghost:   "text-zinc-400 hover:text-zinc-100 hover:bg-zinc-800/60",
  danger:  "bg-red-500/15 text-red-400 border border-red-500/30 hover:bg-red-500/25",
  success: "bg-green-500/15 text-green-400 border border-green-500/30 hover:bg-green-500/25",
};

const SIZE: Record<BtnSize, string> = {
  xs: "px-2 py-1 text-xs gap-1",
  sm: "px-3 py-1.5 text-xs gap-1.5",
  md: "px-4 py-2 text-sm gap-2",
  lg: "px-5 py-2.5 text-base gap-2",
};

export function Btn({ variant = "outline", size = "md", loading, disabled, children, className, ...rest }: BtnProps) {
  return (
    <button
      disabled={disabled || loading}
      className={cn(
        "inline-flex items-center justify-center font-semibold rounded-lg transition-all duration-150 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap",
        VARIANT[variant], SIZE[size], className
      )}
      {...rest}
    >
      {loading && <Loader2 size={14} className="animate-spin" />}
      {children}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
export function Badge({ children, color }: { children: ReactNode; color?: string }) {
  const key = typeof children === "string" ? children.toLowerCase() : "";
  const cls = color ? STATUS_COLOR[color] : STATUS_COLOR[key] ?? "text-zinc-400 bg-zinc-500/15";
  return (
    <span className={cn("inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold tracking-wide", cls)}>
      {children}
    </span>
  );
}

// ── Input ─────────────────────────────────────────────────────────────────────
export const Input = React.forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...rest }, ref) => (
    <input
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm placeholder:text-zinc-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all",
        className
      )}
      {...rest}
    />
  )
);
Input.displayName = "Input";

// ── Textarea ─────────────────────────────────────────────────────────────────
export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...rest }, ref) => (
    <textarea
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm placeholder:text-zinc-500 outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all resize-y min-h-[80px]",
        className
      )}
      {...rest}
    />
  )
);
Textarea.displayName = "Textarea";

// ── Select ────────────────────────────────────────────────────────────────────
export const Select = React.forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...rest }, ref) => (
    <select
      ref={ref}
      className={cn(
        "w-full px-3 py-2 rounded-lg border border-zinc-700 bg-zinc-900 text-zinc-100 text-sm outline-none focus:border-red-500 focus:ring-2 focus:ring-red-500/20 transition-all cursor-pointer",
        className
      )}
      {...rest}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

// ── FormGroup ─────────────────────────────────────────────────────────────────
export function FormGroup({ label, children, error }: { label?: string; children: ReactNode; error?: string }) {
  return (
    <div className="mb-4">
      {label && <label className="block text-[11px] font-semibold text-zinc-400 uppercase tracking-widest mb-1.5">{label}</label>}
      {children}
      {error && <p className="mt-1 text-xs text-red-400">{error}</p>}
    </div>
  );
}

// ── Card ──────────────────────────────────────────────────────────────────────
export function Card({ children, className, style }: { children: ReactNode; className?: string; style?: React.CSSProperties }) {
  return (
    <div className={cn("bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden", className)} style={style}>
      {children}
    </div>
  );
}

// ── StatCard ──────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string;
  value: string | number;
  sub?: string;
  subColor?: string;
  accent?: string;
  icon?: React.ElementType;
  sparkData?: number[];
}

export function StatCard({ label, value, sub, subColor, accent = "bg-red-500", icon: Icon, sparkData }: StatCardProps) {
  const max = sparkData ? Math.max(...sparkData) : 1;
  return (
    <Card className="relative p-5">
      <div className={cn("absolute top-0 right-0 w-1 h-full rounded-r-xl", accent)} />
      <div className="flex items-start justify-between mb-3">
        <span className="text-[11px] font-semibold text-zinc-500 uppercase tracking-widest">{label}</span>
        {Icon && <Icon size={16} className="text-zinc-600" />}
      </div>
      <div className="text-3xl font-bold font-[Playfair_Display] text-zinc-100 leading-none mb-2">
        {typeof value === "number" ? value.toLocaleString() : value}
      </div>
      {sub && <p className={cn("text-[11px]", subColor ?? "text-zinc-500")}>{sub}</p>}
      {sparkData && (
        <div className="flex items-end gap-0.5 h-8 mt-3">
          {sparkData.map((v, i) => (
            <div key={i} className="flex-1 bg-red-500/30 rounded-sm hover:bg-red-500/60 transition-colors"
              style={{ height: `${Math.max(15, (v / max) * 100)}%` }} />
          ))}
        </div>
      )}
    </Card>
  );
}

// ── Table ─────────────────────────────────────────────────────────────────────
export function Table({ children }: { children: ReactNode }) {
  return (
    <div className="w-full overflow-x-auto">
      <table className="w-full border-collapse">{children}</table>
    </div>
  );
}

export function Th({ children }: { children: ReactNode }) {
  return (
    <th className="px-4 py-2.5 text-left text-[11px] font-semibold uppercase tracking-widest text-zinc-500 border-b border-zinc-800 bg-zinc-950">
      {children}
    </th>
  );
}

export function Td({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <td className={cn("px-4 py-3 text-sm text-zinc-400 border-b border-zinc-800/60 align-middle", className)}>
      {children}
    </td>
  );
}

// ── Modal ─────────────────────────────────────────────────────────────────────
interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  width?: string;
}

export function Modal({ open, onClose, title, children, footer, width = "w-[500px]" }: ModalProps) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/70 z-[1000] flex items-center justify-center backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className={cn("bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col max-h-[85vh]", width)}>
        <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
          <h3 className="font-[Playfair_Display] text-lg font-semibold text-zinc-100">{title}</h3>
          <button onClick={onClose} className="text-zinc-500 hover:text-zinc-100 transition-colors">
            <X size={18} />
          </button>
        </div>
        <div className="px-5 py-4 overflow-y-auto flex-1">{children}</div>
        {footer && (
          <div className="flex gap-2.5 justify-end px-5 py-4 border-t border-zinc-800">{footer}</div>
        )}
      </div>
    </div>
  );
}

// ── Toggle ────────────────────────────────────────────────────────────────────
export function Toggle({ on, onChange }: { on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!on)}
      className={cn(
        "relative w-10 h-5.5 rounded-full transition-colors duration-200 flex-shrink-0",
        on ? "bg-red-600" : "bg-zinc-700"
      )}
      style={{ height: 22, minWidth: 40 }}
    >
      <span
        className="absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow transition-transform duration-200"
        style={{ width: 18, height: 18, transform: on ? "translateX(18px)" : "translateX(0)" }}
      />
    </button>
  );
}

// ── Spinner ───────────────────────────────────────────────────────────────────
export function Spinner({ size = 24 }: { size?: number }) {
  return (
    <div className="flex items-center justify-center p-10">
      <Loader2 size={size} className="animate-spin text-red-500" />
    </div>
  );
}

// ── Empty ─────────────────────────────────────────────────────────────────────
export function Empty({ message = "No data found" }: { message?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-zinc-600">
      <span className="text-4xl mb-3 opacity-30">📭</span>
      <p className="text-sm">{message}</p>
    </div>
  );
}

// ── SectionHead ───────────────────────────────────────────────────────────────
export function SectionHead({ title, action }: { title: string; action?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-4">
      <h3 className="text-sm font-semibold text-zinc-200 flex items-center gap-2">
        <span className="w-0.5 h-4 bg-red-500 rounded-sm inline-block" />
        {title}
      </h3>
      {action}
    </div>
  );
}

// ── BarRow ────────────────────────────────────────────────────────────────────
export function BarRow({ label, value, max, color = "bg-red-500" }: { label: string; value: number; max: number; color?: string }) {
  const pct = max > 0 ? Math.min(100, (value / max) * 100) : 0;
  return (
    <div className="flex items-center gap-3 mb-2.5">
      <span className="text-xs text-zinc-500 w-28 text-right shrink-0 truncate">{label}</span>
      <div className="flex-1 bg-zinc-800 rounded-full h-2 overflow-hidden">
        <div className={cn("h-full rounded-full transition-all duration-700", color)} style={{ width: `${pct}%` }} />
      </div>
      <span className="text-xs text-zinc-500 w-12 shrink-0">{value?.toLocaleString()}</span>
    </div>
  );
}

// ── Avatar ────────────────────────────────────────────────────────────────────
export function Avatar({ name, src, size = 32 }: { name: string; src?: string; size?: number }) {
  const initials = name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  if (src) {
    return <img src={src} alt={name} className="rounded-full object-cover" style={{ width: size, height: size }} />;
  }
  return (
    <div className="rounded-full bg-red-600 flex items-center justify-center text-white font-bold shrink-0"
      style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initials}
    </div>
  );
}

// ── Pagination ────────────────────────────────────────────────────────────────
export function Pagination({ page, total, limit, onChange }: { page: number; total: number; limit: number; onChange: (p: number) => void }) {
  const pages = Math.ceil(total / limit);
  if (pages <= 1) return null;
  return (
    <div className="flex items-center justify-between px-4 py-3 border-t border-zinc-800">
      <span className="text-xs text-zinc-500">Page {page} of {pages} · {total.toLocaleString()} total</span>
      <div className="flex gap-2">
        <Btn size="sm" onClick={() => onChange(Math.max(1, page - 1))} disabled={page === 1}>← Prev</Btn>
        <Btn size="sm" onClick={() => onChange(Math.min(pages, page + 1))} disabled={page === pages}>Next →</Btn>
      </div>
    </div>
  );
}
