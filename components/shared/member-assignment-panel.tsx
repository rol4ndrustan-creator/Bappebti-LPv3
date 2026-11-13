"use client";

import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { useToast } from "@/components/shared/toast-provider";
import { ECOSYSTEM_LEMBAGA } from "@/lib/ecosystem-lembaga";
import { setLinkedEcosystemEntities, addTimelineEvent } from "@/lib/mock-service/store";
import { logAudit } from "@/lib/mock-service/audit-store";
import { useDemoSession } from "@/lib/demo-session";
import { ComplaintCase, LinkedEcosystemEntity, MemberInvolvementStatus } from "@/lib/types";
import { Building2, Check, Landmark, Pencil, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

type LembagaType = LinkedEcosystemEntity["type"];

const TYPE_META: Record<LembagaType, { label: string; desc: string; icon: React.ComponentType<{ className?: string }>; cls: string }> = {
  Bursa: { label: "Bursa Berjangka", desc: "Mediasi & supervisi Pialang anggota bursa", icon: Landmark, cls: "bg-navy/10 text-navy border-navy/20" },
  Kliring: { label: "Lembaga Kliring", desc: "Rekonsiliasi & settlement transaksi", icon: Building2, cls: "bg-amber-bg text-amber border-amber/30" },
  Custody: { label: "Custody / Kustodian", desc: "Verifikasi aset dan dana nasabah", icon: ShieldCheck, cls: "bg-green-bg text-green border-green/30" },
};
const STATUS_TONE: Record<MemberInvolvementStatus, "navy" | "amber" | "green"> = { Diundang: "navy", "Aktif Terlibat": "amber", Selesai: "green" };
const STATUSES: MemberInvolvementStatus[] = ["Diundang", "Aktif Terlibat", "Selesai"];

/**
 * Penugasan Bursa/Kliring/Custody pada satu kasus (List Revisi 14 #4).
 * Banyak pengaduan selesai langsung antara Nasabah dan Pialang, sehingga
 * kondisi tanpa anggota adalah normal.
 *
 * Revisi 17 #2: panel terpisah tidak lagi ditampilkan di halaman detail.
 * Hook ini memberi daftar ringkas (untuk grid fakta banner status) dan
 * pemicu modal 3 langkah (untuk baris aksi sekunder banner).
 */
export function useMemberAssignment(c: ComplaintCase | undefined, editable: boolean) {
  const members = c?.linkedEcosystemEntities ?? [];
  const ticket = c?.ticket ?? "";
  const { user } = useDemoSession();
  const { showToast } = useToast();
  const [modal, setModal] = React.useState<{ mode: "add" } | { mode: "edit"; member: LinkedEcosystemEntity } | null>(null);
  const [removing, setRemoving] = React.useState<LinkedEcosystemEntity | null>(null);

  function save(next: LinkedEcosystemEntity[], action: string, note: string) {
    setLinkedEcosystemEntities(ticket, next);
    addTimelineEvent(ticket, { actor: user.name, role: user.institution, action, note, status: "info", visibility: "internal" });
    logAudit({ activity: action, ticket, detail: note });
  }

  const list =
    members.length === 0 ? (
      <span className="font-normal text-muted">Belum ada anggota pasar yang dilibatkan</span>
    ) : (
      <ul className="flex flex-wrap gap-1.5">
        {members.map((m) => {
          const meta = TYPE_META[m.type];
          const Icon = meta.icon;
          const status = m.involvement ?? "Diundang";
          return (
            <li key={m.id} className="inline-flex max-w-full items-center gap-1.5 rounded-md border border-border bg-white py-0.5 pl-1.5 pr-0.5">
              <span className={cn("flex size-5 shrink-0 items-center justify-center rounded border", meta.cls)} title={meta.label}>
                <Icon className="size-3" />
              </span>
              <span className="min-w-0 truncate" title={`${meta.label} · ${m.name} · PIC ${m.pic || "-"}${m.instruction ? ` · Tugas: ${m.instruction}` : ""}`}>
                {m.name}
              </span>
              <Badge variant={STATUS_TONE[status]} className="shrink-0">
                {status.toUpperCase()}
              </Badge>
              {editable ? (
                <>
                  <button
                    type="button"
                    onClick={() => setModal({ mode: "edit", member: m })}
                    aria-label={`Edit penugasan ${m.name}`}
                    title="Edit penugasan"
                    className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy/30"
                  >
                    <Pencil className="size-3" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setRemoving(m)}
                    aria-label={`Hapus penugasan ${m.name}`}
                    title="Hapus penugasan"
                    className="rounded p-1 text-muted hover:bg-red-bg hover:text-red focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red/30"
                  >
                    <Trash2 className="size-3" />
                  </button>
                </>
              ) : (
                <span className="pr-1" />
              )}
            </li>
          );
        })}
      </ul>
    );

  const trigger = editable ? (
    <Button size="sm" variant="ghost" onClick={() => setModal({ mode: "add" })}>
      <Plus className="size-3.5" /> Tugaskan Anggota Pasar
    </Button>
  ) : null;

  const dialogs = (
    <>
      {modal && (
        <MemberModal
          existing={modal.mode === "edit" ? modal.member : undefined}
          taken={members.map((m) => m.id)}
          onClose={() => setModal(null)}
          onSave={(m) => {
            const stamped = { ...m, assignedBy: user.name, assignedAt: new Date().toISOString() };
            if (modal.mode === "edit") {
              save(
                members.map((x) => (x.id === m.id ? { ...x, ...stamped } : x)),
                "Ubah Penugasan Anggota Pasar",
                `${m.name}: PIC ${m.pic || "-"}, status ${m.involvement}.`
              );
              showToast("Penugasan anggota diperbarui.");
            } else {
              save([...members, stamped], "Tambah Anggota Pasar", `${TYPE_META[m.type].label} ${m.name} dilibatkan (PIC ${m.pic || "-"}). Tugas: ${m.instruction}`);
              showToast(`${m.name} ditambahkan sebagai anggota yang dilibatkan.`);
            }
            setModal(null);
          }}
        />
      )}

      <Dialog open={!!removing} onOpenChange={(v) => !v && setRemoving(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Penugasan</DialogTitle>
            <DialogDescription>
              {removing?.name} tidak lagi dilibatkan dalam penanganan tiket {ticket}. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setRemoving(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (!removing) return;
                save(members.filter((x) => x.id !== removing.id), "Hapus Penugasan Anggota Pasar", `${removing.name} dihapus dari penugasan.`);
                showToast("Penugasan dihapus.");
                setRemoving(null);
              }}
            >
              Hapus Penugasan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  return { list, trigger, dialogs };
}

function MemberModal({
  existing,
  taken,
  onSave,
  onClose,
}: {
  existing?: LinkedEcosystemEntity;
  taken: string[];
  onSave: (m: LinkedEcosystemEntity) => void;
  onClose: () => void;
}) {
  const [step, setStep] = React.useState(existing ? 3 : 1);
  const [type, setType] = React.useState<LembagaType | "">(existing?.type ?? "");
  const [entityName, setEntityName] = React.useState(existing?.name ?? "");
  const [pic, setPic] = React.useState(existing?.pic ?? "");
  const [instruction, setInstruction] = React.useState(existing?.instruction ?? "");
  const [involvement, setInvolvement] = React.useState<MemberInvolvementStatus>(existing?.involvement ?? "Diundang");
  const candidates = ECOSYSTEM_LEMBAGA.filter((e) => e.type === type && (e.id === existing?.id || !taken.includes(e.id)));
  const entity = ECOSYSTEM_LEMBAGA.find((e) => e.type === type && e.name === entityName);
  const steps = ["Jenis Lembaga", "Nama Entitas", "Instruksi / Tugas"];

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{existing ? "Edit Penugasan Anggota" : "Tambah Anggota Pasar"}</DialogTitle>
          <DialogDescription>Libatkan Bursa Berjangka, Lembaga Kliring, atau Custody hanya bila penanganan pengaduan membutuhkannya.</DialogDescription>
        </DialogHeader>
        <ol className="flex items-center gap-2 text-[11px]">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-1.5">
              <span
                className={cn(
                  "flex size-5 items-center justify-center rounded-full font-semibold",
                  i + 1 < step ? "bg-navy text-white" : i + 1 === step ? "border-2 border-navy text-navy" : "border border-border text-muted"
                )}
              >
                {i + 1 < step ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={i + 1 === step ? "font-semibold text-navy" : "text-muted"}>{s}</span>
              {i < steps.length - 1 && <span className="h-px w-4 bg-border" />}
            </li>
          ))}
        </ol>

        <div className="space-y-3 text-sm min-h-[150px]">
          {step === 1 && (
            <div className="grid grid-cols-1 gap-2">
              {(Object.keys(TYPE_META) as LembagaType[]).map((t) => {
                const meta = TYPE_META[t];
                const Icon = meta.icon;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => {
                      setType(t);
                      setEntityName("");
                    }}
                    className={cn("flex items-center gap-3 rounded-md border p-3 text-left", type === t ? "border-navy bg-navy/5" : "border-border hover:bg-muted-bg")}
                  >
                    <span className={cn("flex size-8 items-center justify-center rounded-md border", meta.cls)}>
                      <Icon className="size-4" />
                    </span>
                    <span>
                      <span className="block text-sm font-medium">{meta.label}</span>
                      <span className="block text-[11px] text-muted">{meta.desc}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          )}
          {step === 2 && type && (
            <div className="space-y-3">
              <div>
                <Label>Nama {TYPE_META[type].label}</Label>
                <SearchableSelect value={entityName} onChange={setEntityName} groups={[{ label: TYPE_META[type].label, options: candidates.map((e) => e.name) }]} placeholder="Pilih lembaga..." />
                {candidates.length === 0 && <p className="text-[11px] text-muted mt-1">Semua lembaga jenis ini sudah dilibatkan.</p>}
              </div>
              <div>
                <Label>Nama PIC yang ditugaskan</Label>
                <Input value={pic} onChange={(e) => setPic(e.target.value)} placeholder="Nama petugas / bagian penanggung jawab" />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              {existing && (
                <p className="text-xs rounded-md bg-muted-bg px-2 py-1.5">
                  {TYPE_META[existing.type].label}: <span className="font-medium">{existing.name}</span>
                </p>
              )}
              {existing && (
                <div>
                  <Label>Nama PIC yang ditugaskan</Label>
                  <Input value={pic} onChange={(e) => setPic(e.target.value)} />
                </div>
              )}
              <div>
                <Label>Catatan instruksi / tugas</Label>
                <Textarea value={instruction} onChange={(e) => setInstruction(e.target.value)} className="min-h-[80px] text-sm" placeholder="Contoh: Mohon verifikasi data settlement batch STL-2026-06-330217." />
              </div>
              <div>
                <Label>Status keterlibatan</Label>
                <Select value={involvement} onChange={(e) => setInvolvement(e.target.value as MemberInvolvementStatus)}>
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          {step > 1 && !(existing && step === 3) ? (
            <Button size="sm" variant="secondary" onClick={() => setStep(step - 1)}>
              Kembali
            </Button>
          ) : (
            <Button size="sm" variant="secondary" onClick={onClose}>
              Batal
            </Button>
          )}
          {step < 3 ? (
            <Button size="sm" disabled={(step === 1 && !type) || (step === 2 && !entity)} onClick={() => setStep(step + 1)}>
              Lanjut
            </Button>
          ) : (
            <Button
              size="sm"
              disabled={!instruction.trim()}
              onClick={() => {
                const base = existing ?? { id: entity!.id, type: entity!.type, name: entity!.name };
                onSave({ ...base, pic: pic.trim(), instruction: instruction.trim(), involvement });
              }}
            >
              Simpan Penugasan
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
