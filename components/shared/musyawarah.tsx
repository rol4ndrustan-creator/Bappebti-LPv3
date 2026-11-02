"use client";

import * as React from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useToast } from "@/components/shared/toast-provider";
import { AttendanceStatus, ComplaintCase, MeetingDecision, MeetingLocationType, MeetingStatus, MusyawarahMeeting } from "@/lib/types";
import {
  meetingEndIso,
  MEETING_LOCATION_OPTIONS,
  MEETING_SEED,
  MEETING_STATUS_TONE,
  formatMeetingDate,
  getMeetingStatus,
  meetingSequence,
  sortMeetings,
  useNow,
} from "@/lib/meeting";
import { addMeeting, editMeeting, recordMeetingOutcome, useMeetings } from "@/lib/mock-service/meeting-store";
import { markMusyawarahFailed } from "@/lib/lifecycle-actions";
import { useLifecycleActor } from "@/components/shared/ticket-lifecycle";
import { getViewerGroup } from "@/lib/permissions";
import { addTimelineEvent } from "@/lib/mock-service/store";
import { logAudit } from "@/lib/mock-service/audit-store";
import { useActingParty } from "@/lib/use-acting-party";
import { useDemoSession } from "@/lib/demo-session";
import { CASES } from "@/lib/mock-data";
import { Ban, CalendarPlus, ClipboardEdit, Eye, MapPin, Pencil, Video } from "lucide-react";
import { cn } from "@/lib/utils";

const DECISIONS: MeetingDecision[] = ["Selesai (Damai / Kesepakatan Tercapai)", "Diundang ke Musyawarah Berikutnya", "Tidak Sepakat (Musyawarah Berakhir)"];
const STATUSES: MeetingStatus[] = ["Dijadwalkan", "Berlangsung", "Selesai", "Lanjut Musyawarah Berikutnya", "Tidak Sepakat", "Dibatalkan"];

/**
 * Edit Jadwal / Batalkan Musyawarah (List Revisi 12 #12): penyelenggara,
 * Bappebti, dan Pialang. Ekosistem Pengawas (pasif) & nasabah hanya melihat.
 */
function useCanManageMeeting(): (m: MusyawarahMeeting) => boolean {
  const { user } = useDemoSession();
  const group = getViewerGroup(user.role);
  return (m) =>
    !m.outcome &&
    !m.cancellation &&
    (group === "Bappebti" || group === "Platform" || (group === "EkosistemActive" && m.proposedBy.name === user.name));
}

function StatusBadge({ status }: { status: MeetingStatus }) {
  return <Badge variant={MEETING_STATUS_TONE[status]}>{status.toUpperCase()}</Badge>;
}

function LocationText({ m }: { m: MusyawarahMeeting }) {
  const isLink = m.locationType === "Tautan Video Conference";
  return (
    <span className="inline-flex items-start gap-1">
      {isLink ? <Video className="size-3.5 mt-0.5 shrink-0 text-muted" /> : <MapPin className="size-3.5 mt-0.5 shrink-0 text-muted" />}
      <span>
        {m.locationType}
        <br />
        {isLink ? (
          <a href={m.locationDetail} target="_blank" rel="noreferrer" className="text-navy hover:underline break-all">
            {m.locationDetail}
          </a>
        ) : (
          <span className="text-muted">{m.locationDetail}</span>
        )}
      </span>
    </span>
  );
}

// ---------------------------------------------------------------------------
// Tab "Pertemuan Musyawarah" pada detail pengaduan
// ---------------------------------------------------------------------------

