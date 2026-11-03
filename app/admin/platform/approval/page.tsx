"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge, badgeVariants } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ECOSYSTEM_CHANGE_REQUESTS } from "@/lib/mock-data";
import { useEcosystemChangeRequests, decideEcosystemChange } from "@/lib/mock-service/ecosystem-change-store";
import { EcosystemChangeRequest, EcosystemEntity } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";
import { CheckCircle2, XCircle, ClipboardCheck, Eye } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

const FIELD_LABELS: Partial<Record<keyof EcosystemEntity, string>> = {
  name: "Nama Pialang",
  license: "Nomor Izin / NIB",
  npwp: "NPWP Badan",
  address: "Alamat Kantor",
  province: "Provinsi",
  city: "Kabupaten / Kota",
  postalCode: "Kode Pos",
  officePhone: "Telepon Kantor",
  officialEmail: "Email Resmi",
  website: "Website",
  bursa: "Bursa",
  kliring: "Kliring",
  administratorEmail: "Email Administrator Utama",
  administratorName: "Nama Administrator Utama",
  direksi: "Data Direksi",
  komisaris: "Data Komisaris",
  suratAnggotaBursa: "Surat Anggota Bursa",
};

function statusVariant(status: EcosystemChangeRequest["status"]): BadgeVariant {
  switch (status) {
    case "Menunggu":
      return "amber";
    case "Disetujui":
      return "green";
    case "Ditolak":
      return "red";
  }
}

function formatValue(v: unknown): string {
  if (v === undefined || v === null || v === "") return "-";
  if (Array.isArray(v)) return `${v.length} data`;
  return String(v);
}

