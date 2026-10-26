"use client";

// Tugas Internal / Manajemen Tugas — a lightweight task-reminder module
// scoped to a case. Shared by the case detail page's "Tugas Internal" tab
// and the Platform portal's "Manajemen Tugas" menu, which read and write
// the exact same store, so a task created from either place appears
// immediately in the other. Same localStorage + event-bus pattern as the
// rest of the prototype — CASE_TASKS in lib/mock-data.ts stays read-only
// seed data.

import * as React from "react";
import { CaseTask, CaseTaskStatus } from "../types";
import { subscribe, emitChange, getVersion } from "./event-bus";
import { logAudit } from "./audit-store";
import { nowDateTimeID } from "../format";

const ADDED_KEY = "bappebti-demo-added-tasks";
const STATUS_KEY = "bappebti-demo-task-status";
const DOCUMENT_KEY = "bappebti-demo-task-document";
const EDITS_KEY = "bappebti-demo-task-edits";
const DELETED_KEY = "bappebti-demo-deleted-tasks";

type TaskEditableFields = Pick<CaseTask, "description" | "assignee" | "delegationType" | "delegationEntity" | "priority" | "dueDate">;

function readJSON<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key: string, value: unknown) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // ignore persistence failures in the prototype
  }
  emitChange();
}

export function addTask(input: Omit<CaseTask, "id" | "createdAt" | "status"> & { status?: CaseTaskStatus }): CaseTask {
  const task: CaseTask = {
    ...input,
    id: `TASK-${Date.now().toString(36).toUpperCase()}`,
    status: input.status ?? "Pending",
    createdAt: nowDateTimeID(),
  };
  writeJSON(ADDED_KEY, [...readJSON<CaseTask[]>(ADDED_KEY, []), task]);
  logAudit({ activity: "Buat Tugas", ticket: task.ticket, detail: `Membuat tugas '${task.description}' untuk ${task.assignee}.` });
  return task;
}

export function updateTaskStatus(
  id: string,
  status: CaseTaskStatus,
  audit?: { ticket: string; from: CaseTaskStatus; description: string }
) {
  if (audit && audit.from !== status) {
    logAudit({
      activity: "Ubah Status Tugas",
      ticket: audit.ticket,
      detail: `Memperbarui status tugas '${audit.description}' dari '${audit.from}' menjadi '${status}'.`,
    });
  }
  const map = readJSON<Record<string, CaseTaskStatus>>(STATUS_KEY, {});
  map[id] = status;
  writeJSON(STATUS_KEY, map);
}

export function deleteTask(id: string) {
  const deleted = new Set(readJSON<string[]>(DELETED_KEY, []));
  deleted.add(id);
  writeJSON(DELETED_KEY, Array.from(deleted));
}

/** Attaches/replaces a task's supporting document — the Manajemen Tugas table's inline "+ Unggah" action. */
export function updateTaskDocument(id: string, document: string) {
  const map = readJSON<Record<string, string>>(DOCUMENT_KEY, {});
  map[id] = document;
  writeJSON(DOCUMENT_KEY, map);
}

/** Edits a task's description/assignee/delegation — the Manajemen Tugas "Edit Tugas" action. */
export function updateTask(id: string, patch: Partial<TaskEditableFields>) {
  const edits = readJSON<Record<string, Partial<TaskEditableFields>>>(EDITS_KEY, {});
  edits[id] = { ...edits[id], ...patch };
  writeJSON(EDITS_KEY, edits);
}

function mergeTasks(seed: CaseTask[]): CaseTask[] {
  const added = readJSON<CaseTask[]>(ADDED_KEY, []);
  const statusMap = readJSON<Record<string, CaseTaskStatus>>(STATUS_KEY, {});
  const documentMap = readJSON<Record<string, string>>(DOCUMENT_KEY, {});
  const edits = readJSON<Record<string, Partial<TaskEditableFields>>>(EDITS_KEY, {});
  const deleted = new Set(readJSON<string[]>(DELETED_KEY, []));
  return [...seed, ...added]
    .filter((t) => !deleted.has(t.id))
    .map((t) => ({
      ...t,
      ...(statusMap[t.id] ? { status: statusMap[t.id] } : null),
      ...(documentMap[t.id] ? { document: documentMap[t.id] } : null),
      ...(edits[t.id] ?? null),
    }));
}

export function useAllTasks(seed: CaseTask[]): CaseTask[] {
  const version = React.useSyncExternalStore(subscribe, getVersion, getVersion);
  return React.useMemo(() => mergeTasks(seed),
  // eslint-disable-next-line react-hooks/exhaustive-deps -- version isn't read in the body, it only forces recomputation when the store changes
  [seed, version]);
}

export function useTasksForCase(ticket: string, seed: CaseTask[]): CaseTask[] {
  const all = useAllTasks(seed);
  return React.useMemo(() => all.filter((t) => t.ticket === ticket), [all, ticket]);
}
