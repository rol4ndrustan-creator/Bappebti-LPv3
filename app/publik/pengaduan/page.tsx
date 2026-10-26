"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { StatusBadge, ComplaintTypeBadge } from "@/components/shared/badges";
import { CASES, CATEGORY_LIST } from "@/lib/mock-data";
import { CaseStatus, ComplaintType } from "@/lib/types";
import { SourceBadge } from "@/components/shared/source-badge";

const STATUS_LIST: CaseStatus[] = [
  "Baru",
  "Verifikasi",
  "Diproses",
  "Menunggu Klarifikasi",
  "Resolusi Diajukan",
  "Resolusi Disetujui",
  "Selesai",
  "Ditolak",
];

const COMPLAINT_TYPE_LIST: ComplaintType[] = ["Pengaduan", "Kritik dan Saran"];

const PLATFORM_LIST_IN_USE = Array.from(new Set(CASES.map((c) => c.platform))).sort();

function parseDate(value: string): Date | null {
  const d = new Date(value);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function PengaduanListPage() {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [category, setCategory] = useState("");
  const [platform, setPlatform] = useState("");
  const [complaintType, setComplaintType] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filtered = useMemo(() => {
    const from = dateFrom ? parseDate(dateFrom) : null;
    const to = dateTo ? parseDate(`${dateTo}T23:59:59`) : null;

    return CASES.filter((c) => {
      const matchesSearch =
        !search ||
        c.title.toLowerCase().includes(search.toLowerCase()) ||
        c.ticket.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = !status || c.status === status;
      const matchesCategory = !category || c.category === category;
      const matchesPlatform = !platform || c.platform === platform;
      const matchesType = !complaintType || (c.complaintType ?? "Pengaduan") === complaintType;
      const created = parseDate(c.createdAt);
      const matchesFrom = !from || (!!created && created >= from);
      const matchesTo = !to || (!!created && created <= to);
      return matchesSearch && matchesStatus && matchesCategory && matchesPlatform && matchesType && matchesFrom && matchesTo;
    });
  }, [search, status, category, platform, complaintType, dateFrom, dateTo]);

  function resetFilters() {
    setSearch("");
    setStatus("");
    setCategory("");
    setPlatform("");
    setComplaintType("");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div>
      <PageHeader
        title="Pengaduan Saya"
        description="Daftar seluruh pengaduan yang telah Anda ajukan beserta status penanganannya."
      />

      <div className="mb-4 rounded-lg border border-border bg-card p-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="w-full max-w-xs">
            <Label>Cari</Label>
            <Input
              placeholder="Judul atau nomor tiket..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="w-44">
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Semua status</option>
              {STATUS_LIST.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-52">
            <Label>Platform</Label>
            <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
              <option value="">Semua platform</option>
              {PLATFORM_LIST_IN_USE.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-56">
            <Label>Kategori</Label>
            <Select value={category} onChange={(e) => setCategory(e.target.value)}>
              <option value="">Semua kategori</option>
              {CATEGORY_LIST.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
          <div className="w-48">
            <Label>Jenis Pengaduan</Label>
            <Select value={complaintType} onChange={(e) => setComplaintType(e.target.value)}>
              <option value="">Semua jenis</option>
              {COMPLAINT_TYPE_LIST.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-end gap-3">
          <div className="w-40">
            <Label>Tanggal Submit Dari</Label>
            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="w-40">
            <Label>Tanggal Submit Hingga</Label>
            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          <Button variant="secondary" size="sm" onClick={resetFilters}>
            Reset Filter
          </Button>
        </div>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tiket</TableHead>
            <TableHead>Sumber Pengaduan</TableHead>
            <TableHead>Judul</TableHead>
            <TableHead>Platform</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead>Jenis Pengaduan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Update Terakhir</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {filtered.map((c) => (
            <TableRow key={c.ticket}>
              <TableCell className="font-medium text-navy whitespace-nowrap">{c.ticket}</TableCell>
              <TableCell>
                <SourceBadge source={c.source} />
              </TableCell>
              <TableCell className="max-w-xs">{c.title}</TableCell>
              <TableCell className="whitespace-nowrap">{c.platform}</TableCell>
              <TableCell className="whitespace-nowrap">{c.category}</TableCell>
              <TableCell>
                <ComplaintTypeBadge type={c.complaintType} />
              </TableCell>
              <TableCell>
                <StatusBadge status={c.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-muted">{c.updatedAt}</TableCell>
              <TableCell>
                <Link href={`/publik/pengaduan/${c.ticket}`}>
                  <Button size="sm" variant="secondary">
                    Lihat Detail
                  </Button>
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {filtered.length === 0 && (
            <TableRow>
              <TableCell colSpan={9} className="text-center text-muted py-6">
                Tidak ada pengaduan yang sesuai dengan filter.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
