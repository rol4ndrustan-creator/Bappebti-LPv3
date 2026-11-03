"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/components/shared/toast-provider";
import { usePublikAuth } from "@/lib/publik-auth";

export default function ProfilPage() {
  const { showToast } = useToast();
  const { account } = usePublikAuth();

  const profile = {
    nama: "Andra Wicaksono",
    nomorIdentitas: "3201**********4521",
    email: "andra.wicaksono@email.com",
    hp: "0812-3456-7890",
    domisili: "Jakarta Selatan, DKI Jakarta",
  };

  const [notifPref, setNotifPref] = useState({
    email: true,
    whatsapp: true,
    sms: false,
  });

  const [passwordForm, setPasswordForm] = useState({
    lama: "",
    baru: "",
    konfirmasi: "",
  });

  function togglePref(key: keyof typeof notifPref) {
    setNotifPref((prev) => ({ ...prev, [key]: !prev[key] }));
  }

  function handlePasswordSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPasswordForm({ lama: "", baru: "", konfirmasi: "" });
    showToast("Password berhasil diperbarui.");
  }

  return (
    <div>
      <PageHeader
        title="Profil Saya"
        description="Kelola data pribadi, preferensi notifikasi, dan keamanan akun Anda."
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Data pribadi */}
        <Card>
          <CardHeader>
            <CardTitle>Data Pribadi</CardTitle>
            <CardDescription>Data ini digunakan untuk verifikasi identitas pelapor.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div>
              <Label>Nama lengkap</Label>
              <Input value={profile.nama} readOnly />
            </div>
            <div>
              <Label>Nomor identitas (KTP)</Label>
              <Input value={profile.nomorIdentitas} readOnly />
            </div>
            <div>
              <Label>Berkas KTP</Label>
              <Input
                value={account?.ktpFile ? `${account.ktpFile.name} (${(account.ktpFile.sizeBytes / 1024 / 1024).toFixed(2)} MB)` : "Belum diunggah"}
                readOnly
              />
              <p className="text-[11px] text-muted mt-1">Diunggah saat registrasi; otomatis dilampirkan pada setiap pengaduan baru.</p>
            </div>
            <div>
              <Label>Email</Label>
              <Input value={profile.email} readOnly />
            </div>
            <div>
              <Label>No. HP</Label>
              <Input value={profile.hp} readOnly />
            </div>
            <div>
              <Label>Domisili</Label>
              <Input value={profile.domisili} readOnly />
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-col gap-4">
          {/* Preferensi notifikasi */}
          <Card>
            <CardHeader>
              <CardTitle>Preferensi Notifikasi</CardTitle>
              <CardDescription>Pilih kanal yang digunakan untuk menerima pemberitahuan.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notifPref.email}
                  onCheckedChange={() => togglePref("email")}
                />
                <span className="text-xs">Email</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notifPref.whatsapp}
                  onCheckedChange={() => togglePref("whatsapp")}
                />
                <span className="text-xs">WhatsApp</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <Checkbox
                  checked={notifPref.sms}
                  onCheckedChange={() => togglePref("sms")}
                />
                <span className="text-xs">SMS</span>
              </label>
            </CardContent>
          </Card>

          {/* Ubah password */}
          <Card id="ubah-password" className="scroll-mt-20">
            <CardHeader>
              <CardTitle>Ubah Password</CardTitle>
              <CardDescription>Gunakan password yang kuat dan unik untuk keamanan akun Anda.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-3">
                <div>
                  <Label htmlFor="passwordLama">Password lama</Label>
                  <Input
                    id="passwordLama"
                    type="password"
                    value={passwordForm.lama}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, lama: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="passwordBaru">Password baru</Label>
                  <Input
                    id="passwordBaru"
                    type="password"
                    value={passwordForm.baru}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, baru: e.target.value }))}
                    required
                  />
                </div>
                <div>
                  <Label htmlFor="konfirmasiPasswordBaru">Konfirmasi password baru</Label>
                  <Input
                    id="konfirmasiPasswordBaru"
                    type="password"
                    value={passwordForm.konfirmasi}
                    onChange={(e) => setPasswordForm((p) => ({ ...p, konfirmasi: e.target.value }))}
                    required
                  />
                </div>
                <Separator />
                <Button type="submit" className="self-start">
                  Simpan
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
