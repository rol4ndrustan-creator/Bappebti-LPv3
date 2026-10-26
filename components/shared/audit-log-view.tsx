"use client";

import * as React from "react";
import Link from "next/link";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { AUDIT_SEED } from "@/lib/audit-seed";
import { useAuditEvents } from "@/lib/mock-service/audit-store";
import { formatWIB } from "@/lib/case-pdf";
import { AuditPortal } from "@/lib/types";
import { Search } from "lucide-react";

/**
 * Tabel Audit Log operasional (List Revisi 11 #6). `portals` membatasi
 * aktivitas yang ditampilkan ke portal tertentu; kosong = semua (Bappebti).
 */
export function AuditLogView({ portals, detailHref }: { portals?: AuditPortal[]; detailHref?: (ticket: string) => string }) {
  const events = useAuditEvents(AUDIT_SEED);
  const scoped = React.useMemo(() => (portals ? events.filter((e) => portals.includes(e.portal)) : events), [events, portals]);

  const [query, setQuery] = React.useState("");
  const [activity, setActivity] = React.useState("");
  const [user, setUser] = React.useState("");
  const [dateFrom, setDateFrom] = React.useState("");
  const [dateTo, setDateTo] = React.useState("");

  const activities = React.useMemo(() => Array.from(new Set(scoped.map((e) => e.activity))).sort(), [scoped]);
  const users = React.useMemo(() => Array.from(new Set(scoped.map((e) => e.userName))).sort(), [scoped]);

  const filtered = scoped.filter((e) => {
    const q = query.toLowerCase();
    const matchesQuery =
      !q || [e.userName, e.institution, e.activity, e.ticket ?? "", e.detail].some((v) => v.toLowerCase().includes(q));
    // Tanggal dibandingkan dalam WIB (yyyy-mm-dd).
    const day = new Date(new Date(e.timestamp).getTime() + 7 * 3600_000).toISOString().slice(0, 10);
    return (
      matchesQuery &&
      (!activity || e.activity === activity) &&
      (!user || e.userName === user) &&
      (!dateFrom || day >= dateFrom) &&
      (!dateTo || day <= dateTo)
    );
  });

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <Label>Cari</Label>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted" />
            <Input placeholder="Pengguna, aktivitas, tiket, rincian..." value={query} onChange={(e) => setQuery(e.target.value)} className="pl-8" />
          </div>
        </div>
        <div className="w-52">
          <Label>Aktivitas</Label>
          <Select value={activity} onChange={(e) => setActivity(e.target.value)}>
            <option value="">Semua aktivitas</option>
            {activities.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-48">
          <Label>Pengguna</Label>
          <Select value={user} onChange={(e) => setUser(e.target.value)}>
            <option value="">Semua pengguna</option>
            {users.map((u) => (
              <option key={u} value={u}>
                {u}
              </option>
            ))}
          </Select>
        </div>
        <div className="w-40">
          <Label>Tanggal Dari</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
        </div>
        <div className="w-40">
          <Label>Tanggal Hingga</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => {
            setQuery("");
            setActivity("");
            setUser("");
            setDateFrom("");
            setDateTo("");
          }}
        >
          Reset Filter
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu Kejadian (WIB)</TableHead>
            <TableHead>Nama Pengguna & Lembaga</TableHead>
            <TableHead>Aktivitas</TableHead>
            <TableHead>No. Tiket Terkait</TableHead>
            <TableHead>Rincian Perubahan</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((e) => (
            <TableRow key={e.id}>
              <TableCell className="whitespace-nowrap">{formatWIB(new Date(e.timestamp))} WIB</TableCell>
              <TableCell>
                <p className="font-medium whitespace-nowrap">
                  {e.userName} - {e.institution}
                </p>
                <p className="text-[11px] text-muted">{e.roleLabel}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap">{e.activity}</TableCell>
              <TableCell className="whitespace-nowrap">
                {e.ticket ? (
                  detailHref ? (
                    <Link href={detailHref(e.ticket)} className="font-medium text-navy hover:underline">
                      {e.ticket}
                    </Link>
                  ) : (
                    <span className="font-medium text-navy">{e.ticket}</span>
                  )
                ) : (
                  <span className="text-muted">-</span>
                )}
              </TableCell>
              <TableCell className="text-muted min-w-[260px]">{e.detail}</TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted py-6">
                Tidak ada aktivitas yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
