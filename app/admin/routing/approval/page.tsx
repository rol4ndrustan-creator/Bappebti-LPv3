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
import { ECOSYSTEM_ENTITIES, ROUTING_CHANGE_REQUESTS } from "@/lib/mock-data";
import { useRoutingChangeRequests, decideRoutingChange } from "@/lib/mock-service/routing-change-store";
import { RoutingChangeRequest } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";
import { CheckCircle2, XCircle, ClipboardCheck } from "lucide-react";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

function statusVariant(status: RoutingChangeRequest["status"]): BadgeVariant {
  switch (status) {
    case "Menunggu":
      return "amber";
    case "Disetujui":
      return "green";
    case "Ditolak":
      return "red";
  }
}

function entityName(entitiesById: Map<string, string>, id: string): string {
  if (!id) return "-";
  return entitiesById.get(id) ?? "-";
}

function MappingDiff({ request, entitiesById }: { request: RoutingChangeRequest; entitiesById: Map<string, string> }) {
  const categories = Array.from(new Set([...Object.keys(request.before), ...Object.keys(request.after)]));
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Category Ekosistem</TableHead>
          <TableHead>Sebelum</TableHead>
          <TableHead>Sesudah</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((cat) => {
          const before = entityName(entitiesById, request.before[cat] ?? "");
          const after = entityName(entitiesById, request.after[cat] ?? "");
          const changed = before !== after;
          return (
            <TableRow key={cat}>
              <TableCell className="font-medium whitespace-nowrap">{cat}</TableCell>
              <TableCell className="text-muted">{before}</TableCell>
              <TableCell className={changed ? "font-medium text-navy" : "text-muted"}>{after}</TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

export default function ApprovalRoutingPage() {
  const requests = useRoutingChangeRequests(ROUTING_CHANGE_REQUESTS);
  const { showToast } = useToast();
  const entitiesById = React.useMemo(() => new Map(ECOSYSTEM_ENTITIES.map((e) => [e.id, e.name])), []);

  const pending = requests.filter((r) => r.status === "Menunggu");
  const history = requests.filter((r) => r.status !== "Menunggu");

  const [decisionTarget, setDecisionTarget] = React.useState<{ request: RoutingChangeRequest; approve: boolean } | null>(null);
  const [reason, setReason] = React.useState("");

  function openDecision(request: RoutingChangeRequest, approve: boolean) {
    setDecisionTarget({ request, approve });
    setReason("");
  }

  function confirmDecision() {
    if (!decisionTarget) return;
    const { request, approve } = decisionTarget;
    decideRoutingChange(request, approve ? "Disetujui" : "Ditolak", "Anda (Petugas Admin)", reason.trim() || undefined);
    showToast(`${request.id} telah ${approve ? "disetujui dan diterapkan" : "ditolak"}.`);
    setDecisionTarget(null);
  }

  return (
    <div>
      <PageHeader
        title="Approval Routing"
        description="Setiap routing baru atau perubahan routing pialang wajib melalui persetujuan di sini sebelum berlaku."
      />

      <Tabs defaultValue="request">
        <TabsList>
          <TabsTrigger value="request">
            <ClipboardCheck className="size-3.5" /> Request Approval ({pending.length})
          </TabsTrigger>
          <TabsTrigger value="history">History Approval ({history.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="request">
          <div className="space-y-3">
            {pending.map((r) => (
              <div key={r.id} className="rounded-lg border border-border bg-white p-3">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <div>
                    <span className="text-xs font-semibold text-navy">{r.id}</span>
                    <span className="text-xs text-muted"> &middot; {r.platformName}</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Button size="sm" variant="success" onClick={() => openDecision(r, true)}>
                      <CheckCircle2 className="size-3.5" /> Setujui
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => openDecision(r, false)}>
                      <XCircle className="size-3.5" /> Tolak
                    </Button>
                  </div>
                </div>
                <MappingDiff request={r} entitiesById={entitiesById} />
                <div className="text-[11px] text-muted mt-2">Diajukan oleh {r.requestedBy} &middot; {r.requestedAt}</div>
              </div>
            ))}
            {pending.length === 0 && (
              <div className="text-center text-muted py-10 text-sm">Tidak ada permohonan routing yang menunggu persetujuan.</div>
            )}
          </div>
        </TabsContent>

        <TabsContent value="history">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Pialang</TableHead>
                <TableHead>Diajukan Oleh</TableHead>
                <TableHead>Tanggal</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {history.map((r) => (
                <TableRow key={r.id}>
                  <TableCell className="font-medium text-navy whitespace-nowrap">{r.id}</TableCell>
                  <TableCell>{r.platformName}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{r.requestedBy}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{r.requestedAt}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(r.status)}>{r.status.toUpperCase()}</Badge>
                    <div className="text-[11px] text-muted mt-0.5">
                      oleh {r.decidedBy} &middot; {r.decidedAt}
                      {r.reason && <> &mdash; {r.reason}</>}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {history.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted py-6">Belum ada riwayat persetujuan routing.</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TabsContent>
      </Tabs>

      <Dialog open={!!decisionTarget} onOpenChange={(v) => !v && setDecisionTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{decisionTarget?.approve ? "Setujui Routing" : "Tolak Routing"}</DialogTitle>
            <DialogDescription>
              {decisionTarget?.request.id} — {decisionTarget?.request.platformName}
            </DialogDescription>
          </DialogHeader>
          <div>
            <Label htmlFor="routing-decision-reason">
              Komentar {decisionTarget?.approve ? "(opsional)" : "(wajib diisi)"}
            </Label>
            <Textarea id="routing-decision-reason" value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[70px] text-xs" />
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
