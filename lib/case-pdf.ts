// Rekap Detail Pengaduan dalam PDF dengan cap air (watermark) identitas
// pengunduh pada setiap halaman — fungsi pengawasan kepatuhan agar sumber
// kebocoran dokumen dapat ditelusuri.

import type { jsPDF as JsPDF } from "jspdf";
import { ComplaintCase } from "./types";
import { formatCurrencyIDR } from "./format";
import { formatSenderLabel } from "./sender-label";
import { getPublicStatus } from "./workflow-config";
import { DISPUTE_STAGES } from "./dispute-workflow";

export interface Downloader {
  name: string;
  institution: string;
  roleLabel: string;
}

/** "26/10/2026 14:15" dalam zona waktu WIB (Asia/Jakarta). */
export function formatWIB(date: Date): string {
  const parts = new Intl.DateTimeFormat("id-ID", {
    timeZone: "Asia/Jakarta",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("day")}/${get("month")}/${get("year")} ${get("hour")}:${get("minute")}`;
}

export function watermarkText(d: Downloader, at: Date): string {
  return `DIUNDUH OLEH: ${d.name} | ${d.institution} / ${d.roleLabel} | ${formatWIB(at)} WIB | DOKUMEN RAHASIA & TERBATAS`;
}

/** Font standar PDF hanya mendukung Latin-1 — ganti simbol yang tidak tersedia. */
function latin1(s: string): string {
  return s
    .replace(/[→⟶]/g, "->")
    .replace(/≥/g, ">=")
    .replace(/≤/g, "<=")
    .replace(/[–—]/g, "-")
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/…/g, "...")
    .replace(/·/g, "-")
    .replace(/[^\x00-\xFF]/g, "?");
}

const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 16;
const CONTENT_W = PAGE_W - MARGIN * 2;
const BOTTOM = PAGE_H - 18;

export async function downloadCasePdf(c: ComplaintCase, downloader: Downloader): Promise<string> {
  const { jsPDF } = await import("jspdf");
  const doc: JsPDF = new jsPDF({ unit: "mm", format: "a4" });
  const at = new Date();
  const wm = latin1(watermarkText(downloader, at));
  let y = MARGIN;

  // Cap air diagonal di latar belakang — digambar lebih dulu pada setiap halaman agar berada di bawah isi.
  function drawWatermark() {
    doc.saveGraphicsState();
    doc.setGState(doc.GState({ opacity: 0.13 }));
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8.5);
    doc.setTextColor(150, 20, 20);
    for (let row = -2; row < 9; row++) {
      doc.text(wm, -40 + (row % 2) * 30, 30 + row * 38, { angle: 33 });
    }
    doc.restoreGraphicsState();
    doc.setTextColor(20, 20, 20);
  }

  function newPage() {
    doc.addPage();
    drawWatermark();
    y = MARGIN;
  }

  function ensure(h: number) {
    if (y + h > BOTTOM) newPage();
  }

  function section(title: string) {
    ensure(14);
    y += 3;
    doc.setFillColor(23, 49, 92);
    doc.rect(MARGIN, y, CONTENT_W, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(latin1(title), MARGIN + 2, y + 4.9);
    doc.setTextColor(20, 20, 20);
    y += 12;
  }

  function field(label: string, value: string | undefined) {
    doc.setFontSize(9);
    const lines = doc.splitTextToSize(latin1(value || "-"), CONTENT_W - 50) as string[];
    ensure(lines.length * 4.4 + 1.5);
    doc.setFont("helvetica", "bold");
    doc.text(latin1(label), MARGIN, y);
    doc.setFont("helvetica", "normal");
    doc.text(lines, MARGIN + 50, y);
    y += lines.length * 4.4 + 1.5;
  }

  function paragraph(text: string, opts: { bold?: boolean; size?: number } = {}) {
    doc.setFont("helvetica", opts.bold ? "bold" : "normal");
    doc.setFontSize(opts.size ?? 9);
    const lines = doc.splitTextToSize(latin1(text), CONTENT_W) as string[];
    for (const line of lines) {
      ensure(4.6);
      doc.text(line, MARGIN, y);
      y += 4.4;
    }
  }

  // --- Halaman 1 ---
  drawWatermark();
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(23, 49, 92);
  doc.text("REKAP DETAIL PENGADUAN", MARGIN, y + 2);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(90, 90, 90);
  doc.text("Layanan Pengaduan Bappebti - Badan Pengawas Perdagangan Berjangka Komoditi", MARGIN, y + 7);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.setTextColor(20, 20, 20);
  doc.text(c.ticket, PAGE_W - MARGIN, y + 2, { align: "right" });
  doc.setDrawColor(23, 49, 92);
  doc.setLineWidth(0.6);
  doc.line(MARGIN, y + 10, PAGE_W - MARGIN, y + 10);
  y += 17;

  section("Informasi Tiket");
  field("Nomor Tiket", c.ticket);
  field("Judul Pengaduan", c.title);
  field("Status", getPublicStatus(c));
  if (c.dispute) field("Tahap Perselisihan", DISPUTE_STAGES[c.dispute.stage].label);
  field("Prioritas", c.severity ?? "Belum ditentukan");
  field("Kategori", `${c.category} / ${c.subcategory}`);
  field("Tanggal Pengaduan", c.createdAt);
  field("Terakhir Diperbarui", c.updatedAt);
  field("Penanggung Jawab Saat Ini", c.currentOwner);

  section("Data Pelapor");
  field("Nama Pelapor", c.reporterName);
  field("Tipe Pelapor", c.reporter?.reporterType);
  field("Email", c.reporter?.verifiedEmail);
  field("Telepon", c.reporter?.verifiedPhone);
  field("Domisili", c.reporterCity ?? [c.reporter?.city, c.reporter?.province].filter(Boolean).join(", "));
  field("ID Pengguna Platform", c.platformUserId);

  section("Data Terlapor");
  field("Pialang / Platform", c.platform);
  field("Bursa", c.institution?.bursa ?? c.bursaEntity);
  field("Lembaga Kliring", c.institution?.clearing ?? c.kliringEntity);
  if (c.linkedEcosystemEntities?.length) {
    field("Member Terhubung", c.linkedEcosystemEntities.map((e) => `${e.type}: ${e.name}`).join("; "));
  }

  section("Ringkasan Kasus");
  field("Nilai Transaksi", formatCurrencyIDR(c.amount));
  field("Referensi Transaksi", c.transactionRef);
  y += 1;
  paragraph("Kronologi", { bold: true });
  paragraph(c.chronology);
  y += 2;
  paragraph("Penyelesaian yang Diharapkan", { bold: true });
  paragraph(c.expectedResolution);

  section(`Daftar Berkas Bukti (${c.evidences.length})`);
  if (c.evidences.length === 0) paragraph("Tidak ada berkas bukti.");
  c.evidences.forEach((e, i) => paragraph(`${i + 1}. ${e}`));

  section(`Riwayat Respon (${c.clarifications.length})`);
  if (c.clarifications.length === 0) paragraph("Belum ada riwayat respon.");
  for (const m of c.clarifications) {
    ensure(12);
    paragraph(`${formatSenderLabel(m, c)} - ${m.datetime}${m.emailSent ? " (salinan dikirim ke email pelapor)" : ""}`, { bold: true });
    paragraph(m.message);
    y += 2;
  }

  // Footer pada setiap halaman.
  const total = doc.getNumberOfPages();
  for (let i = 1; i <= total; i++) {
    doc.setPage(i);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(MARGIN, PAGE_H - 13, PAGE_W - MARGIN, PAGE_H - 13);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(110, 110, 110);
    const footer = doc.splitTextToSize(wm, CONTENT_W - 25) as string[];
    doc.text(footer, MARGIN, PAGE_H - 9.5);
    doc.text(`Halaman ${i} dari ${total}`, PAGE_W - MARGIN, PAGE_H - 9.5, { align: "right" });
  }

  const filename = `Detail-Pengaduan-${c.ticket}.pdf`;
  doc.save(filename);
  return filename;
}
