"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ECOSYSTEM_ENTITIES, PLATFORM_ECOSYSTEM_MEMBERSHIPS, EKOSISTEM_PENGAWAS_MEMBERS } from "@/lib/mock-data";
import {
  usePlatformEcosystemMemberships,
  addPlatformMembership,
  updatePlatformMembership,
  deletePlatformMembership,
  useEcosystemPengawasMembers,
  addPengawasMember,
  updatePengawasMember,
  deletePengawasMember,
} from "@/lib/mock-service/ecosystem-member-store";
import {
  EcosystemAssociation,
  EcosystemPengawasMember,
  EcosystemPengawasMembershipStatus,
  PelakuUsahaCategory,
  PlatformEcosystemMembership,
  PlatformMembershipEcosystemType,
  PlatformMembershipStatus,
} from "@/lib/types";
import { useDemoSession } from "@/lib/demo-session";
import { useToast } from "@/components/shared/toast-provider";
import { formatDateID } from "@/lib/format";
import { Plus, Pencil, Trash2 } from "lucide-react";

const ACTIVE_ECOSYSTEM_TYPES: PlatformMembershipEcosystemType[] = ["Bursa", "Kliring", "Custody"];
const ACTIVE_STATUSES: PlatformMembershipStatus[] = ["Aktif", "Suspended", "Non-Aktif"];
const PENGAWAS_STATUSES: EcosystemPengawasMembershipStatus[] = ["Aktif", "Suspended", "Non-Aktif"];
const PELAKU_USAHA_CATEGORIES: PelakuUsahaCategory[] = ["Pialang Berjangka", "CPFAK / PFAK", "Pialang Aset Digital"];
const ASSOCIATIONS: EcosystemAssociation[] = ["ASPEBTINDO", "BAKTI"];

const ACTIVE_STATUS_VARIANT: Record<PlatformMembershipStatus, "green" | "amber" | "muted"> = {
  Aktif: "green",
  Suspended: "amber",
  "Non-Aktif": "muted",
};

const PENGAWAS_STATUS_VARIANT: Record<EcosystemPengawasMembershipStatus, "green" | "amber" | "muted"> = {
  Aktif: "green",
  Suspended: "amber",
  "Non-Aktif": "muted",
};

interface ActiveFormState {
  platformEntityId: string;
  platformName: string;
  ecosystemType: PlatformMembershipEcosystemType;
  ecosystemEntityId: string;
  ecosystemEntityName: string;
  id: string;
  registeredAt: string;
  picName: string;
  picContact: string;
  status: PlatformMembershipStatus;
}

interface PengawasFormState {
  association: EcosystemAssociation;
  sourceEntityId: string;
  companyName: string;
  category: PelakuUsahaCategory;
  license: string;
  id: string;
  joinedAt: string;
  picName: string;
  picContact: string;
  status: EcosystemPengawasMembershipStatus;
}

