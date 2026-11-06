"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DisableConfirmDialog } from "@/components/shared/disable-confirm-dialog";
import { EcosystemRegistrationWizard, EcosystemWizardValues } from "@/components/shared/ecosystem-registration-wizard";
import { ECOSYSTEM_ENTITIES, ECOSYSTEM_CATEGORY_CONFIG } from "@/lib/mock-data";
import { useEcosystemEntities, addEcosystemEntity, updateEcosystemEntity } from "@/lib/mock-service/ecosystem-store";
import { useEcosystemCategoryConfig } from "@/lib/mock-service/ecosystem-category-store";
import { requestEcosystemChange } from "@/lib/mock-service/ecosystem-change-store";
import { EcosystemEntity, EcosystemRegistrationStatus } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";
import { Plus, Pencil, Ban, CheckCircle2 } from "lucide-react";
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

export default function DaftarEkosistemPage() {
  const entities = useEcosystemEntities(ECOSYSTEM_ENTITIES);
  const categories = useEcosystemCategoryConfig(ECOSYSTEM_CATEGORY_CONFIG);
  const { showToast } = useToast();

  const [search, setSearch] = React.useState("");
  const [category, setCategory] = React.useState("");
  const [type, setType] = React.useState("");
  const [status, setStatus] = React.useState("");

  const [wizardOpen, setWizardOpen] = React.useState(false);
  const [editingEntity, setEditingEntity] = React.useState<EcosystemEntity | null>(null);
  const [disabling, setDisabling] = React.useState<EcosystemEntity | null>(null);

  const filtered = entities.filter((e) => {
    const matchesSearch = !search || e.name.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = !category || e.category === category;
    const matchesType = !type || e.ecosystemType === type;
    const matchesStatus = !status || e.status === status;
    return matchesSearch && matchesCategory && matchesType && matchesStatus;
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
        category: values.category || "",
        ecosystemType: values.ecosystemType || "Ecosystem Aktif",
        status: "Draft",
        registeredAt: today,
      } as EcosystemEntity);
    }
    showToast("Draft pendaftaran ekosistem telah disimpan.");
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
      showToast("Permohonan perubahan data telah diajukan untuk persetujuan.");
    } else {
      const id = `ECO-${Date.now().toString(36).toUpperCase()}`;
      const entity: EcosystemEntity = {
        ...values,
        id,
        name: values.name || "(Tanpa nama)",
        category: values.category || "",
        ecosystemType: values.ecosystemType || "Ecosystem Aktif",
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
      showToast("Registrasi ekosistem telah diajukan untuk persetujuan.");
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
        title="Daftar Ekosistem"
        description="Registrasi dan daftar seluruh pelaku ekosistem (Ecosystem Aktif maupun Ecosystem Pasif) beserta status pendaftarannya."
        actions={
          <Button size="sm" onClick={openNew}>
            <Plus className="size-3.5" /> Daftar Baru
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <Label>Cari</Label>
          <Input placeholder="Nama entitas..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-48">
          <Label>Kategori</Label>
          <Select value={category} onChange={(e) => setCategory(e.target.value)}>
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.shortDescription}>{c.shortDescription}</option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Label>Tipe Ekosistem</Label>
          <Select value={type} onChange={(e) => setType(e.target.value)}>
            <option value="">Semua tipe</option>
            <option value="Ecosystem Aktif">Ecosystem Aktif</option>
            <option value="Ecosystem Pasif">Ecosystem Pasif</option>
          </Select>
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
        <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setCategory(""); setType(""); setStatus(""); }}>
          Reset Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Entitas</TableHead>
            <TableHead>Kategori Ekosistem</TableHead>
            <TableHead>Tipe Ekosistem</TableHead>
            <TableHead>Nomor Izin</TableHead>
            <TableHead>Bursa</TableHead>
            <TableHead>Kliring</TableHead>
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
              <TableCell>{e.category}</TableCell>
              <TableCell className="whitespace-nowrap">
                <Badge variant={e.ecosystemType === "Ecosystem Aktif" ? "navy" : "amber"}>{e.ecosystemType}</Badge>
              </TableCell>
              <TableCell className="whitespace-nowrap">{e.license || "-"}</TableCell>
              <TableCell>{e.bursa || "-"}</TableCell>
              <TableCell>{e.kliring || "-"}</TableCell>
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
              <TableCell colSpan={10} className="text-center text-muted py-6">
                Tidak ada entitas yang sesuai dengan filter.
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
        onSaveDraft={handleSaveDraft}
        onSubmit={handleSubmit}
      />

      {disabling && (
        <DisableConfirmDialog
          open={!!disabling}
          onOpenChange={(v) => !v && setDisabling(null)}
          categoryLabel="Ekosistem"
          itemName={disabling.name}
          onConfirm={confirmDisable}
          requiresApproval={false}
        />
      )}
    </div>
  );
}
