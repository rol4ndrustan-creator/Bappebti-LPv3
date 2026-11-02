"use client";

import * as React from "react";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { LinkedEcosystemEntity } from "@/lib/types";

const TYPE_CLASS: Record<LinkedEcosystemEntity["type"], string> = {
  Bursa: "bg-navy/10 text-navy border-navy/20",
  Kliring: "bg-amber-bg text-amber border-amber/30",
  Custody: "bg-green-bg text-green border-green/30",
};

const ECOSYSTEM_TYPES: LinkedEcosystemEntity["type"][] = ["Bursa", "Kliring", "Custody"];

function abbreviate(name: string): string {
  const words = name.replace(/^PT\s+/i, "").split(/\s+/).filter(Boolean);
  const letters = words.map((w) => w[0]).join("").toUpperCase();
  return letters.length > 1 ? letters.slice(0, 4) : name.slice(0, 6);
}

function Chip({ entity }: { entity: LinkedEcosystemEntity }) {
  return (
    <span
      title={entity.name}
      className={cn("inline-flex items-center rounded-md border px-1.5 py-0.5 text-[10.5px] font-medium whitespace-nowrap", TYPE_CLASS[entity.type])}
    >
      {entity.type}: {abbreviate(entity.name)}
    </span>
  );
}

export function MemberLinkCell({
  ticket,
  entities: entitiesProp,
  candidateEntities,
  onSave,
}: {
  ticket: string;
  /** Boleh kosong/null bila pengaduan diselesaikan langsung Nasabah–Pialang. */
  entities: LinkedEcosystemEntity[] | null | undefined;
  candidateEntities: { id: string; name: string; type: LinkedEcosystemEntity["type"] }[];
  onSave: (ticket: string, entities: LinkedEcosystemEntity[]) => void;
}) {
  const entities = entitiesProp ?? [];
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<LinkedEcosystemEntity[]>(entities);
  const [addType, setAddType] = React.useState<LinkedEcosystemEntity["type"]>("Bursa");
  const [addName, setAddName] = React.useState("");

  function openModal() {
    setDraft(entities);
    setAddType("Bursa");
    setAddName("");
    setOpen(true);
  }

  function addToDraft() {
    const candidate = candidateEntities.find((e) => e.type === addType && e.name === addName);
    if (!candidate) return;
    if (draft.some((d) => d.id === candidate.id)) return;
    setDraft((prev) => [...prev, { id: candidate.id, type: candidate.type, name: candidate.name }]);
    setAddName("");
  }

  function removeFromDraft(id: string) {
    setDraft((prev) => prev.filter((d) => d.id !== id));
  }

  function save() {
    onSave(ticket, draft);
    setOpen(false);
  }

  const filteredCandidates = candidateEntities.filter((e) => e.type === addType);
  const shown = entities.length <= 2 ? entities : entities.slice(0, 1);
  const hiddenCount = entities.length - shown.length;
  const hiddenNames = entities.slice(shown.length).map((e) => e.name);

  return (
    <>
      <div className="flex items-center gap-1 flex-wrap">
        {entities.length === 0 ? (
          // Banyak pengaduan selesai langsung antara Nasabah & Pialang tanpa anggota bursa/kliring:
          // tampilkan status netral + tombol kecil agar tata letak tabel tetap rapi.
          <span className="inline-flex items-center gap-1.5 whitespace-nowrap">
            <span className="text-[11px] text-muted italic">Belum ada anggota yang ditugaskan</span>
            <button
              type="button"
              onClick={openModal}
              className="inline-flex items-center gap-0.5 rounded-md border border-dashed border-muted/60 px-1.5 py-0.5 text-[10.5px] text-muted hover:border-navy hover:text-navy"
            >
              <Plus className="size-3" /> Tugaskan Member
            </button>
          </span>
        ) : (
          <>
            {shown.map((e) => (
              <button type="button" key={e.id} onClick={openModal}>
                <Chip entity={e} />
              </button>
            ))}
            {hiddenCount > 0 && (
              <button
                type="button"
                onClick={openModal}
                title={hiddenNames.join(", ")}
                className="inline-flex items-center rounded-md border border-border bg-muted-bg px-1.5 py-0.5 text-[10.5px] font-medium text-muted"
              >
                +{hiddenCount}
              </button>
            )}
            <button
              type="button"
              onClick={openModal}
              title="Hubungkan member lain"
              className="flex items-center justify-center rounded-full border border-dashed border-muted/60 size-5 text-muted hover:border-navy hover:text-navy shrink-0"
            >
              <Plus className="size-3" />
            </button>
          </>
        )}
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hubungkan Member Ekosistem</DialogTitle>
            <DialogDescription>Tiket {ticket} dapat dihubungkan ke lebih dari satu lembaga pasar.</DialogDescription>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-xs font-semibold text-navy">Lembaga Terhubung Saat Ini</p>
            {draft.length === 0 && <p className="text-xs text-muted">Belum ada lembaga ekosistem yang terhubung.</p>}
            {draft.map((e) => (
              <div key={e.id} className="flex items-center justify-between gap-2 rounded-md border border-border px-3 py-1.5">
                <div className="flex items-center gap-2 min-w-0">
                  <Chip entity={e} />
                  <span className="text-xs text-foreground truncate">{e.name}</span>
                </div>
                <button
                  type="button"
                  title="Hapus relasi"
                  onClick={() => removeFromDraft(e.id)}
                  className="rounded p-1 text-muted hover:bg-red-bg hover:text-red shrink-0"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="space-y-2 pt-3 border-t border-border">
            <p className="text-xs font-semibold text-navy">Tambah Member Baru</p>
            <div className="grid grid-cols-2 gap-2">
              <Select
                value={addType}
                onChange={(e) => {
                  setAddType(e.target.value as LinkedEcosystemEntity["type"]);
                  setAddName("");
                }}
              >
                {ECOSYSTEM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
              <SearchableSelect
                value={addName}
                onChange={setAddName}
                groups={[{ label: addType, options: filteredCandidates.map((e) => e.name) }]}
                placeholder="Pilih lembaga..."
              />
            </div>
            <Button size="sm" variant="secondary" disabled={!addName} onClick={addToDraft}>
              <Plus className="size-3.5" /> Tambah ke Daftar
            </Button>
          </div>

          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setOpen(false)}>Batal</Button>
            <Button size="sm" onClick={save}>Simpan Perubahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