function ChangeDetail({ request }: { request: EcosystemChangeRequest }) {
  if (request.changeType === "Pendaftaran Baru") {
    const a = request.after as EcosystemEntity;
    return (
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-xs">
        <div><dt className="text-muted">Nama Pialang</dt><dd className="font-medium">{a.name}</dd></div>
        <div><dt className="text-muted">Nomor Izin</dt><dd className="font-medium">{a.license || "-"}</dd></div>
        <div><dt className="text-muted">Bursa / Kliring</dt><dd className="font-medium">{a.bursa || "-"} / {a.kliring || "-"}</dd></div>
        <div><dt className="text-muted">Administrator</dt><dd className="font-medium">{a.administratorName || "-"} ({a.administratorEmail || "-"})</dd></div>
        <div><dt className="text-muted">Jumlah Direksi</dt><dd className="font-medium">{a.direksi?.length ?? 0}</dd></div>
        <div><dt className="text-muted">Jumlah Komisaris</dt><dd className="font-medium">{a.komisaris?.length ?? 0}</dd></div>
        <div><dt className="text-muted">Surat Anggota Bursa</dt><dd className="font-medium">{a.suratAnggotaBursa?.length ?? 0}</dd></div>
        <div><dt className="text-muted">Jumlah PIC</dt><dd className="font-medium">{a.pics?.length ?? 0}</dd></div>
      </dl>
    );
  }

  const keys = Object.keys(request.before ?? {}) as (keyof EcosystemEntity)[];
  const before = request.before as Partial<EcosystemEntity> | undefined;
  const after = request.after as EcosystemEntity;
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Field</TableHead>
          <TableHead>Sebelum</TableHead>
          <TableHead>Sesudah</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {keys.map((key) => (
          <TableRow key={String(key)}>
            <TableCell className="font-medium whitespace-nowrap">{FIELD_LABELS[key] ?? String(key)}</TableCell>
            <TableCell className="text-muted">{formatValue(before?.[key])}</TableCell>
            <TableCell className="font-medium text-navy">{formatValue(after[key])}</TableCell>
          </TableRow>
        ))}
        {keys.length === 0 && (
          <TableRow>
            <TableCell colSpan={3} className="text-center text-muted py-4">Tidak ada field yang tercatat berubah.</TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

function RequestTable({
  requests,
  showActions,
  onView,
  onDecide,
}: {
  requests: EcosystemChangeRequest[];
  showActions: boolean;
  onView: (request: EcosystemChangeRequest) => void;
  onDecide: (request: EcosystemChangeRequest, approve: boolean) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>ID</TableHead>
          <TableHead>Jenis Perubahan</TableHead>
          <TableHead>Nama Pialang</TableHead>
          <TableHead>Diajukan Oleh</TableHead>
          <TableHead>Tanggal</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {requests.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-medium text-navy whitespace-nowrap">{r.id}</TableCell>
            <TableCell className="whitespace-nowrap">{r.changeType}</TableCell>
            <TableCell>{r.entityName}</TableCell>
            <TableCell className="text-muted whitespace-nowrap">{r.requestedBy}</TableCell>
            <TableCell className="text-muted whitespace-nowrap">{r.requestedAt}</TableCell>
            <TableCell>
              <Badge variant={statusVariant(r.status)}>{r.status.toUpperCase()}</Badge>
              {r.status !== "Menunggu" && (
                <div className="text-[11px] text-muted mt-0.5">
                  oleh {r.decidedBy} &middot; {r.decidedAt}
                  {r.reason && <> &mdash; {r.reason}</>}
                </div>
              )}
            </TableCell>
            <TableCell>
              <div className="flex items-center gap-1.5">
                <Button size="sm" variant="outline" onClick={() => onView(r)}>
                  <Eye className="size-3.5" /> Detail
                </Button>
                {showActions && (
                  <>
                    <Button size="sm" variant="success" onClick={() => onDecide(r, true)}>
                      <CheckCircle2 className="size-3.5" /> Setujui
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => onDecide(r, false)}>
                      <XCircle className="size-3.5" /> Tolak
                    </Button>
                  </>
                )}
              </div>
            </TableCell>
          </TableRow>
        ))}
        {requests.length === 0 && (
          <TableRow>
            <TableCell colSpan={7} className="text-center text-muted py-6">
              Tidak ada permohonan yang sesuai.
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
}

export default function ApprovalDataPlatformPage() {
  const allRequests = useEcosystemChangeRequests(ECOSYSTEM_CHANGE_REQUESTS);
  const { showToast } = useToast();

  // Scoped to platform entity requests only — every new platform
  // registration and every edit to an approved platform must pass through
  // here, separate from the general Approval Ekosistem queue.
  const requests = React.useMemo(
    () =>
      allRequests.filter(
        (r) => r.targetType === "Entitas Ekosistem" && (r.after as EcosystemEntity).category === "Pialang"
      ),
    [allRequests]
  );

  const pending = requests.filter((r) => r.status === "Menunggu");

  const [viewing, setViewing] = React.useState<EcosystemChangeRequest | null>(null);
  const [decisionTarget, setDecisionTarget] = React.useState<{ request: EcosystemChangeRequest; approve: boolean } | null>(null);
  const [reason, setReason] = React.useState("");

  function openDecision(request: EcosystemChangeRequest, approve: boolean) {
    setDecisionTarget({ request, approve });
    setReason("");
  }

  function confirmDecision() {
    if (!decisionTarget) return;
    const { request, approve } = decisionTarget;
    decideEcosystemChange(request, approve ? "Disetujui" : "Ditolak", "Anda (Petugas Admin)", reason.trim() || undefined);
    showToast(`${request.id} telah ${approve ? "disetujui" : "ditolak"}.`);
    setDecisionTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Approval Data Pialang"
        description="Semua pengajuan pendaftaran pialang baru dan perubahan data pialang wajib melalui persetujuan di sini."
      />

      <Tabs defaultValue="perlu-tindakan">
        <TabsList>
          <TabsTrigger value="perlu-tindakan">
            <ClipboardCheck className="size-3.5" /> Perlu Tindakan ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="semua">Semua Permohonan ({requests.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="perlu-tindakan">
          <RequestTable requests={pending} showActions onView={setViewing} onDecide={openDecision} />
        </TabsContent>

        <TabsContent value="semua">
          <RequestTable requests={requests} showActions={false} onView={setViewing} onDecide={openDecision} />
        </TabsContent>
      </Tabs>

      <Dialog open={!!viewing} onOpenChange={(v) => !v && setViewing(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Detail Permohonan — {viewing?.id}</DialogTitle>
            <DialogDescription>{viewing?.changeType} untuk {viewing?.entityName}</DialogDescription>
          </DialogHeader>
          {viewing && <ChangeDetail request={viewing} />}
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setViewing(null)}>Tutup</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!decisionTarget} onOpenChange={(v) => !v && setDecisionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionTarget?.approve ? "Setujui Permohonan" : "Tolak Permohonan"}</DialogTitle>
            <DialogDescription>
              {decisionTarget?.request.id} — {decisionTarget?.request.changeType} untuk {decisionTarget?.request.entityName}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="platform-decision-reason">
              Alasan {decisionTarget?.approve ? "(opsional)" : "(wajib diisi)"}
            </Label>
            <Textarea id="platform-decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[70px] text-xs" />
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setDecisionTarget(null)}>Batal</Button>
            <Button
              size="sm"
              variant={decisionTarget?.approve ? "success" : "destructive"}
              disabled={!decisionTarget?.approve && !reason.trim()}
              onClick={confirmDecision}
            >
              {decisionTarget?.approve ? "Konfirmasi Setuju" : "Konfirmasi Tolak"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
