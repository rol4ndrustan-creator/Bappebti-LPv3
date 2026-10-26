"use client";

import { useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { SeverityBadge, PriorityBadge } from "@/components/shared/badges";
import { BackLink } from "@/components/shared/back-link";
import { StatusBadgeSelect } from "@/components/shared/status-badge-select";
import { AssigneeBadge } from "@/components/shared/task-table";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { CaseStatusExplanation } from "@/components/shared/case-status-explanation";
import { EscalationBanner } from "@/components/shared/escalation-banner";
import { ClarificationThread } from "@/components/shared/clarification-thread";
import { EvidenceList } from "@/components/shared/evidence-list";
import { FileUploader } from "@/components/shared/file-uploader";
import { ResolutionPanel } from "@/components/shared/resolution-panel";
import { CaseActionDialog, TONE_TO_BUTTON_VARIANT } from "@/components/shared/case-action-dialog";
import { DisputePanel } from "@/components/shared/dispute-panel";
import { disputeActorForRole } from "@/lib/dispute-workflow";
import { useOptionalEkosistemActiveRole } from "@/lib/ekosistem-active-role";
import { DownloadCaseButton } from "@/components/shared/download-case-button";
import { useToast } from "@/components/shared/toast-provider";
import { useDemoSession } from "@/lib/demo-session";
import { getCaseByTicket, formatCurrency, CASE_TASKS } from "@/lib/mock-data";
import { formatDueDateID } from "@/lib/format";
import { lembagaOptionsFor } from "@/lib/ecosystem-lembaga";
import { CASE_ACTIONS, CaseActionId, executeCaseAction } from "@/lib/case-actions";
import {
  useCaseData,
  addClarificationReply,
  addInternalNote,
  setSeverity,
  setCurrentOwner,
  addTimelineEvent,
  proposeResolution,
  addEvidence,
} from "@/lib/mock-service/store";
import { useTasksForCase, addTask, updateTaskStatus, deleteTask } from "@/lib/mock-service/task-store";
import { DEMO_USERS, ROLE_LABEL, getViewerGroup, ViewerGroup } from "@/lib/permissions";
import { CaseTask, InternalNoteTargetType, Severity, TaskDelegationType, TaskPriority } from "@/lib/types";
import { Plus, Trash2, Lock, FileText } from "lucide-react";

const NOTE_TARGET_TYPES: InternalNoteTargetType[] = ["Semua Pihak Tertutup", "Bursa", "Kliring", "Custody", "Bappebti"];
const DELEGATION_TYPES: TaskDelegationType[] = ["Internal Platform", "Bursa", "Kliring", "Custody"];
const TASK_PRIORITIES: TaskPriority[] = ["Rendah", "Sedang", "Tinggi"];
/** Bursa/Kliring/Custody institutions (Manajemen Ekosistem master data) used by both the Catatan Internal sasaran-entitas picker and the Tugas Internal delegation picker. */
const BACK_HREF: Record<ViewerGroup, string> = {
  User: "/bappebti/antrean",
  Bappebti: "/bappebti/antrean",
  Platform: "/platform/case-queue",
  EkosistemActive: "/ekosistem/active/pengaduan",
  EkosistemPengawas: "/ekosistem/pengawas/pengaduan",
};

const SEVERITY_OPTIONS: Severity[] = ["Rendah", "Sedang", "Tinggi", "Kritis"];
const ASSIGNABLE_NAMES = DEMO_USERS.filter((u) => u.role !== "PUBLIC_REPORTER" && u.role !== "PUBLIC_REPRESENTATIVE").map((u) => u.name);

export default function KasusDetailClient({ ticket }: { ticket: string }) {
  const base = getCaseByTicket(ticket);
  const c = useCaseData(base);
  const { showToast } = useToast();
  const { user } = useDemoSession();
  const tasks = useTasksForCase(ticket, CASE_TASKS);
  const ekosistemActiveRole = useOptionalEkosistemActiveRole();

  const [noteText, setNoteText] = useState("");
  const [noteTargetType, setNoteTargetType] = useState<InternalNoteTargetType>("Semua Pihak Tertutup");
  const [noteTargetEntity, setNoteTargetEntity] = useState("");
  const [activeAction, setActiveAction] = useState<CaseActionId | null>(null);
  const [escalating, setEscalating] = useState(false);
  const [resolutionText, setResolutionText] = useState("");
  const [newEvidenceFiles, setNewEvidenceFiles] = useState<string[]>([]);
  const [taskDesc, setTaskDesc] = useState("");
  const [delegationType, setDelegationType] = useState<TaskDelegationType>("Internal Platform");
  const [delegationEntity, setDelegationEntity] = useState("");
  const [taskAssignee, setTaskAssignee] = useState(ASSIGNABLE_NAMES[0] ?? "");
  const [taskDoc, setTaskDoc] = useState("");
  const [taskPriority, setTaskPriority] = useState<TaskPriority>("Sedang");
  const [taskDueDate, setTaskDueDate] = useState("");
  const [deletingTask, setDeletingTask] = useState<CaseTask | null>(null);

  if (!c) {
    return (
      <div>
        <PageHeader title="Kasus Tidak Ditemukan" />
        <Card>
          <CardContent className="text-sm text-muted py-6 text-center">
            Kasus dengan tiket <span className="font-medium text-foreground">{ticket}</span> tidak ditemukan.
            <div className="mt-3">
              <Link href="/bappebti/antrean">
                <Button variant="secondary" size="sm">
                  Kembali ke Daftar Pengaduan
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const viewerGroup: ViewerGroup = getViewerGroup(user.role);
  const isBappebti = viewerGroup === "Bappebti";
  const isInternal = viewerGroup !== "User";
  const isPlatform = viewerGroup === "Platform";

  // Role Restriction Rule (Bab II): a Platform CS/PIC may only open tickets
  // assigned to them; direct-URL access to another ticket is blocked.
  // Admin/Supervisor (and every other role) are unrestricted.
  const isUnauthorized =
    user.role === "PLATFORM_CASE_OFFICER" && !!c.platformPic && c.platformPic !== user.name;

  if (isUnauthorized) {
    return (
      <div>
        <PageHeader title="Akses Ditolak" />
        <Card>
          <CardContent className="py-8 text-center">
            <Lock className="size-8 text-red mx-auto mb-3" />
            <p className="text-sm font-semibold text-foreground">403 — Unauthorized</p>
            <p className="text-xs text-muted mt-1 max-w-sm mx-auto">
              Tiket {ticket} ditugaskan kepada {c.platformPic}. Anda hanya dapat membuka tiket yang
              ditugaskan kepada Anda sendiri.
            </p>
            <div className="mt-4">
              <Link href="/platform/case-queue">
                <Button variant="secondary" size="sm">Kembali ke Manajemen Pengaduan</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const internalNotes = c.internalNotes ?? [];

  function handleExecuteAction(actionId: CaseActionId, values: Record<string, string>) {
    executeCaseAction(actionId, { ticket, actor: user.name, values });
    showToast(`${CASE_ACTIONS[actionId].label} berhasil dijalankan.`);
  }

  function confirmEscalateToBappebti() {
    setCurrentOwner(ticket, "Bappebti");
    addTimelineEvent(ticket, {
      actor: user.name,
      role: viewerGroup === "Platform" ? "Platform" : "Ekosistem",
      action: "Kasus dieskalasi ke Bappebti",
      note: `Kasus dieskalasi oleh ${user.name} (${c?.platform ?? user.institution}) ke Bappebti untuk supervisi lebih lanjut.`,
      status: "warning",
      visibility: "internal",
    });
    showToast("Kasus dieskalasi ke Bappebti.");
    setEscalating(false);
  }

  function submitTask() {
    if (!taskDesc.trim() || !taskAssignee) return;
    if (delegationType !== "Internal Platform" && !delegationEntity) return;
    addTask({
      ticket,
      description: taskDesc.trim(),
      createdBy: user.name,
      createdByRole: ROLE_LABEL[user.role],
      assignee: taskAssignee,
      document: taskDoc || undefined,
      delegationType: delegationType === "Internal Platform" ? undefined : delegationType,
      delegationEntity: delegationType === "Internal Platform" ? undefined : delegationEntity,
      priority: taskPriority,
      dueDate: taskDueDate ? formatDueDateID(taskDueDate) : undefined,
    });
    showToast("Tugas internal berhasil ditambahkan.");
    setTaskDesc("");
    setTaskDoc("");
    setDelegationType("Internal Platform");
    setDelegationEntity("");
    setTaskAssignee(ASSIGNABLE_NAMES[0] ?? "");
    setTaskPriority("Sedang");
    setTaskDueDate("");
  }

  // Respon ke Public: Bappebti, Platform, dan Ekosistem Active dapat membalas; Ekosistem Pengawas read-only.
  const canReplyPublic = viewerGroup === "Bappebti" || viewerGroup === "Platform" || viewerGroup === "EkosistemActive";

  /** Peran & lembaga pengirim untuk label "[Peran: Lembaga] Nama" pada balon percakapan. */
  function replySender(): { role: string; institution: string } {
    if (viewerGroup === "Bappebti") return { role: "Bappebti", institution: "Bappebti" };
    if (viewerGroup === "Platform") return { role: "Platform", institution: user.institution };
    if (user.role.startsWith("BURSA_")) return { role: "Bursa", institution: user.institution };
    if (user.role.startsWith("CLEARING_")) return { role: "Kliring", institution: user.institution };
    const type = ekosistemActiveRole?.roleType ?? "Bursa";
    const institution =
      type === "Bursa"
        ? c!.institution?.bursa ?? c!.bursaEntity
        : type === "Kliring"
          ? c!.institution?.clearing ?? c!.kliringEntity
          : c!.linkedEcosystemEntities?.find((e) => e.type === "Custody")?.name ?? user.institution;
    return { role: type, institution };
  }

  function sendPublicResponse(message: string, { sendEmail }: { sendEmail: boolean }) {
    const sender = replySender();
    addClarificationReply(ticket, user.name, sender.role, message, { institution: sender.institution, emailSent: sendEmail });
    showToast(sendEmail ? "Respon berhasil dipublikasikan dan telah dikirimkan ke email klien." : "Respon berhasil dipublikasikan.");
  }

  const canManageTasks = viewerGroup === "Bappebti" || viewerGroup === "Platform" || viewerGroup === "EkosistemActive";
  const canProposeResolution = isPlatform || isBappebti;
  const canUploadEvidence = isBappebti || isPlatform;
  const canEscalateToBappebti =
    (viewerGroup === "Platform" || viewerGroup === "EkosistemActive") && c.currentOwner !== "Bappebti" && c.status !== "Selesai";

  const bannerActions = (
    <>
      {isBappebti && (
        <>
          <Button size="sm" variant="outline" onClick={() => setActiveAction("assign-to-member")}>
            Tugaskan / Alihkan Penanggung Jawab
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setActiveAction("close-administrative")}>
            Tutup Secara Administratif
          </Button>
        </>
      )}
      {canEscalateToBappebti && (
        <Button size="sm" variant="outline" onClick={() => setEscalating(true)}>
          Eskalasi ke Bappebti
        </Button>
      )}
    </>
  );

  return (
    <div>
      <PageHeader
        title={`${c.ticket} — ${c.title}`}
        description="Detail pengaduan, riwayat penanganan, dan tindakan yang tersedia sesuai peran Anda."
        actions={
          <div className="flex items-center gap-2">
            {isInternal && <DownloadCaseButton complaintCase={c} />}
            <BackLink fallbackHref={BACK_HREF[viewerGroup]} />
          </div>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        {isBappebti ? (
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-muted">Prioritas:</span>
            <Select
              className="h-7 text-xs w-auto"
              value={c.severity ?? ""}
              onChange={(e) => setSeverity(ticket, e.target.value as Severity)}
            >
              <option value="" disabled>
                Belum ditentukan
              </option>
              {SEVERITY_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <SeverityBadge severity={c.severity} />
        )}
        <span className="text-xs text-muted">
          Pelapor: <span className="font-medium text-foreground">{c.reporterName}</span> (identitas
          lengkap disamarkan pada tampilan ringkas ini demi kepatuhan privasi data)
        </span>
        {viewerGroup === "Platform" && c.platformPic && (
          <span className="text-xs text-muted">
            PIC: <span className="font-medium text-foreground">{c.platformPic}</span>
          </span>
        )}
      </div>

      <div className="mb-4">
        <EscalationBanner complaintCase={c} />
      </div>

      <div className="mb-4">
        <CaseStatusExplanation complaintCase={c} viewer="internal" actions={isInternal ? bannerActions : undefined} />
      </div>

      <Tabs defaultValue={c.dispute ? "perselisihan" : "ringkasan"}>
        <TabsList>
          {c.dispute && <TabsTrigger value="perselisihan">Penyelesaian Perselisihan</TabsTrigger>}
          <TabsTrigger value="ringkasan">Ringkasan Pengaduan</TabsTrigger>
          <TabsTrigger value="bukti">Bukti</TabsTrigger>
          <TabsTrigger value="respons">Respon ke Public</TabsTrigger>
          {isInternal && <TabsTrigger value="catatan">Catatan Internal</TabsTrigger>}
          {isInternal && <TabsTrigger value="tugas">Tugas Internal</TabsTrigger>}
          <TabsTrigger value="resolusi">Resolusi</TabsTrigger>
          {isInternal && <TabsTrigger value="kronologi">Kronologi Kasus</TabsTrigger>}
        </TabsList>

        {c.dispute && (
          <TabsContent value="perselisihan">
            <DisputePanel
              complaintCase={c}
              actor={viewerGroup === "EkosistemPengawas" ? null : disputeActorForRole(user.role)}
              actorName={user.name}
            />
          </TabsContent>
        )}

        <TabsContent value="ringkasan">
          <Card>
            <CardContent className="py-4 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-[11px] uppercase text-muted font-medium mb-1">Kategori</p>
                <p>{c.category}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted font-medium mb-1">Subkategori</p>
                <p>{c.subcategory}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted font-medium mb-1">Nilai Transaksi</p>
                <p>{formatCurrency(c.amount)}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted font-medium mb-1">Referensi Transaksi</p>
                <p>{c.transactionRef || "-"}</p>
              </div>
              <div>
                <p className="text-[11px] uppercase text-muted font-medium mb-1">ID Pengguna Platform</p>
                <p>{c.platformUserId || "-"}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase text-muted font-medium mb-1">Kronologi</p>
                <p className="text-foreground/90">{c.chronology}</p>
              </div>
              <div className="sm:col-span-2">
                <p className="text-[11px] uppercase text-muted font-medium mb-1">Penyelesaian yang Diharapkan</p>
                <p className="text-foreground/90">{c.expectedResolution}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="bukti">
          <Card>
            <CardContent className="py-4 space-y-4">
              <EvidenceList files={c.evidences} />
              {canUploadEvidence && (
                <div className="pt-3 border-t border-border space-y-2">
                  <p className="text-xs font-semibold text-navy">Unggah Bukti Tambahan</p>
                  <FileUploader files={newEvidenceFiles} onChange={setNewEvidenceFiles} />
                  <Button
                    size="sm"
                    disabled={newEvidenceFiles.length === 0}
                    onClick={() => {
                      addEvidence(ticket, newEvidenceFiles);
                      showToast("Bukti berhasil diunggah.");
                      setNewEvidenceFiles([]);
                    }}
                  >
                    Simpan Bukti
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="respons">
          <Card>
            <CardHeader>
              <CardTitle>Respon ke Public</CardTitle>
              <p className="text-[11px] text-muted mt-1">
                Kanal interaksi antara Pelapor, Platform, dan Bappebti. Respon yang dikirim dari sini dapat dibaca langsung oleh pelapor publik.
              </p>
            </CardHeader>
            <CardContent className="py-4">
              <ClarificationThread
                messages={c.clarifications}
                complaintCase={c}
                publicResponse
                onReply={canReplyPublic ? sendPublicResponse : undefined}
                replyPlaceholder="Tulis respon kepada pelapor..."
              />
            </CardContent>
          </Card>
        </TabsContent>

        {isInternal && (
          <TabsContent value="catatan">
            <Card>
              <CardHeader>
                <CardTitle>Catatan Internal</CardTitle>
                <p className="text-[11px] text-muted mt-1">
                  Catatan ini tidak pernah ditampilkan pada portal publik.
                </p>
              </CardHeader>
              <CardContent className="py-4 space-y-3">
                {internalNotes.length === 0 && (
                  <p className="text-sm text-muted">Belum ada catatan internal untuk kasus ini.</p>
                )}
                {internalNotes.map((n, idx) => (
                  <div key={idx} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{n.author}</span>
                      <span className="text-[11px] text-muted">{n.timestamp}</span>
                    </div>
                    <p className="text-[11px] text-muted mb-1">
                      {n.role} &middot; {n.institution} &middot; {n.targetType}
                      {n.targetEntity ? ` — ${n.targetEntity}` : ""}
                    </p>
                    <p>{n.text}</p>
                  </div>
                ))}
                <div className="pt-2 space-y-2">
                  <div className="grid grid-cols-2 gap-2 max-w-md">
                    <div>
                      <Label className="text-[11px]">Sasaran Entitas</Label>
                      <Select
                        value={noteTargetType}
                        onChange={(e) => {
                          setNoteTargetType(e.target.value as InternalNoteTargetType);
                          setNoteTargetEntity("");
                        }}
                      >
                        {NOTE_TARGET_TYPES.map((t) => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </Select>
                    </div>
                    {(noteTargetType === "Bursa" || noteTargetType === "Kliring" || noteTargetType === "Custody") && (
                      <div>
                        <Label className="text-[11px]">Nama Perusahaan / Lembaga</Label>
                        <SearchableSelect
                          value={noteTargetEntity}
                          onChange={setNoteTargetEntity}
                          groups={[{ label: noteTargetType, options: lembagaOptionsFor(noteTargetType) }]}
                          placeholder="Pilih lembaga..."
                        />
                      </div>
                    )}
                  </div>
                  <Textarea
                    placeholder="Tulis catatan internal..."
                    value={noteText}
                    onChange={(e) => setNoteText(e.target.value)}
                  />
                  <Button
                    size="sm"
                    disabled={
                      !noteText.trim() ||
                      ((noteTargetType === "Bursa" || noteTargetType === "Kliring" || noteTargetType === "Custody") && !noteTargetEntity)
                    }
                    onClick={() => {
                      addInternalNote(ticket, {
                        author: user.name,
                        role: ROLE_LABEL[user.role],
                        institution: user.institution,
                        targetType: noteTargetType,
                        targetEntity:
                          noteTargetType === "Bursa" || noteTargetType === "Kliring" || noteTargetType === "Custody"
                            ? noteTargetEntity
                            : undefined,
                        text: noteText.trim(),
                      });
                      setNoteText("");
                      setNoteTargetType("Semua Pihak Tertutup");
                      setNoteTargetEntity("");
                      showToast("Catatan internal berhasil ditambahkan.");
                    }}
                  >
                    Tambah Catatan
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        {isInternal && (
          <TabsContent value="tugas">
            <Card>
              <CardHeader>
                <CardTitle>Tugas Internal</CardTitle>
                <p className="text-[11px] text-muted mt-1">
                  Modul pengingat penanganan (task reminder), bukan ruang obrolan. Penerima tugas dapat
                  mengubah status; pembuat tugas dapat mengubah status dan menghapus tugas.
                </p>
              </CardHeader>
              <CardContent className="py-4 space-y-3">
                {tasks.length === 0 && <p className="text-sm text-muted">Belum ada tugas untuk kasus ini.</p>}
                {tasks.map((t) => {
                  // Ekosistem Pengawas's role is monitoring-only (Bab V) — never editable regardless of assignee/creator match.
                  const canEdit = viewerGroup !== "EkosistemPengawas" && (t.assignee === user.name || t.createdBy === user.name);
                  const canDelete = viewerGroup !== "EkosistemPengawas" && t.createdBy === user.name;
                  return (
                    <div key={t.id} className="rounded-md border border-border px-3 py-2 text-sm">
                      <div className="flex items-start justify-between gap-2 mb-1">
                        <p className="font-medium">{t.description}</p>
                        {canDelete && (
                          <button
                            title="Hapus tugas"
                            onClick={() => setDeletingTask(t)}
                            className="text-muted hover:text-red shrink-0"
                          >
                            <Trash2 className="size-3.5" />
                          </button>
                        )}
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted mb-1.5">
                        <span>Dari: <span className="text-foreground">{t.createdBy}</span></span>
                        <span>Untuk: <AssigneeBadge task={t} /></span>
                        <span>Dibuat: {t.createdAt}</span>
                        {t.dueDate && <span>Batas Waktu: <span className="text-foreground">{t.dueDate}</span></span>}
                        {t.document && (
                          <button
                            type="button"
                            onClick={() => showToast("Unduhan dokumen bersifat simulasi pada prototipe ini.")}
                            className="inline-flex items-center gap-1 text-navy hover:underline"
                            title={t.document}
                          >
                            <FileText className="size-3.5 shrink-0" />
                            <span className="max-w-[160px] truncate">{t.document}</span>
                          </button>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <PriorityBadge priority={t.priority} />
                        <StatusBadgeSelect value={t.status} editable={canEdit} onChange={(s) => updateTaskStatus(t.id, s)} />
                      </div>
                    </div>
                  );
                })}

                {canManageTasks && (
                  <div className="pt-3 border-t border-border space-y-2">
                    <p className="text-xs font-semibold text-navy">Tambah Tugas</p>
                    <Textarea
                      placeholder="Deskripsi tugas..."
                      value={taskDesc}
                      onChange={(e) => setTaskDesc(e.target.value)}
                      className="text-xs min-h-[60px]"
                    />
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Tipe Entitas Tujuan</Label>
                        <Select
                          className="h-8 text-xs"
                          value={delegationType}
                          onChange={(e) => {
                            setDelegationType(e.target.value as TaskDelegationType);
                            setDelegationEntity("");
                            setTaskAssignee(e.target.value === "Internal Platform" ? ASSIGNABLE_NAMES[0] ?? "" : "");
                          }}
                        >
                          {DELEGATION_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </Select>
                      </div>
                      {delegationType !== "Internal Platform" && (
                        <div>
                          <Label className="text-[11px]">Perusahaan / Lembaga Tujuan</Label>
                          <SearchableSelect
                            value={delegationEntity}
                            onChange={setDelegationEntity}
                            groups={[{ label: delegationType, options: lembagaOptionsFor(delegationType) }]}
                            placeholder="Pilih lembaga..."
                          />
                        </div>
                      )}
                    </div>
                    <div>
                      <Label className="text-[11px]">Assignee / Petugas</Label>
                      {delegationType === "Internal Platform" ? (
                        <Select className="h-8 text-xs w-48" value={taskAssignee} onChange={(e) => setTaskAssignee(e.target.value)}>
                          {ASSIGNABLE_NAMES.map((n) => (
                            <option key={n} value={n}>{n}</option>
                          ))}
                        </Select>
                      ) : (
                        <Input
                          className="h-8 text-xs w-56"
                          placeholder="Nama petugas / bagian penanggung jawab..."
                          value={taskAssignee}
                          onChange={(e) => setTaskAssignee(e.target.value)}
                        />
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <Label className="text-[11px]">Prioritas</Label>
                        <Select
                          className="h-8 text-xs"
                          value={taskPriority}
                          onChange={(e) => setTaskPriority(e.target.value as TaskPriority)}
                        >
                          {TASK_PRIORITIES.map((p) => (
                            <option key={p} value={p}>{p}</option>
                          ))}
                        </Select>
                      </div>
                      <div>
                        <Label className="text-[11px]">Batas Waktu</Label>
                        <Input
                          type="date"
                          className="h-8 text-xs"
                          value={taskDueDate}
                          onChange={(e) => setTaskDueDate(e.target.value)}
                        />
                      </div>
                    </div>
                    <div>
                      <Label className="text-[11px]">Upload Dokumen (opsional)</Label>
                      <FileUploader
                        files={taskDoc ? [taskDoc] : []}
                        onChange={(files) => setTaskDoc(files[0] ?? "")}
                        multiple={false}
                        maxFiles={1}
                        label="Klik atau seret dokumen pendukung ke sini"
                      />
                    </div>
                    <Button size="sm" disabled={!taskDesc.trim()} onClick={submitTask}>
                      <Plus className="size-3.5" /> Tambah Tugas
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="resolusi">
          {canProposeResolution && (
            <Card className="mb-4">
              <CardHeader>
                <CardTitle>Ajukan Resolusi</CardTitle>
              </CardHeader>
              <CardContent className="py-4 space-y-2">
                <Textarea
                  placeholder="Tulis usulan resolusi untuk pelapor..."
                  value={resolutionText}
                  onChange={(e) => setResolutionText(e.target.value)}
                  className="text-sm min-h-[70px]"
                />
                <Button
                  size="sm"
                  variant="success"
                  disabled={!resolutionText.trim()}
                  onClick={() => {
                    proposeResolution(ticket, resolutionText.trim(), user.name, isBappebti ? "Bappebti" : "Platform");
                    showToast("Usulan resolusi telah diajukan kepada pelapor.");
                    setResolutionText("");
                  }}
                >
                  Ajukan Resolusi
                </Button>
              </CardContent>
            </Card>
          )}
          <ResolutionPanel complaintCase={c} />
        </TabsContent>

        {isInternal && (
          <TabsContent value="kronologi">
            <Card>
              <CardHeader>
                <CardTitle>Kronologi Kasus</CardTitle>
                <p className="text-[11px] text-muted mt-1">Jejak riwayat aktivitas dan tindakan kasus (read-only).</p>
              </CardHeader>
              <CardContent className="py-4 space-y-2">
                {c.timeline.length === 0 && <p className="text-sm text-muted">Belum ada aktivitas tercatat.</p>}
                {[...c.timeline].reverse().map((t, i) => (
                  <div key={i} className="rounded-md border border-border px-3 py-2 text-sm">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-medium">{t.actor}</span>
                      <span className="text-[11px] text-muted">{t.datetime}</span>
                    </div>
                    <p className="text-[11px] text-muted mb-1">{t.role} &middot; {t.action}</p>
                    <p>{t.note}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </TabsContent>
        )}
      </Tabs>

      {activeAction && (
        <CaseActionDialog
          action={CASE_ACTIONS[activeAction]}
          complaintCase={c}
          open={!!activeAction}
          onOpenChange={(v) => !v && setActiveAction(null)}
          onConfirm={(values) => {
            handleExecuteAction(activeAction, values);
            setActiveAction(null);
          }}
        />
      )}

      <Dialog open={escalating} onOpenChange={setEscalating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eskalasi ke Bappebti</DialogTitle>
            <DialogDescription>
              Kasus {ticket} akan dialihkan kepemilikannya ke Bappebti untuk supervisi lebih lanjut. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setEscalating(false)}>Batal</Button>
            <Button size="sm" variant={TONE_TO_BUTTON_VARIANT.destructive} onClick={confirmEscalateToBappebti}>
              Ya, Eskalasi
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deletingTask} onOpenChange={(v) => !v && setDeletingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Hapus Tugas</DialogTitle>
            <DialogDescription>
              Tugas &ldquo;{deletingTask?.description}&rdquo; akan dihapus permanen dari daftar. Lanjutkan?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setDeletingTask(null)}>
              Batal
            </Button>
            <Button
              size="sm"
              variant={TONE_TO_BUTTON_VARIANT.destructive}
              onClick={() => {
                if (deletingTask) {
                  deleteTask(deletingTask.id);
                  showToast("Tugas dihapus.");
                }
                setDeletingTask(null);
              }}
            >
              Ya, Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
