"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";

type EvidenceStatus = "Menunggu" | "Diterima" | "Terlambat";

interface EvidenceRow {
  ticket: string;
  evidence: string;
  requestedFrom: string;
  deadline: string;
  status: EvidenceStatus;
}

const initialRows: EvidenceRow[] = [
  {
    ticket: "BPP-2026-000186",
    evidence: "Bukti konfirmasi bank untuk batch STL-2026-06-330217",
    requestedFrom: "Bank Kustodian",
    deadline: "17 Jun 2026",
    status: "Menunggu",
  },
  {
    ticket: "BPP-2026-000186",
    evidence: "Rincian transaksi batch settlement",
    requestedFrom: "Pialang",
    deadline: "16 Jun 2026",
    status: "Terlambat",
  },
  {
    ticket: "BPP-2026-000191",
    evidence: "Salinan instruksi transfer terkait referensi STL-2026-06-330452",
    requestedFrom: "Pialang",
    deadline: "18 Jun 2026",
    status: "Menunggu",
  },
  {
    ticket: "BPP-2026-000191",
    evidence: "Bukti konfirmasi bank atas referensi settlement",
    requestedFrom: "Bank Kustodian",
    deadline: "18 Jun 2026",
    status: "Menunggu",
  },
  {
    ticket: "BPP-2026-000184",
    evidence: "Rincian mutasi rekening penampungan settlement",
    requestedFrom: "Pialang",
    deadline: "16 Jun 2026",
    status: "Diterima",
  },
];

const statusVariant: Record<EvidenceStatus, "amber" | "green" | "red"> = {
  Menunggu: "amber",
  Diterima: "green",
  Terlambat: "red",
};

export default function SettlementEvidencePage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<EvidenceRow[]>(initialRows);

  function markReceived(index: number) {
    setRows((prev) => prev.map((r, i) => (i === index ? { ...r, status: "Diterima" } : r)));
    showToast(`Bukti settlement untuk ${rows[index].ticket} ditandai diterima`);
  }

  return (
    <div>
      <PageHeader
        title="Settlement Evidence"
        description="Pelacakan kelengkapan bukti settlement yang diperlukan dari pialang maupun bank kustodian untuk proses rekonsiliasi."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tiket</TableHead>
                <TableHead>Bukti Diperlukan</TableHead>
                <TableHead>Diminta Dari</TableHead>
                <TableHead>Batas Waktu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r, i) => (
                <TableRow key={`${r.ticket}-${i}`}>
                  <TableCell className="font-medium text-navy">{r.ticket}</TableCell>
                  <TableCell className="max-w-[280px]">{r.evidence}</TableCell>
                  <TableCell className="text-muted">{r.requestedFrom}</TableCell>
                  <TableCell className="text-muted">{r.deadline}</TableCell>
                  <TableCell><Badge variant={statusVariant[r.status]}>{r.status.toUpperCase()}</Badge></TableCell>
                  <TableCell>
                    {r.status !== "Diterima" ? (
                      <Button variant="success" size="sm" onClick={() => markReceived(i)}>
                        Tandai Diterima
                      </Button>
                    ) : (
                      <span className="text-[11px] text-muted">Tidak ada tindakan</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
