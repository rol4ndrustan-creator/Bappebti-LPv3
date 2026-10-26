"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ROLE_DEFINITIONS } from "@/lib/mock-data";
import { MENU_TREE } from "@/lib/menu-tree";
import { useRoles, addRole, deleteRole } from "@/lib/mock-service/role-store";
import { useToast } from "@/components/shared/toast-provider";
import { Plus, Trash2, ShieldCheck } from "lucide-react";

function newRoleId(name: string): string {
  return `role-${name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")}-${Date.now().toString(36)}`;
}

export default function RoleAccessPage() {
  const roles = useRoles(ROLE_DEFINITIONS).filter((r) => !r.portal);
  const { showToast } = useToast();

  const [addOpen, setAddOpen] = React.useState(false);
  const [name, setName] = React.useState("");
  const [description, setDescription] = React.useState("");
  const [selectedKeys, setSelectedKeys] = React.useState<Set<string>>(new Set());
  const [deleting, setDeleting] = React.useState<{ id: string; name: string } | null>(null);

  function resetForm() {
    setName("");
    setDescription("");
    setSelectedKeys(new Set());
  }

  function toggleKey(key: string, checked: boolean) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) next.add(key);
      else next.delete(key);
      return next;
    });
  }

  function toggleParent(parentKey: string, childKeys: string[], checked: boolean) {
    setSelectedKeys((prev) => {
      const next = new Set(prev);
      if (checked) {
        next.add(parentKey);
        childKeys.forEach((k) => next.add(k));
      } else {
        next.delete(parentKey);
        childKeys.forEach((k) => next.delete(k));
      }
      return next;
    });
  }

  function handleCreateRole() {
    if (!name.trim() || selectedKeys.size === 0) return;
    addRole({
      id: newRoleId(name),
      name: name.trim(),
      description: description.trim() || undefined,
      menuKeys: Array.from(selectedKeys),
      createdAt: new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" }),
    });
    showToast(`Role "${name.trim()}" berhasil dibuat.`);
    resetForm();
    setAddOpen(false);
  }

  function confirmDelete() {
    if (!deleting) return;
    deleteRole(deleting.id);
    showToast(`Role "${deleting.name}" telah dihapus.`);
    setDeleting(null);
  }

  return (
    <div>
      <PageHeader
        title="Setup Role Access"
        description="Buat role baru dan tentukan menu serta submenu yang dapat diakses oleh role tersebut. Role yang telah dibuat di sini akan muncul sebagai pilihan saat menambah user pada User Management."
        actions={
          <Button size="sm" onClick={() => setAddOpen(true)}>
            <Plus className="size-3.5" /> Tambah Role
          </Button>
        }
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nama Role</TableHead>
            <TableHead>Deskripsi</TableHead>
            <TableHead>Jumlah Menu Diizinkan</TableHead>
            <TableHead>Tipe</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {roles.map((r) => (
            <TableRow key={r.id}>
              <TableCell className="font-medium text-navy whitespace-nowrap">{r.name}</TableCell>
              <TableCell className="max-w-sm text-muted">{r.description || "-"}</TableCell>
              <TableCell>{r.menuKeys.length}</TableCell>
              <TableCell>
                {r.builtIn ? (
                  <Badge variant="navy"><ShieldCheck className="size-3" /> Bawaan Sistem</Badge>
                ) : (
                  <Badge variant="muted">Kustom</Badge>
                )}
              </TableCell>
              <TableCell>
                {!r.builtIn && (
                  <button
                    title="Hapus Role"
                    onClick={() => setDeleting({ id: r.id, name: r.name })}
                    className="rounded p-1 text-muted hover:bg-red-bg hover:text-red"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <Dialog open={addOpen} onOpenChange={(v) => { setAddOpen(v); if (!v) resetForm(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Tambah Role</DialogTitle>
            <DialogDescription>
              Isi nama role, lalu pilih menu dan submenu yang dapat diakses. Tidak ada batasan jumlah menu, namun minimal 1 submenu harus dipilih.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="role-name">Nama Role</Label>
              <Input id="role-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: Petugas Verifikasi Dokumen" />
            </div>
            <div>
              <Label htmlFor="role-desc">Deskripsi (opsional)</Label>
              <Textarea id="role-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[60px] text-xs" />
            </div>
            <div>
              <Label>Menu &amp; Submenu yang Dapat Diakses</Label>
              <div className="max-h-72 overflow-y-auto rounded-md border border-border p-2 space-y-1">
                {MENU_TREE.map((item) => {
                  const childKeys = item.children?.map((c) => c.key) ?? [];
                  const parentChecked = selectedKeys.has(item.key);
                  return (
                    <div key={item.key}>
                      <label className="flex items-center gap-2 py-1 cursor-pointer">
                        <Checkbox
                          checked={parentChecked}
                          onCheckedChange={(v) =>
                            item.children ? toggleParent(item.key, childKeys, !!v) : toggleKey(item.key, !!v)
                          }
                        />
                        <span className="text-xs font-medium">{item.label}</span>
                      </label>
                      {item.children && (
                        <div className="ml-6 space-y-1">
                          {item.children.map((child) => (
                            <label key={child.key} className="flex items-center gap-2 py-0.5 cursor-pointer">
                              <Checkbox
                                checked={selectedKeys.has(child.key)}
                                onCheckedChange={(v) => toggleKey(child.key, !!v)}
                              />
                              <span className="text-[11.5px] text-foreground/80">{child.label}</span>
                            </label>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
              {selectedKeys.size === 0 && (
                <p className="text-[11px] text-red mt-1">Pilih minimal 1 submenu.</p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="secondary" size="sm" onClick={() => setAddOpen(false)}>Batal</Button>
            <Button size="sm" disabled={!name.trim() || selectedKeys.size === 0} onClick={handleCreateRole}>
              Simpan Role
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={(v) => !v && setDeleting(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Role</DialogTitle>
            <DialogDescription>
              Yakin ingin menghapus role <strong>{deleting?.name}</strong>? User yang saat ini menggunakan role ini tidak akan otomatis berpindah role.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setDeleting(null)}>Batal</Button>
            <Button size="sm" variant="destructive" onClick={confirmDelete}>Hapus Role</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
