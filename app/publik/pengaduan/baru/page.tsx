"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { StatusBadge } from "@/components/shared/badges";
import { FileUploader } from "@/components/shared/file-uploader";
import { useToast } from "@/components/shared/toast-provider";
import { CATEGORY_LIST, PLATFORM_LIST, PROVINCE_LIST } from "@/lib/mock-data";
import { getPialangOfficials } from "@/lib/pialang-profiles";
import { useBusinessParams } from "@/lib/mock-service/params-store";
import { useClock } from "@/lib/clock";
import { PialangOfficial } from "@/lib/types";
import { usePublikAuth } from "@/lib/publik-auth";
import {
  CheckCircle2,
  ChevronRight,
  Info,
  FileText,
  Plus,
  Trash2,
} from "lucide-react";

const MAX_KRONOLOGI_BYTES = 5 * 1024 * 1024;
const OFFICIAL_POSITIONS: PialangOfficial["position"][] = ["Direksi", "Kepala Cabang", "Wakil Pialang Berjangka (WPB)"];

interface SupportingDoc {
  id: string;
  file: string;
  label: string;
}

type ServiceType = "resmi" | "kritik" | "panduan" | null;

const STEP_LABELS = [
  "Jenis Layanan",
  "Identitas Pelapor",
  "Detail Pengaduan",
  "Bukti Pendukung",
  "Tinjau Data",
  "Status / Tiket",
];

interface FormData {
  // step 2
  nama: string;
  noIdentitas: string;
  email: string;
  noHp: string;
  provinsi: string;
  kota: string;
  // step 3
  judul: string;
  platform: string;
  kategori: string;
  subkategori: string;
  tanggalKejadian: string;
  nilaiTransaksi: string;
  nomorTransaksi: string;
  platformUserId: string;
  kronologi: string;
  permintaan: string;
  /** Pihak terlapor (orang) dari data kepengurusan hasil profiling Pialang. */
  terlaporJabatan: string;
  terlaporNama: string;
}

const INITIAL_FORM: FormData = {
  nama: "",
  noIdentitas: "",
  email: "",
  noHp: "",
  provinsi: "",
  kota: "",
  judul: "",
  platform: "",
  kategori: "",
  subkategori: "",
  tanggalKejadian: "",
  nilaiTransaksi: "",
  nomorTransaksi: "",
  platformUserId: "",
  kronologi: "",
  permintaan: "",
  terlaporJabatan: "",
  terlaporNama: "",
};

const PANDUAN_EXAMPLES = [
  {
    case: "Dana penarikan (withdrawal) belum cair lebih dari 3 hari kerja",
    channel: "Pengaduan Resmi",
  },
  {
    case: "Transaksi mencurigakan / tidak dikenali pada akun Anda",
    channel: "Pengaduan Resmi",
  },
  {
    case: "Saldo aset tidak sesuai setelah proses settlement / kliring",
    channel: "Pengaduan Resmi",
  },
  {
    case: "Dugaan penipuan atau penawaran investasi ilegal mengatasnamakan pialang",
    channel: "Pengaduan Resmi",
  },
  {
    case: "Saran perbaikan tampilan aplikasi atau fitur baru",
    channel: "Kritik & Saran",
  },
  {
    case: "Masukan terhadap kualitas layanan pelanggan secara umum",
    channel: "Kritik & Saran",
  },
  {
    case: "Pertanyaan umum mengenai prosedur, tanpa kasus spesifik",
    channel: "Kritik & Saran",
  },
];

