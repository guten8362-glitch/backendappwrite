import { cn } from "@/lib/utils";
import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from "react";

export function Button({
  variant = "primary",
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "primary" | "ghost" | "quiet" }) {
  return (
    <button
      className={cn(
        "press inline-flex h-13 w-full items-center justify-center gap-2 rounded-xl px-6 text-[0.95rem] font-medium disabled:opacity-40",
        variant === "primary" &&
          "bg-primary text-primary-foreground shadow-[var(--shadow-soft)] hover:brightness-110",
        variant === "ghost" && "border border-border bg-card text-foreground hover:bg-muted",
        variant === "quiet" && "text-muted-foreground hover:text-foreground",
        className,
      )}
      {...props}
    />
  );
}

export function Field({
  label,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.8rem] font-medium text-muted-foreground">{label}</span>
      <input
        className={cn(
          "h-12 w-full rounded-xl border border-border bg-card px-4 text-[0.95rem] outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10",
          className,
        )}
        {...props}
      />
    </label>
  );
}

export function TextField({
  label,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[0.8rem] font-medium text-muted-foreground">{label}</span>
      <textarea
        rows={3}
        className="w-full resize-none rounded-xl border border-border bg-card px-4 py-3 text-[0.95rem] outline-none transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-4 focus:ring-primary/10"
        {...props}
      />
    </label>
  );
}

export function PageTitle({
  eyebrow,
  title,
  subtitle,
  action,
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  action?: ReactNode;
}) {
  return (
    <header className="fade-up mb-4 sm:mb-8 flex flex-col gap-2 sm:gap-3 sm:flex-row sm:items-start sm:justify-between">
      <div>
        {eyebrow && (
          <p className="mb-1 sm:mb-2 text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-primary hidden sm:block">
            {eyebrow}
          </p>
        )}
        <h1 className="text-xl font-semibold sm:text-[2.1rem]">{title}</h1>
        {subtitle && <p className="mt-1 sm:mt-2 max-w-xl text-sm sm:text-[0.95rem] text-muted-foreground hidden sm:block">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}

export function Surface({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <section
      className={cn("surface rise p-6 sm:p-8", className)}
      style={{ animationDelay: `${delay}ms` }}
    >
      {children}
    </section>
  );
}

export function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-6 border-b border-border/70 py-3.5 last:border-0">
      <span className="text-[0.85rem] text-muted-foreground">{label}</span>
      <span className="text-right text-[0.95rem] font-medium">{value || "—"}</span>
    </div>
  );
}
