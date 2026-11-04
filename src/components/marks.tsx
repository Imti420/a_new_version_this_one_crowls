import type { ReactNode } from "react";
import type { AppStatus, Circular } from "@/data/types";
import { formatDayTime } from "@/lib/dates";
import { cn } from "@/lib/cn";
import { evidenceLabel, statusLabel } from "@/lib/status";

export const controlClass =
  "h-11 w-full border border-ink bg-paper px-3 font-sans text-sm text-ink outline-none transition-colors duration-150 focus:bg-panel";

export function PageHead({
  kicker,
  title,
  lede,
  aside,
}: {
  kicker: string;
  title: string;
  lede?: string;
  aside?: ReactNode;
}) {
  return (
    <header className="mb-8 flex flex-col gap-4 border-b border-ink pb-5 md:flex-row md:items-end md:justify-between">
      <div>
        <p className="font-mono text-xs uppercase tracking-widest text-mute">{kicker}</p>
        <h1 className="mt-1 font-display text-5xl font-bold uppercase leading-none text-balance md:text-7xl">
          {title}
        </h1>
        {lede ? <p className="mt-3 max-w-3xl text-base text-pretty text-ink">{lede}</p> : null}
      </div>
      {aside}
    </header>
  );
}

export function SectionLabel({ index, children }: { index?: string; children: ReactNode }) {
  return (
    <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-tight md:text-4xl">
      {index ? <span className="mr-3 font-mono text-sm font-medium text-mute">{index}</span> : null}
      {children}
    </h2>
  );
}

export function StatusPill({ status }: { status: AppStatus }) {
  const open = status === "open";
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center border px-2 font-mono text-xs tracking-widest",
        open ? "border-accent bg-accent text-paper" : "border-ink text-ink",
        status === "not_announced" && "border-mute text-mute",
        status === "closed" && "text-mute",
      )}
    >
      {statusLabel(status)}
    </span>
  );
}

export function EvidenceStamp({ circular }: { circular: Circular }) {
  const label = evidenceLabel(circular.confidence, circular.publication);
  const hot = circular.confidence === "preliminary";
  return (
    <span
      className={cn(
        "inline-flex h-7 items-center border px-2 font-mono text-xs tracking-widest",
        hot ? "border-accent text-accent" : "border-ink text-ink",
        circular.confidence === "not-announced" && "border-mute text-mute",
      )}
    >
      {label}
    </span>
  );
}

export function Monogram({ text }: { text: string }) {
  return (
    <span className="flex h-16 w-16 shrink-0 items-center justify-center border border-ink bg-paper font-display text-xl font-bold uppercase leading-none">
      {text.slice(0, 5)}
    </span>
  );
}

export function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="border-b border-ink py-3">
      <div className="font-mono text-xs uppercase tracking-widest text-mute">{label}</div>
      <div className="mt-1 text-sm">{children}</div>
    </div>
  );
}

export function Announced({
  day,
  time,
}: {
  day: string | null;
  time?: string | null;
}) {
  if (!day) return <span className="font-mono text-sm text-mute">NOT ANNOUNCED</span>;
  return <span className="font-mono text-sm">{formatDayTime(day, time ?? null)}</span>;
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="underline decoration-1 underline-offset-4 hover:text-accent"
    >
      {children}
    </a>
  );
}

export function TextButton({
  children,
  onClick,
  tone = "ink",
  type = "button",
  disabled,
}: {
  children: ReactNode;
  onClick?: () => void;
  tone?: "ink" | "paper" | "accent" | "ghost";
  type?: "button" | "submit";
  disabled?: boolean;
}) {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "inline-flex h-11 items-center justify-center border px-3 font-display text-sm font-semibold uppercase tracking-widest transition-colors duration-150 disabled:opacity-40",
        tone === "ink" && "border-ink bg-ink text-paper hover:bg-accent hover:border-accent",
        tone === "paper" && "border-ink bg-paper text-ink hover:bg-panel",
        tone === "accent" && "border-accent bg-accent text-paper",
        tone === "ghost" && "border-ink bg-transparent text-ink hover:bg-ink hover:text-paper",
      )}
    >
      {children}
    </button>
  );
}
