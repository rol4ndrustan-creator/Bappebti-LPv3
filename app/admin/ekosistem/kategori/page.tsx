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
import { ECOSYSTEM_CATEGORY_CONFIG, ECOSYSTEM_CHANGE_REQUESTS } from "@/lib/mock-data";
import { useEcosystemCategoryConfig } from "@/lib/mock-service/ecosystem-category-store";
import { requestEcosystemChange, useEcosystemChangeRequests } from "@/lib/mock-service/ecosystem-change-store";
import { EcosystemType } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";
import { Plus, Ban, CheckCircle2, Clock3 } from "lucide-react";

const ECOSYSTEM_TYPES: EcosystemType[] = ["Ecosystem Aktif", "Ecosystem Pasif"];

function parseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function EkosistemKategoriPage() {
  const categories = useEcosystemCategoryConfig(ECOSYSTEM_CATEGORY_CONFIG);
  const allRequests = useEcosystemChangeRequests(ECOSYSTEM_CHANGE_REQUESTS);
  const { showToast } = useToast();

  const myRequests = React.useMemo(() => allRequests.filter((r) => r.targetType === "Kategori Ekosistem"), [allRequests]);
  function pendingDecisionFor(id: string) {
    return myRequests.find(
      (r) => r.status === "Menunggu" && (r.changeType === "Nonaktifkan Kategori" || r.changeType === "Aktifkan Kategori") && r.entityId === id
    );
  }
  const pendingAdds = myRequests.filter((r) => r.status === "Menunggu" && r.changeType === "Tambah Kategori");

  // Filters
  const [tipeFilter, setTipeFilter] = React.useState("");
  const [categoryFilter, setCategoryFilter] = React.useState("");
  const [makerFilter, setMakerFilter] = React.useState("");
  const [approvalFilter, setApprovalFilter] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const categoryOptions = React.useMemo(() => Array.from(new Set(categories.map((c) => c.shortDescription))).sort(), [categories]);
  const makerOptions = React.useMemo(() => Array.from(new Set(categories.map((c) => c.userMaker))).sort(), [categories]);
  const approvalOptions = React.useMemo(
    () => Array.from(new Set(categories.map((c) => c.userApproval).filter((v): v is string => !!v))).sort(),
    [categories]
  );

  const filtered = React.useMemo(() => {
    const from = dateFrom ? parseDate(dateFrom) : null;
    const to = dateTo ? parseDate(`${dateTo}T23:59:59`) : null;
    return categories.filter((c) => {
      const matchesTipe = !tipeFilter || c.type === tipeFilter;
      const matchesCategory = !categoryFilter || c.shortDescription === categoryFilter;
      const matchesMaker = !makerFilter || c.userMaker === makerFilter;
      const matchesApproval = !approvalFilter || c.userApproval === approvalFilter;
      const d = parseDate(c.displayDate);
      const matchesFrom = !from || (!!d && d >= from);
      const matchesTo = !to || (!!d && d <= to);
      return matchesTipe && matchesCategory && matchesMaker && matchesApproval && matchesFrom && matchesTo;
    });
  }, [categories, tipeFilter, categoryFilter, makerFilter, approvalFilter, dateFrom, dateTo]);

  function resetFilters() {
    setTipeFilter("");
    setCategoryFilter("");
    setMakerFilter("");
    setApprovalFilter("");
    setDateFrom("");
    setDateTo("");
  }

  // Tambah Kategori dialog
  const [addOpen, setAddOpen] = React.useState(false);
  const [type, setType] = React.useState<EcosystemType>(ECOSYSTEM_TYPES[0]);
  const [shortDesc, setShortDesc] = React.useState("");
  const [longDesc, setLongDesc] = React.useState("");
  const [displayDate, setDisplayDate] = React.useState("");

  function resetAddForm() {
    setType(ECOSYSTEM_TYPES[0]);
    setShortDesc("");
    setLongDesc("");
    setDisplayDate("");
  }

  function submitAdd() {
    if (!shortDesc.trim()) return;
    const tempId = `ECAT-PENDING-${Date.now().toString(36).toUpperCase()}`;
    const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    requestEcosystemChange({
      targetType: "Kategori Ekosistem",
      entityId: tempId,
      changeType: "Tambah Kategori",
      entityName: shortDesc.trim(),
      after: {
        id: tempId,
        type,
        shortDescription: shortDesc.trim(),
        longDescription: longDesc.trim(),
        active: true,
        createdAt: today,
        displayDate: displayDate || today,
        userMaker: "Anda (Petugas Admin)",
      },
      requestedBy: "Anda (Petugas Admin)",
    });
    showToast("Pengajuan kategori ekosistem baru dikirim untuk persetujuan.");
    resetAddForm();
    setAddOpen(false);
  }

  // Disable / reactivate confirm dialog
  const [disabling, setDisabling] = React.useState<{ id: string; name: string; mode: "disable" | "enable" } | null>(null);

  function submitDisableToggle() {
    if (!disabling) return;
    const category = categories.find((c) => c.id === disabling.id);
    if (!category) return;
    const nextActive = disabling.mode === "enable";
    requestEcosystemChange({
      targetType: "Kategori Ekosistem",
      entityId: category.id,
      changeType: nextActive ? "Aktifkan Kategori" : "Nonaktifkan Kategori",
      entityName: category.shortDescription,
      before: category,
      after: { ...category, active: nextActive },
      requestedBy: "Anda (Petugas Admin)",
    });
    showToast(`Pengajuan ${nextActive ? "aktivasi" : "nonaktivasi"} kategori "${category.shortDescription}" dikirim untuk persetujuan.`);
  }

  return (
    <div>
      <PageHeader
        title="Kategori Ekosistem"
        description="Kategori pelaku ekosistem yang dapat didaftarkan melalui Daftar Ekosistem. Setiap perubahan (tambah, nonaktifkan, aktifkan kembali) wajib melalui persetujuan di Approval Ekosistem."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-4" /> Tambah Kategori
          </Button>
        }
      />

      {pendingAdds.length > 0 && (
        <div className="mb-3 rounded-md border border-amber-300 bg-amber-50 px-3 py-2 text-xs text-amber-900">
          <span className="font-semibold">Menunggu Persetujuan:</span>{" "}
          {pendingAdds.map((r) => r.entityName).join(", ")} — lihat Approval Ekosistem untuk menindaklanjuti.
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-44">
          <Label>Tipe Ekosistem</Label>
          <Select value={tipeFilter} onChange={(e) => setTipeFilter(e.target.value)}>
            <option value="">Semua tipe</option>
            {ECOSYSTEM_TYPES.map((t) => (
              <option key={t} value={t}>{t}</option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Label>Category Ekosistem</Label>
          <Select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
            <option value="">Semua kategori</option>
            {categoryOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </Select>
        </div>
        <div className="w-36">
          <Label>Tanggal Tayang Dari</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="w-36">
          <Label>Tanggal Tayang Hingga</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <div className="w-40">
          <Label>User Maker</Label>
          <Select value={makerFilter} onChange={(e) => setMakerFilter(e.target.value)}>
            <option value="">Semua user</option>
            {makerOptions.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Label>User Approval</Label>
          <Select value={approvalFilter} onChange={(e) => setApprovalFilter(e.target.value)}>
            <option value="">Semua user</option>
            {approvalOptions.map((a) => (
              <option key={a} value={a}>{a}</option>
            ))}
          </Select>
        </div>
        <Button variant="secondary" size="sm" onClick={resetFilters}>Reset Filter</Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No</TableHead>
            <TableHead>ID</TableHead>
            <TableHead>Tipe Ekosistem</TableHead>
            <TableHead>Tanggal Tayang</TableHead>
            <TableHead>Category Ekosistem</TableHead>
            <TableHead>Deskripsi Ekosistem</TableHead>
            <TableHead>User Maker</TableHead>
            <TableHead>User Approval</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c, i) => {
            const pending = pendingDecisionFor(c.id);
            return (
              <TableRow key={c.id}>
                <TableCell>{i + 1}</TableCell>
                <TableCell className="font-medium text-navy whitespace-nowrap">{c.id}</TableCell>
                <TableCell className="whitespace-nowrap">{c.type}</TableCell>
                <TableCell className="whitespace-nowrap">{c.displayDate}</TableCell>
                <TableCell className="font-medium whitespace-nowrap">{c.shortDescription}</TableCell>
                <TableCell className="max-w-[260px]">{c.longDescription || "-"}</TableCell>
                <TableCell className="whitespace-nowrap">{c.userMaker}</TableCell>
                <TableCell className="whitespace-nowrap">{c.userApproval || "-"}</TableCell>
                <TableCell>
                  <Badge variant={c.active ? "green" : "red"}>{c.active ? "ACTIVE" : "DISABLE"}</Badge>
                  {pending && (
                    <div className="mt-1">
                      <Badge variant="amber" className="gap-1">
                        <Clock3 className="size-3" /> MENUNGGU PERSETUJUAN
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {c.active ? (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!pending}
                      onClick={() => setDisabling({ id: c.id, name: c.shortDescription, mode: "disable" })}
                    >
                      <Ban className="size-3.5" /> Nonaktifkan
                    </Button>
                  ) : (
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={!!pending}
                      onClick={() => setDisabling({ id: c.id, name: c.shortDescription, mode: "enable" })}
                    >
                      <CheckCircle2 className="size-3.5" /> Aktifkan Kembali
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={10} className="text-center text-muted py-6">
                Tidak ada kategori yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetAddForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Category Ekosistem</DialogTitle>
            <DialogDescription>Kategori baru akan tersedia pada Daftar Ekosistem setelah disetujui di Approval Ekosistem.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="ek-cat-type">Ecosystem Type</Label>
              <Select id="ek-cat-type" value={type} onChange={(e) => setType(e.target.value as EcosystemType)}>
                {ECOSYSTEM_TYPES.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="ek-cat-short">Category Ekosistem (short description)</Label>
              <Input id="ek-cat-short" value={shortDesc} onChange={(e) => setShortDesc(e.target.value)} placeholder="Misal: Bursa" />
            </div>
            <div>
              <Label htmlFor="ek-cat-long">Deskripsi Ekosistem</Label>
              <Textarea id="ek-cat-long" value={longDesc} onChange={(e) => setLongDesc(e.target.value)} className="min-h-[70px] text-xs" placeholder="Penjelasan singkat peran kategori ini dalam ekosistem" />
            </div>
            <div>
              <Label htmlFor="ek-cat-date">Tanggal Tayang</Label>
              <Input id="ek-cat-date" type="date" value={displayDate} onChange={(e) => setDisplayDate(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button size="sm" disabled={!shortDesc.trim()} onClick={submitAdd}>Ajukan Kategori</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {disabling && (
        <DisableConfirmDialog
          open={!!disabling}
          onOpenChange={(v) => !v && setDisabling(null)}
          categoryLabel="Kategori Ekosistem"
          itemName={disabling.name}
          mode={disabling.mode}
          approvalLocation="Approval Ekosistem"
          onConfirm={submitDisableToggle}
        />
      )}
    </div>
  );
}
