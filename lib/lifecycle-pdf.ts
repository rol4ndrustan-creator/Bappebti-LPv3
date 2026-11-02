// Dokumen PDF siklus tiket (List Revisi 12 #6): Formulir Registrasi BAKTI
// untuk diisi nasabah, dan Surat Pengantar Bappebti untuk pendaftaran gugatan
// ke Pengadilan Negeri setelah jendela arbitrase berakhir.

import type { jsPDF as JsPDF } from "jspdf";
import { ComplaintCase } from "./types";
import { formatWIB } from "./case-pdf";

const M = 18;
const W = 210 - M * 2;

async function newDoc(): Promise<JsPDF> {
  const { jsPDF } = await import("jspdf");
  return new jsPDF({ unit: "mm", format: "a4" });
}

function header(doc: JsPDF, title: string, subtitle: string) {
  doc.setFont("helvetica", "bold");
  doc.setFontSize(13);
  doc.setTextColor(23, 49, 92);
  doc.text(title, 105, 22, { align: "center" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(90, 90, 90);
  doc.text(subtitle, 105, 28, { align: "center" });
  doc.setDrawColor(23, 49, 92);
  doc.setLineWidth(0.6);
  doc.line(M, 32, 210 - M, 32);
  doc.setTextColor(20, 20, 20);
}

function paragraph(doc: JsPDF, text: string, y: number, size = 10): number {
  doc.setFontSize(size);
  const lines = doc.splitTextToSize(text, W) as string[];
  doc.text(lines, M, y);
  return y + lines.length * (size * 0.45) + 2;
}

/** Formulir registrasi arbitrase BAKTI (kolom isian kosong untuk ditandatangani nasabah). */
export async function downloadBaktiRegistrationForm(c: ComplaintCase) {
  const doc = await newDoc();
  header(doc, "FORMULIR REGISTRASI PERMOHONAN ARBITRASE", "Badan Arbitrase Perdagangan Berjangka Komoditi (BAKTI)");
  let y = 42;
  doc.setFont("helvetica", "bold");
  y = paragraph(doc, `Nomor Tiket Pengaduan Bappebti: ${c.ticket}`, y);
  doc.setFont("helvetica", "normal");
  y = paragraph(doc, `Pihak Termohon (Pialang): ${c.platform}`, y);
  y = paragraph(doc, `Pokok Perkara: ${c.title}`, y + 1);
  y += 4;
  const fields = [
    "Nama Lengkap Pemohon",
    "Nomor KTP",
    "Alamat Domisili",
    "Nomor HP / Email",
    "Pialang User ID",
    "Nomor Akun Transaksi",
    "Nilai Kerugian yang Dimohonkan (Rp)",
    "Ringkasan Tuntutan",
  ];
  doc.setFontSize(10);
  for (const f of fields) {
    doc.text(`${f}`, M, y);
    doc.setDrawColor(150, 150, 150);
    doc.setLineWidth(0.2);
    doc.line(M + 70, y + 0.5, 210 - M, y + 0.5);
    y += f === "Ringkasan Tuntutan" ? 22 : 9;
  }
  y = paragraph(
    doc,
    "Dengan ini saya mengajukan permohonan penyelesaian perselisihan melalui arbitrase BAKTI dan menyatakan bahwa data yang saya isi adalah benar. " +
      "Saya bersedia mengikuti peraturan dan prosedur arbitrase BAKTI.",
    y + 4,
    9
  );
  y += 10;
  doc.setFontSize(10);
  doc.text("Tempat, Tanggal: ____________________", M, y);
  doc.text("Tanda Tangan Pemohon", 210 - M - 50, y);
  doc.text("( ______________________ )", 210 - M - 55, y + 25);
  doc.save(`Formulir-Registrasi-BAKTI-${c.ticket}.pdf`);
}

/** Surat pengantar resmi Bappebti untuk pendaftaran gugatan ke Pengadilan Negeri. */
export async function downloadCourtCoverLetter(c: ComplaintCase, failedAt: string, windowDays: number) {
  const doc = await newDoc();
  header(doc, "SURAT PENGANTAR", "Badan Pengawas Perdagangan Berjangka Komoditi (Bappebti) — Layanan Pengaduan");
  const issued = formatWIB(new Date());
  let y = 42;
  doc.setFontSize(10);
  doc.text(`Nomor  : SP-PN/${c.ticket}/${new Date().getFullYear()}`, M, y);
  doc.text(`Tanggal: ${issued} WIB`, 210 - M, y, { align: "right" });
  y += 6;
  doc.text("Perihal: Pengantar Pendaftaran Gugatan ke Pengadilan Negeri", M, y);
  y += 10;
  doc.text("Kepada Yth.", M, y);
  doc.text("Ketua Pengadilan Negeri", M, y + 5);
  doc.text("di Tempat", M, y + 10);
  y += 20;
  y = paragraph(
    doc,
    `Bersama ini Bappebti menerangkan bahwa pengaduan dengan nomor tiket ${c.ticket} atas nama ${c.reporterName} terhadap ${c.platform} ` +
      `telah melalui tahap musyawarah/mediasi dan berakhir Tidak Sepakat pada ${formatWIB(new Date(failedAt))} WIB.`,
    y
  );
  y = paragraph(
    doc,
    `Sampai dengan berakhirnya jangka waktu ${windowDays} hari kerja, pengadu tidak mendaftarkan penyelesaian melalui arbitrase BAKTI. ` +
      "Dengan demikian status pengaduan dinyatakan Selesai Non-Arbitrase, dan pengadu dapat menempuh penyelesaian melalui gugatan ke Pengadilan Negeri.",
    y + 2
  );
  y = paragraph(doc, `Pokok pengaduan: ${c.title}.`, y + 2);
  y = paragraph(doc, "Demikian surat pengantar ini dibuat untuk dipergunakan sebagaimana mestinya.", y + 4);
  y += 12;
  doc.text("Badan Pengawas Perdagangan Berjangka Komoditi", 210 - M, y, { align: "right" });
  doc.text("( Dokumen elektronik — sah tanpa tanda tangan basah )", 210 - M, y + 22, { align: "right" });
  doc.save(`Surat-Pengantar-Pengadilan-Negeri-${c.ticket}.pdf`);
}
