"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { ECOSYSTEM_ENTITIES, PLATFORM_ECOSYSTEM_MEMBERSHIPS } from "@/lib/mock-data";
import { usePlatformEcosystemMemberships } from "@/lib/mock-service/ecosystem-member-store";
import { useEkosistemActiveRole } from "@/lib/ekosistem-active-role";
import { PlatformEcosystemMembership, PlatformMembershipStatus } from "@/lib/types";
import { Eye } from "lucide-react";

const STATUS_VARIANT: Record<PlatformMembershipStatus, "green" | "amber" | "muted"> = {
  Aktif: "green",
  Suspended: "amber",
  "Non-Aktif": "muted",
};

function platformCategory(bursa?: string): string {
  return bursa === "Bursa Aset Kripto Indonesia" ? "Pedagang Fisik Kripto / PFAK" : "Pialang Berjangka";
}

export default function EkosistemActiveMemberPage() {
  const { roleType } = useEkosistemActiveRole();
  const allMemberships = usePlatformEcosystemMemberships(PLATFORM_ECOSYSTEM_MEMBERSHIPS);
  const members = useMemo(() => allMemberships.filter((m) => m.ecosystemType === roleType), [allMemberships, roleType]);
  const [viewing, setViewing] = useState<PlatformEcosystemMembership | null>(null);

  const entityById = useMemo(() => new Map(ECOSYSTEM_ENTITIES.map((e) => [e.id, e])), []);

  return (
    <div>
      <PageHeader
        title="Data Member"
        description={`Daftar pialang yang menjadi anggota di bawah naungan Ekosistem Active — konteks saat ini: ${roleType}.`}
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Kode Anggota Pialang</TableHead>
            <TableHead>Nama Perusahaan / Pialang</TableHead>
            <TableHead>Kategori Entitas</TableHead>
            <TableHead>No. Izin Bappebti</TableHead>
            <TableHead>Terdaftar</TableHead>
            <TableHead>PIC Pialang & Kontak</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {members.map((m) => {
            const platformEntity = entityById.get(m.platformEntityId);
            return (
              <TableRow key={m.id}>
                <TableCell className="font-medium text-navy whitespace-nowrap">{m.id}</TableCell>
                <TableCell className="max-w-[200px] truncate">{m.platformName}</TableCell>
                <TableCell className="text-muted whitespace-nowrap">{platformCategory(platformEntity?.bursa)}</TableCell>
                <TableCell className="text-muted whitespace-nowrap">{platformEntity?.license || "-"}</TableCell>
                <TableCell className="text-muted whitespace-nowrap">{m.registeredAt}</TableCell>
                <TableCell className="text-muted max-w-[180px] truncate">{m.picName} &middot; {m.picContact}</TableCell>
                <TableCell>
                  <Badge variant={STATUS_VARIANT[m.status]}>{m.status}</Badge>
                </TableCell>
                <TableCell>
                  <button
                    title="Lihat Detail"
                    onClick={() => setViewing(m)}
                    className="rounded p-1 text-muted hover:bg-muted-bg hover:text-navy"
                  >
                    <Eye className="size-3.5" />
                  </button>
                </TableCell>
              </TableRow>
            );
          })}
          {members.length === 0 && (
            <TableRow>
              <TableCell colSpan={8} className="text-center text-muted py-6">
                Belum ada pialang yang terdaftar sebagai anggota ({roleType}).
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{viewing?.platformName}</DialogTitle>
            <DialogDescription>Kode Anggota: {viewing?.id} &middot; {viewing?.ecosystemEntityName}</DialogDescription>
          </DialogHeader>
          {viewing && (
            <dl className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <dt className="text-muted">Kategori Entitas</dt>
                <dd className="font-medium mt-0.5">{platformCategory(entityById.get(viewing.platformEntityId)?.bursa)}</dd>
              </div>
              <div>
                <dt className="text-muted">Status Keanggotaan</dt>
                <dd className="mt-0.5"><Badge variant={STATUS_VARIANT[viewing.status]}>{viewing.status}</Badge></dd>
              </div>
              <div>
                <dt className="text-muted">No. Izin Bappebti</dt>
                <dd className="font-medium mt-0.5">{entityById.get(viewing.platformEntityId)?.license || "-"}</dd>
              </div>
              <div>
                <dt className="text-muted">Tanggal Terdaftar</dt>
                <dd className="font-medium mt-0.5">{viewing.registeredAt}</dd>
              </div>
              <div className="col-span-2">
                <dt className="text-muted">PIC Pialang & Kontak Aduan</dt>
                <dd className="font-medium mt-0.5">{viewing.picName} &middot; {viewing.picContact}</dd>
              </div>
            </dl>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
