"use client";

import * as React from "react";
import { ClarificationMessage, ComplaintCase } from "@/lib/types";
import { getSenderLabel } from "@/lib/sender-label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { EmptyState } from "./empty-state";
import { Mail, MessageSquare } from "lucide-react";
import { cn } from "@/lib/utils";

const KIND_LABEL: Record<NonNullable<ClarificationMessage["kind"]>, { label: string; tone: "navy" | "amber" | "green" | "muted" }> = {
  info: { label: "Informasi", tone: "muted" },
  "formal-request": { label: "Permintaan Klarifikasi Resmi", tone: "amber" },
  reply: { label: "Tanggapan Pelapor", tone: "navy" },
  resolution: { label: "Komunikasi Resolusi", tone: "green" },
  "public-response": { label: "Respon Publik", tone: "navy" },
};

/** Warna label asal lembaga per peran pengirim. */
const ROLE_TAG_CLASS: Record<string, string> = {
  Pelapor: "bg-muted-bg text-foreground border-border",
  Platform: "bg-navy/10 text-navy border-navy/20",
  Bursa: "bg-amber-bg text-amber border-amber/30",
  Kliring: "bg-green-bg text-green border-green/30",
  Custody: "bg-green-bg text-green border-green/30",
  Bappebti: "bg-red-bg text-red border-red/30",
};

export interface PublicResponseOptions {
  sendEmail: boolean;
}

export function ClarificationThread({
  messages,
  complaintCase,
  onReply,
  replyPlaceholder = "Tulis jawaban klarifikasi Anda...",
  publicResponse = false,
}: {
  messages: ClarificationMessage[];
  /** Dipakai untuk menurunkan nama lembaga pengirim pada pesan lama yang belum menyimpannya. */
  complaintCase?: ComplaintCase;
  onReply?: (message: string, opts: PublicResponseOptions) => void;
  replyPlaceholder?: string;
  /**
   * Mode "Respon ke Public" untuk petugas (Platform, Ekosistem Active, Bappebti):
   * menampilkan opsi kirim ke email klien dan modal konfirmasi wajib sebelum publikasi.
   */
  publicResponse?: boolean;
}) {
  const [text, setText] = React.useState("");
  const [sendEmail, setSendEmail] = React.useState(false);
  const [confirming, setConfirming] = React.useState(false);

  if (messages.length === 0 && !onReply) {
    return <EmptyState icon={MessageSquare} title="Belum ada percakapan" />;
  }

  function send() {
    if (!text.trim() || !onReply) return;
    onReply(text.trim(), { sendEmail: publicResponse && sendEmail });
    setText("");
    setSendEmail(false);
    setConfirming(false);
  }

  return (
    <div className="flex flex-col gap-3">
      {messages.length === 0 && <p className="text-xs text-muted">Belum ada percakapan untuk kasus ini.</p>}
      {messages.map((m, idx) => {
        const kind = KIND_LABEL[m.kind ?? "info"];
        const sender = getSenderLabel(m, complaintCase);
        return (
          <div key={idx} className={cn("rounded-md border p-2.5", m.kind === "formal-request" ? "border-amber/30 bg-amber-bg/30" : "border-border")}>
            <div className="flex flex-wrap items-center justify-between gap-1 mb-1">
              <span className="flex flex-wrap items-center gap-1.5 text-xs">
                <span className={cn("rounded border px-1.5 py-0.5 text-[10px] font-semibold", ROLE_TAG_CLASS[m.role] ?? ROLE_TAG_CLASS.Pelapor)}>
                  {sender.tag}
                </span>
                <span className="font-semibold text-navy">{sender.name}</span>
              </span>
              <div className="flex items-center gap-1.5">
                {m.emailSent && (
                  <span className="inline-flex items-center gap-1 text-[10px] text-muted" title="Salinan dikirim ke email pelapor">
                    <Mail className="size-3" /> Email terkirim
                  </span>
                )}
                <Badge variant={kind.tone}>{kind.label}</Badge>
                <span className="text-[11px] text-muted">{m.datetime}</span>
              </div>
            </div>
            <p className="text-xs text-foreground/80">{m.message}</p>
            {m.dueDate && <p className="text-[11px] text-amber mt-1">Mohon ditanggapi paling lambat {m.dueDate}.</p>}
            {m.requiresAttachment && <p className="text-[11px] text-muted mt-0.5">Lampiran dokumen diperlukan untuk permintaan ini.</p>}
          </div>
        );
      })}
      {onReply && (
        <div className="flex flex-col gap-2 pt-1">
          <Textarea
            placeholder={replyPlaceholder}
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="text-xs min-h-[70px]"
          />
          <div className={cn("flex flex-wrap items-center gap-3", publicResponse ? "justify-between" : "justify-end")}>
            {publicResponse && (
              <label className="flex items-center gap-2 text-xs cursor-pointer select-none">
                <Checkbox checked={sendEmail} onCheckedChange={(v) => setSendEmail(v === true)} />
                Kirim respon ini juga ke email klien
              </label>
            )}
            <Button
              size="sm"
              disabled={!text.trim()}
              onClick={() => {
                if (!text.trim()) return;
                if (publicResponse) setConfirming(true);
                else send();
              }}
            >
              {publicResponse ? "Kirim Respon" : "Kirim Jawaban"}
            </Button>
          </div>
        </div>
      )}

      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{sendEmail ? "Kirim Respon ke Publik & Email Klien?" : "Publikasikan Respon Publik?"}</DialogTitle>
            <DialogDescription>
              {sendEmail
                ? "Apakah Anda yakin ingin mempublikasikan respon ini sekaligus mengirimkan salinannya langsung ke alamat email klien/pelapor?"
                : "Apakah Anda yakin ingin mempublikasikan respon ini ke kolom tanggapan publik? (Pesan tidak dikirimkan ke email klien)."}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>
              Batal
            </Button>
            <Button size="sm" onClick={send}>
              {sendEmail ? "Ya, Kirim ke Email" : "Ya, Publikasikan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
