"use client";

import { useMemo, useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { FileUploader } from "@/components/shared/file-uploader";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { TaskTable } from "@/components/shared/task-table";
import { CASES, CASE_TASKS } from "@/lib/mock-data";
import { useCasesData } from "@/lib/mock-service/store";
import { useAllTasks, addTask, updateTask } from "@/lib/mock-service/task-store";
import { useDemoSession } from "@/lib/demo-session";
import { useToast } from "@/components/shared/toast-provider";
import { DEMO_USERS, PLATFORM_STAFF, ROLE_LABEL } from "@/lib/permissions";
import { lembagaOptionsFor } from "@/lib/ecosystem-lembaga";
import { formatDueDateID, parseDueDateID } from "@/lib/format";
import { CaseTask, TaskDelegationType, TaskPriority } from "@/lib/types";
import { Plus } from "lucide-react";

const DELEGATION_TYPES: TaskDelegationType[] = ["Internal Pialang", "Bursa", "Kliring", "Custody"];
const TASK_PRIORITIES: TaskPriority[] = ["Rendah", "Sedang", "Tinggi"];

export default function ManajemenTugasPage() {
  const { user } = useDemoSession();
  const { showToast } = useToast();
  const isSupervisor = user.role === "PLATFORM_SUPERVISOR";

  const platformCases = useCasesData(useMemo(() => CASES.filter((c) => c.currentOwner === "Pialang"), []));
  const allTasks = useAllTasks(CASE_TASKS);

  // Everyone who can create a task from this page (CS + Supervisor) — broader
  // than PLATFORM_STAFF (CS-only), since a task created here is always "ours"
  // regardless of who created it or whether its assignee is a free-text
  // delegation target (Bursa/Kliring/Custody) rather than a recognized CS name.
  const platformPersonaNames = useMemo(
    () => new Set(DEMO_USERS.filter((u) => u.role === "PLATFORM_CASE_OFFICER" || u.role === "PLATFORM_SUPERVISOR").map((u) => u.name)),
    []
  );
  const platformTasks = useMemo(
    () =>
      allTasks.filter(
        (t) =>
          t.createdByRole === "Pialang" ||
          t.createdByRole === ROLE_LABEL.PLATFORM_CASE_OFFICER ||
          t.createdByRole === ROLE_LABEL.PLATFORM_SUPERVISOR ||
          platformPersonaNames.has(t.assignee) ||
          platformPersonaNames.has(t.createdBy)
      ),
    [allTasks, platformPersonaNames]
  );

  // Role-scoped visibility (Bab II): CS only sees tasks delegated to them;
  // Admin/Supervisor monitors every task from all platform staff.
  const tasks = isSupervisor ? platformTasks : platformTasks.filter((t) => t.assignee === user.name);

  const [editingTask, setEditingTask] = useState<CaseTask | "add" | null>(null);
  const [ticket, setTicket] = useState("");
  const [description, setDescription] = useState("");
  const [delegationType, setDelegationType] = useState<TaskDelegationType>("Internal Pialang");
  const [delegationEntity, setDelegationEntity] = useState("");
  const [assignee, setAssignee] = useState(PLATFORM_STAFF[0]?.name ?? "");
  const [document, setDocument] = useState("");
  const [priority, setPriority] = useState<TaskPriority>("Sedang");
  const [dueDate, setDueDate] = useState("");

  function resetForm() {
    setTicket("");
    setDescription("");
    setDelegationType("Internal Pialang");
    setDelegationEntity("");
    setAssignee(PLATFORM_STAFF[0]?.name ?? "");
    setDocument("");
    setPriority("Sedang");
    setDueDate("");
  }

  function openAdd() {
    resetForm();
    setEditingTask("add");
  }

  function openEdit(t: CaseTask) {
    setTicket(t.ticket);
    setDescription(t.description);
    setDelegationType(t.delegationType ?? "Internal Pialang");
    setDelegationEntity(t.delegationEntity ?? "");
    setAssignee(t.assignee);
    setDocument(t.document ?? "");
    setPriority(t.priority ?? "Sedang");
    setDueDate(parseDueDateID(t.dueDate));
    setEditingTask(t);
  }

  function submitTask() {
    if (!ticket || !description.trim() || !assignee) return;
    if (delegationType !== "Internal Pialang" && !delegationEntity) return;
    const payload = {
      description: description.trim(),
      assignee,
      document: document || undefined,
      delegationType: delegationType === "Internal Pialang" ? undefined : delegationType,
      delegationEntity: delegationType === "Internal Pialang" ? undefined : delegationEntity,
      priority,
      dueDate: dueDate ? formatDueDateID(dueDate) : undefined,
    };
    if (editingTask === "add") {
      addTask({ ticket, createdBy: user.name, createdByRole: ROLE_LABEL[user.role], ...payload });
      showToast("Tugas berhasil ditambahkan.");
    } else if (editingTask) {
      updateTask(editingTask.id, payload);
      showToast("Tugas berhasil diperbarui.");
    }
    resetForm();
    setEditingTask(null);
  }

  return (
    <div>
      <PageHeader
        title="Manajemen Tugas"
        description={
          isSupervisor
            ? "Pantau seluruh tugas internal yang didelegasikan kepada staf pialang."
            : "Daftar tugas internal yang didelegasikan kepada Anda."
        }
        actions={
          <Button size="sm" onClick={openAdd}>
            <Plus className="size-3.5" /> Tambah Tugas
          </Button>
        }
      />

      <TaskTable
        tasks={tasks}
        currentUserName={user.name}
        caseDetailPath={(ticket) => `/platform/kasus/${ticket}`}
        onEdit={openEdit}
        emptyMessage={isSupervisor ? "Belum ada tugas internal." : "Belum ada tugas yang didelegasikan kepada Anda."}
      />

      <Dialog open={!!editingTask} onOpenChange={(v) => { if (!v) { resetForm(); setEditingTask(null); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingTask === "add" ? "Tambah Tugas" : "Edit Tugas"}</DialogTitle>
            <DialogDescription>Tugas akan tersinkronisasi otomatis dengan tab Tugas Internal pada detail tiket terkait.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label htmlFor="task-ticket">Pilih Kasus / Nomor Tiket</Label>
              <Select id="task-ticket" value={ticket} onChange={(e) => setTicket(e.target.value)} disabled={editingTask !== "add"}>
                <option value="">Pilih tiket...</option>
                {platformCases.map((c) => (
                  <option key={c.ticket} value={c.ticket}>{c.ticket} — {c.title}</option>
                ))}
              </Select>
            </div>
            <div>
              <Label htmlFor="task-desc">Task Description</Label>
              <Textarea id="task-desc" value={description} onChange={(e) => setDescription(e.target.value)} className="min-h-[70px] text-xs" />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Tujuan Penugasan</Label>
                <Select
                  value={delegationType}
                  onChange={(e) => {
                    const next = e.target.value as TaskDelegationType;
                    setDelegationType(next);
                    setDelegationEntity("");
                    setAssignee(next === "Internal Pialang" ? PLATFORM_STAFF[0]?.name ?? "" : "");
                  }}
                >
                  {DELEGATION_TYPES.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </Select>
              </div>
              {delegationType !== "Internal Pialang" && (
                <div>
                  <Label className="text-[11px]">Nama Lembaga / Perusahaan</Label>
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
              <Label htmlFor="task-assignee">Assignee / Petugas</Label>
              {delegationType === "Internal Pialang" ? (
                <Select id="task-assignee" value={assignee} onChange={(e) => setAssignee(e.target.value)}>
                  {PLATFORM_STAFF.map((s) => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </Select>
              ) : (
                <Input
                  id="task-assignee"
                  placeholder="Nama petugas / bagian penanggung jawab..."
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                />
              )}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-[11px]">Prioritas</Label>
                <Select value={priority} onChange={(e) => setPriority(e.target.value as TaskPriority)}>
                  {TASK_PRIORITIES.map((p) => (
                    <option key={p} value={p}>{p}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label className="text-[11px]">Batas Waktu</Label>
                <Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
              </div>
            </div>
            <div>
              <Label htmlFor="task-doc">Upload Dokumen (opsional)</Label>
              <FileUploader
                files={document ? [document] : []}
                onChange={(files) => setDocument(files[0] ?? "")}
                multiple={false}
                maxFiles={1}
                label="Klik atau seret dokumen pendukung ke sini"
              />
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => { resetForm(); setEditingTask(null); }}>Batal</Button>
            <Button size="sm" disabled={!ticket || !description.trim() || !assignee} onClick={submitTask}>
              {editingTask === "add" ? "Tambah Tugas" : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
