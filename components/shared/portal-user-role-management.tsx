"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/shared/toast-provider";
import { AdminUser } from "@/lib/types";
import { PORTAL_ACCESS, PORTAL_ROLE_SEED, PORTAL_USER_SEED, PortalKey } from "@/lib/portal-access";
import { useAdminUsers, addUser, editUser, deleteUser } from "@/lib/mock-service/admin-user-store";
import { useRoles, addRole, deleteRole } from "@/lib/mock-service/role-store";
import { logAudit } from "@/lib/mock-service/audit-store";
import { useDemoSession } from "@/lib/demo-session";
import { Ban, CheckCircle2, Eye, KeyRound, Plus, ShieldCheck, Trash2, UserPlus } from "lucide-react";

const cell = "py-1.5";

/** Active / Inactive (status "Menunggu Persetujuan" dari portal Bappebti diperlakukan sebagai Inactive). */
function isActive(u: AdminUser) {
  return u.status === "Aktif";
}

function StatusBadge({ u }: { u: AdminUser }) {
  return <Badge variant={isActive(u) ? "green" : "muted"}>{isActive(u) ? "ACTIVE" : "INACTIVE"}</Badge>;
}

/** Modul User & Role Management untuk portal Platform / Ekosistem Active / Ekosistem Pengawas (List Revisi 11 #4). */
export function PortalUserRoleManagement({ portal }: { portal: PortalKey }) {
  const config = PORTAL_ACCESS[portal];
  const { showToast } = useToast();
  const { user: me } = useDemoSession();
  const allUsers = useAdminUsers(PORTAL_USER_SEED);
  const allRoles = useRoles(PORTAL_ROLE_SEED);
  const users = allUsers.filter((u) => config.organizations.includes(u.organization));
  const roles = allRoles.filter((r) => r.portal === portal);

  // --- Pengguna ---
  const [search, setSearch] = React.useState("");
  const [orgFilter, setOrgFilter] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<"" | "Active" | "Inactive">("");
  const [addOpen, setAddOpen] = React.useState(false);
  const [viewing, setViewing] = React.useState<AdminUser | null>(null);
  const [deleting, setDeleting] = React.useState<AdminUser | null>(null);
  const defaultOrg = config.organizations.includes(me.institution) ? me.institution : config.organizations[0];
  const [form, setForm] = React.useState({ name: "", email: "", org: defaultOrg, role: roles[0]?.name ?? "", active: true });

  const filtered = users.filter((u) => {
    const q = search.toLowerCase();
    return (
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q)) &&
      (!orgFilter || u.organization === orgFilter) &&
      (!roleFilter || u.role === roleFilter) &&
      (!statusFilter || (statusFilter === "Active") === isActive(u))
    );
  });

  function submitUser() {
    if (!form.name.trim() || !form.email.trim() || !form.role) return;
    if (allUsers.some((u) => u.email.toLowerCase() === form.email.trim().toLowerCase())) {
      showToast("Email sudah terdaftar. Gunakan email lain.");
      return;
    }
    addUser({
      name: form.name.trim(),
      email: form.email.trim(),
      role: form.role,
      organization: form.org,
      status: form.active ? "Aktif" : "Nonaktif",
      lastLogin: "-",
    });
    logAudit({
      activity: "Tambah Pengguna",
      detail: `Menambahkan pengguna '${form.name.trim()}' (${form.role}, ${form.org}) dengan status ${form.active ? "Active" : "Inactive"}.`,
    });
    showToast(`Pengguna ${form.name.trim()} berhasil ditambahkan.`);
    setForm({ name: "", email: "", org: defaultOrg, role: roles[0]?.name ?? "", active: true });
    setAddOpen(false);
  }

  function toggleActive(u: AdminUser) {
    const next = isActive(u) ? "Nonaktif" : "Aktif";
    editUser(u.email, { status: next });
    logAudit({
      activity: "Ubah Status Akun",
      detail: `Memperbarui status akun '${u.name}' dari '${isActive(u) ? "Active" : "Inactive"}' menjadi '${next === "Aktif" ? "Active" : "Inactive"}'.`,
    });
    showToast(next === "Aktif" ? `Akun ${u.name} diaktifkan.` : `Akun ${u.name} dinonaktifkan.`);
  }

  function changeRole(u: AdminUser, role: string) {
    editUser(u.email, { role });
    logAudit({ activity: "Ubah Role Pengguna", detail: `Memperbarui role '${u.name}' dari '${u.role}' menjadi '${role}'.` });
    showToast(`Role ${u.name} diperbarui menjadi ${role}.`);
  }

  // --- Role ---
  const [roleOpen, setRoleOpen] = React.useState(false);
  const [roleName, setRoleName] = React.useState("");
  const [roleDesc, setRoleDesc] = React.useState("");
  const [roleMenus, setRoleMenus] = React.useState<Set<string>>(new Set());
  const [deletingRole, setDeletingRole] = React.useState<{ id: string; name: string } | null>(null);

  function submitRole() {
    if (!roleName.trim() || roleMenus.size === 0) return;
    addRole({
      id: `role-${portal.toLowerCase()}-${Date.now().toString(36)}`,
      portal,
      name: roleName.trim(),
      description: roleDesc.trim() || undefined,
      menuKeys: config.menus.filter((m) => roleMenus.has(m)),
      createdAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    });
    logAudit({ activity: "Tambah Role", detail: `Membuat role '${roleName.trim()}' dengan ${roleMenus.size} hak akses menu.` });
    showToast(`Role "${roleName.trim()}" berhasil dibuat.`);
    setRoleName("");
    setRoleDesc("");
    setRoleMenus(new Set());
    setRoleOpen(false);
  }

  return (
    <div>
      <PageHeader title={config.title} description={config.description} />

      <Tabs defaultValue="pengguna">
        <TabsList>
          <TabsTrigger value="pengguna">Pengguna ({users.length})</TabsTrigger>
          <TabsTrigger value="role">Role & Hak Akses ({roles.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="pengguna">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <div className="flex flex-wrap items-end gap-2">
              <div className="w-56">
                <Label>Cari</Label>
                <Input placeholder="Nama atau email..." value={search} onChange={(e) => setSearch(e.target.value)} />
              </div>
              <div className="w-56">
                <Label>Lembaga</Label>
                <Select value={orgFilter} onChange={(e) => setOrgFilter(e.target.value)}>
                  <option value="">Semua lembaga</option>
                  {config.organizations.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-48">
                <Label>Role</Label>
                <Select value={roleFilter} onChange={(e) => setRoleFilter(e.target.value)}>
                  <option value="">Semua role</option>
                  {roles.map((r) => (
                    <option key={r.id} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </Select>
              </div>
              <div className="w-36">
                <Label>Status</Label>
                <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as "" | "Active" | "Inactive")}>
                  <option value="">Semua</option>
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </Select>
              </div>
            </div>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <UserPlus className="size-3.5" /> Tambah User
            </Button>
          </div>

          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className={cell}>Nama</TableHead>
                <TableHead className={cell}>Email</TableHead>
                <TableHead className={cell}>Lembaga</TableHead>
                <TableHead className={cell}>Role / Hak Akses</TableHead>
                <TableHead className={cell}>Status Akun</TableHead>
                <TableHead className={cell}>Login Terakhir</TableHead>
                <TableHead className={cell}>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((u) => (
                <TableRow key={u.email}>
                  <TableCell className={`${cell} font-medium whitespace-nowrap`}>{u.name}</TableCell>
                  <TableCell className={cell}>{u.email}</TableCell>
                  <TableCell className={cell}>{u.organization}</TableCell>
                  <TableCell className={cell}>
                    <Select className="h-7 text-xs w-48" value={u.role} onChange={(e) => changeRole(u, e.target.value)}>
                      {!roles.some((r) => r.name === u.role) && <option value={u.role}>{u.role}</option>}
                      {roles.map((r) => (
                        <option key={r.id} value={r.name}>
                          {r.name}
                        </option>
                      ))}
                    </Select>
                  </TableCell>
                  <TableCell className={cell}>
                    <StatusBadge u={u} />
                  </TableCell>
                  <TableCell className={`${cell} whitespace-nowrap`}>{u.lastLogin}</TableCell>
                  <TableCell className={cell}>
                    <div className="flex items-center gap-1">
                      <button title="Lihat Detail" onClick={() => setViewing(u)} className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy">
                        <Eye className="size-3.5" />
                      </button>
                      <button
                        title={isActive(u) ? "Nonaktifkan (Inactive)" : "Aktifkan (Active)"}
                        onClick={() => toggleActive(u)}
                        className="rounded p-1 text-muted hover:bg-amber-bg hover:text-amber"
                      >
                        {isActive(u) ? <Ban className="size-3.5" /> : <CheckCircle2 className="size-3.5" />}
                      </button>
                      <button
                        title="Reset Password"
                        onClick={() => showToast(`Tautan reset password telah dikirim ke ${u.email}`)}
                        className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy"
                      >
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
        </TabsContent>

        <TabsContent value="role">
          <div className="mb-3 flex justify-end">
            <Button size="sm" onClick={() => setRoleOpen(true)}>
              <Plus className="size-3.5" /> Tambah Role
            </Button>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Deskripsi</TableHead>
                <TableHead>Hak Akses Menu</TableHead>
                <TableHead>Pengguna</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium whitespace-nowrap">
                    <span className="inline-flex items-center gap-1">
                      <ShieldCheck className="size-3.5 text-navy" /> {r.name}
                    </span>
                    {r.builtIn && <p className="text-[10px] text-muted">Bawaan</p>}
                  </TableCell>
                  <TableCell className="text-muted">{r.description ?? "-"}</TableCell>
                  <TableCell>
                    <div className="flex flex-wrap gap-1 max-w-md">
                      {r.menuKeys.map((m) => (
                        <Badge key={m} variant="navy">
                          {m}
                        </Badge>
                      ))}
                    </div>
                  </TableCell>
                  <TableCell>{users.filter((u) => u.role === r.name).length}</TableCell>
                  <TableCell>
                    {!r.builtIn && (
                      <button title="Hapus Role" onClick={() => setDeletingRole({ id: r.id, name: r.name })} className="rounded p-1 text-muted hover:bg-red-bg hover:text-red">
                        <Trash2 className="size-3.5" />
                      </button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      {/* Tambah User */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah User Baru</DialogTitle>
            <DialogDescription>Setiap user memiliki satu role yang menentukan hak aksesnya pada portal ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <div>
              <Label>Nama Lengkap</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Contoh: Siti Rahma" />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder={config.emailPlaceholder} />
            </div>
            <div>
              <Label>Lembaga</Label>
              <Select value={form.org} onChange={(e) => setForm({ ...form, org: e.target.value })}>
                {config.organizations.map((o) => (
                  <option key={o} value={o}>
                    {o}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Role / Hak Akses</Label>
              <Select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })}>
                {roles.map((r) => (
                  <option key={r.id} value={r.name}>
                    {r.name}
                  </option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Status Akun</Label>
              <Select value={form.active ? "Active" : "Inactive"} onChange={(e) => setForm({ ...form, active: e.target.value === "Active" })}>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>
              Batal
            </Button>
            <Button size="sm" disabled={!form.name.trim() || !form.email.trim() || !form.role} onClick={submitUser}>
              Tambah User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Detail */}
      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Detail User</DialogTitle>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div><dt className="text-muted">Nama</dt><dd className="font-medium">{viewing.name}</dd></div>
              <div><dt className="text-muted">Email</dt><dd className="font-medium">{viewing.email}</dd></div>
              <div><dt className="text-muted">Lembaga</dt><dd className="font-medium">{viewing.organization}</dd></div>
              <div><dt className="text-muted">Role</dt><dd className="font-medium">{viewing.role}</dd></div>
              <div><dt className="text-muted">Status Akun</dt><dd><StatusBadge u={viewing} /></dd></div>
              <div><dt className="text-muted">Login Terakhir</dt><dd className="font-medium">{viewing.lastLogin}</dd></div>
              <div className="sm:col-span-2">
                <dt className="text-muted">Hak Akses Menu</dt>
                <dd className="flex flex-wrap gap-1 mt-1">
                  {(roles.find((r) => r.name === viewing.role)?.menuKeys ?? []).map((m) => (
                    <Badge key={m} variant="navy">{m}</Badge>
                  ))}
                </dd>
              </div>
            </dl>
          )}
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setViewing(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hapus User */}
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
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (!deleting) return;
                deleteUser(deleting.email);
                logAudit({ activity: "Hapus Pengguna", detail: `Menghapus pengguna '${deleting.name}' (${deleting.organization}).` });
                showToast(`Pengguna ${deleting.name} telah dihapus.`);
                setDeleting(null);
              }}
            >
              Hapus User
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Tambah Role */}
      <Dialog open={roleOpen} onOpenChange={setRoleOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Tambah Role</DialogTitle>
            <DialogDescription>Pilih menu portal yang dapat diakses oleh role ini.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2.5">
            <div>
              <Label>Nama Role</Label>
              <Input value={roleName} onChange={(e) => setRoleName(e.target.value)} placeholder="Contoh: Tim Legal" />
            </div>
            <div>
              <Label>Deskripsi (opsional)</Label>
              <Textarea value={roleDesc} onChange={(e) => setRoleDesc(e.target.value)} className="min-h-[60px] text-sm" />
            </div>
            <div>
              <Label>Hak Akses Menu</Label>
              <div className="mt-1 grid grid-cols-1 sm:grid-cols-2 gap-1.5 rounded-md border border-border p-2">
                {config.menus.map((m) => (
                  <label key={m} className="flex items-center gap-2 text-xs cursor-pointer">
                    <Checkbox
                      checked={roleMenus.has(m)}
                      onCheckedChange={(v) =>
                        setRoleMenus((prev) => {
                          const next = new Set(prev);
                          if (v === true) next.add(m);
                          else next.delete(m);
                          return next;
                        })
                      }
                    />
                    {m}
                  </label>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setRoleOpen(false)}>Batal</Button>
            <Button size="sm" disabled={!roleName.trim() || roleMenus.size === 0} onClick={submitRole}>
              Simpan Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hapus Role */}
      <Dialog open={!!deletingRole} onOpenChange={(v) => !v && setDeletingRole(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Role</DialogTitle>
            <DialogDescription>Yakin ingin menghapus role &ldquo;{deletingRole?.name}&rdquo;?</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setDeletingRole(null)}>Batal</Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => {
                if (!deletingRole) return;
                deleteRole(deletingRole.id);
                logAudit({ activity: "Hapus Role", detail: `Menghapus role '${deletingRole.name}'.` });
                showToast(`Role "${deletingRole.name}" telah dihapus.`);
                setDeletingRole(null);
              }}
            >
              Hapus Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
