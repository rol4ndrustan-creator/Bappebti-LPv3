"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/shared/toast-provider";
import {
  SupervisoryActionEntry,
  SupervisoryActionStatus,
  addSupervisoryAction,
  useSupervisoryActions,
} from "@/lib/mock-service/supervisory-store";

type ActionStatus = SupervisoryActionStatus;
type SupervisoryAction = SupervisoryActionEntry;

const initialActions: SupervisoryAction[] = [
  { date: "15 Jun 2026", platform: "PT Monex Investindo Futures", action: "Kirim pengingat SLA", ticket: "BPP-2026-000187", due: "17 Jun 2026", status: "Berjalan" },
  { date: "15 Jun 2026", platform: "PT Monex Investindo Futures", action: "Ambil alih supervisi kasus", ticket: "BPP-2026-000193", due: "18 Jun 2026", status: "Berjalan" },
  { date: "14 Jun 2026", platform: "PT Monex Investindo Futures", action: "Minta penjelasan keterlambatan respon", ticket: "BPP-2026-000187", due: "16 Jun 2026", status: "Menunggu Respon" },
  { date: "13 Jun 2026", platform: "PT Rifan Financindo Berjangka", action: "Tinjau laporan kepatuhan SLA bulanan", ticket: "BPP-2026-000193", due: "15 Jun 2026", status: "Selesai" },
  { date: "12 Jun 2026", platform: "PT Monex Investindo Futures", action: "Minta data penanganan kasus terdahulu", ticket: "BPP-2026-000187", due: "14 Jun 2026", status: "Selesai" },
  { date: "10 Jun 2026", platform: "PT Rifan Financindo Berjangka", action: "Kirim pengingat SLA", ticket: "BPP-2026-000193", due: "12 Jun 2026", status: "Selesai" },
];

const statusVariant: Record<ActionStatus, "green" | "amber" | "navy"> = {
  Selesai: "green",
  "Menunggu Respon": "amber",
  Berjalan: "navy",
};

const platforms = ["PT Monex Investindo Futures", "PT Rifan Financindo Berjangka"];
const tickets = ["BPP-2026-000187", "BPP-2026-000193"];

export default function SupervisoryActionsPage() {
  const { showToast } = useToast();
  const actions = useSupervisoryActions(initialActions);
  const [platform, setPlatform] = useState(platforms[0]);
  const [ticket, setTicket] = useState(tickets[0]);
  const [action, setAction] = useState("");
  const [due, setDue] = useState("");

  const handleSubmit = () => {
    if (!action.trim() || !due.trim()) {
      showToast("Mohon lengkapi tindakan dan tanggal jatuh tempo");
      return;
    }
    const today = new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
    addSupervisoryAction({ date: today, platform, action, ticket, due, status: "Berjalan" });
    showToast("Catatan tindakan supervisi disimpan");
    setAction("");
    setDue("");
  };

  return (
    <div>
      <PageHeader
        title="Supervisory Actions"
        description="Log tindakan supervisi yang dilakukan Bursa terhadap pialang yang dipantau."
      />

      <Card className="mb-4">
        <CardContent>
          <p className="text-xs font-medium text-navy mb-3">Tambah Catatan Tindakan Supervisi</p>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3 items-end">
            <div className="space-y-1">
              <Label>Pialang</Label>
              <Select value={platform} onChange={(e) => setPlatform(e.target.value)}>
                {platforms.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tiket</Label>
              <Select value={ticket} onChange={(e) => setTicket(e.target.value)}>
                {tickets.map((t) => (
                  <option key={t} value={t}>{t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tindakan</Label>
              <Input placeholder="Contoh: Kirim pengingat SLA" value={action} onChange={(e) => setAction(e.target.value)} />
            </div>
            <div className="space-y-1">
              <Label>Tanggal Jatuh Tempo</Label>
              <Input placeholder="Contoh: 20 Jun 2026" value={due} onChange={(e) => setDue(e.target.value)} />
            </div>
            <Button onClick={handleSubmit}>Simpan</Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal</TableHead>
                <TableHead>Pialang</TableHead>
                <TableHead>Tindakan</TableHead>
                <TableHead>Tiket</TableHead>
                <TableHead>Jatuh Tempo</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {actions.map((a, i) => (
                <TableRow key={i}>
                  <TableCell className="text-muted">{a.date}</TableCell>
                  <TableCell className="font-medium text-navy max-w-[180px] truncate">{a.platform}</TableCell>
                  <TableCell>{a.action}</TableCell>
                  <TableCell className="text-muted">{a.ticket}</TableCell>
                  <TableCell className="text-muted">{a.due}</TableCell>
                  <TableCell><Badge variant={statusVariant[a.status]}>{a.status.toUpperCase()}</Badge></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
