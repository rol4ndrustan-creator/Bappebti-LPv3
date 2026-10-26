"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { SimpleStatusBadge } from "@/components/shared/badges";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PicAssignPopover } from "@/components/shared/pic-assign-popover";
import { MemberLinkCell } from "@/components/shared/member-link-cell";
import { CASES, ECOSYSTEM_ENTITIES } from "@/lib/mock-data";
import { LinkedEcosystemEntity } from "@/lib/types";
import { useDemoSession } from "@/lib/demo-session";
import { useCasesData, setPlatformPic, setLinkedEcosystemEntities } from "@/lib/mock-service/store";
import { PLATFORM_STAFF } from "@/lib/permissions";
import { Eye } from "lucide-react";
import { SourceBadge } from "@/components/shared/source-badge";

const UNASSIGNED = "Belum Ditugaskan";
const ECOSYSTEM_CATEGORY_TYPE: Record<string, LinkedEcosystemEntity["type"]> = { Bursa: "Bursa", Kliring: "Kliring", Custody: "Custody" };

export default function CaseQueuePage() {
  const { user } = useDemoSession();
  const isSupervisor = user.role === "PLATFORM_SUPERVISOR";
  const baseCases = useMemo(() => CASES.filter((c) => c.currentOwner === "Platform"), []);
  const allCases = useCasesData(baseCases).filter((c) => c.currentOwner === "Platform");

  // Data scoping (Bab II): a CS/PIC only ever sees tickets assigned to them.
  const scopedCases = isSupervisor ? allCases : allCases.filter((c) => c.platformPic === user.name);

  const [search, setSearch] = useState("");
  const [picFilter, setPicFilter] = useState("");

  const cases = scopedCases.filter((c) => {
    const matchesSearch = !search || c.ticket.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase());
    const matchesPic = !picFilter || (picFilter === UNASSIGNED ? !c.platformPic : c.platformPic === picFilter);
    return matchesSearch && matchesPic;
  });

  const ecosystemCandidates = useMemo(
    () =>
      ECOSYSTEM_ENTITIES.filter((e) => e.ecosystemType === "Ecosystem Aktif" && ECOSYSTEM_CATEGORY_TYPE[e.category]).map((e) => ({
        id: e.id,
        name: e.name,
        type: ECOSYSTEM_CATEGORY_TYPE[e.category],
      })),
    []
  );

  return (
    <div>
      <PageHeader
        title="Manajemen Pengaduan"
        description="Daftar kasus pengaduan yang saat ini menjadi tanggung jawab Platform / Pialang untuk ditangani."
      />

      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <Label>Cari</Label>
          <Input placeholder="Nomor tiket atau judul..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        {isSupervisor && (
          <div className="w-56">
            <Label>PIC</Label>
            <Select value={picFilter} onChange={(e) => setPicFilter(e.target.value)}>
              <option value="">Semua PIC</option>
              <option value={UNASSIGNED}>{UNASSIGNED}</option>
              {PLATFORM_STAFF.map((s) => (
                <option key={s.id} value={s.name}>{s.name}</option>
              ))}
            </Select>
          </div>
        )}
        {(search || picFilter) && (
          <Button variant="secondary" size="sm" onClick={() => { setSearch(""); setPicFilter(""); }}>
            Reset Filter
          </Button>
        )}
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nomor Ticket</TableHead>
            <TableHead>Sumber Pengaduan</TableHead>
            <TableHead>Judul Pengaduan</TableHead>
            <TableHead>PIC</TableHead>
            <TableHead>Member</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => (
            <TableRow key={c.ticket}>
              <TableCell className="whitespace-nowrap">
                <Link href={`/platform/kasus/${c.ticket}`} className="font-medium text-navy hover:underline">
                  {c.ticket}
                </Link>
              </TableCell>
              <TableCell>
                <SourceBadge source={c.source} />
              </TableCell>
              <TableCell className="max-w-[240px] truncate">{c.title}</TableCell>
              <TableCell>
                <PicAssignPopover
                  currentPic={c.platformPic}
                  staff={PLATFORM_STAFF}
                  onAssign={(name) => setPlatformPic(c.ticket, name)}
                />
              </TableCell>
              <TableCell>
                <MemberLinkCell
                  ticket={c.ticket}
                  entities={c.linkedEcosystemEntities ?? []}
                  candidateEntities={ecosystemCandidates}
                  onSave={(ticket, entities) => setLinkedEcosystemEntities(ticket, entities)}
                />
              </TableCell>
              <TableCell>
                <SimpleStatusBadge status={c.status} />
              </TableCell>
              <TableCell>
                <Link href={`/platform/kasus/${c.ticket}`} title="Lihat Detail" className="inline-flex rounded p-1 text-muted hover:bg-muted-bg hover:text-navy">
                  <Eye className="size-4" />
                </Link>
              </TableCell>
            </TableRow>
          ))}
          {cases.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted py-6">
                {isSupervisor ? "Tidak ada kasus yang sesuai dengan filter." : "Tidak ada tiket yang ditugaskan kepada Anda."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
