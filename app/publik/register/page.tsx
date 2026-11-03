"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { PROVINCE_LIST } from "@/lib/mock-data";
import { getRegenciesForProvince } from "@/lib/indonesia-regions";
import { usePublikAuth } from "@/lib/publik-auth";
import { cn } from "@/lib/utils";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function RegisterPage() {
  const router = useRouter();
  const { register } = usePublikAuth();
  const [form, setForm] = useState({
    nama: "",
    nomorIdentitas: "",
    email: "",
    hp: "",
    provinsi: "",
    kota: "",
    platformUserId: "",
    password: "",
    konfirmasiPassword: "",
  });
  const [formError, setFormError] = useState("");
  const [ktpFile, setKtpFile] = useState<{ name: string; sizeBytes: number } | null>(null);
  const [ktpError, setKtpError] = useState("");

  function handleKtp(file: File | undefined) {
    if (!file) return;
    if (!/\.(jpe?g|png|pdf)$/i.test(file.name)) {
      setKtpFile(null);
      setKtpError("Format harus JPG, PNG, atau PDF.");
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setKtpFile(null);
      setKtpError("Ukuran berkas melebihi 5MB.");
      return;
    }
    setKtpError("");
    setKtpFile({ name: file.name, sizeBytes: file.size });
  }

  const kotaOptions = getRegenciesForProvince(form.provinsi);
  const ktpInvalid = form.nomorIdentitas.length > 0 && form.nomorIdentitas.length < 16;
  const emailInvalid = form.email.length > 0 && !EMAIL_PATTERN.test(form.email);

  function update(field: string, value: string) {
    setForm((prev) => ({
      ...prev,
      [field]: value,
      // Reset the selected city whenever the province changes so it never
      // holds a value from a different province's regency list.
      ...(field === "provinsi" ? { kota: "" } : {}),
    }));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError("");
    if (form.nomorIdentitas.length !== 16) {
      setFormError("Nomor identitas (KTP) harus tepat 16 digit.");
      return;
    }
    if (!EMAIL_PATTERN.test(form.email)) {
      setFormError("Format email tidak valid.");
      return;
    }
    if (!ktpFile) {
      setFormError("Foto KTP wajib diunggah.");
      return;
    }
    register({
      nama: form.nama,
      nomorIdentitas: form.nomorIdentitas,
      email: form.email,
      hp: form.hp,
      provinsi: form.provinsi,
      kota: form.kota,
      platformUserId: form.platformUserId,
      password: form.password,
      ktpFile,
    });
    router.push("/publik/dashboard");
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-background px-4 py-10">
      <div className="w-full max-w-2xl">
        <div className="flex flex-col items-center mb-6 gap-2">
          <div className="flex size-10 items-center justify-center rounded-md bg-navy text-white text-base font-bold bg-linear-to-b from-white/20 to-transparent shadow-sm shadow-black/20">
            B
          </div>
          <div className="text-center">
            <p className="text-sm font-semibold text-navy">Layanan Pengaduan Bappebti</p>
            <p className="text-[11px] text-muted">Pendaftaran Akun Publik</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4">
            <h1 className="text-sm font-semibold text-navy mb-1">Buat Akun Baru</h1>
            <p className="text-xs text-muted mb-4">
              Lengkapi data berikut untuk membuat akun dan mengajukan pengaduan.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {formError && (
                <p className="rounded-md border border-red/30 bg-red-bg px-3 py-2 text-xs text-red">
                  {formError}
                </p>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <Label htmlFor="nama">Nama lengkap</Label>
                  <Input
                    id="nama"
                    placeholder="Sesuai KTP"
                    value={form.nama}
                    onChange={(e) => update("nama", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="nomorIdentitas">Nomor identitas (KTP)</Label>
                  <Input
                    id="nomorIdentitas"
                    placeholder="16 digit NIK"
                    inputMode="numeric"
                    maxLength={16}
                    value={form.nomorIdentitas}
                    onChange={(e) => update("nomorIdentitas", e.target.value.replace(/\D/g, "").slice(0, 16))}
                    aria-invalid={ktpInvalid}
                    className={cn(ktpInvalid && "border-red text-red focus-visible:ring-red/30")}
                    required
                  />
                  {ktpInvalid && (
                    <p className="text-[11px] text-red mt-1">
                      NIK harus tepat 16 digit ({form.nomorIdentitas.length}/16).
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="email">Email aktif</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="nama@email.com"
                    value={form.email}
                    onChange={(e) => update("email", e.target.value)}
                    aria-invalid={emailInvalid}
                    className={cn(emailInvalid && "border-red text-red focus-visible:ring-red/30")}
                    required
                  />
                  {emailInvalid && <p className="text-[11px] text-red mt-1">Format email tidak valid.</p>}
                </div>
                <div>
                  <Label htmlFor="hp">Nomor HP / WhatsApp</Label>
                  <Input
                    id="hp"
                    placeholder="08xxxxxxxxxx"
                    value={form.hp}
                    onChange={(e) => update("hp", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="provinsi">Provinsi domisili</Label>
                  <Select
                    id="provinsi"
                    value={form.provinsi}
                    onChange={(e) => update("provinsi", e.target.value)}
                    required
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
                  <Label htmlFor="kota">Kota / Kabupaten</Label>
                  <Select
                    id="kota"
                    value={form.kota}
                    onChange={(e) => update("kota", e.target.value)}
                    disabled={!form.provinsi}
                    required
                  >
                    <option value="">
                      {form.provinsi ? "Pilih kota/kabupaten" : "Pilih provinsi terlebih dahulu"}
                    </option>
                    {kotaOptions.map((k) => (
                      <option key={k} value={k}>
                        {k}
                      </option>
                    ))}
                  </Select>
                </div>
                <div>
                  <Label htmlFor="platformUserId">Pialang User ID (Opsional)</Label>
                  <Input
                    id="platformUserId"
                    placeholder="ID akun Anda pada pialang terkait"
                    value={form.platformUserId}
                    onChange={(e) => update("platformUserId", e.target.value)}
                  />
                </div>
                <div className="sm:col-span-2">
                  <Label htmlFor="ktpFile">Unggah Foto KTP *</Label>
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      id="ktpFile"
                      type="file"
                      accept=".jpg,.jpeg,.png,.pdf"
                      className="hidden"
                      onChange={(e) => handleKtp(e.target.files?.[0])}
                    />
                    <Button type="button" size="sm" variant="outline" onClick={() => document.getElementById("ktpFile")?.click()}>
                      {ktpFile ? "Ganti Foto KTP" : "Pilih Foto KTP"}
                    </Button>
                    {ktpFile && (
                      <span className="text-xs text-foreground/80">
                        {ktpFile.name} ({(ktpFile.sizeBytes / 1024 / 1024).toFixed(2)} MB)
                      </span>
                    )}
                    {ktpError && <span className="text-xs text-red">{ktpError}</span>}
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    JPG/PNG/PDF, maks. 5MB. Tersimpan di profil Anda dan otomatis terlampir sebagai berkas identitas wajib pada setiap pengaduan.
                  </p>
                </div>
                <div>
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="********"
                    value={form.password}
                    onChange={(e) => update("password", e.target.value)}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="konfirmasiPassword">Konfirmasi password</Label>
                  <Input
                    id="konfirmasiPassword"
                    type="password"
                    placeholder="********"
                    value={form.konfirmasiPassword}
                    onChange={(e) => update("konfirmasiPassword", e.target.value)}
                    required
                  />
                </div>
              </div>
              <Button type="submit" className="mt-2 w-full">
                Daftar
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted mt-4">
          Sudah memiliki akun?{" "}
          <Link href="/publik/masuk" className="text-navy font-medium hover:underline">
            Masuk di sini
          </Link>
        </p>
        <p className="text-center text-[11px] text-muted mt-2">
          <Link href="/publik" className="hover:underline">
            Kembali ke halaman utama
          </Link>
        </p>
      </div>
    </div>
  );
}
