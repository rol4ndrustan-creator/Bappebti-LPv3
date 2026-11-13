"use client";

import { useMemo, useState } from "react";
import { TicketLink } from "@/components/shared/ticket-link";
import { PageHeader } from "@/components/shared/page-header";
import { SimpleStatusBadge } from "@/components/shared/badges";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { PicAssignPopover } from "@/components/shared/pic-assign-popover";
import { MemberChips } from "@/components/shared/member-link-cell";
import { CASES } from "@/lib/mock-data";
import { useDemoSession } from "@/lib/demo-session";
import { useCasesData, setPlatformPic } from "@/lib/mock-service/store";
import { PLATFORM_STAFF } from "@/lib/permissions";
import { SourceBadge } from "@/components/shared/source-badge";
import { TicketStatusBadge } from "@/components/shared/ticket-lifecycle";

const UNASSIGNED = "Belum Ditugaskan";

export default function CaseQueuePage() {
  const { user } = useDemoSession();
  const isSupervisor = user.role === "PLATFORM_SUPERVISOR";
  const baseCases = useMemo(() => CASES.filter((c) => c.currentOwner === "Pialang"), []);
  const allCases = useCasesData(baseCases).filter((c) => c.currentOwner === "Pialang");

  // Data scoping (Bab II): a CS/PIC only ever sees tickets assigned to them.
  const scopedCases = isSupervisor ? allCases : allCases.filter((c) => c.platformPic === user.name);

  const [search, setSearch] = useState("");
  const [picFilter, setPicFilter] = useState("");

  const cases = scopedCases.filter((c) => {
    const matchesSearch = !search || c.ticket.toLowerCase().includes(search.toLowerCase()) || c.title.toLowerCase().includes(search.toLowerCase());
    const matchesPic = !picFilter || (picFilter === UNASSIGNED ? !c.platformPic : c.platformPic === picFilter);
    return matchesSearch && matchesPic;
  });


  return (
    <div>
      <PageHeader
        title="Manajemen Pengaduan"
        description="Daftar kasus pengaduan yang saat ini menjadi tanggung jawab Pialang untuk ditangani."
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
            <TableHead>Status Tiket</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {cases.map((c) => (
            <TableRow key={c.ticket}>
              <TableCell className="whitespace-nowrap">
                <TicketLink ticket={c.ticket} href={`/platform/kasus/${c.ticket}`} />
              </TableCell>
              <TableCell>
                <SourceBadge source={c.source} />
              </TableCell>
              <TableCell className="min-w-[200px] max-w-[280px]">
                <span className="line-clamp-2" title={c.title}>{c.title}</span>
              </TableCell>
              <TableCell>
                <PicAssignPopover
                  currentPic={c.platformPic}
                  staff={PLATFORM_STAFF}
                  onAssign={(name) => setPlatformPic(c.ticket, name)}
                />
              </TableCell>
              <TableCell>
<MemberChips entities={c.linkedEcosystemEntities} />
              </TableCell>
              <TableCell>
                <TicketStatusBadge complaintCase={c} />
              </TableCell>
            </TableRow>
          ))}
          {cases.length === 0 && (
            <TableRow>
              <TableCell colSpan={6} className="text-center text-muted py-6">
                {isSupervisor ? "Tidak ada kasus yang sesuai dengan filter." : "Tidak ada tiket yang ditugaskan kepada Anda."}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </div>
  );
}