export function MusyawarahTab({
  complaintCase: c,
  readOnly,
  publicView = false,
}: {
  complaintCase: ComplaintCase;
  readOnly: boolean;
  /** Portal nasabah: daftar jadwal tanpa aksi. */
  publicView?: boolean;
}) {
  const all = useMeetings(MEETING_SEED);
  const meetings = sortMeetings(all.filter((m) => m.ticket === c.ticket));
  const now = useNow();
  const canManage = useCanManageMeeting();
  const [formOpen, setFormOpen] = React.useState(false);
  const [recording, setRecording] = React.useState<MusyawarahMeeting | null>(null);
  const [editing, setEditing] = React.useState<MusyawarahMeeting | null>(null);
  const [cancelling, setCancelling] = React.useState<MusyawarahMeeting | null>(null);

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader className="flex flex-row flex-wrap items-center justify-between gap-2">
          <div>
            <CardTitle>Pertemuan Musyawarah</CardTitle>
            <p className="text-[11px] text-muted mt-1">
              {publicView
                ? "Jadwal pertemuan musyawarah atas pengaduan Anda. Undangan resmi juga dikirim ke email Anda."
                : readOnly
                ? "Mode pemantauan (read-only): Anda dapat melihat jadwal, lokasi, agenda, kehadiran, dan hasil musyawarah."
                : "Jadwalkan pertemuan musyawarah/mediasi bersama pelapor. Undangan resmi dikirim ke email pengadu."}
            </p>
          </div>
          {!readOnly && !formOpen && (
            <Button size="sm" onClick={() => setFormOpen(true)}>
              <CalendarPlus className="size-3.5" /> Ajukan Pertemuan Baru
            </Button>
          )}
        </CardHeader>
        {!readOnly && formOpen && (
          <CardContent className="py-4 border-b border-border">
            <MeetingForm complaintCase={c} sequence={meetings.length + 1} onDone={() => setFormOpen(false)} />
          </CardContent>
        )}
        <CardContent className="py-4 space-y-3">
          {meetings.length === 0 && <p className="text-sm text-muted">Belum ada pertemuan musyawarah untuk tiket ini.</p>}
          {meetings.map((m, i) =>
            editing?.id === m.id ? (
              <div key={m.id} className="rounded-md border border-navy/30 p-3">
                <MeetingForm complaintCase={c} sequence={i + 1} existing={m} onDone={() => setEditing(null)} />
              </div>
            ) : (
              <MeetingCard
                key={m.id}
                meeting={m}
                sequence={i + 1}
                status={getMeetingStatus(m, now)}
                publicView={publicView}
                onRecord={!readOnly && !m.outcome && !m.cancellation ? () => setRecording(m) : undefined}
                onEdit={!readOnly && canManage(m) ? () => setEditing(m) : undefined}
                onCancel={!readOnly && canManage(m) ? () => setCancelling(m) : undefined}
              />
            )
          )}
        </CardContent>
      </Card>
      {recording && <OutcomeDialog meeting={recording} onClose={() => setRecording(null)} />}
      {cancelling && <CancelMeetingDialog meeting={cancelling} onClose={() => setCancelling(null)} />}
    </div>
  );
}

