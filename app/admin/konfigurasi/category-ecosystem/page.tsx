"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { DisableConfirmDialog } from "@/components/shared/disable-confirm-dialog";
import { ECOSYSTEM_CATEGORY_CONFIG, CONFIG_CHANGE_REQUESTS } from "@/lib/mock-data";
import { useEcosystemCategoryConfig } from "@/lib/mock-service/ecosystem-category-store";
import { requestConfigChange, useConfigChangeRequests } from "@/lib/mock-service/config-approval-store";
import { EcosystemType } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";
import { Plus, Ban, CheckCircle2, Clock3 } from "lucide-react";

const ECOSYSTEM_TYPES: EcosystemType[] = ["Ecosystem Aktif", "Ecosystem Pasif"];

export default function CategoryEcosystemPage() {
  const categories = useEcosystemCategoryConfig(ECOSYSTEM_CATEGORY_CONFIG);
  const allRequests = useConfigChangeRequests(CONFIG_CHANGE_REQUESTS);
  const { showToast } = useToast();

  const myRequests = allRequests.filter((r) => r.configType === "Kategori Ekosistem");
  const pendingNew = myRequests.filter((r) => r.status === "Menunggu" && r.action === "Tambah");
  function pendingStatusFor(id: string) {
    return myRequests.find((r) => r.status === "Menunggu" && (r.action === "Nonaktifkan" || r.action === "Aktifkan") && JSON.parse(r.payload).id === id);
  }

  const [addOpen, setAddOpen] = React.useState(false);
  const [type, setType] = React.useState<EcosystemType>(ECOSYSTEM_TYPES[0]);
  const [shortDesc, setShortDesc] = React.useState("");
  const [longDesc, setLongDesc] = React.useState("");
  const [disabling, setDisabling] = React.useState<{ id: string; name: string } | null>(null);

  function resetForm() {
    setType(ECOSYSTEM_TYPES[0]);
    setShortDesc("");
    setLongDesc("");
  }

  function handleAdd() {
    const name = shortDesc.trim();
    if (!name) return;
    requestConfigChange({
      configType: "Kategori Ekosistem",
      action: "Tambah",
      itemLabel: "Kategori Ekosistem baru",
      afterValue: `${name} (${type})`,
      payload: JSON.stringify({ type, shortDescription: name, longDescription: longDesc.trim() }),
      requestedBy: "Anda (Petugas Admin)",
    });
    showToast(`Permohonan penambahan kategori ekosistem "${name}" telah diajukan untuk persetujuan.`);
    resetForm();
    setAddOpen(false);
  }

  function confirmDisable() {
    if (!disabling) return;
    requestConfigChange({
      configType: "Kategori Ekosistem",
      action: "Nonaktifkan",
      itemLabel: disabling.name,
      beforeValue: "Aktif",
      afterValue: "Nonaktif",
      payload: JSON.stringify({ id: disabling.id }),
      requestedBy: "Anda (Petugas Admin)",
    });
    showToast(`Permohonan nonaktifkan "${disabling.name}" telah diajukan untuk persetujuan.`);
    setDisabling(null);
  }

  function enableDirectly(id: string, name: string) {
    requestConfigChange({
      configType: "Kategori Ekosistem",
      action: "Aktifkan",
      itemLabel: name,
      beforeValue: "Nonaktif",
      afterValue: "Aktif",
      payload: JSON.stringify({ id }),
      requestedBy: "Anda (Petugas Admin)",
    });
    showToast(`Permohonan aktifkan "${name}" telah diajukan untuk persetujuan.`);
  }

  return (
    <div>
      <PageHeader
        title="Category Ecosystem"
        description="Kelola kategori ekosistem yang tersedia saat mendaftarkan entitas baru pada Manajemen Ekosistem. Setiap kategori wajib terhubung ke salah satu Ecosystem Type (Aktif / Pasif)."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" /> Tambah Kategori
          </Button>
        }
      />

      {pendingNew.length > 0 && (
        <div className="mb-4 rounded-lg border border-amber/40 bg-amber-bg/40 p-3">
          <p className="text-xs font-semibold text-amber mb-1.5 flex items-center gap-1.5">
            <Clock3 className="size-3.5" /> Menunggu Persetujuan
          </p>
          <ul className="space-y-1 text-xs text-foreground">
            {pendingNew.map((r) => (
              <li key={r.id}>{r.afterValue} — diajukan oleh {r.requestedBy}</li>
            ))}
          </ul>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ID</TableHead>
            <TableHead>Ecosystem Type</TableHead>
            <TableHead>Deskripsi Singkat</TableHead>
            <TableHead>Deskripsi Panjang</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((c) => {
            const pending = pendingStatusFor(c.id);
            return (
              <TableRow key={c.id}>
                <TableCell className="whitespace-nowrap text-muted">{c.id}</TableCell>
                <TableCell className="whitespace-nowrap">
                  <Badge variant={c.type === "Ecosystem Aktif" ? "navy" : "amber"}>{c.type}</Badge>
                </TableCell>
                <TableCell className="font-medium whitespace-nowrap">{c.shortDescription}</TableCell>
                <TableCell className="max-w-sm text-muted">{c.longDescription}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-1.5">
                    <Badge variant={c.active ? "green" : "muted"}>{c.active ? "AKTIF" : "NONAKTIF"}</Badge>
                    {pending && <Badge variant="amber">MENUNGGU PERSETUJUAN</Badge>}
                  </div>
                </TableCell>
                <TableCell>
                  <button
                    title={c.active ? "Nonaktifkan" : "Aktifkan"}
                    disabled={!!pending}
                    onClick={() => (c.active ? setDisabling({ id: c.id, name: c.shortDescription }) : enableDirectly(c.id, c.shortDescription))}
                    className="inline-flex items-center gap-1 rounded p-1 text-muted hover:bg-muted-bg hover:text-navy disabled:opacity-40 disabled:pointer-events-none"
                  >
                    {c.active ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                    {c.active ? "Nonaktifkan" : "Aktifkan"}
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Kategori Ekosistem</DialogTitle>
            <DialogDescription>Kategori baru akan aktif setelah disetujui pada Approval Configuration.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <div>
              <Label htmlFor="eco-cat-type">Ecosystem Type</Label>
              <Select id="eco-cat-type" value={type} onChange={(e) => setType(e.target.value as EcosystemType)}>
                {ECOSYSTEM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="eco-cat-short">Deskripsi Singkat</Label>
              <Input id="eco-cat-short" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Contoh: Bursa" />
            </div>
            <div>
              <Label htmlFor="eco-cat-long">Deskripsi Panjang</Label>
              <Textarea id="eco-cat-long" value={longDesc} onChange={(e) => setLongDesc(e.target.value)} className="min-h-[70px] text-xs" placeholder="Penjelasan singkat peran kategori ini dalam ekosistem." />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button size="sm" disabled={!shortDesc.trim()} onClick={handleAdd}>Ajukan Penambahan</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {disabling && (
        <DisableConfirmDialog
          open={!!disabling}
          onOpenChange={(v) => !v && setDisabling(null)}
          categoryLabel="Kategori Ekosistem"
          itemName={disabling.name}
          onConfirm={confirmDisable}
        />
      )}
    </div>
  );
}
