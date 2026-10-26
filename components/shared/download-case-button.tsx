"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/shared/toast-provider";
import { useDemoSession } from "@/lib/demo-session";
import { ROLE_LABEL } from "@/lib/permissions";
import { addTimelineEvent } from "@/lib/mock-service/store";
import { ComplaintCase } from "@/lib/types";
import { Download } from "lucide-react";

/**
 * Tombol "Unduh Detail Pengaduan" — menghasilkan PDF rekap kasus dengan cap air
 * identitas pengunduh di setiap halaman dan mencatat unduhan ke jejak audit.
 */
export function DownloadCaseButton({ complaintCase }: { complaintCase: ComplaintCase }) {
  const { user } = useDemoSession();
  const { showToast } = useToast();
  const [busy, setBusy] = React.useState(false);

  async function handleDownload() {
    setBusy(true);
    try {
      const { downloadCasePdf, formatWIB } = await import("@/lib/case-pdf");
      const downloader = { name: user.name, institution: user.institution, roleLabel: ROLE_LABEL[user.role] };
      const filename = await downloadCasePdf(complaintCase, downloader);
      addTimelineEvent(complaintCase.ticket, {
        actor: user.name,
        role: ROLE_LABEL[user.role],
        action: "Detail pengaduan diunduh (PDF ber-watermark)",
        note: `${filename} diunduh oleh ${user.name} (${user.institution}) pada ${formatWIB(new Date())} WIB.`,
        status: "info",
        visibility: "internal",
      });
      showToast("Detail pengaduan berhasil diunduh. Dokumen memuat cap air identitas Anda.");
    } catch {
      showToast("Gagal membuat dokumen PDF. Silakan coba lagi.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Button variant="secondary" size="sm" onClick={handleDownload} disabled={busy}>
      <Download className="size-3.5" /> {busy ? "Menyiapkan PDF..." : "Unduh Detail Pengaduan"}
    </Button>
  );
}
