"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";
import { formatCurrency } from "@/lib/mock-data";

type ReviewStatus = "Terbuka" | "Dalam Proses" | "Selesai";

interface ReconciliationRow {
  batch: string;
  platform: string;
  transactionRef: string;
  amount: number;
  issueType: string;
  requiredAction: string;
  status: ReviewStatus;
}

const initialRows: ReconciliationRow[] = [
  {
    batch: "BATCH-2026-06-217",
    platform: "PT Pintu Kemana Saja",
    transactionRef: "STL-2026-06-330217",
    amount: 4200000,
    issueType: "Mismatch",
    requiredAction: "Rekonsiliasi ulang nilai settlement batch dengan data transaksi pialang dan sesuaikan saldo akun pelapor.",
    status: "Dalam Proses",
  },
  {
    batch: "BATCH-2026-06-452",
    platform: "PT Bursa Digital Nusantara",
    transactionRef: "STL-2026-06-330452",
    amount: 7800000,
    issueType: "Pending bank confirmation",
    requiredAction: "Tunggu konfirmasi bank atas referensi settlement, lalu perbarui status referensi pada sistem kliring.",
    status: "Terbuka",
  },
  {
    batch: "BATCH-2026-06-510",
    platform: "PT Monex Investindo Futures",
    transactionRef: "STL-2026-06-330510",
    amount: 15600000,
    issueType: "Missing settlement proof",
    requiredAction: "Minta bukti konfirmasi bank dari pialang sebelum batch dapat ditutup.",
    status: "Terbuka",
  },
  {
    batch: "BATCH-2026-06-588",
    platform: "PT Rifan Financindo Berjangka",
    transactionRef: "STL-2026-06-330588",
    amount: 9300000,
    issueType: "Duplicate reference",
    requiredAction: "Identifikasi entri duplikat pada batch dan hapus referensi yang tidak valid setelah verifikasi.",
    status: "Dalam Proses",
  },
  {
    batch: "BATCH-2026-06-602",
    platform: "PT Bursa Digital Nusantara",
    transactionRef: "STL-2026-06-330602",
    amount: 2150000,
    issueType: "Amount discrepancy",
    requiredAction: "Bandingkan nominal pada laporan pialang dengan data kliring dan sesuaikan selisih nominal.",
    status: "Terbuka",
  },
  {
    batch: "BATCH-2026-06-119",
    platform: "PT Monex Investindo Futures",
    transactionRef: "STL-2026-06-330119",
    amount: 18750000,
    issueType: "Mismatch",
    requiredAction: "Lakukan pencocokan ulang transaksi pada batch dengan data settlement bank kustodian.",
    status: "Selesai",
  },
];

const statusVariant: Record<ReviewStatus, "amber" | "navy" | "green"> = {
  Terbuka: "amber",
  "Dalam Proses": "navy",
  Selesai: "green",
};

export default function ReconciliationReviewPage() {
  const { showToast } = useToast();
  const [rows, setRows] = useState<ReconciliationRow[]>(initialRows);
  const [expanded, setExpanded] = useState<string | null>(null);

  function markDone(batch: string) {
    setRows((prev) =>
      prev.map((r) => (r.batch === batch ? { ...r, status: "Selesai" } : r))
    );
    showToast(`Tinjauan batch ${batch} ditandai selesai`);
  }

  return (
    <div>
      <PageHeader
        title="Reconciliation Review"
        description="Tinjauan batch / referensi settlement untuk proses pencocokan transaksi dan rekonsiliasi data antara pialang dan kliring."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Batch / Referensi</TableHead>
                <TableHead>Pialang</TableHead>
                <TableHead>Transaction Ref</TableHead>
                <TableHead>Amount</TableHead>
                <TableHead>Jenis Isu</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const isExpanded = expanded === r.batch;
                return (
                  <>
                    <TableRow key={r.batch}>
                      <TableCell className="font-medium text-navy">{r.batch}</TableCell>
                      <TableCell className="max-w-[160px] truncate text-muted">{r.platform}</TableCell>
                      <TableCell className="text-muted">{r.transactionRef}</TableCell>
                      <TableCell>{formatCurrency(r.amount)}</TableCell>
                      <TableCell className="text-muted">{r.issueType}</TableCell>
                      <TableCell><Badge variant={statusVariant[r.status]}>{r.status.toUpperCase()}</Badge></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpanded(isExpanded ? null : r.batch)}
                          >
                            {isExpanded ? "Tutup" : "Tinjau"}
                          </Button>
                          {r.status !== "Selesai" && (
                            <Button
                              variant="success"
                              size="sm"
                              onClick={() => markDone(r.batch)}
                            >
                              Tandai Selesai
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>

                    {isExpanded && (
                      <TableRow key={`${r.batch}-detail`}>
                        <TableCell colSpan={7} className="bg-muted-bg/40">
                          <div className="py-2 max-w-2xl text-xs space-y-1.5">
                            <p className="font-medium text-navy">Tindakan yang diperlukan</p>
                            <p className="text-muted">{r.requiredAction}</p>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
