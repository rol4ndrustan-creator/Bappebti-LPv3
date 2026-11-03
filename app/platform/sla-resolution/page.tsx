import { PageHeader } from "@/components/shared/page-header";
import { StatusBadge, SlaBadge } from "@/components/shared/badges";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { CASES } from "@/lib/mock-data";
import { ComplaintCase } from "@/lib/types";
import { AlertTriangle } from "lucide-react";

const platformCases = CASES.filter((c) => c.currentOwner === "Pialang");

// Distribute "Aman" cases across the two safe buckets for a richer demo.
const under12: ComplaintCase[] = [];
const between12and24: ComplaintCase[] = [];
const overdue: ComplaintCase[] = [];

platformCases.forEach((c, idx) => {
  if (c.slaStatus === "Lewat SLA") {
    overdue.push(c);
  } else if (c.slaStatus === "Mendekati SLA") {
    between12and24.push(c);
  } else {
    // "Aman" - split alternately between the two safe buckets
    if (idx % 2 === 0) {
      under12.push(c);
    } else {
      between12and24.push(c);
    }
  }
});

function stageOf(c: ComplaintCase): "investigation" | "evidence" | "drafted" | "acceptance" {
  if (c.status === "Menunggu Klarifikasi") return "evidence";
  if (c.status === "Resolusi Diajukan") {
    // split resolution-proposed cases: those with resolutionProposal set are
    // waiting on user acceptance, otherwise still in drafting
    return c.resolutionProposal ? "acceptance" : "drafted";
  }
  return "investigation";
}

const investigation = platformCases.filter((c) => stageOf(c) === "investigation");
const waitingEvidence = platformCases.filter((c) => stageOf(c) === "evidence");
const resolutionDrafted = platformCases.filter((c) => stageOf(c) === "drafted");
const waitingAcceptance = platformCases.filter((c) => stageOf(c) === "acceptance");

const overdueCases = platformCases.filter((c) => c.slaStatus === "Lewat SLA");

function StageColumn({ title, cases, emptyText }: { title: string; cases: ComplaintCase[]; emptyText: string }) {
  return (
    <div className="flex-1 min-w-[200px]">
      <div className="rounded-md border border-border bg-muted-bg px-2 py-1.5 mb-2">
        <h4 className="text-[11px] font-semibold uppercase tracking-wide text-navy">
          {title} <span className="text-muted">({cases.length})</span>
        </h4>
      </div>
      <div className="space-y-2">
        {cases.length === 0 && (
          <p className="text-[11px] text-muted px-1">{emptyText}</p>
        )}
        {cases.map((c) => (
          <div key={c.ticket} className="rounded-md border border-border bg-card p-2">
            <p className="text-[11px] font-medium text-navy">{c.ticket}</p>
            <p className="text-xs truncate">{c.title}</p>
            <div className="mt-1 flex items-center gap-1">
              <StatusBadge status={c.status} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function BucketCard({ label, cases, tone }: { label: string; cases: ComplaintCase[]; tone: "green" | "amber" | "red" }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{label}</span>
          <KpiCardInline count={cases.length} tone={tone} />
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        {cases.length === 0 && <p className="text-xs text-muted">Tidak ada kasus pada bucket ini.</p>}
        <ul className="space-y-1.5">
          {cases.map((c) => (
            <li key={c.ticket} className="flex items-center justify-between text-xs">
              <span className="font-medium text-navy">{c.ticket}</span>
              <span className="text-muted truncate max-w-[140px]">{c.title}</span>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}

function KpiCardInline({ count, tone }: { count: number; tone: "green" | "amber" | "red" }) {
  const toneMap: Record<string, string> = {
    green: "text-green",
    amber: "text-amber",
    red: "text-red",
  };
  return <span className={`text-base font-semibold ${toneMap[tone]}`}>{count}</span>;
}

export default function SlaResolutionPage() {
  return (
    <div>
      <PageHeader
        title="SLA & Resolution"
        description="Pemantauan usia kasus terhadap batas waktu SLA serta status kesiapan resolusi pada kasus yang ditangani Pialang."
      />

      <h2 className="text-sm font-semibold text-navy mb-2">SLA Aging Buckets</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
        <BucketCard label="< 12 Jam" cases={under12} tone="green" />
        <BucketCard label="12 - 24 Jam" cases={between12and24} tone="amber" />
        <BucketCard label="Overdue" cases={overdue} tone="red" />
      </div>

      <h2 className="text-sm font-semibold text-navy mb-2">Resolution Pipeline</h2>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <StageColumn title="Investigation" cases={investigation} emptyText="Tidak ada kasus dalam investigasi." />
        <StageColumn title="Waiting Evidence" cases={waitingEvidence} emptyText="Tidak ada kasus menunggu bukti." />
        <StageColumn title="Resolution Drafted" cases={resolutionDrafted} emptyText="Tidak ada draf resolusi." />
        <StageColumn title="Waiting User Acceptance" cases={waitingAcceptance} emptyText="Tidak ada resolusi menunggu konfirmasi pelapor." />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Rejected Resolution List</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>Alasan Penolakan</TableHead>
                  <TableHead>Tanggal</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell colSpan={4} className="text-center text-muted py-4">
                    Tidak ada resolusi yang ditolak saat ini.
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="border-red/40">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red">
              <AlertTriangle className="size-4" />
              Overdue Warning List
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Tiket</TableHead>
                  <TableHead>Pengaduan</TableHead>
                  <TableHead>SLA</TableHead>
                  <TableHead>Batas Waktu</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {overdueCases.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted py-4">
                      Tidak ada kasus yang melewati batas SLA.
                    </TableCell>
                  </TableRow>
                )}
                {overdueCases.map((c) => (
                  <TableRow key={c.ticket} className="bg-red-bg/40">
                    <TableCell className="font-medium text-red">{c.ticket}</TableCell>
                    <TableCell className="max-w-[160px] truncate">{c.title}</TableCell>
                    <TableCell><SlaBadge sla={c.slaStatus} /></TableCell>
                    <TableCell className="text-red">{c.slaDeadline}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
