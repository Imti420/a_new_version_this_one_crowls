import { cn } from "@/lib/cn";

function Mark({ ink = false }: { ink?: boolean }) {
  return (
    <span className={cn("relative inline-block h-4 w-4 shrink-0", ink ? "bg-ink" : "bg-accent")} aria-hidden>
      <span className={cn("absolute top-0 right-0 h-1.5 w-1.5", ink ? "bg-paper" : "bg-ink")} />
      <span className={cn("absolute bottom-0 left-0 h-px w-3", ink ? "bg-paper" : "bg-paper")} />
    </span>
  );
}

export function Signature({ variant }: { variant: "rail" | "colophon" | "about" }) {
  const reveal = "AN INDEPENDENT PROJECT BY IMTI — ADMISSION//26";
  if (variant === "about") {
    return (
      <div className="border border-ink p-4">
        <div className="flex items-center gap-3">
          <Mark ink />
          <p className="font-display text-4xl font-bold uppercase leading-none tracking-tight">Imti's creation</p>
        </div>
        <p className="mt-3 font-mono text-xs tracking-widest text-mute">{reveal}</p>
        <p className="mt-3 max-w-2xl text-sm">
          ADMISSION//26 is an independent admission intelligence archive. It is not a university portal and it does not
          speak for any admission office.
        </p>
      </div>
    );
  }
  if (variant === "colophon") {
    return (
      <div className="group">
        <div className="flex items-center gap-2">
          <Mark ink />
          <p className="font-display text-2xl font-bold uppercase leading-none tracking-tight">Imti's creation</p>
        </div>
        <p className="mt-1 max-h-0 overflow-hidden font-mono text-xs tracking-widest text-mute transition-[max-height] duration-200 group-hover:max-h-12 group-focus-within:max-h-12">
          {reveal}
        </p>
      </div>
    );
  }
  return (
    <div className="group px-4 py-4">
      <div className="flex items-center gap-2">
        <Mark />
        <p className="font-display text-lg font-bold uppercase leading-none tracking-wide text-paper">Designed & built by Imti</p>
      </div>
      <p className="mt-2 font-mono text-xs leading-relaxed tracking-widest text-paper/80 md:max-h-0 md:overflow-hidden md:group-hover:max-h-16 md:group-focus-within:max-h-16">
        {reveal}
      </p>
    </div>
  );
}
