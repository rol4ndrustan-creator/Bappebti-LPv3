import { ComplaintSource } from "@/lib/types";
import { cn } from "@/lib/utils";

const SOURCE: Record<ComplaintSource, { icon: string; label: string; title: string; cls: string }> = {
  Bappebti: { icon: "🏛️", label: "Bappebti", title: "Pengaduan masuk dari kanal resmi Bappebti", cls: "bg-navy/10 text-navy border-navy/20" },
  Platform: { icon: "🏢", label: "Platform", title: "Pengaduan masuk dari kanal internal Pialang", cls: "bg-amber-bg text-amber border-amber/30" },
};

/** Badge "Sumber Pengaduan" (List Revisi 11 #5). */
export function SourceBadge({ source, withDescription = false }: { source?: ComplaintSource; withDescription?: boolean }) {
  const s = SOURCE[source ?? "Bappebti"];
  return (
    <span className="inline-flex flex-wrap items-center gap-1.5">
      <span title={s.title} className={cn("inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-semibold whitespace-nowrap", s.cls)}>
        <span aria-hidden>{s.icon}</span> {s.label}
      </span>
      {withDescription && <span className="text-[11px] text-muted font-normal">({s.title.replace("Pengaduan masuk dari ", "")})</span>}
    </span>
  );
}