export default function BuatPengaduanPage() {
  const { showToast } = useToast();
  const { account } = usePublikAuth();
  const [step, setStep] = useState(1);
  const [serviceType, setServiceType] = useState<ServiceType>(null);
  const [form, setForm] = useState<FormData>(() =>
    account
      ? {
          ...INITIAL_FORM,
          nama: account.nama,
          noIdentitas: account.nomorIdentitas,
          email: account.email,
          noHp: account.hp,
          provinsi: account.provinsi,
          kota: account.kota,
        }
      : INITIAL_FORM
  );
  const [agree, setAgree] = useState(false);
  const [agreeRegulation, setAgreeRegulation] = useState(false);
  const [agreeMateriil, setAgreeMateriil] = useState(false);
  const params = useBusinessParams();
  const now = useClock();
  // Kronologi: ketik narasi atau unggah dokumen (PDF/DOC/JPG maks. 5MB).
  // Pialang opsional: bila belum diketahui, tiket masuk antrean triase Bappebti (List Revisi 13 #6).
  const [pialangUnknown, setPialangUnknown] = useState(false);
  const [kronologiMode, setKronologiMode] = useState<"teks" | "file">("teks");
  const [kronologiFile, setKronologiFile] = useState("");
  const [kronologiFileError, setKronologiFileError] = useState("");
  // Dokumen bukti: KTP otomatis dari akun, Bukti Setor wajib, dokumen lain berlabel.
  const [buktiSetor, setBuktiSetor] = useState<string[]>([]);
  const [supportingDocs, setSupportingDocs] = useState<SupportingDoc[]>([]);

  // Identitas Pelapor is auto-filled from the reporter's registration data
  // once the account has loaded from localStorage.
  useEffect(() => {
    if (!account) return;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-time sync once the registered account loads from localStorage
    setForm((prev) => ({
      ...prev,
      nama: prev.nama || account.nama,
      noIdentitas: prev.noIdentitas || account.nomorIdentitas,
      email: prev.email || account.email,
      noHp: prev.noHp || account.hp,
      provinsi: prev.provinsi || account.provinsi,
      kota: prev.kota || account.kota,
    }));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-sync when the account identity changes
  }, [account?.email]);

  // feedback (Kritik & Saran) state
  const [feedbackTopic, setFeedbackTopic] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackSubmitted, setFeedbackSubmitted] = useState(false);

  function update<K extends keyof FormData>(key: K, value: FormData[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function resetWizard() {
    setStep(1);
    setServiceType(null);
    setForm(
      account
        ? {
            ...INITIAL_FORM,
            nama: account.nama,
            noIdentitas: account.nomorIdentitas,
            email: account.email,
            noHp: account.hp,
            provinsi: account.provinsi,
            kota: account.kota,
          }
        : INITIAL_FORM
    );
    setAgree(false);
    setAgreeRegulation(false);
    setAgreeMateriil(false);
    setPialangUnknown(false);
    setKronologiMode("teks");
    setKronologiFile("");
    setKronologiFileError("");
    setBuktiSetor([]);
    setSupportingDocs([]);
    setFeedbackTopic("");
    setFeedbackMessage("");
    setFeedbackSubmitted(false);
  }

  function handleSelectService(type: ServiceType) {
    setServiceType(type);
    if (type === "resmi") {
      setStep(2);
    }
    // kritik & panduan stay on step 1 and render their own branch
  }

  const officials = getPialangOfficials(form.platform);
  // KTP dari profil akun (diunggah saat registrasi).
  const ktpFile = account?.ktpFile?.name ?? `KTP_${(form.nama || "Pelapor").replace(/\s+/g, "_")}.jpg`;
  const incidentAgeDays = form.tanggalKejadian && now
    ? Math.floor((now.getTime() - new Date(`${form.tanggalKejadian}T00:00:00+07:00`).getTime()) / 86_400_000)
    : 0;
  const incidentExpired = !!form.tanggalKejadian && incidentAgeDays > params.kedaluwarsaDays;
  const incidentInFuture = !!form.tanggalKejadian && incidentAgeDays < 0;
  const kronologiOk = kronologiMode === "teks" ? !!form.kronologi.trim() : !!kronologiFile;
  const step3Valid = !!form.tanggalKejadian && !incidentExpired && !incidentInFuture && kronologiOk;
  const step4Valid = buktiSetor.length > 0 && supportingDocs.every((d) => !d.file || d.label.trim());
  const consentOk = agree && agreeRegulation && agreeMateriil;
  const allEvidence = [`${ktpFile} (KTP)`, ...buktiSetor.map((f) => `${f} (Bukti Setor)`), ...supportingDocs.filter((d) => d.file).map((d) => `${d.file} (${d.label.trim()})`)];

  function handleKronologiFile(file: File | undefined) {
    if (!file) return;
    const okType = /\.(pdf|docx?|jpe?g)$/i.test(file.name);
    if (!okType) {
      setKronologiFile("");
      setKronologiFileError("Format harus PDF, DOC/DOCX, atau JPG.");
      return;
    }
    if (file.size > MAX_KRONOLOGI_BYTES) {
      setKronologiFile("");
      setKronologiFileError("Ukuran berkas melebihi 5MB.");
      return;
    }
    setKronologiFileError("");
    setKronologiFile(file.name);
  }

  function handleSubmitComplaint() {
    if (!consentOk) return;
    setStep(6);
    showToast("Pengaduan Anda telah diterima dan tiket telah diterbitkan.");
  }

  function handleSubmitFeedback() {
    if (!feedbackTopic.trim() || !feedbackMessage.trim()) return;
    setFeedbackSubmitted(true);
    showToast("Masukan Anda telah diterima, terima kasih.");
  }

  const isFormalWizard = serviceType === "resmi" && step >= 2;

  return (
    <div>
      <PageHeader
        title="Buat Pengaduan"
        description="Ajukan pengaduan resmi, sampaikan kritik & saran, atau cari panduan kanal yang tepat."
      />

      {/* Progress indicator - only show for formal wizard */}
      {isFormalWizard && (
        <div className="mb-6">
          <ol className="flex items-center w-full">
            {STEP_LABELS.map((label, idx) => {
              const num = idx + 1;
              const isActive = step === num;
              const isDone = step > num;
              return (
                <li key={label} className="flex-1 flex items-center last:flex-none">
                  <div className="flex flex-col items-center gap-1 min-w-[64px]">
                    <div
                      className={`flex items-center justify-center size-6 rounded-full text-[11px] font-semibold border ${
                        isDone
                          ? "bg-navy text-white border-navy"
                          : isActive
                          ? "bg-white text-navy border-navy"
                          : "bg-white text-muted border-border"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="size-3.5" /> : num}
                    </div>
                    <span
                      className={`text-[10px] text-center leading-tight ${
                        isActive ? "text-navy font-semibold" : "text-muted"
                      }`}
                    >
                      {label}
                    </span>
                  </div>
                  {num < STEP_LABELS.length && (
                    <div
                      className={`h-px flex-1 mx-1 ${
                        step > num ? "bg-navy" : "bg-border"
                      }`}
                    />
                  )}
                </li>
              );
            })}
          </ol>
        </div>
      )}

      {/* STEP 1: choose service type */}
      {step === 1 && serviceType === null && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Pengaduan Resmi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted">
                Nomor tiket, verifikasi, SLA, dan tindak lanjut pialang.
              </p>
              <Button size="sm" onClick={() => handleSelectService("resmi")}>
                Pilih Layanan
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Kritik &amp; Saran</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted">
                Masukan umum tanpa penanganan kasus formal.
              </p>
              <Button size="sm" variant="secondary" onClick={() => handleSelectService("kritik")}>
                Pilih Layanan
              </Button>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Panduan Memilih</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <p className="text-xs text-muted">
                Contoh kasus dan kanal yang tepat.
              </p>
              <Button size="sm" variant="secondary" onClick={() => handleSelectService("panduan")}>
                Pilih Layanan
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* PANDUAN MEMILIH branch */}
      {step === 1 && serviceType === "panduan" && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Info className="size-4 text-navy" />
              Panduan Memilih Kanal yang Tepat
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted mb-3">
              Berikut beberapa contoh kasus dan kanal pelaporan yang sesuai:
            </p>
            <ul className="flex flex-col gap-2 mb-4">
              {PANDUAN_EXAMPLES.map((ex, idx) => (
                <li
                  key={idx}
                  className="flex flex-wrap items-center gap-2 rounded-md border border-border p-2.5 text-xs"
                >
                  <span className="flex-1">{ex.case}</span>
                  <ChevronRight className="size-3.5 text-muted shrink-0" />
                  <span className="font-semibold text-navy whitespace-nowrap">{ex.channel}</span>
                </li>
              ))}
            </ul>
            <Button size="sm" variant="secondary" onClick={() => setServiceType(null)}>
              Kembali ke Pilihan Layanan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* KRITIK & SARAN branch */}
      {step === 1 && serviceType === "kritik" && !feedbackSubmitted && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Kritik &amp; Saran</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <Label htmlFor="topik">Topik</Label>
              <Input
                id="topik"
                placeholder="Contoh: Alur registrasi, Notifikasi status, dll."
                value={feedbackTopic}
                onChange={(e) => setFeedbackTopic(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="pesan">Pesan</Label>
              <Textarea
                id="pesan"
                placeholder="Tuliskan kritik atau saran Anda..."
                value={feedbackMessage}
                onChange={(e) => setFeedbackMessage(e.target.value)}
                className="min-h-[120px]"
              />
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" variant="secondary" onClick={() => setServiceType(null)}>
                Kembali
              </Button>
              <Button size="sm" onClick={handleSubmitFeedback}>
                Kirim Masukan
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 1 && serviceType === "kritik" && feedbackSubmitted && (
        <Card className="max-w-2xl">
          <CardContent className="py-10 flex flex-col items-center text-center gap-3">
            <CheckCircle2 className="size-12 text-green" />
            <h2 className="text-base font-semibold text-navy">
              Masukan Anda telah diterima, terima kasih.
            </h2>
            <p className="text-xs text-muted max-w-md">
              Tim kami akan meninjau masukan Anda untuk perbaikan layanan ke depan.
            </p>
            <Button size="sm" variant="secondary" onClick={resetWizard}>
              Kembali ke Pilihan Layanan
            </Button>
          </CardContent>
        </Card>
      )}

      {/* STEP 2: Identitas Pelapor */}
      {step === 2 && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle>Identitas Pelapor</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nama">Nama lengkap</Label>
                  <Input id="nama" value={form.nama} onChange={(e) => update("nama", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="noIdentitas">Nomor identitas (KTP/Paspor)</Label>
                  <Input
                    id="noIdentitas"
                    value={form.noIdentitas}
                    onChange={(e) => update("noIdentitas", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email aktif</Label>
                  <Input
                    id="email"
                    type="email"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="noHp">Nomor HP/WhatsApp</Label>
                  <Input id="noHp" value={form.noHp} onChange={(e) => update("noHp", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="provinsi">Provinsi domisili</Label>
                  <Select
                    id="provinsi"
                    value={form.provinsi}
                    onChange={(e) => update("provinsi", e.target.value)}
                  >
                    <option value="">Pilih provinsi</option>
                    {PROVINCE_LIST.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="kota">Kota/Kabupaten</Label>
                  <Input id="kota" value={form.kota} onChange={(e) => update("kota", e.target.value)} />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Catatan Penting</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="flex flex-col gap-2 text-xs text-muted">
                <li className="flex gap-2">
                  <span className="text-navy">&bull;</span>
                  Gunakan data yang valid.
                </li>
                <li className="flex gap-2">
                  <span className="text-navy">&bull;</span>
                  Jangan memasukkan password, PIN, atau informasi rahasia lain.
                </li>
                <li className="flex gap-2">
                  <span className="text-navy">&bull;</span>
                  Nomor akun transaksi membantu verifikasi.
                </li>
                <li className="flex gap-2">
                  <span className="text-navy">&bull;</span>
                  Bukti pendukung mempercepat proses.
                </li>
                <li className="flex gap-2">
                  <span className="text-navy">&bull;</span>
                  Setiap status akan tercatat.
                </li>
              </ul>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 3: Detail Pengaduan */}
      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Detail Pengaduan</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="sm:col-span-2">
                <Label htmlFor="judul">Judul pengaduan</Label>
                <Input id="judul" value={form.judul} onChange={(e) => update("judul", e.target.value)} />
              </div>
              <div>
                <Label htmlFor="pialang">Pialang terkait (opsional)</Label>
                <Select
                  id="pialang"
                  disabled={pialangUnknown}
                  value={form.platform}
                  onChange={(e) => setForm((prev) => ({ ...prev, platform: e.target.value, terlaporJabatan: "", terlaporNama: "" }))}
                >
                  <option value="">Pilih pialang</option>
                  {PLATFORM_LIST.map((p) => (
                    <option key={p} value={p}>
                      {p}
                    </option>
                  ))}
                </Select>
                <label className="mt-1.5 flex items-center gap-2 text-xs cursor-pointer">
                  <Checkbox
                    id="pialang-unknown"
                    checked={pialangUnknown}
                    onCheckedChange={(v) => {
                      const on = v === true;
                      setPialangUnknown(on);
                      if (on) setForm((prev) => ({ ...prev, platform: "", terlaporJabatan: "", terlaporNama: "" }));
                    }}
                  />
                  Belum mengetahui nama Pialang
                </label>
                {pialangUnknown && (
                  <p className="text-[11px] text-muted mt-1">Pengaduan akan masuk antrean triase Bappebti untuk dianalisis dan diteruskan ke Pialang terkait.</p>
                )}
              </div>
              {form.platform && (
                <div className="sm:col-span-2 rounded-md border border-border bg-muted-bg/40 p-3">
                  <p className="text-xs font-semibold text-navy mb-0.5">Pihak yang Diadukan</p>
                  <p className="text-[11px] text-muted mb-2">
                    Pilih jabatan dan nama orang yang diadukan berdasarkan data kepengurusan hasil profiling Bappebti atas {form.platform} (data simulasi).
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <Label htmlFor="terlaporJabatan">Jabatan</Label>
                      <Select
                        id="terlaporJabatan"
                        value={form.terlaporJabatan}
                        onChange={(e) => setForm((prev) => ({ ...prev, terlaporJabatan: e.target.value, terlaporNama: "" }))}
                      >
                        <option value="">Tidak spesifik / lembaga Pialang</option>
                        {OFFICIAL_POSITIONS.map((p) => (
                          <option key={p} value={p}>
                            {p}
                          </option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="terlaporNama">Nama orang yang diadukan</Label>
                      <Select
                        id="terlaporNama"
                        value={form.terlaporNama}
                        disabled={!form.terlaporJabatan}
                        onChange={(e) => update("terlaporNama", e.target.value)}
                      >
                        <option value="">{form.terlaporJabatan ? "Pilih nama" : "Pilih jabatan terlebih dahulu"}</option>
                        {officials
                          .filter((o) => o.position === form.terlaporJabatan)
                          .map((o) => (
                            <option key={o.id} value={o.name}>
                              {o.name} — {o.office} ({o.licenseNumber})
                            </option>
                          ))}
                      </Select>
                    </div>
                  </div>
                </div>
              )}
              <div>
                <Label htmlFor="kategori">Kategori pengaduan</Label>
                <Select id="kategori" value={form.kategori} onChange={(e) => update("kategori", e.target.value)}>
                  <option value="">Pilih kategori</option>
                  {CATEGORY_LIST.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="subkategori">Subkategori</Label>
                <Input
                  id="subkategori"
                  value={form.subkategori}
                  onChange={(e) => update("subkategori", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="tanggalKejadian">Tanggal kejadian *</Label>
                <Input
                  id="tanggalKejadian"
                  type="date"
                  value={form.tanggalKejadian}
                  onChange={(e) => update("tanggalKejadian", e.target.value)}
                />
                {incidentExpired && (
                  <p className="text-[11px] text-red mt-1">
                    Perkara telah kedaluwarsa: melewati batas {params.kedaluwarsaDays} hari sejak tanggal kejadian, sehingga tidak dapat diajukan.
                  </p>
                )}
                {incidentInFuture && <p className="text-[11px] text-red mt-1">Tanggal kejadian tidak boleh di masa depan.</p>}
              </div>
              <div>
                <Label htmlFor="nilaiTransaksi">Nilai transaksi (opsional)</Label>
                <Input
                  id="nilaiTransaksi"
                  type="number"
                  placeholder="0"
                  value={form.nilaiTransaksi}
                  onChange={(e) => update("nilaiTransaksi", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="nomorTransaksi">Nomor Akun Transaksi (Opsional)</Label>
                <Input
                  id="nomorTransaksi"
                  value={form.nomorTransaksi}
                  onChange={(e) => update("nomorTransaksi", e.target.value)}
                />
              </div>
              <div>
                <Label htmlFor="platformUserId">Pialang User ID (Opsional)</Label>
                <Input
                  id="platformUserId"
                  value={form.platformUserId}
                  onChange={(e) => update("platformUserId", e.target.value)}
                />
              </div>
              <div className="sm:col-span-2">
                <Label>Kronologi perkara *</Label>
                <div className="flex flex-wrap gap-4 text-xs mb-2">
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="kronologi-mode" checked={kronologiMode === "teks"} onChange={() => setKronologiMode("teks")} />
                    Ketik narasi langsung
                  </label>
                  <label className="flex items-center gap-1.5 cursor-pointer">
                    <input type="radio" name="kronologi-mode" checked={kronologiMode === "file"} onChange={() => setKronologiMode("file")} />
                    Unggah dokumen (PDF, DOC, atau JPG maks. 5MB)
                  </label>
                </div>
                {kronologiMode === "teks" ? (
                  <Textarea
                    id="kronologi"
                    className="min-h-[100px]"
                    placeholder="Ceritakan kronologi kejadian secara runtut..."
                    value={form.kronologi}
                    onChange={(e) => update("kronologi", e.target.value)}
                  />
                ) : (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id="kronologi-file"
                      type="file"
                      accept=".pdf,.doc,.docx,.jpg,.jpeg"
                      className="hidden"
                      onChange={(e) => handleKronologiFile(e.target.files?.[0])}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById("kronologi-file")?.click()}>
                      <FileText className="size-3.5" /> {kronologiFile ? "Ganti Dokumen" : "Pilih Dokumen Kronologi"}
                    </Button>
                    {kronologiFile && <span className="text-xs text-foreground/80">{kronologiFile}</span>}
                    {kronologiFileError && <span className="text-xs text-red">{kronologiFileError}</span>}
                  </div>
                )}
              </div>
              <div className="sm:col-span-2">
                <Label htmlFor="permintaan">Permintaan pelapor / resolusi yang diharapkan</Label>
                <Textarea
                  id="permintaan"
                  className="min-h-[100px]"
                  value={form.permintaan}
                  onChange={(e) => update("permintaan", e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 4: Bukti Pendukung */}
      {step === 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Dokumen Bukti</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <p className="text-xs font-semibold text-navy mb-1">Dokumen Wajib</p>
              <div className="rounded-md border border-border p-2.5 text-xs flex items-center gap-2">
                <CheckCircle2 className="size-4 text-green shrink-0" />
                <span className="font-medium">KTP</span>
                <span className="text-muted">— {ktpFile} (terisi otomatis dari profil akun — diunggah saat registrasi)</span>
              </div>
            </div>
            <div>
              <Label>Bukti Setor *</Label>
              <FileUploader files={buktiSetor} onChange={setBuktiSetor} multiple={false} maxFiles={1} label="Unggah bukti setor dana (PDF/JPG/PNG)" />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-xs font-semibold text-navy">Dokumen Pendukung Lain (opsional)</p>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => setSupportingDocs((prev) => [...prev, { id: `DOC-${Date.now().toString(36)}`, file: "", label: "" }])}
                >
                  <Plus className="size-3.5" /> Tambah Dokumen
                </Button>
              </div>
              {supportingDocs.length === 0 && <p className="text-[11px] text-muted">Belum ada dokumen pendukung tambahan.</p>}
              <div className="flex flex-col gap-2">
                {supportingDocs.map((d) => (
                  <div key={d.id} className="rounded-md border border-border p-2.5 flex flex-col gap-2">
                    <div className="flex items-center gap-2">
                      <input
                        id={`doc-${d.id}`}
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const name = e.target.files?.[0]?.name ?? "";
                          setSupportingDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, file: name } : x)));
                        }}
                      />
                      <Button type="button" size="sm" variant="secondary" onClick={() => document.getElementById(`doc-${d.id}`)?.click()}>
                        {d.file ? "Ganti File" : "Pilih File"}
                      </Button>
                      <span className="text-xs truncate flex-1">{d.file || "Belum ada file"}</span>
                      <button
                        type="button"
                        title="Hapus"
                        onClick={() => setSupportingDocs((prev) => prev.filter((x) => x.id !== d.id))}
                        className="text-muted hover:text-red"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    {d.file && (
                      <div>
                        <Label className="text-[11px]">Nama / label berkas *</Label>
                        <Input
                          placeholder="Contoh: Riwayat percakapan CS, Rekening koran"
                          value={d.label}
                          onChange={(e) => setSupportingDocs((prev) => prev.map((x) => (x.id === d.id ? { ...x, label: e.target.value } : x)))}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
              <p className="text-[11px] text-muted mt-2">Bukti susulan tetap dapat diunggah setelah tiket terbit melalui tab Bukti pada detail pengaduan.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* STEP 5: Tinjau Data */}
      {step === 5 && (
        <div className="flex flex-col gap-4">
          <Card>
            <CardHeader>
              <CardTitle>Ringkasan Pengaduan</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div className="sm:col-span-2">
                  <dt className="text-muted">Judul pengaduan</dt>
                  <dd className="font-medium">{form.judul || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Pialang terkait</dt>
                  <dd className="font-medium">{form.platform || (pialangUnknown ? "Belum diketahui — triase Bappebti" : "-")}</dd>
                </div>
                <div>
                  <dt className="text-muted">Pihak yang diadukan</dt>
                  <dd className="font-medium">{form.terlaporNama ? `${form.terlaporJabatan}: ${form.terlaporNama}` : "Tidak spesifik"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Kategori / Subkategori</dt>
                  <dd className="font-medium">
                    {form.kategori || "-"} / {form.subkategori || "-"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Nomor Akun Transaksi</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <dt className="text-muted">Pialang User ID</dt>
                  <dd className="font-medium">{form.platformUserId || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Nomor Akun Transaksi</dt>
                  <dd className="font-medium">{form.nomorTransaksi || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Tanggal kejadian</dt>
                  <dd className="font-medium">{form.tanggalKejadian || "-"}</dd>
                </div>
                <div>
                  <dt className="text-muted">Nilai transaksi (opsional)</dt>
                  <dd className="font-medium">
                    {form.nilaiTransaksi
                      ? "Rp" + Number(form.nilaiTransaksi).toLocaleString("id-ID")
                      : "-"}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Kronologi &amp; Permintaan</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-3 text-xs">
                <div>
                  <p className="text-muted mb-1">Ringkasan kronologi</p>
                  <p className="text-foreground/80">{kronologiMode === "teks" ? form.kronologi || "-" : `Dokumen terlampir: ${kronologiFile || "-"}`}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Permintaan pelapor</p>
                  <p className="text-foreground/80">{form.permintaan || "-"}</p>
                </div>
                <div>
                  <p className="text-muted mb-1">Bukti terlampir</p>
                  {allEvidence.length === 0 ? (
                    <p className="text-foreground/80">Tidak ada bukti terlampir.</p>
                  ) : (
                    <ul className="flex flex-col gap-1">
                      {allEvidence.map((file) => (
                        <li key={file} className="flex items-center gap-2">
                          <CheckCircle2 className="size-3.5 text-green shrink-0" />
                          <span>{file}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Routing Awal</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs mb-3">
                <div>
                  <dt className="text-muted">Kanal</dt>
                  <dd className="font-medium">BAPPEBTI PORTAL</dd>
                </div>
                <div>
                  <dt className="text-muted">Estimasi current owner awal</dt>
                  <dd className="font-medium">Verifikasi Sistem</dd>
                </div>
              </dl>
              <div>
                <p className="text-muted mb-2">Potensi routing</p>
                <div className="flex items-center gap-2 flex-wrap text-xs font-medium">
                  <span className="rounded-md border border-border bg-muted-bg px-2.5 py-1.5">Pialang</span>
                  <ChevronRight className="size-4 text-muted" />
                  <span className="rounded-md border border-border bg-muted-bg px-2.5 py-1.5">Bursa / Kliring</span>
                  <ChevronRight className="size-4 text-muted" />
                  <span className="rounded-md border border-navy/20 bg-navy/10 text-navy px-2.5 py-1.5">Bappebti</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Persetujuan Regulasi</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-2.5 py-3">
              <div className="flex items-start gap-2">
                <Checkbox id="agree" checked={agree} onCheckedChange={(v) => setAgree(v === true)} className="mt-0.5" />
                <Label htmlFor="agree" className="mb-0 cursor-pointer">
                  Saya menyatakan informasi dan bukti yang disampaikan benar dan dapat dipertanggungjawabkan.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="agree-regulation" checked={agreeRegulation} onCheckedChange={(v) => setAgreeRegulation(v === true)} className="mt-0.5" />
                <Label htmlFor="agree-regulation" className="mb-0 cursor-pointer">
                  Saya setuju untuk mengikuti peraturan Bappebti yang berlaku terkait mekanisme penanganan pengaduan dan penyelesaian perselisihan.
                </Label>
              </div>
              <div className="flex items-start gap-2">
                <Checkbox id="agree-materiil" checked={agreeMateriil} onCheckedChange={(v) => setAgreeMateriil(v === true)} className="mt-0.5" />
                <Label htmlFor="agree-materiil" className="mb-0 cursor-pointer">
                  Saya memahami bahwa laporan dapat ditolak apabila tidak memenuhi syarat materiil.
                </Label>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* STEP 6: Submission Success */}
      {step === 6 && (
        <Card className="max-w-2xl">
          <CardContent className="py-10 flex flex-col items-center text-center gap-4">
            <CheckCircle2 className="size-14 text-green" />
            <div>
              <h2 className="text-base font-semibold text-navy">Pengaduan Anda telah diterima</h2>
              <p className="text-xs text-muted mt-1">
                Simpan nomor tiket ini untuk melacak status pengaduan Anda.
              </p>
              {!form.platform && (
                <p className="text-xs text-navy mt-1">Pialang belum diisi — tiket masuk antrean triase Bappebti untuk diteruskan ke Pialang terkait.</p>
              )}
            </div>

            <div className="text-2xl font-bold text-navy tracking-wide">BPP-2026-000201</div>

            <dl className="grid grid-cols-2 gap-4 text-xs w-full max-w-md text-left">
              <div>
                <dt className="text-muted mb-1">Status</dt>
                <dd>
                  <StatusBadge status="Baru" />
                </dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Current owner</dt>
                <dd className="font-medium">Sistem Verifikasi</dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Tanggal pengajuan</dt>
                <dd className="font-medium">15 Jun 2026, 14:35</dd>
              </div>
              <div>
                <dt className="text-muted mb-1">Estimasi respon pertama</dt>
                <dd className="font-medium">1 x 24 jam</dd>
              </div>
            </dl>

            <Separator className="my-2" />

            <div className="flex flex-wrap items-center justify-center gap-2">
              <Link href="/publik/pengaduan/BPP-2026-000184">
                <Button size="sm">Lihat Detail Kasus</Button>
              </Link>
              <Link href="/publik/dashboard">
                <Button size="sm" variant="secondary">
                  Kembali ke Dashboard
                </Button>
              </Link>
              <Button size="sm" variant="outline" onClick={resetWizard}>
                Buat Pengaduan Lain
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation buttons for formal wizard steps 2-5 */}
      {isFormalWizard && step >= 2 && step <= 5 && (
        <div className="mt-4 flex items-center justify-between">
          <Button variant="secondary" size="sm" onClick={() => setStep((s) => Math.max(2, s - 1))} disabled={step === 2}>
            Kembali
          </Button>
          {step < 5 ? (
            <Button
              size="sm"
              disabled={(step === 3 && !step3Valid) || (step === 4 && !step4Valid)}
              onClick={() => setStep((s) => Math.min(5, s + 1))}
            >
              Lanjutkan
            </Button>
          ) : (
            <Button size="sm" disabled={!consentOk} onClick={handleSubmitComplaint}>
              Kirim Pengaduan
            </Button>
          )}
        </div>
      )}

      {/* Allow going back to step 1 from step 2 fully */}
      {isFormalWizard && step === 2 && (
        <div className="mt-2 text-right">
          <button
            type="button"
            className="text-[11px] text-muted hover:text-navy underline"
            onClick={() => {
              setServiceType(null);
              setStep(1);
            }}
          >
            Batalkan dan pilih jenis layanan lain
          </button>
        </div>
      )}
    </div>
  );
}
