import { Badge, badgeVariants } from "@/components/ui/badge";
import { CaseStatus, ComplaintType, OwnerType, Responsibility, Severity, SlaStatus, TaskPriority } from "@/lib/types";
import { cn } from "@/lib/utils";
import type { VariantProps } from "class-variance-authority";

type BadgeVariant = VariantProps<typeof badgeVariants>["variant"];

export function SeverityBadge({ severity }: { severity?: Severity }) {
  if (!severity) return <Badge variant="muted">NOT DEFINED YET</Badge>;
  const map: Record<Severity, BadgeVariant> = {
    Rendah: "green",
    Sedang: "amber",
    Tinggi: "amber",
    Kritis: "red",
  };
  return <Badge variant={map[severity]}>{severity.toUpperCase()}</Badge>;
}

export function StatusBadge({ status }: { status: CaseStatus }) {
  const map: Record<CaseStatus, BadgeVariant> = {
    Baru: "navy",
    Verifikasi: "navy",
    Diproses: "amber",
    "Menunggu Klarifikasi": "amber",
    "Resolusi Diajukan": "green",
    "Resolusi Disetujui": "green",
    Selesai: "green",
    Ditolak: "red",
  };
  return <Badge variant={map[status]}>{status.toUpperCase()}</Badge>;
}

/** Simplified 4-state status badge (Pending/In Progress/Resolved/Closed) for compact listing tables — List Revisi 4's "Manajemen Pengaduan" table, distinct from the full regulator-grade StatusBadge used on the detail page. */
export function SimpleStatusBadge({ status }: { status: CaseStatus }) {
  const SIMPLE_MAP: Record<CaseStatus, { label: string; variant: BadgeVariant }> = {
    Baru: { label: "Pending", variant: "navy" },
    Verifikasi: { label: "Pending", variant: "navy" },
    Diproses: { label: "In Progress", variant: "amber" },
    "Menunggu Klarifikasi": { label: "In Progress", variant: "amber" },
    "Resolusi Diajukan": { label: "In Progress", variant: "amber" },
    "Resolusi Disetujui": { label: "Resolved", variant: "green" },
    Selesai: { label: "Closed", variant: "green" },
    Ditolak: { label: "Closed", variant: "red" },
  };
  const { label, variant } = SIMPLE_MAP[status];
  return <Badge variant={variant}>{label}</Badge>;
}

export function ComplaintTypeBadge({ type }: { type?: ComplaintType }) {
  const resolved = type ?? "Pengaduan";
  return <Badge variant={resolved === "Kritik dan Saran" ? "amber" : "navy"}>{resolved}</Badge>;
}

export function OwnerBadge({ owner }: { owner: OwnerType }) {
  const map: Record<OwnerType, BadgeVariant> = {
    Pelapor: "outline",
    Pialang: "navy",
    Bursa: "navy",
    Kliring: "navy",
    Bappebti: "default",
  };
  const label: Record<OwnerType, string> = {
    Pelapor: "Public User",
    Pialang: "Pialang",
    Bursa: "Bursa",
    Kliring: "Kliring",
    Bappebti: "Bappebti Regulator",
  };
  return <Badge variant={map[owner]}>{label[owner]}</Badge>;
}

export function ResponsibilityBadge({ responsibility }: { responsibility: Responsibility }) {
  const map: Record<Responsibility, BadgeVariant> = {
    "BAPPEBTI OWNED": "red",
    "MEMBER ASSIGNED": "navy",
    "WAITING PUBLIC": "amber",
  };
  return <Badge variant={map[responsibility]}>{responsibility}</Badge>;
}

export function SlaBadge({ sla }: { sla: SlaStatus }) {
  const map: Record<SlaStatus, BadgeVariant> = {
    Aman: "green",
    "Mendekati SLA": "amber",
    "Lewat SLA": "red",
  };
  return <Badge variant={map[sla]}>{sla.toUpperCase()}</Badge>;
}

export function FeedbackTypeBadge({ type }: { type: "Kritik" | "Masukan" }) {
  return <Badge variant={type === "Kritik" ? "red" : "amber"}>{type.toUpperCase()}</Badge>;
}

export function TrendBadge({ trend }: { trend?: "naik" | "turun" | "stabil" }) {
  if (!trend) return null;
  const map: Record<"naik" | "turun" | "stabil", BadgeVariant> = { naik: "red", turun: "green", stabil: "muted" };
  const label = { naik: "Naik", turun: "Turun", stabil: "Stabil" };
  return <Badge variant={map[trend]}>{label[trend]}</Badge>;
}

export function RiskBadge({ risk }: { risk: "Rendah" | "Sedang" | "Tinggi" }) {
  const map: Record<"Rendah" | "Sedang" | "Tinggi", BadgeVariant> = { Rendah: "green", Sedang: "amber", Tinggi: "red" };
  return <Badge variant={map[risk]}>{risk.toUpperCase()}</Badge>;
}

/** Tugas Internal / Manajemen Tugas priority pill (List Revisi 8) — same color scale as RiskBadge, shared verbatim between the "Manajemen Tugas" tables and the case detail page's "Tugas Internal" tab so priority reads identically in both places. */
export function PriorityBadge({ priority }: { priority?: TaskPriority }) {
  if (!priority) return <span className="text-muted">-</span>;
  const map: Record<TaskPriority, BadgeVariant> = { Rendah: "green", Sedang: "amber", Tinggi: "red" };
  return <Badge variant={map[priority]}>{priority.toUpperCase()}</Badge>;
}

export function cellMuted(text?: string) {
  return <span className={cn("text-muted")}>{text || "-"}</span>;
}
