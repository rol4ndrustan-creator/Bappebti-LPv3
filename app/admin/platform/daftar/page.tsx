"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DisableConfirmDialog } from "@/components/shared/disable-confirm-dialog";
import { EcosystemRegistrationWizard, EcosystemWizardValues } from "@/components/shared/ecosystem-registration-wizard";
import { ECOSYSTEM_ENTITIES, ECOSYSTEM_CATEGORY_CONFIG } from "@/lib/mock-data";
import { useEcosystemEntities, addEcosystemEntity, updateEcosystemEntity } from "@/lib/mock-service/ecosystem-store";
import { useEcosystemCategoryConfig } from "@/lib/mock-service/ecosystem-category-store";
import { requestEcosystemChange } from "@/lib/mock-service/ecosystem-change-store";
import { EcosystemEntity, EcosystemRegistrationStatus } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";
import { Plus, Pencil, Ban, CheckCircle2, MailCheck } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const STATUSES: EcosystemRegistrationStatus[] = ["Draft", "Menunggu Verifikasi", "Perlu Perbaikan", "Disetujui", "Ditolak"];

function statusVariant(status: EcosystemRegistrationStatus): BadgeVariant {
  switch (status) {
    case "Disetujui":
      return "green";
    case "Menunggu Verifikasi":
      return "amber";
    case "Perlu Perbaikan":
      return "amber";
    case "Ditolak":
      return "red";
    case "Draft":
      return "muted";
  }
}

