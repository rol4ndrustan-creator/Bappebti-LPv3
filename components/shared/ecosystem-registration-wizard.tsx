"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { PROVINCE_LIST, BURSA_LIST, KLIRING_LIST } from "@/lib/mock-data";
import { getPialangOfficials } from "@/lib/pialang-profiles";
import {
  EcosystemAccessRole,
  EcosystemCategoryConfig,
  EcosystemEntity,
  EcosystemExecutive,
  EcosystemPic,
  EcosystemType,
  PlatformBoardMember,
  PlatformMembershipLetter,
  PialangOfficial,
} from "@/lib/types";
import { Upload, Plus, Trash2, X, Check, DatabaseZap } from "lucide-react";
import { cn } from "@/lib/utils";

const STEPS = [
  "Klasifikasi Ecosystem",
  "Identitas Badan Hukum / Instansi",
  "Data Pengurus / Pimpinan",
  "Data PIC Sistem",
  "Upload Dokumen",
  "Pernyataan dan Pengajuan",
];

const STRUKTUR_STEP = "Struktur Organisasi";
const ADMIN_STEP = "Administrator & Tata Kelola";
const OFFICIAL_POSITIONS: PialangOfficial["position"][] = ["Direksi", "Kepala Cabang", "Wakil Pialang Berjangka (WPB)"];

const ACCESS_ROLES: EcosystemAccessRole[] = ["Admin Ecosystem", "Petugas Pengaduan", "Penyetuju", "Pemantau"];

function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

function FileField({
  label,
  value,
  onChange,
  required,
}: {
  label: string;
  value?: string;
  onChange: (name: string) => void;
  required?: boolean;
}) {
  const inputId = React.useId();
  return (
    <div>
      <Label htmlFor={inputId}>
        {label}
        {required && <span className="text-red"> *</span>}
      </Label>
      <div className="flex items-center gap-2">
        <input
          id={inputId}
          type="file"
          className="hidden"
          onChange={(e) => onChange(e.target.files?.[0]?.name ?? "")}
        />
        <Button type="button" variant="outline" size="sm" onClick={() => document.getElementById(inputId)?.click()}>
          <Upload className="size-3.5" /> {value ? "Ganti File" : "Pilih File"}
        </Button>
        {value && <span className="text-xs text-muted truncate max-w-[220px]">{value}</span>}
      </div>
    </div>
  );
}

export interface EcosystemWizardValues extends Partial<EcosystemEntity> {
  executives: EcosystemExecutive[];
  pics: EcosystemPic[];
  declarationTruth?: boolean;
  declarationAuthority?: boolean;
  declarationTerms?: boolean;
}

function emptyValues(platformMode?: boolean): EcosystemWizardValues {
  return {
    category: platformMode ? "Pialang" : "",
    ecosystemType: "Ecosystem Aktif",
    description: "",
    name: "",
    shortName: "",
    executives: [],
    pics: [],
    supportingDocuments: [],
    direksi: [],
    komisaris: [],
    suratAnggotaBursa: [],
    strukturOrganisasi: [],
  };
}

