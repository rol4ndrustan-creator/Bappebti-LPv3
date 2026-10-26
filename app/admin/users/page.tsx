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
import { ADMIN_USERS, ROLE_DEFINITIONS } from "@/lib/mock-data";
import { AdminUser } from "@/lib/types";
import { useAdminUsers, addUser, editUser, deleteUser } from "@/lib/mock-service/admin-user-store";
import { useRoles } from "@/lib/mock-service/role-store";
import { useToast } from "@/components/shared/toast-provider";
import { UserPlus, Eye, Trash2, CheckCircle2, Ban, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

function statusVariant(status: AdminUser["status"]): BadgeVariant {
  switch (status) {
    case "Aktif":
      return "green";
    case "Menunggu Persetujuan":
      return "amber";
    case "Nonaktif":
      return "muted";
  }
}

const cell = "py-1.5";

export default function UserManagementPage() {
  const users = useAdminUsers(ADMIN_USERS);
  const roles = useRoles(ROLE_DEFINITIONS).filter((r) => !r.portal);
  const { showToast } = useToast();

  const [search, setSearch] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("");

  const [addOpen, setAddOpen] = React.useState(false);
  const [viewing, setViewing] = React.useState<AdminUser | null>(null);
  const [deleting, setDeleting] = React.useState<AdminUser | null>(null);

  const [newName, setNewName] = React.useState("");
  const [newEmail, setNewEmail] = React.useState("");
  const [newRole, setNewRole] = React.useState(roles[0]?.name ?? "");
  const [newOrg, setNewOrg] = React.useState("Bappebti");

  const allRoleNames = React.useMemo(
    () => Array.from(new Set([...roles.map((r) => r.name), ...users.map((u) => u.role)])).sort(),
    [roles, users]
  );

  const filtered = users.filter((u) => {
    const matchesSearch =
      !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = !roleFilter || u.role === roleFilter;
    const matchesStatus = !statusFilter || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  function resetAddForm() {
    setNewName("");
    setNewEmail("");
    setNewRole(roles[0]?.name ?? "");
    setNewOrg("Bappebti");
  }

  function handleAddUser() {
    if (!newName.trim() || !newEmail.trim()) return;
    addUser({
      name: newName.trim(),
      email: newEmail.trim(),
      role: newRole,
      organization: newOrg.trim() || "-",
      status: "Aktif",
      lastLogin: "-",
    });
    showToast(`Pengguna ${newName.trim()} berhasil ditambahkan.`);
    resetAddForm();
    setAddOpen(false);
  }

  function approveUser(email: string) {
    editUser(email, { status: "Aktif" });
    showToast("Pengguna telah disetujui dan diaktifkan");
  }

  function toggleActive(u: AdminUser) {
    editUser(u.email, { status: u.status === "Aktif" ? "Nonaktif" : "Aktif" });
    showToast(u.status === "Aktif" ? "Pengguna telah dinonaktifkan" : "Pengguna telah diaktifkan kembali");
  }

  function resetPassword(email: string) {
    showToast(`Tautan reset password telah dikirim ke ${email}`);
  }

  function confirmDelete() {
    if (!deleting) return;
    deleteUser(deleting.email);
    showToast(`Pengguna ${deleting.name} telah dihapus.`);
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        title="User Management"
        description="Kelola akun pengguna sistem: persetujuan, status aktif, role, dan reset password."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <UserPlus className="size-3.5" /> Tambah User
          </Button>
        }
      />

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <Label>Cari</Label>
          <Input placeholder="Nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-52">
          <Label>Role</Label>
          <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
            <option value="">Semua role</option>
            {allRoleNames.map((r) => (
              <option key={r} value={r}>{r}</option>
            ))}
          </Select>
        </div>
        <div className="w-44">
          <Label>Status</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
            <option value="">Semua status</option>
            <option value="Aktif">Aktif</option>
            <option value="Menunggu Persetujuan">Menunggu Persetujuan</option>
            <option value="Nonaktif">Nonaktif</option>
          </Select>
        </div>
        <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setRoleFilter(""); setStatusFilter(""); }}>
          Reset Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className={cell}>User</TableHead>
            <TableHead className={cell}>Email</TableHead>
            <TableHead className={cell}>Role</TableHead>
            <TableHead className={cell}>Organisasi</TableHead>
            <TableHead className={cell}>Status</TableHead>
            <TableHead className={cell}>Login Terakhir</TableHead>
            <TableHead className={cell}>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((u) => (
            <TableRow key={u.email}>
              <TableCell className={cn(cell, "font-medium")}>{u.name}</TableCell>
              <TableCell className={cell}>{u.email}</TableCell>
              <TableCell className={cell}>{u.role}</TableCell>
              <TableCell className={cell}>{u.organization}</TableCell>
              <TableCell className={cell}><Badge variant={statusVariant(u.status)}>{u.status.toUpperCase()}</Badge></TableCell>
              <TableCell className={cn(cell, "whitespace-nowrap")}>{u.lastLogin}</TableCell>
              <TableCell className={cell}>
                <div className="flex items-center gap-1">
                  <button title="Lihat Detail" onClick={() => setViewing(u)} className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy">
                    <Eye className="size-3.5" />
                  </button>
                  {u.status === "Menunggu Persetujuan" && (
                    <button title="Setujui" onClick={() => approveUser(u.email)} className="rounded p-1 text-muted hover:bg-green-bg hover:text-green">
                      <CheckCircle2 className="size-3.5" />
                    </button>
                  )}
                  {u.status !== "Menunggu Persetujuan" && (
                    <button
                      title={u.status === "Aktif" ? "Nonaktifkan" : "Aktifkan"}
                      onClick={() => toggleActive(u)}
                      className="rounded p-1 text-muted hover:bg-amber-bg hover:text-amber"
                    >
                      <Ban className="size-3.5" />
                    </button>
                  )}
                  <button title="Reset Password" onClick={() => resetPassword(u.email)} className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy">
                    <KeyRound className="size-3.5" />
                  </button>
                  <button title="Hapus" onClick={() => setDeleting(u)} className="rounded p-1 text-muted hover:bg-red-bg hover:text-red">
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted py-6">
                Tidak ada pengguna yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {/* Tambah User */}
      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetAddForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>Setiap user memiliki tepat satu role, dipilih dari role yang telah disetup pada Setup Role Access.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <div>
              <Label htmlFor="new-user-name">Nama Lengkap</Label>
              <Input id="new-user-name" value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Contoh: Siti Rahma" />
            </div>
            <div>
              <Label htmlFor="new-user-email">Email</Label>
              <Input id="new-user-email" type="email" value={newEmail} onChange={(e) => setNewEmail(e.target.value)} placeholder="nama@bappebti.go.id" />
            </div>
            <div>
              <Label htmlFor="new-user-role">Role</Label>
              <Select id="new-user-role" value={newRole} onChange={(e) => setNewRole(e.target.value)}>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="new-user-org">Organisasi</Label>
              <Input id="new-user-org" value={newOrg} onChange={(e) => setNewOrg(e.target.value)} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button size="sm" disabled={!newName.trim() || !newEmail.trim()} onClick={handleAddUser}>Tambah User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Lihat Detail */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><dt className="text-muted">Nama</dt><dd className="font-medium">{viewing.name}</dd></div>
              <div><dt className="text-muted">Email</dt><dd className="font-medium">{viewing.email}</dd></div>
              <div><dt className="text-muted">Role</dt><dd className="font-medium">{viewing.role}</dd></div>
              <div><dt className="text-muted">Organisasi</dt><dd className="font-medium">{viewing.organization}</dd></div>
              <div><dt className="text-muted">Status</dt><dd><Badge variant={statusVariant(viewing.status)}>{viewing.status.toUpperCase()}</Badge></dd></div>
              <div><dt className="text-muted">Login Terakhir</dt><dd className="font-medium">{viewing.lastLogin}</dd></div>
            </dl>
          )}
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setViewing(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hapus */}
      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus User</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus <strong>{deleting?.name}</strong> ({deleting?.email})? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setDeleting(null)}>Batal</Button>
            <Button size="sm" variant="destructive" onClick={confirmDelete}>Hapus User</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