export default function DaftarPlatformPage() {
  const allEntities = useEcosystemEntities(ECOSYSTEM_ENTITIES);
  const categories = useEcosystemCategoryConfig(ECOSYSTEM_CATEGORY_CONFIG);
  const { showToast } = useToast();

  const platforms = React.useMemo(() => allEntities.filter((e) => e.category === "Pialang"), [allEntities]);
  const bursaOptions = React.useMemo(() => Array.from(new Set(platforms.map((p) => p.bursa).filter((b): b is string => !!b))).sort(), [platforms]);

  const [search, setSearch] = React.useState("");
  const [status, setStatus] = React.useState("");
  const [bursaFilter, setBursaFilter] = React.useState("");

  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [editingEntity, setEditingEntity] = React.useState<EcosystemEntity | null>(null);
  const [disabling, setDisabling] = React.useState<EcosystemEntity | null>(null);
  const [activationReminder, setActivationReminder] = React.useState<string | null>(null);

  const filtered = platforms.filter((e) => {
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase()) || (e.license ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesStatus = !status || e.status === status;
    const matchesBursa = !bursaFilter || e.bursa === bursaFilter;
    return matchesSearch && matchesStatus && matchesBursa;
  });

  function openNew() {
    setEditingEntity(null);
    setWizardOpen(true);
  }
  function openEdit(entity: EcosystemEntity) {
    setEditingEntity(entity);
    setWizardOpen(true);
  }

  function handleSaveDraft(values: EcosystemWizardValues) {
    const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    if (editingEntity) {
      updateEcosystemEntity(editingEntity.id, { ...values, status: "Draft" });
    } else {
      addEcosystemEntity({
        ...values,
        id: `ECO-${Date.now().toString(36).toUpperCase()}`,
        name: values.name || "(Draft tanpa nama)",
        category: "Pialang",
        ecosystemType: "Ecosystem Aktif",
        status: "Draft",
        registeredAt: today,
      } as EcosystemEntity);
    }
    showToast("Draft pendaftaran pialang telah disimpan.");
    setWizardOpen(false);
  }

  function handleSubmit(values: EcosystemWizardValues) {
    const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    if (editingEntity) {
      const after: EcosystemEntity = { ...editingEntity, ...values, status: editingEntity.status };
      requestEcosystemChange({
        targetType: "Entitas Ekosistem",
        entityId: editingEntity.id,
        changeType: "Perubahan Data",
        entityName: editingEntity.name,
        before: editingEntity,
        after,
        requestedBy: values.submitterName || "Anda",
      });
      showToast("Permohonan perubahan data pialang telah diajukan untuk persetujuan.");
    } else {
      const id = `ECO-${Date.now().toString(36).toUpperCase()}`;
      const entity: EcosystemEntity = {
        ...values,
        id,
        name: values.name || "(Tanpa nama)",
        category: "Pialang",
        ecosystemType: "Ecosystem Aktif",
        status: "Menunggu Verifikasi",
        registeredAt: today,
      } as EcosystemEntity;
      addEcosystemEntity(entity);
      requestEcosystemChange({
        targetType: "Entitas Ekosistem",
        entityId: id,
        changeType: "Pendaftaran Baru",
        entityName: entity.name,
        after: entity,
        requestedBy: values.submitterName || "Anda",
      });
      showToast("Registrasi pialang telah diajukan untuk persetujuan.");
      if (values.administratorEmail) {
        setActivationReminder(values.administratorEmail);
      }
    }
    setWizardOpen(false);
  }

  function confirmDisable() {
    if (!disabling) return;
    updateEcosystemEntity(disabling.id, { disabled: true });
    showToast(`${disabling.name} telah dinonaktifkan.`);
    setDisabling(null);
  }

  function enable(entity: EcosystemEntity) {
    updateEcosystemEntity(entity.id, { disabled: false });
    showToast(`${entity.name} telah diaktifkan kembali.`);
  }

  return (
    <div>
      <PageHeader
        title="Daftar Pialang"
        description="Registrasi dan daftar seluruh pialang berjangka terdaftar, lengkap dengan data administrator, direksi, komisaris, dan surat keanggotaan bursa."
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus className="size-3.5" /> Tambah Pialang
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <Label>Cari</Label>
          <Input placeholder="Nama pialang atau nomor izin..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <Label>Status</Label>
          <Select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </Select>
        </div>
        <div className="w-56">
          <Label>Bursa</Label>
          <Select value={bursaFilter} onChange={(e) => setBursaFilter(e.target.value)}>
            <option value="">Semua bursa</option>
            {bursaOptions.map((b) => (
              <option key={b} value={b}>{b}</option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setStatus(""); setBursaFilter(""); }}>
          Reset Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Pialang</TableHead>
            <TableHead>Nomor Izin</TableHead>
            <TableHead>Bursa</TableHead>
            <TableHead>Kliring</TableHead>
            <TableHead>Administrator</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Berdiri Sejak</TableHead>
            <TableHead>Terdaftar Sejak</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="font-medium text-navy">
                {e.name}
                {e.disabled && <Badge variant="muted" className="ml-1.5">NONAKTIF</Badge>}
                {e.hasPendingEdit && <Badge variant="amber" className="ml-1.5">PERUBAHAN MENUNGGU</Badge>}
              </TableCell>
              <TableCell className="whitespace-nowrap">{e.license || "-"}</TableCell>
              <TableCell>{e.bursa || "-"}</TableCell>
              <TableCell>{e.kliring || "-"}</TableCell>
              <TableCell className="whitespace-nowrap">
                {e.administratorName || "-"}
                {e.administratorEmail && <div className="text-[11px] text-muted">{e.administratorEmail}</div>}
              </TableCell>
              <TableCell><Badge variant={statusVariant(e.status)}>{e.status.toUpperCase()}</Badge></TableCell>
              <TableCell className="whitespace-nowrap">{e.establishedAt || "-"}</TableCell>
              <TableCell className="whitespace-nowrap">{e.registeredAt}</TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <button title="Edit" onClick={() => openEdit(e)} className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy">
                    <Pencil className="size-3.5" />
                  </button>
                  {e.disabled ? (
                    <button title="Aktifkan" onClick={() => enable(e)} className="rounded p-1 text-muted hover:bg-green-bg hover:text-green">
                      <CheckCircle2 className="size-3.5" />
                    </button>
                  ) : (
                    <button title="Nonaktifkan" onClick={() => setDisabling(e)} className="rounded p-1 text-muted hover:bg-red-bg hover:text-red">
                      <Ban className="size-3.5" />
                    </button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted py-6">
                Tidak ada pialang yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <EcosystemRegistrationWizard
        open={wizardOpen}
        onClose={() => setWizardOpen(false)}
        categories={categories}
        initialValues={editingEntity ?? undefined}
        isEdit={!!editingEntity}
        platformMode
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />

      {disabling && (
        <DisableConfirmDialog
          open={!!disabling}
          onOpenChange={(v) => !v && setDisabling(null)}
          categoryLabel="Pialang"
          itemName={disabling.name}
          onConfirm={confirmDisable}
          requiresApproval={false}
        />
      )}

      <Dialog open={!!activationReminder} onOpenChange={(v) => !v && setActivationReminder(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MailCheck className="size-4 text-green" /> Email Aktivasi Terkirim
            </DialogTitle>
            <DialogDescription>
              Registrasi pialang telah diajukan untuk persetujuan. Email aktivasi telah dikirim ke email administrator: <span className="font-medium text-navy">{activationReminder}</span>.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" onClick={() => setActivationReminder(null)}>Mengerti</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