function MeetingCard({
  meeting: m,
  sequence,
  status,
  publicView = false,
  onRecord,
  onEdit,
  onCancel,
}: {
  meeting: MusyawarahMeeting;
  sequence: number;
  status: MeetingStatus;
  publicView?: boolean;
  onRecord?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
}) {
  return (
    <div className="rounded-md border border-border p-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-2 mb-1.5">
        <p className="font-semibold text-sm">
          <span className="text-muted font-medium">Musyawarah ke-{sequence} · </span>
          {m.title}
        </p>
        <StatusBadge status={status} />
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
        <div>
          <dt className="text-muted">Tanggal & Jam</dt>
          <dd className="font-medium">{formatMeetingDate(m)}</dd>
        </div>
        <div>
          <dt className="text-muted">Lokasi</dt>
          <dd className="font-medium">
            <LocationText m={m} />
          </dd>
        </div>
        <div>
          <dt className="text-muted">Pihak Pengaju</dt>
          <dd className="font-medium">
            [{m.proposedBy.role}
            {m.proposedBy.institution !== m.proposedBy.role ? `: ${m.proposedBy.institution}` : ""}] {m.proposedBy.name}
          </dd>
        </div>
        {!publicView && (
        <div>
          <dt className="text-muted">Status Kehadiran</dt>
          <dd className="font-medium">
            {m.outcome ? `Pelapor: ${m.outcome.reporterAttendance} · Terlapor: ${m.outcome.respondentAttendance}` : "Belum dicatat"}
          </dd>
        </div>
        )}
        <div className="sm:col-span-2">
          <dt className="text-muted">Agenda Pembahasan</dt>
          <dd className="text-foreground/90">{m.agenda}</dd>
        </div>
      </dl>
      {m.outcome && (
        <div className={cn("mt-2 rounded-md p-2", m.outcome.decision.startsWith("Selesai") ? "bg-green-bg/60" : "bg-muted-bg")}>
          <p className="font-semibold">Hasil: {m.outcome.decision}</p>
          <p className="mt-0.5 text-foreground/90">{m.outcome.notula}</p>
          <p className="mt-0.5 text-[11px] text-muted">Dicatat oleh {m.outcome.recordedBy}</p>
        </div>
      )}
      {m.cancellation && (
        <div className="mt-2 rounded-md bg-muted-bg p-2">
          <p className="font-semibold">Musyawarah dibatalkan</p>
          <p className="mt-0.5">Alasan: {m.cancellation.reason}</p>
          <p className="mt-0.5 text-[11px] text-muted">Dibatalkan oleh {m.cancellation.by}</p>
        </div>
      )}
      {m.reschedules && m.reschedules.length > 0 && (
        <p className="mt-1.5 text-[11px] text-muted">
          Dijadwalkan ulang {m.reschedules.length}x — terakhir dari {m.reschedules[m.reschedules.length - 1].before} oleh {m.reschedules[m.reschedules.length - 1].by}.
        </p>
      )}
      {(onRecord || onEdit || onCancel) && (
        <div className="mt-2 flex flex-wrap gap-2">
          {onRecord && (
            <Button size="sm" variant="secondary" onClick={onRecord}>
              <ClipboardEdit className="size-3.5" /> Catat Hasil
            </Button>
          )}
          {onEdit && (
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="size-3.5" /> Edit Jadwal
            </Button>
          )}
          {onCancel && (
            <Button size="sm" variant="ghost" onClick={onCancel}>
              <Ban className="size-3.5" /> Batalkan Musyawarah
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

function MeetingForm({
  complaintCase: c,
  sequence,
  existing,
  onDone,
}: {
  complaintCase: ComplaintCase;
  sequence: number;
  /** Diisi saat Edit Jadwal. */
  existing?: MusyawarahMeeting;
  onDone: () => void;
}) {
  const { showToast } = useToast();
  const actingParty = useActingParty();
  const [title, setTitle] = React.useState(existing?.title ?? `Musyawarah ${sequence > 1 ? `Lanjutan ke-${sequence} ` : ""}Mediasi ${c.title} #${c.ticket}`);
  const [date, setDate] = React.useState(existing?.date ?? "");
  const [startTime, setStartTime] = React.useState(existing?.startTime ?? "10:00");
  const [endTime, setEndTime] = React.useState(existing?.endTime ?? "12:00");
  const [locationType, setLocationType] = React.useState<MeetingLocationType>(existing?.locationType ?? "Tautan Video Conference");
  const [locationDetail, setLocationDetail] = React.useState(existing?.locationDetail ?? "");
  const [agenda, setAgenda] = React.useState(existing?.agenda ?? "");

  const timeInvalid = !!startTime && !!endTime && endTime <= startTime;
  const invalid = !title.trim() || !date || !startTime || !endTime || timeInvalid || !locationDetail.trim() || !agenda.trim();

  function submit() {
    if (invalid) return;
    const party = actingParty(c);
    if (existing) {
      const before = formatMeetingDate(existing);
      const after = formatMeetingDate({ date, startTime, endTime });
      editMeeting(existing.id, {
        title: title.trim(),
        date,
        startTime,
        endTime,
        locationType,
        locationDetail: locationDetail.trim(),
        agenda: agenda.trim(),
        reschedules: [...(existing.reschedules ?? []), { before, after, by: party.name, at: new Date().toISOString() }],
      });
      addTimelineEvent(c.ticket, {
        actor: party.name,
        role: party.role,
        action: "Jadwal musyawarah diubah",
        note: `${title.trim()} — dari ${before} menjadi ${after}, ${locationType}. Notifikasi perubahan dikirim ke email pengadu dan pihak terkait.`,
        status: "info",
        visibility: "public",
      });
      logAudit({ activity: "Edit Jadwal Musyawarah", ticket: c.ticket, detail: `Menjadwalkan ulang "${title.trim()}" dari ${before} menjadi ${after}.` });
      showToast("Jadwal musyawarah diperbarui dan notifikasi perubahan telah dikirimkan ke email pengadu dan pihak terkait.");
      onDone();
      return;
    }
    const m = addMeeting({
      ticket: c.ticket,
      title: title.trim(),
      date,
      startTime,
      endTime,
      locationType,
      locationDetail: locationDetail.trim(),
      agenda: agenda.trim(),
      proposedBy: party,
    });
    const when = formatMeetingDate(m);
    addTimelineEvent(c.ticket, {
      actor: party.name,
      role: party.role,
      action: "Undangan musyawarah dikirim",
      note: `${m.title} — ${when}, ${locationType}. Undangan resmi dikirim ke email pengadu.`,
      status: "info",
      visibility: "public",
    });
    logAudit({ activity: "Buat Jadwal Musyawarah", ticket: c.ticket, detail: `Menjadwalkan "${m.title}" pada ${when} (${locationType}).` });
    showToast("Jadwal musyawarah berhasil dibuat dan surat undangan resmi telah dikirimkan ke email pengadu.");
    onDone();
  }

  return (
    <div className="space-y-2.5">
      <p className="text-xs font-semibold text-navy">{existing ? "Edit Jadwal Musyawarah" : "Ajukan Pertemuan Musyawarah"}</p>
      <div>
        <Label>Judul Pertemuan</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <div>
          <Label>Tanggal Pertemuan</Label>
          <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
        </div>
        <div>
          <Label>Jam Mulai (WIB)</Label>
          <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
        </div>
        <div>
          <Label>Jam Selesai (WIB)</Label>
          <Input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} />
        </div>
      </div>
      {timeInvalid && <p className="text-[11px] text-red">Jam selesai harus setelah jam mulai.</p>}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        <div>
          <Label>Lokasi</Label>
          <Select value={locationType} onChange={(e) => setLocationType(e.target.value as MeetingLocationType)}>
            {MEETING_LOCATION_OPTIONS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label>{locationType === "Tautan Video Conference" ? "Tautan Meeting" : "Alamat Kantor"}</Label>
          <Input
            value={locationDetail}
            onChange={(e) => setLocationDetail(e.target.value)}
            placeholder={locationType === "Tautan Video Conference" ? "https://meet.bappebti.go.id/..." : "Nama gedung, lantai, alamat..."}
          />
        </div>
      </div>
      <div>
        <Label>Deskripsi / Agenda Pembahasan</Label>
        <Textarea value={agenda} onChange={(e) => setAgenda(e.target.value)} className="min-h-[70px] text-sm" placeholder="Ringkasan poin masalah yang akan dibahas..." />
      </div>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="secondary" onClick={onDone}>
          Batal
        </Button>
        <Button size="sm" disabled={invalid} onClick={submit}>
          {existing ? "Simpan Perubahan Jadwal" : "Ajukan / Kirim Undangan Musyawarah"}
        </Button>
      </div>
    </div>
  );
}

function OutcomeDialog({ meeting: m, onClose }: { meeting: MusyawarahMeeting; onClose: () => void }) {
  const { showToast } = useToast();
  const { user } = useDemoSession();
  const actor = useLifecycleActor();
  const [decision, setDecision] = React.useState<MeetingDecision>(DECISIONS[0]);
  const [reporterAttendance, setReporterAttendance] = React.useState<AttendanceStatus>("Hadir");
  const [respondentAttendance, setRespondentAttendance] = React.useState<AttendanceStatus>("Hadir");
  const [notula, setNotula] = React.useState("");

  function submit() {
    if (!notula.trim()) return;
    recordMeetingOutcome(m.id, {
      decision,
      notula: notula.trim(),
      reporterAttendance,
      respondentAttendance,
      recordedBy: user.name,
      recordedAt: new Date().toISOString(),
    });
    addTimelineEvent(m.ticket, {
      actor: user.name,
      role: "Musyawarah",
      action: `Hasil musyawarah: ${decision}`,
      note: notula.trim(),
      status: decision.startsWith("Selesai") ? "success" : "warning",
      visibility: "public",
    });
    logAudit({ activity: "Catat Hasil Musyawarah", ticket: m.ticket, detail: `"${m.title}" → ${decision}.` });
    if (decision === "Tidak Sepakat (Musyawarah Berakhir)") {
      markMusyawarahFailed(m.ticket, actor, meetingEndIso(m));
    }
    showToast(
      decision.startsWith("Selesai")
        ? "Hasil musyawarah tersimpan: kesepakatan tercapai."
        : decision.startsWith("Tidak Sepakat")
          ? "Hasil musyawarah tersimpan: Tidak Sepakat. Jendela pengajuan arbitrase nasabah dibuka mulai H+1."
          : "Hasil musyawarah tersimpan. Silakan ajukan jadwal musyawarah berikutnya."
    );
    onClose();
  }

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Catat Hasil Musyawarah</DialogTitle>
          <DialogDescription>
            {m.title} — {formatMeetingDate(m)}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3 text-sm">
          <div>
            <Label>Keputusan</Label>
            <div className="mt-1 grid grid-cols-1 gap-1.5">
              {DECISIONS.map((d) => (
                <label key={d} className={cn("flex items-center gap-2 rounded-md border px-3 py-2 text-xs cursor-pointer", decision === d ? "border-navy bg-navy/5" : "border-border")}>
                  <input type="radio" name="decision" checked={decision === d} onChange={() => setDecision(d)} />
                  {d}
                </label>
              ))}
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label>Kehadiran Pelapor</Label>
              <Select value={reporterAttendance} onChange={(e) => setReporterAttendance(e.target.value as AttendanceStatus)}>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
              </Select>
            </div>
            <div>
              <Label>Kehadiran Terlapor</Label>
              <Select value={respondentAttendance} onChange={(e) => setRespondentAttendance(e.target.value as AttendanceStatus)}>
                <option value="Hadir">Hadir</option>
                <option value="Tidak Hadir">Tidak Hadir</option>
              </Select>
            </div>
          </div>
          <div>
            <Label>Deskripsi / Notula (wajib)</Label>
            <Textarea value={notula} onChange={(e) => setNotula(e.target.value)} className="min-h-[90px] text-sm" placeholder="Kesimpulan dan poin kesepakatan hasil musyawarah..." />
          </div>
          {decision.startsWith("Selesai") && (
            <p className="text-[11px] rounded-md bg-muted-bg px-2 py-1.5">
              Kesepakatan damai dituangkan Pialang melalui tombol Ajukan Resolusi pada tab Resolusi, lalu disetujui nasabah.
            </p>
          )}
          {decision.startsWith("Tidak Sepakat") && (
            <p className="text-[11px] rounded-md bg-amber-bg/60 px-2 py-1.5">
              Nasabah dapat mengajukan penyelesaian melalui arbitrase BAKTI mulai H+1 selama jendela waktu arbitrase. Tanpa pendaftaran, status menjadi Selesai Non-Arbitrase.
            </p>
          )}
        </div>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Batal
          </Button>
          <Button size="sm" disabled={!notula.trim()} onClick={submit}>
            Simpan Hasil
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ---------------------------------------------------------------------------
// Menu sidebar "Musyawarah" — daftar semua musyawarah lintas tiket
// ---------------------------------------------------------------------------

export function MusyawarahModule({ detailHref, readOnly }: { detailHref: (ticket: string) => string; readOnly: boolean }) {
  const all = useMeetings(MEETING_SEED);
  const now = useNow();
  const [statusFilter, setStatusFilter] = React.useState<MeetingStatus | "">("");
  const [search, setSearch] = React.useState("");
  const [viewing, setViewing] = React.useState<MusyawarahMeeting | null>(null);
  const [recording, setRecording] = React.useState<MusyawarahMeeting | null>(null);
  const [cancelling, setCancelling] = React.useState<MusyawarahMeeting | null>(null);
  const canManage = useCanManageMeeting();

  const rows = [...all]
    .sort((a, b) => `${b.date} ${b.startTime}`.localeCompare(`${a.date} ${a.startTime}`))
    .filter((m) => !statusFilter || getMeetingStatus(m, now) === statusFilter)
    .filter((m) => !search || m.ticket.toLowerCase().includes(search.toLowerCase()) || m.title.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="mb-3 flex flex-wrap items-end gap-2">
        <div className="w-full max-w-xs">
          <Label>Cari</Label>
          <Input placeholder="Nomor tiket atau judul..." value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
        <div className="w-60">
          <Label>Status Pertemuan</Label>
          <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as MeetingStatus | "")}>
            <option value="">Semua status</option>
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </div>
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>No. Tiket</TableHead>
            <TableHead>Judul Musyawarah</TableHead>
            <TableHead>Tanggal & Jam</TableHead>
            <TableHead>Lokasi / Link Meeting</TableHead>
            <TableHead>Pihak Pengaju</TableHead>
            <TableHead>Status Pertemuan</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((m) => (
            <TableRow key={m.id}>
              <TableCell className="whitespace-nowrap">
                <Link href={detailHref(m.ticket)} className="font-medium text-navy hover:underline">
                  {m.ticket}
                </Link>
              </TableCell>
              <TableCell className="max-w-[240px]">
                <p className="truncate" title={m.title}>
                  {m.title}
                </p>
                <p className="text-[11px] text-muted">Musyawarah ke-{meetingSequence(m, all)}</p>
              </TableCell>
              <TableCell className="whitespace-nowrap">{formatMeetingDate(m)}</TableCell>
              <TableCell className="max-w-[220px]">
                <LocationText m={m} />
              </TableCell>
              <TableCell className="whitespace-nowrap">
                <p className="font-medium">{m.proposedBy.role}</p>
                <p className="text-[11px] text-muted">{m.proposedBy.name}</p>
              </TableCell>
              <TableCell>
                <StatusBadge status={getMeetingStatus(m, now)} />
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-1">
                  <Button size="sm" variant="ghost" onClick={() => setViewing(m)}>
                    <Eye className="size-3.5" /> Detail
                  </Button>
                  {!readOnly && !m.outcome && !m.cancellation && (
                    <Button size="sm" variant="secondary" onClick={() => setRecording(m)}>
                      <ClipboardEdit className="size-3.5" /> Catat Hasil
                    </Button>
                  )}
                  {!readOnly && canManage(m) && (
                    <>
                      <Link href={`${detailHref(m.ticket)}?tab=musyawarah`} title="Edit jadwal pada tab Pertemuan Musyawarah tiket">
                        <Button size="sm" variant="ghost">
                          <Pencil className="size-3.5" /> Edit
                        </Button>
                      </Link>
                      <Button size="sm" variant="ghost" onClick={() => setCancelling(m)}>
                        <Ban className="size-3.5" /> Batalkan
                      </Button>
                    </>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={7} className="text-center text-muted py-6">
                Tidak ada jadwal musyawarah.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      {viewing && <MeetingDetailDialog meeting={viewing} all={all} now={now} detailHref={detailHref} onClose={() => setViewing(null)} />}
      {recording && <OutcomeDialog meeting={recording} onClose={() => setRecording(null)} />}
      {cancelling && <CancelMeetingDialog meeting={cancelling} onClose={() => setCancelling(null)} />}
    </div>
  );
}

function CancelMeetingDialog({ meeting: m, onClose }: { meeting: MusyawarahMeeting; onClose: () => void }) {
  const { showToast } = useToast();
  const actingParty = useActingParty();
  const [reason, setReason] = React.useState("");
  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Batalkan Musyawarah</DialogTitle>
          <DialogDescription>
            {m.title} — {formatMeetingDate(m)}. Email notifikasi pembatalan akan dikirim ke nasabah dan pihak terkait.
          </DialogDescription>
        </DialogHeader>
        <div>
          <Label>Alasan pembatalan (wajib)</Label>
          <Textarea value={reason} onChange={(e) => setReason(e.target.value)} className="min-h-[80px] text-sm" />
        </div>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Kembali
          </Button>
          <Button
            size="sm"
            variant="destructive"
            disabled={!reason.trim()}
            onClick={() => {
              const party = actingParty(CASES.find((x) => x.ticket === m.ticket));
              editMeeting(m.id, { cancellation: { reason: reason.trim(), by: party.name, at: new Date().toISOString() } });
              addTimelineEvent(m.ticket, {
                actor: party.name,
                role: party.role,
                action: "Musyawarah dibatalkan",
                note: `${m.title} (${formatMeetingDate(m)}) dibatalkan. Alasan: ${reason.trim()}. Notifikasi pembatalan dikirim ke email nasabah dan pihak terkait.`,
                status: "warning",
                visibility: "public",
              });
              logAudit({ activity: "Batalkan Musyawarah", ticket: m.ticket, detail: `Membatalkan "${m.title}". Alasan: ${reason.trim()}.` });
              showToast("Musyawarah dibatalkan dan email notifikasi pembatalan telah dikirimkan ke nasabah dan pihak terkait.");
              onClose();
            }}
          >
            Batalkan Musyawarah
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function MeetingDetailDialog({
  meeting,
  all,
  now,
  detailHref,
  onClose,
}: {
  meeting: MusyawarahMeeting;
  all: MusyawarahMeeting[];
  now: Date | null;
  detailHref: (ticket: string) => string;
  onClose: () => void;
}) {
  // Ambil versi terbaru (mis. setelah hasil dicatat) dari daftar.
  const m = all.find((x) => x.id === meeting.id) ?? meeting;
  const history = sortMeetings(all.filter((x) => x.ticket === m.ticket));
  const c = CASES.find((x) => x.ticket === m.ticket);

  return (
    <Dialog open onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{m.title}</DialogTitle>
          <DialogDescription>
            <Link href={detailHref(m.ticket)} className="text-navy hover:underline">
              {m.ticket}
            </Link>
            {c ? ` — ${c.title} (${c.platform})` : ""}
          </DialogDescription>
        </DialogHeader>
        <Tabs defaultValue="detail">
          <TabsList>
            <TabsTrigger value="detail">Detail</TabsTrigger>
            <TabsTrigger value="riwayat">Riwayat ({history.length})</TabsTrigger>
          </TabsList>
          <TabsContent value="detail">
            <MeetingCard meeting={m} sequence={meetingSequence(m, all)} status={getMeetingStatus(m, now)} />
          </TabsContent>
          <TabsContent value="riwayat">
            <ol className="relative border-l border-border ml-2 space-y-3 max-h-[50vh] overflow-y-auto pr-1">
              {history.map((h, i) => (
                <li key={h.id} className="ml-4">
                  <span className="absolute -left-1.5 mt-1 size-3 rounded-full bg-navy ring-4 ring-card" />
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-xs font-semibold">Musyawarah ke-{i + 1}</p>
                    <StatusBadge status={getMeetingStatus(h, now)} />
                  </div>
                  <p className="text-[11px] text-muted">{formatMeetingDate(h)} · {h.locationType}</p>
                  <p className="text-xs mt-0.5">{h.title}</p>
                  <p className="text-xs mt-1 text-foreground/90">
                    <span className="font-medium">Notula: </span>
                    {h.outcome ? h.outcome.notula : "Belum ada notula."}
                  </p>
                </li>
              ))}
            </ol>
          </TabsContent>
        </Tabs>
        <DialogFooter>
          <Button size="sm" variant="secondary" onClick={onClose}>
            Tutup
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