export function EcosystemRegistrationWizard({
  open,
  onClose,
  categories,
  initialValues,
  isEdit,
  platformMode,
  onSaveDraft,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  categories: EcosystemCategoryConfig[];
  initialValues?: EcosystemEntity;
  isEdit?: boolean;
  /** Platform Management's "Tambah Platform" flow: locks step 1 to Ecosystem Aktif / Platform/Pialang and appends a 7th governance step. */
  platformMode?: boolean;
  onSaveDraft: (values: EcosystemWizardValues) => void;
  onSubmit: (values: EcosystemWizardValues) => void;
}) {
  // The component unmounts whenever `open` is false (see the early return
  // below), so remounting it already gives these useState calls a fresh
  // initializer — no effect needed to "reset" state on open.
  const [step, setStep] = React.useState(0);
  const [values, setValues] = React.useState<EcosystemWizardValues>(
    initialValues
      ? {
          ...initialValues,
          executives: initialValues.executives ?? [],
          pics: initialValues.pics ?? [],
          direksi: initialValues.direksi ?? [],
          komisaris: initialValues.komisaris ?? [],
          suratAnggotaBursa: initialValues.suratAnggotaBursa ?? [],
          strukturOrganisasi: initialValues.strukturOrganisasi ?? [],
        }
      : emptyValues(platformMode)
  );

  if (!open) return null;

  // Onboarding Pialang: tahap ke-4 "Struktur Organisasi" (List Revisi 12 #1) + tahap tata kelola.
  const steps = platformMode ? [...STEPS.slice(0, 3), STRUKTUR_STEP, ...STEPS.slice(3), ADMIN_STEP] : STEPS;
  const stepName = steps[step];
  const activeCategories = categories.filter((c) => c.active);
  const categoriesForType = activeCategories.filter((c) => c.type === values.ecosystemType);

  function set<K extends keyof EcosystemWizardValues>(key: K, value: EcosystemWizardValues[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function addExecutive() {
    set("executives", [
      ...values.executives,
      { id: uid("EXE"), name: "", position: "", responsibilityArea: "", officialEmail: "", startDate: "" },
    ]);
  }
  function updateExecutive(id: string, patch: Partial<EcosystemExecutive>) {
    set("executives", values.executives.map((e) => (e.id === id ? { ...e, ...patch } : e)));
  }
  function removeExecutive(id: string) {
    set("executives", values.executives.filter((e) => e.id !== id));
  }

  function addPic() {
    set("pics", [
      ...values.pics,
      { id: uid("PIC"), name: "", position: "", unit: "", email: "", phone: "", accessRole: ACCESS_ROLES[0], isPrimary: values.pics.length === 0 },
    ]);
  }
  function updatePic(id: string, patch: Partial<EcosystemPic>) {
    set("pics", values.pics.map((p) => (p.id === id ? { ...p, ...patch } : p)));
  }
  function removePic(id: string) {
    set("pics", values.pics.filter((p) => p.id !== id));
  }

  function addBoardMember(key: "direksi" | "komisaris") {
    set(key, [...(values[key] ?? []), { id: uid(key === "direksi" ? "DIR" : "KOM"), name: "", birthDate: "", idNumber: "" }]);
  }
  function updateBoardMember(key: "direksi" | "komisaris", id: string, patch: Partial<PlatformBoardMember>) {
    set(key, (values[key] ?? []).map((m) => (m.id === id ? { ...m, ...patch } : m)));
  }
  function removeBoardMember(key: "direksi" | "komisaris", id: string) {
    set(key, (values[key] ?? []).filter((m) => m.id !== id));
  }

  const officials = values.strukturOrganisasi ?? [];
  function setOfficials(next: PialangOfficial[]) {
    set("strukturOrganisasi", next);
  }
  function pullFromProfiling() {
    setOfficials(getPialangOfficials(values.name ?? ""));
  }
  function addOfficial() {
    setOfficials([...officials, { id: uid("OFF"), position: "Wakil Pialang Berjangka (WPB)", name: "", licenseNumber: "", office: "" }]);
  }
  function updateOfficial(id: string, patch: Partial<PialangOfficial>) {
    setOfficials(officials.map((o) => (o.id === id ? { ...o, ...patch } : o)));
  }

  function addMembershipLetter() {
    set("suratAnggotaBursa", [...(values.suratAnggotaBursa ?? []), { id: uid("SAB"), file: "" }]);
  }
  function updateMembershipLetter(id: string, patch: Partial<PlatformMembershipLetter>) {
    set("suratAnggotaBursa", (values.suratAnggotaBursa ?? []).map((s) => (s.id === id ? { ...s, ...patch } : s)));
  }
  function removeMembershipLetter(id: string) {
    set("suratAnggotaBursa", (values.suratAnggotaBursa ?? []).filter((s) => s.id !== id));
  }

  // Minimal required-field checks per step so "Lanjut" stays guarded without being exhaustive.
  const baseValid = [
    platformMode ? !!values.description?.trim() : !!values.category && !!values.description?.trim(),
    !!values.name?.trim() && !!values.address?.trim() && !!values.province && !!values.city?.trim() && !!values.postalCode?.trim() && !!values.officePhone?.trim() && !!values.officialEmail?.trim(),
    values.executives.length > 0 && values.executives.every((e) => e.name.trim() && e.position.trim()),
    values.pics.length > 0 && values.pics.some((p) => p.isPrimary) && values.pics.every((p) => p.name.trim() && p.email.trim()),
    true,
    !!values.submitterName?.trim() &&
      !!values.submitterPosition?.trim() &&
      !!values.declarationTruth &&
      !!values.declarationAuthority &&
      !!values.declarationTerms,
    ...(platformMode
      ? [
          !!values.administratorEmail?.trim() &&
            !!values.administratorName?.trim() &&
            (values.direksi ?? []).length > 0 &&
            (values.direksi ?? []).every((d) => d.name.trim() && d.birthDate && d.idNumber.trim()) &&
            (values.komisaris ?? []).length > 0 &&
            (values.komisaris ?? []).every((d) => d.name.trim() && d.birthDate && d.idNumber.trim()),
        ]
      : []),
  ];

  const validByName: Record<string, boolean> = Object.fromEntries([...STEPS, ADMIN_STEP].map((n, i) => [n, baseValid[i] ?? true]));
  validByName[STRUKTUR_STEP] =
    officials.some((o) => o.position === "Direksi") &&
    officials.some((o) => o.position === "Wakil Pialang Berjangka (WPB)") &&
    officials.every((o) => o.name.trim() && o.licenseNumber.trim());
  const stepValid = steps.map((n) => validByName[n]);

  function next() {
    if (step < steps.length - 1) setStep(step + 1);
  }
  function back() {
    if (step > 0) setStep(step - 1);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 py-8">
      <div className="w-full max-w-3xl rounded-lg bg-card shadow-xl">
        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <div>
            <h2 className="text-sm font-semibold text-navy">
              {isEdit
                ? platformMode ? "Ajukan Perubahan Data Pialang" : "Ajukan Perubahan Data Ekosistem"
                : platformMode ? "Daftarkan Pialang Baru" : "Daftarkan Ekosistem Baru"}
            </h2>
            <p className="text-[11px] text-muted">Langkah {step + 1} dari {steps.length}: {steps[step]}</p>
          </div>
          <button onClick={onClose} className="rounded p-1 text-muted hover:bg-muted-bg hover:text-foreground">
            <X className="size-4" />
          </button>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-1 px-5 py-3 overflow-x-auto border-b border-border">
          {steps.map((s, i) => (
            <button
              key={s}
              type="button"
              onClick={() => i < step && setStep(i)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[10.5px] font-medium whitespace-nowrap shrink-0",
                i === step ? "bg-navy text-white" : i < step ? "bg-green-bg text-green cursor-pointer" : "bg-muted-bg text-muted"
              )}
            >
              <span className="flex size-4 items-center justify-center rounded-full bg-white/20 text-[9px]">
                {i < step ? <Check className="size-2.5" /> : i + 1}
              </span>
              {s}
            </button>
          ))}
        </div>

        <div className="px-5 py-4 max-h-[55vh] overflow-y-auto space-y-3">
          {stepName === "Klasifikasi Ecosystem" && (
            <div className="space-y-3">
              {platformMode ? (
                <div className="rounded-md border border-border bg-muted-bg/40 p-3 text-xs space-y-0.5">
                  <p><span className="text-muted">Ecosystem Type:</span> <span className="font-medium text-navy">Ecosystem Aktif</span></p>
                  <p><span className="text-muted">Ecosystem Category:</span> <span className="font-medium text-navy">Pialang</span></p>
                </div>
              ) : (
                <>
                  <div>
                    <Label htmlFor="eco-type">Ecosystem Type *</Label>
                    <Select
                      id="eco-type"
                      value={values.ecosystemType}
                      onChange={(e) => {
                        set("ecosystemType", e.target.value as EcosystemType);
                        set("category", "");
                      }}
                    >
                      <option value="Ecosystem Aktif">Ecosystem Aktif</option>
                      <option value="Ecosystem Pasif">Ecosystem Pasif</option>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="eco-category">Ecosystem Category *</Label>
                    <Select id="eco-category" value={values.category} onChange={(e) => set("category", e.target.value)}>
                      <option value="">Pilih kategori...</option>
                      {categoriesForType.map((c) => (
                        <option key={c.id} value={c.shortDescription}>{c.shortDescription}</option>
                      ))}
                    </Select>
                  </div>
                </>
              )}
              <div>
                <Label htmlFor="eco-desc">Deskripsi Ecosystem *</Label>
                <Textarea id="eco-desc" value={values.description} onChange={(e) => set("description", e.target.value)} className="min-h-[70px] text-xs" placeholder="Penjelasan singkat peran lembaga dalam ekosistem" />
              </div>
            </div>
          )}

          {stepName === "Identitas Badan Hukum / Instansi" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="sm:col-span-2">
                  <Label htmlFor="eco-name">Nama Badan Hukum / Instansi *</Label>
                  <Input id="eco-name" value={values.name} onChange={(e) => set("name", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-shortname">Nama Singkat *</Label>
                  <Input id="eco-shortname" value={values.shortName} onChange={(e) => set("shortName", e.target.value)} />
                </div>
                <FileField label="Logo" value={values.logo} onChange={(v) => set("logo", v)} />
                <div>
                  <Label htmlFor="eco-nib">NIB</Label>
                  <Input id="eco-nib" value={values.license ?? ""} onChange={(e) => set("license", e.target.value)} placeholder="Nomor Induk Berusaha" />
                </div>
                <div>
                  <Label htmlFor="eco-npwp">NPWP Badan</Label>
                  <Input id="eco-npwp" value={values.npwp ?? ""} onChange={(e) => set("npwp", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-akta">Akta Pendirian</Label>
                  <Input id="eco-akta" value={values.aktaPendirian ?? ""} onChange={(e) => set("aktaPendirian", e.target.value)} placeholder="Nomor dan tanggal" />
                </div>
                <div>
                  <Label htmlFor="eco-akta-ubah">Akta Perubahan Terakhir</Label>
                  <Input id="eco-akta-ubah" value={values.aktaPerubahan ?? ""} onChange={(e) => set("aktaPerubahan", e.target.value)} placeholder="Jika ada" />
                </div>
                <div>
                  <Label htmlFor="eco-ahu">Pengesahan / Persetujuan AHU</Label>
                  <Input id="eco-ahu" value={values.pengesahanAhu ?? ""} onChange={(e) => set("pengesahanAhu", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-izin">Izin Usaha / Dasar Penunjukan *</Label>
                  <Input id="eco-izin" value={values.izinUsaha ?? ""} onChange={(e) => set("izinUsaha", e.target.value)} />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="eco-address">Alamat Kantor *</Label>
                  <Textarea id="eco-address" value={values.address ?? ""} onChange={(e) => set("address", e.target.value)} className="min-h-[50px] text-xs" />
                </div>
                <div>
                  <Label htmlFor="eco-province">Provinsi *</Label>
                  <Select id="eco-province" value={values.province ?? ""} onChange={(e) => set("province", e.target.value)}>
                    <option value="">Pilih provinsi...</option>
                    {PROVINCE_LIST.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="eco-city">Kabupaten / Kota *</Label>
                  <Input id="eco-city" value={values.city ?? ""} onChange={(e) => set("city", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-postal">Kode Pos *</Label>
                  <Input id="eco-postal" value={values.postalCode ?? ""} onChange={(e) => set("postalCode", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-phone">Telepon Kantor *</Label>
                  <Input id="eco-phone" value={values.officePhone ?? ""} onChange={(e) => set("officePhone", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-email">Email Resmi *</Label>
                  <Input id="eco-email" type="email" value={values.officialEmail ?? ""} onChange={(e) => set("officialEmail", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-website">Website</Label>
                  <Input id="eco-website" value={values.website ?? ""} onChange={(e) => set("website", e.target.value)} />
                </div>
                {values.ecosystemType === "Ecosystem Aktif" && values.category === "Pialang" && (
                  <>
                    <div>
                      <Label htmlFor="eco-bursa">Bursa</Label>
                      <Select id="eco-bursa" value={values.bursa ?? ""} onChange={(e) => set("bursa", e.target.value)}>
                        <option value="">Pilih bursa...</option>
                        {BURSA_LIST.map((b) => (
                          <option key={b} value={b}>{b}</option>
                        ))}
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="eco-kliring">Kliring</Label>
                      <Select id="eco-kliring" value={values.kliring ?? ""} onChange={(e) => set("kliring", e.target.value)}>
                        <option value="">Pilih kliring...</option>
                        {KLIRING_LIST.map((k) => (
                          <option key={k} value={k}>{k}</option>
                        ))}
                      </Select>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          {stepName === "Data Pengurus / Pimpinan" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Minimal 1 pengurus/pimpinan wajib ditambahkan.</p>
                <Button type="button" size="sm" variant="secondary" onClick={addExecutive}>
                  <Plus className="size-3.5" /> Tambah Pengurus
                </Button>
              </div>
              {values.executives.map((exec, i) => (
                <div key={exec.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-navy">Pengurus #{i + 1}</p>
                    <button onClick={() => removeExecutive(exec.id)} className="text-muted hover:text-red" title="Hapus">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input placeholder="Nama Lengkap *" value={exec.name} onChange={(e) => updateExecutive(exec.id, { name: e.target.value })} />
                    <Input placeholder="Jabatan *" value={exec.position} onChange={(e) => updateExecutive(exec.id, { position: e.target.value })} />
                    <Input placeholder="Bidang Tanggung Jawab" value={exec.responsibilityArea} onChange={(e) => updateExecutive(exec.id, { responsibilityArea: e.target.value })} />
                    <Input placeholder="Email Kedinasan *" type="email" value={exec.officialEmail} onChange={(e) => updateExecutive(exec.id, { officialEmail: e.target.value })} />
                    <Input placeholder="Nomor Telepon Kerja" value={exec.phone ?? ""} onChange={(e) => updateExecutive(exec.id, { phone: e.target.value })} />
                    <Input placeholder="Tanggal Mulai Jabatan *" type="date" value={exec.startDate} onChange={(e) => updateExecutive(exec.id, { startDate: e.target.value })} />
                    <Input placeholder="Tanggal Berakhir Jabatan (jika ada)" type="date" value={exec.endDate ?? ""} onChange={(e) => updateExecutive(exec.id, { endDate: e.target.value })} />
                  </div>
                  <FileField label="Dokumen Pengangkatan" value={exec.appointmentDocument} onChange={(v) => updateExecutive(exec.id, { appointmentDocument: v })} />
                </div>
              ))}
              {values.executives.length === 0 && <p className="text-xs text-muted text-center py-4">Belum ada pengurus ditambahkan.</p>}
            </div>
          )}

          {stepName === "Data PIC Sistem" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted">Minimal 1 PIC wajib, dan minimal 1 di antaranya ditandai sebagai PIC Utama.</p>
                <Button type="button" size="sm" variant="secondary" onClick={addPic}>
                  <Plus className="size-3.5" /> Tambah PIC
                </Button>
              </div>
              {values.pics.map((pic, i) => (
                <div key={pic.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-navy">PIC #{i + 1}</p>
                    <button onClick={() => removePic(pic.id)} className="text-muted hover:text-red" title="Hapus">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Input placeholder="Nama Lengkap PIC *" value={pic.name} onChange={(e) => updatePic(pic.id, { name: e.target.value })} />
                    <Input placeholder="Jabatan PIC *" value={pic.position} onChange={(e) => updatePic(pic.id, { position: e.target.value })} />
                    <Input placeholder="Divisi / Unit Kerja *" value={pic.unit} onChange={(e) => updatePic(pic.id, { unit: e.target.value })} />
                    <Input placeholder="Email Kerja PIC *" type="email" value={pic.email} onChange={(e) => updatePic(pic.id, { email: e.target.value })} />
                    <Input placeholder="Nomor HP PIC *" value={pic.phone} onChange={(e) => updatePic(pic.id, { phone: e.target.value })} />
                    <Select value={pic.accessRole} onChange={(e) => updatePic(pic.id, { accessRole: e.target.value as EcosystemAccessRole })}>
                      {ACCESS_ROLES.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </Select>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs">
                    <Checkbox checked={pic.isPrimary} onCheckedChange={(v) => updatePic(pic.id, { isPrimary: !!v })} />
                    PIC Utama
                  </label>
                  <FileField label="Surat Penunjukan PIC" value={pic.appointmentLetter} onChange={(v) => updatePic(pic.id, { appointmentLetter: v })} />
                </div>
              ))}
              {values.pics.length === 0 && <p className="text-xs text-muted text-center py-4">Belum ada PIC ditambahkan.</p>}
            </div>
          )}

          {stepName === "Upload Dokumen" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <FileField label="Dokumen NIB" value={values.nibDocument} onChange={(v) => set("nibDocument", v)} />
                <FileField label="Dokumen NPWP Badan" value={values.npwpDocument} onChange={(v) => set("npwpDocument", v)} />
                <FileField label="Akta Pendirian dan Pengesahan AHU" value={values.aktaPendirianDocument} onChange={(v) => set("aktaPendirianDocument", v)} />
                <FileField label="Akta Perubahan Terakhir" value={values.aktaPerubahanDocument} onChange={(v) => set("aktaPerubahanDocument", v)} />
                <FileField label="Izin Usaha / Dasar Penunjukan" value={values.izinUsahaDocument} onChange={(v) => set("izinUsahaDocument", v)} />
                <FileField label="Struktur Organisasi" value={values.strukturOrganisasiDocument} onChange={(v) => set("strukturOrganisasiDocument", v)} />
              </div>
              <div className="rounded-md border border-border bg-muted-bg/40 p-3">
                <p className="text-[11px] font-semibold uppercase text-muted mb-1.5">Otomatis dari Step 3 &amp; 4</p>
                <ul className="text-xs space-y-1">
                  {values.executives.filter((e) => e.appointmentDocument).map((e) => (
                    <li key={e.id}>Dokumen Pengangkatan — {e.name}: {e.appointmentDocument}</li>
                  ))}
                  {values.pics.filter((p) => p.appointmentLetter).map((p) => (
                    <li key={p.id}>Surat Penunjukan PIC — {p.name}: {p.appointmentLetter}</li>
                  ))}
                  {values.executives.every((e) => !e.appointmentDocument) && values.pics.every((p) => !p.appointmentLetter) && (
                    <li className="text-muted">Belum ada dokumen dari Step 3/4.</li>
                  )}
                </ul>
              </div>
              <div>
                <Button
                  type="button"
                  size="sm"
                  variant="outline"
                  onClick={() => set("supportingDocuments", [...(values.supportingDocuments ?? []), { name: "", file: "" }])}
                >
                  <Plus className="size-3.5" /> Dokumen Pendukung Lainnya
                </Button>
                {(values.supportingDocuments ?? []).map((doc, i) => (
                  <div key={i} className="flex items-center gap-2 mt-2">
                    <Input
                      placeholder="Nama/keterangan dokumen"
                      value={doc.name}
                      onChange={(e) => {
                        const next = [...(values.supportingDocuments ?? [])];
                        next[i] = { ...next[i], name: e.target.value };
                        set("supportingDocuments", next);
                      }}
                      className="max-w-xs"
                    />
                    <FileField
                      label=""
                      value={doc.file}
                      onChange={(v) => {
                        const next = [...(values.supportingDocuments ?? [])];
                        next[i] = { ...next[i], file: v };
                        set("supportingDocuments", next);
                      }}
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {stepName === "Pernyataan dan Pengajuan" && (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="eco-submitter">Nama Pengaju *</Label>
                  <Input id="eco-submitter" value={values.submitterName ?? ""} onChange={(e) => set("submitterName", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="eco-submitter-pos">Jabatan Pengaju *</Label>
                  <Input id="eco-submitter-pos" value={values.submitterPosition ?? ""} onChange={(e) => set("submitterPosition", e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <Checkbox checked={!!values.declarationTruth} onCheckedChange={(v) => set("declarationTruth", !!v)} />
                  Saya menyatakan data dan dokumen yang disampaikan benar serta dapat dipertanggungjawabkan.
                </label>
                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <Checkbox checked={!!values.declarationAuthority} onCheckedChange={(v) => set("declarationAuthority", !!v)} />
                  Saya menyatakan berwenang mewakili lembaga dalam pengajuan ini.
                </label>
                <label className="flex items-start gap-2 cursor-pointer text-xs">
                  <Checkbox checked={!!values.declarationTerms} onCheckedChange={(v) => set("declarationTerms", !!v)} />
                  Saya menyetujui ketentuan penggunaan sistem dan pengelolaan data.
                </label>
              </div>
              <div>
                <Label>Status Registrasi</Label>
                <div className="mt-1">
                  <Badge variant="muted">{values.status ?? "Draft"}</Badge>
                </div>
              </div>
            </div>
          )}

          {stepName === STRUKTUR_STEP && (
            <div className="space-y-3">
              <p className="text-xs text-muted">
                Petakan nama dan jabatan pejabat berizin (Direksi, Kepala Cabang, Wakil Pialang Berjangka/WPB) yang terhubung dengan sistem Profiling Bappebti.
                Data ini dipakai nasabah untuk memilih pihak terlapor pada formulir pengaduan. Minimal 1 Direksi dan 1 WPB.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant="secondary" disabled={!values.name?.trim()} onClick={pullFromProfiling}>
                  <DatabaseZap className="size-3.5" /> Tarik Data dari Profiling Bappebti
                </Button>
                <Button type="button" size="sm" variant="outline" onClick={addOfficial}>
                  <Plus className="size-3.5" /> Tambah Pejabat
                </Button>
              </div>
              {!values.name?.trim() && <p className="text-[11px] text-muted">Isi nama badan hukum pada tahap 2 untuk menarik data profiling.</p>}
              {officials.map((o, i) => (
                <div key={o.id} className="rounded-md border border-border p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-semibold text-navy">Pejabat #{i + 1}</p>
                    <button onClick={() => setOfficials(officials.filter((x) => x.id !== o.id))} className="text-muted hover:text-red" title="Hapus">
                      <Trash2 className="size-3.5" />
                    </button>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <Select value={o.position} onChange={(e) => updateOfficial(o.id, { position: e.target.value as PialangOfficial["position"] })}>
                      {OFFICIAL_POSITIONS.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </Select>
                    <Input placeholder="Nama Lengkap *" value={o.name} onChange={(e) => updateOfficial(o.id, { name: e.target.value })} />
                    <Input placeholder="Nomor Izin / Profiling *" value={o.licenseNumber} onChange={(e) => updateOfficial(o.id, { licenseNumber: e.target.value })} />
                    <Input placeholder="Kantor (Pusat / Cabang)" value={o.office ?? ""} onChange={(e) => updateOfficial(o.id, { office: e.target.value })} />
                  </div>
                </div>
              ))}
              {officials.length === 0 && <p className="text-xs text-muted text-center py-4">Belum ada pejabat ditambahkan.</p>}
            </div>
          )}

          {stepName === ADMIN_STEP && (
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold text-navy mb-2">Data Administrator</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="plat-admin-email">Email Administrator Utama *</Label>
                    <Input id="plat-admin-email" type="email" value={values.administratorEmail ?? ""} onChange={(e) => set("administratorEmail", e.target.value)} />
                  </div>
                  <div>
                    <Label htmlFor="plat-admin-name">Nama Administrator Utama *</Label>
                    <Input id="plat-admin-name" value={values.administratorName ?? ""} onChange={(e) => set("administratorName", e.target.value)} />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-navy">Data Direksi</p>
                  <Button type="button" size="sm" variant="secondary" onClick={() => addBoardMember("direksi")}>
                    <Plus className="size-3.5" /> Tambah Direksi
                  </Button>
                </div>
                {(values.direksi ?? []).map((d, i) => (
                  <div key={d.id} className="rounded-md border border-border p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-navy">Direksi #{i + 1}</p>
                      <button onClick={() => removeBoardMember("direksi", d.id)} className="text-muted hover:text-red" title="Hapus">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input placeholder="Nama Lengkap *" value={d.name} onChange={(e) => updateBoardMember("direksi", d.id, { name: e.target.value })} />
                      <Input placeholder="Tanggal Lahir *" type="date" value={d.birthDate} onChange={(e) => updateBoardMember("direksi", d.id, { birthDate: e.target.value })} />
                      <Input placeholder="Nomor ID (KTP) *" value={d.idNumber} onChange={(e) => updateBoardMember("direksi", d.id, { idNumber: e.target.value })} />
                      <Input placeholder="Keterangan Lulus Fit and Proper Test" value={d.fitProperNote ?? ""} onChange={(e) => updateBoardMember("direksi", d.id, { fitProperNote: e.target.value })} />
                    </div>
                  </div>
                ))}
                {(values.direksi ?? []).length === 0 && <p className="text-xs text-muted text-center py-3">Belum ada direksi ditambahkan.</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-navy">Data Komisaris</p>
                  <Button type="button" size="sm" variant="secondary" onClick={() => addBoardMember("komisaris")}>
                    <Plus className="size-3.5" /> Tambah Komisaris
                  </Button>
                </div>
                {(values.komisaris ?? []).map((d, i) => (
                  <div key={d.id} className="rounded-md border border-border p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-navy">Komisaris #{i + 1}</p>
                      <button onClick={() => removeBoardMember("komisaris", d.id)} className="text-muted hover:text-red" title="Hapus">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <Input placeholder="Nama Lengkap *" value={d.name} onChange={(e) => updateBoardMember("komisaris", d.id, { name: e.target.value })} />
                      <Input placeholder="Tanggal Lahir *" type="date" value={d.birthDate} onChange={(e) => updateBoardMember("komisaris", d.id, { birthDate: e.target.value })} />
                      <Input placeholder="Nomor ID (KTP) *" value={d.idNumber} onChange={(e) => updateBoardMember("komisaris", d.id, { idNumber: e.target.value })} />
                      <Input placeholder="Keterangan Lulus Fit and Proper Test" value={d.fitProperNote ?? ""} onChange={(e) => updateBoardMember("komisaris", d.id, { fitProperNote: e.target.value })} />
                    </div>
                  </div>
                ))}
                {(values.komisaris ?? []).length === 0 && <p className="text-xs text-muted text-center py-3">Belum ada komisaris ditambahkan.</p>}
              </div>

              <div>
                <div className="flex items-center justify-between">
                  <p className="text-xs font-semibold text-navy">Surat Anggota Bursa</p>
                  <Button type="button" size="sm" variant="secondary" onClick={addMembershipLetter}>
                    <Plus className="size-3.5" /> Tambah Surat
                  </Button>
                </div>
                {(values.suratAnggotaBursa ?? []).map((s, i) => (
                  <div key={s.id} className="rounded-md border border-border p-3 space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-navy">Surat #{i + 1}</p>
                      <button onClick={() => removeMembershipLetter(s.id)} className="text-muted hover:text-red" title="Hapus">
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                    <Input placeholder="Nama Bursa (opsional)" value={s.bursaName ?? ""} onChange={(e) => updateMembershipLetter(s.id, { bursaName: e.target.value })} className="mb-2" />
                    <FileField label="Dokumen Surat Anggota Bursa" value={s.file} onChange={(v) => updateMembershipLetter(s.id, { file: v })} />
                  </div>
                ))}
                {(values.suratAnggotaBursa ?? []).length === 0 && <p className="text-xs text-muted text-center py-3">Belum ada surat ditambahkan.</p>}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between border-t border-border px-5 py-3">
          <Button type="button" variant="ghost" size="sm" onClick={() => onSaveDraft(values)}>
            Simpan Draft
          </Button>
          <div className="flex items-center gap-2">
            {step > 0 && (
              <Button type="button" variant="secondary" size="sm" onClick={back}>
                Kembali
              </Button>
            )}
            {step < steps.length - 1 ? (
              <Button type="button" size="sm" disabled={!stepValid[step]} onClick={next}>
                Lanjut
              </Button>
            ) : (
              <Button type="button" size="sm" disabled={!stepValid[step]} onClick={() => onSubmit(values)}>
                {isEdit ? "Ajukan Perubahan" : "Ajukan Registrasi"}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