export default function ManagementMemberPage() {
  const { user } = useDemoSession();
  const { showToast } = useToast();
  const [tab, setTab] = useState("active");

  const activeMembers = usePlatformEcosystemMemberships(PLATFORM_ECOSYSTEM_MEMBERSHIPS);
  const pengawasMembers = useEcosystemPengawasMembers(EKOSISTEM_PENGAWAS_MEMBERS);

  // Shared master data: every Platform/Pialang entity (Step 1 of the Tambah
  // Member cascade) and every Bursa/Kliring/Custody institution (Step 3,
  // filtered to the ecosystemType chosen in Step 2).
  const pelakuUsahaCandidates = useMemo(() => ECOSYSTEM_ENTITIES.filter((e) => e.category === "Pialang"), []);
  const ecosystemCandidates = useMemo(
    () => ECOSYSTEM_ENTITIES.filter((e) => e.ecosystemType === "Ecosystem Aktif" && e.category !== "Pialang"),
    []
  );

  // --- Tab A: Member Ekosistem Active (cascading: Platform -> Tipe Ekosistem -> Lembaga -> atribut) ---
  const [activeDialog, setActiveDialog] = useState<"add" | PlatformEcosystemMembership | null>(null);
  const [activeForm, setActiveForm] = useState<ActiveFormState>({
    platformEntityId: "",
    platformName: "",
    ecosystemType: "Bursa",
    ecosystemEntityId: "",
    ecosystemEntityName: "",
    id: "",
    registeredAt: "",
    picName: "",
    picContact: "",
    status: "Aktif",
  });

  function openAddActive() {
    setActiveForm({
      platformEntityId: "",
      platformName: "",
      ecosystemType: "Bursa",
      ecosystemEntityId: "",
      ecosystemEntityName: "",
      id: "",
      registeredAt: formatDateID(new Date()),
      picName: "",
      picContact: "",
      status: "Aktif",
    });
    setActiveDialog("add");
  }

  function openEditActive(m: PlatformEcosystemMembership) {
    setActiveForm({
      platformEntityId: m.platformEntityId,
      platformName: m.platformName,
      ecosystemType: m.ecosystemType,
      ecosystemEntityId: m.ecosystemEntityId,
      ecosystemEntityName: m.ecosystemEntityName,
      id: m.id,
      registeredAt: m.registeredAt,
      picName: m.picName,
      picContact: m.picContact,
      status: m.status,
    });
    setActiveDialog(m);
  }

  function selectActivePlatform(name: string) {
    const entity = pelakuUsahaCandidates.find((e) => e.name === name);
    if (!entity) return;
    setActiveForm((f) => ({ ...f, platformEntityId: entity.id, platformName: entity.name }));
  }

  function selectActiveLembaga(name: string) {
    const entity = ecosystemCandidates.find((e) => e.category === activeForm.ecosystemType && e.name === name);
    if (!entity) return;
    setActiveForm((f) => ({ ...f, ecosystemEntityId: entity.id, ecosystemEntityName: entity.name }));
  }

  function submitActive() {
    if (!activeForm.id.trim() || !activeForm.platformName || !activeForm.ecosystemEntityName) return;
    const record: PlatformEcosystemMembership = {
      id: activeForm.id.trim(),
      platformEntityId: activeForm.platformEntityId,
      platformName: activeForm.platformName,
      ecosystemType: activeForm.ecosystemType,
      ecosystemEntityId: activeForm.ecosystemEntityId,
      ecosystemEntityName: activeForm.ecosystemEntityName,
      registeredAt: activeForm.registeredAt,
      picName: activeForm.picName,
      picContact: activeForm.picContact,
      status: activeForm.status,
      createdBy: user.name,
      createdAt: formatDateID(new Date()),
    };
    if (activeDialog === "add") {
      addPlatformMembership(record);
      showToast("Member Ekosistem Active berhasil ditambahkan.");
    } else if (activeDialog) {
      updatePlatformMembership(activeDialog.id, record);
      showToast("Profil member berhasil diperbarui.");
    }
    setActiveDialog(null);
  }

  // --- Tab B: Member Ekosistem Pengawas ---
  const [pengawasDialog, setPengawasDialog] = useState<"add" | EcosystemPengawasMember | null>(null);
  const [pengawasForm, setPengawasForm] = useState<PengawasFormState>({
    association: "ASPEBTINDO",
    sourceEntityId: "",
    companyName: "",
    category: "Pialang Berjangka",
    license: "",
    id: "",
    joinedAt: "",
    picName: "",
    picContact: "",
    status: "Aktif",
  });

  function openAddPengawas() {
    setPengawasForm({
      association: "ASPEBTINDO",
      sourceEntityId: "",
      companyName: "",
      category: "Pialang Berjangka",
      license: "",
      id: "",
      joinedAt: formatDateID(new Date()),
      picName: "",
      picContact: "",
      status: "Aktif",
    });
    setPengawasDialog("add");
  }

  function openEditPengawas(m: EcosystemPengawasMember) {
    setPengawasForm({
      association: m.association,
      sourceEntityId: m.sourceEntityId,
      companyName: m.companyName,
      category: m.category,
      license: m.license,
      id: m.id,
      joinedAt: m.joinedAt,
      picName: m.picName,
      picContact: m.picContact,
      status: m.status,
    });
    setPengawasDialog(m);
  }

  function selectPelakuUsaha(name: string) {
    const entity = pelakuUsahaCandidates.find((e) => e.name === name);
    if (!entity) return;
    const inferredCategory: PelakuUsahaCategory = entity.bursa === "Bursa Aset Kripto Indonesia" ? "CPFAK / PFAK" : "Pialang Berjangka";
    setPengawasForm((f) => ({
      ...f,
      sourceEntityId: entity.id,
      companyName: entity.name,
      category: inferredCategory,
      license: entity.license ?? "",
    }));
  }

  function submitPengawas() {
    if (!pengawasForm.id.trim() || !pengawasForm.companyName.trim()) return;
    const record: EcosystemPengawasMember = {
      id: pengawasForm.id.trim(),
      sourceEntityId: pengawasForm.sourceEntityId,
      association: pengawasForm.association,
      companyName: pengawasForm.companyName,
      category: pengawasForm.category,
      license: pengawasForm.license,
      joinedAt: pengawasForm.joinedAt,
      picName: pengawasForm.picName,
      picContact: pengawasForm.picContact,
      status: pengawasForm.status,
      createdBy: user.name,
      createdAt: formatDateID(new Date()),
    };
    if (pengawasDialog === "add") {
      addPengawasMember(record);
      showToast("Member Ekosistem Pasif berhasil ditambahkan.");
    } else if (pengawasDialog) {
      updatePengawasMember(pengawasDialog.id, record);
      showToast("Profil member berhasil diperbarui.");
    }
    setPengawasDialog(null);
  }

  return (
    <div>
      <PageHeader
        title="Management Member"
        description="Pengelolaan data keanggotaan Ekosistem Active dan Ekosistem Pasif secara terpusat oleh Bappebti."
        actions={
          <Button size="sm" onClick={tab === "active" ? openAddActive : openAddPengawas}>
            <Plus className="size-3.5" /> Tambah Member
          </Button>
        }
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="active">Member Ekosistem Active</TabsTrigger>
          <TabsTrigger value="pengawas">Member Ekosistem Pasif</TabsTrigger>
        </TabsList>

        <TabsContent value="active">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Keanggotaan</TableHead>
                <TableHead>Pialang</TableHead>
                <TableHead>Tipe Ekosistem</TableHead>
                <TableHead>Lembaga</TableHead>
                <TableHead>Terdaftar</TableHead>
                <TableHead>PIC & Kontak</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {activeMembers.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-navy whitespace-nowrap">{m.id}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{m.platformName}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.ecosystemType}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{m.ecosystemEntityName}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.registeredAt}</TableCell>
                  <TableCell className="text-muted max-w-[180px] truncate">{m.picName} &middot; {m.picContact}</TableCell>
                  <TableCell>
                    <Badge variant={ACTIVE_STATUS_VARIANT[m.status]}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button title="Ubah Profil" onClick={() => openEditActive(m)} className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        title="Hapus Keanggotaan"
                        onClick={() => {
                          deletePlatformMembership(m.id);
                          showToast("Keanggotaan dihapus.");
                        }}
                        className="rounded p-1 text-muted hover:bg-red-bg hover:text-red"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {activeMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} className="text-center text-muted py-6">
                    Belum ada member Ekosistem Active.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>

        <TabsContent value="pengawas">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kode Anggota</TableHead>
                <TableHead>Nama Perusahaan</TableHead>
                <TableHead>Lembaga</TableHead>
                <TableHead>Kategori</TableHead>
                <TableHead>No. Izin</TableHead>
                <TableHead>Bergabung</TableHead>
                <TableHead>PIC Compliance</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pengawasMembers.map((m) => (
                <TableRow key={m.id}>
                  <TableCell className="font-medium text-navy whitespace-nowrap">{m.id}</TableCell>
                  <TableCell className="max-w-[180px] truncate">{m.companyName}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.association}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.category}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.license}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.joinedAt}</TableCell>
                  <TableCell className="text-muted max-w-[160px] truncate">{m.picName}</TableCell>
                  <TableCell>
                    <Badge variant={PENGAWAS_STATUS_VARIANT[m.status]}>{m.status}</Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1">
                      <button title="Ubah Profil" onClick={() => openEditPengawas(m)} className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy">
                        <Pencil className="size-3.5" />
                      </button>
                      <button
                        title="Hapus Keanggotaan"
                        onClick={() => {
                          deletePengawasMember(m.id);
                          showToast("Keanggotaan dihapus.");
                        }}
                        className="rounded p-1 text-muted hover:bg-red-bg hover:text-red"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {pengawasMembers.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted py-6">
                    Belum ada member Ekosistem Pasif.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Tambah/Ubah Member — Ekosistem Active (cascading: Platform -> Tipe Ekosistem -> Lembaga -> atribut) */}
      <Dialog open={!!activeDialog} onOpenChange={(v) => !v && setActiveDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{activeDialog === "add" ? "Tambah Member Ekosistem Active" : "Ubah Profil Member"}</DialogTitle>
            <DialogDescription>Petakan keanggotaan sebuah Pialang di salah satu lembaga Bursa, Kliring, atau Custody.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>Langkah 1 — Pialang</Label>
              <SearchableSelect
                value={activeForm.platformName}
                onChange={selectActivePlatform}
                groups={[{ label: "Pialang", options: pelakuUsahaCandidates.map((e) => e.name) }]}
                placeholder="Pilih pialang..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="active-type">Langkah 2 — Tipe Ekosistem</Label>
                <Select
                  id="active-type"
                  value={activeForm.ecosystemType}
                  onChange={(e) =>
                    setActiveForm((f) => ({
                      ...f,
                      ecosystemType: e.target.value as PlatformMembershipEcosystemType,
                      ecosystemEntityId: "",
                      ecosystemEntityName: "",
                    }))
                  }
                >
                  {ACTIVE_ECOSYSTEM_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label>Langkah 3 — Lembaga / Perusahaan</Label>
                <SearchableSelect
                  value={activeForm.ecosystemEntityName}
                  onChange={selectActiveLembaga}
                  groups={[{
                    label: activeForm.ecosystemType,
                    options: ecosystemCandidates.filter((e) => e.category === activeForm.ecosystemType).map((e) => e.name),
                  }]}
                  placeholder="Pilih lembaga..."
                />
              </div>
            </div>
            <p className="text-[11px] font-semibold text-navy">Langkah 4 — Atribut Keanggotaan</p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="active-id">Kode Anggota Internal</Label>
                <Input id="active-id" value={activeForm.id} onChange={(e) => setActiveForm((f) => ({ ...f, id: e.target.value }))} placeholder="mis. MBR-PL-018" />
              </div>
              <div>
                <Label htmlFor="active-registered">Tanggal Efektif</Label>
                <Input id="active-registered" value={activeForm.registeredAt} onChange={(e) => setActiveForm((f) => ({ ...f, registeredAt: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="active-pic-name">PIC / Kontak</Label>
                <Input id="active-pic-name" value={activeForm.picName} onChange={(e) => setActiveForm((f) => ({ ...f, picName: e.target.value }))} placeholder="Nama PIC" />
              </div>
              <div>
                <Label htmlFor="active-pic-contact">Kontak PIC</Label>
                <Input id="active-pic-contact" value={activeForm.picContact} onChange={(e) => setActiveForm((f) => ({ ...f, picContact: e.target.value }))} placeholder="Email / telepon" />
              </div>
            </div>
            <div>
              <Label htmlFor="active-status">Status Keanggotaan</Label>
              <Select
                id="active-status"
                value={activeForm.status}
                onChange={(e) => setActiveForm((f) => ({ ...f, status: e.target.value as PlatformMembershipStatus }))}
              >
                {ACTIVE_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setActiveDialog(null)}>Batal</Button>
            <Button
              size="sm"
              disabled={!activeForm.id.trim() || !activeForm.platformName || !activeForm.ecosystemEntityName}
              onClick={submitActive}
            >
              {activeDialog === "add" ? "Tambah Member" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tambah/Ubah Member — Ekosistem Pengawas */}
      <Dialog open={!!pengawasDialog} onOpenChange={(v) => !v && setPengawasDialog(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{pengawasDialog === "add" ? "Tambah Member Ekosistem Pasif" : "Ubah Profil Member"}</DialogTitle>
            <DialogDescription>Pelaku usaha di bawah asosiasi pengawas (ASPEBTINDO / BAKTI).</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="pengawas-lembaga">Lembaga Penampung</Label>
              <Select
                id="pengawas-lembaga"
                value={pengawasForm.association}
                onChange={(e) => setPengawasForm((f) => ({ ...f, association: e.target.value as EcosystemAssociation }))}
              >
                {ASSOCIATIONS.map((a) => (
                  <option key={a} value={a}>{a}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Pelaku Usaha (dari Pialang Management)</Label>
              <SearchableSelect
                value={pengawasForm.companyName}
                onChange={selectPelakuUsaha}
                groups={[{ label: "Pialang Berjangka / Pedagang", options: pelakuUsahaCandidates.map((e) => e.name) }]}
                placeholder="Pilih pelaku usaha..."
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pengawas-category">Kategori Pelaku Usaha</Label>
                <Select
                  id="pengawas-category"
                  value={pengawasForm.category}
                  onChange={(e) => setPengawasForm((f) => ({ ...f, category: e.target.value as PelakuUsahaCategory }))}
                >
                  {PELAKU_USAHA_CATEGORIES.map((c) => (
                    <option key={c} value={c}>{c}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="pengawas-license">No. Izin Bappebti</Label>
                <Input id="pengawas-license" value={pengawasForm.license} disabled />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pengawas-id">Kode Anggota Asosiasi</Label>
                <Input id="pengawas-id" value={pengawasForm.id} onChange={(e) => setPengawasForm((f) => ({ ...f, id: e.target.value }))} placeholder="mis. ASP-PL-048" />
              </div>
              <div>
                <Label htmlFor="pengawas-joined">Tanggal Terdaftar</Label>
                <Input id="pengawas-joined" value={pengawasForm.joinedAt} onChange={(e) => setPengawasForm((f) => ({ ...f, joinedAt: e.target.value }))} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="pengawas-pic-name">PIC Compliance</Label>
                <Input id="pengawas-pic-name" value={pengawasForm.picName} onChange={(e) => setPengawasForm((f) => ({ ...f, picName: e.target.value }))} />
              </div>
              <div>
                <Label htmlFor="pengawas-pic-contact">Kontak Aduan (email/telepon)</Label>
                <Input id="pengawas-pic-contact" value={pengawasForm.picContact} onChange={(e) => setPengawasForm((f) => ({ ...f, picContact: e.target.value }))} />
              </div>
            </div>
            <div>
              <Label htmlFor="pengawas-status">Status Keanggotaan</Label>
              <Select
                id="pengawas-status"
                value={pengawasForm.status}
                onChange={(e) => setPengawasForm((f) => ({ ...f, status: e.target.value as EcosystemPengawasMembershipStatus }))}
              >
                {PENGAWAS_STATUSES.map((s) => (
                  <option key={s} value={s}>{s}</option>
                ))}
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setPengawasDialog(null)}>Batal</Button>
            <Button size="sm" disabled={!pengawasForm.id.trim() || !pengawasForm.companyName.trim()} onClick={submitPengawas}>
              {pengawasDialog === "add" ? "Tambah Member" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
