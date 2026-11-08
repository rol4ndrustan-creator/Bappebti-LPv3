import { cn } from "@/lib/utils";
import { LinkedEcosystemEntity } from "@/lib/types";

const TYPE_CLASS: Record<LinkedEcosystemEntity["type"], string> = {
  Bursa: "bg-navy/10 text-navy border-navy/20",
  Kliring: "bg-amber-bg text-amber border-amber/30",
  Custody: "bg-green-bg text-green border-green/30",
};

function abbreviate(name: string): string {
  const words = name.replace(/^PT\s+/i, "").split(/\s+/).filter(Boolean);
  const letters = words.map((w) => w[0]).join("").toUpperCase();
  return letters.length > 1 ? letters.slice(0, 4) : name.slice(0, 6);
}

/**
 * Kolom MEMBER pada tabel listing (List Revisi 16 #3): murni informatif / read-only.
 * Penugasan anggota pasar dilakukan dari panel "Anggota Pasar yang Dilibatkan" di detail kasus.
 */
export function MemberChips({ entities }: { entities: LinkedEcosystemEntity[] | null | undefined }) {
  const list = entities ?? [];
  if (list.length === 0) {
    return (
      <span className="text-muted" aria-label="Belum ada anggota ditugaskan">
        -
      </span>
    );
  }
  return (
    <div className="flex flex-wrap items-center gap-1">
      {list.map((e) => (
        <span
          key={e.id}
          title={e.name}
          className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap", TYPE_CLASS[e.type])}
        >
          {e.type}: {abbreviate(e.name)}
        </span>
      ))}
    </div>
  );
}
