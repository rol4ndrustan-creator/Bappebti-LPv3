"use client";

import { useState } from "react";
import Link from "next/link";
import { InstitutionLogos } from "@/components/publik/public-shell";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { usePublikAuth } from "@/lib/publik-auth";

export default function MasukPage() {
  const router = useRouter();
  const { login } = usePublikAuth();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (login(identifier, password)) {
      router.push("/publik/dashboard");
    } else {
      setError("Email/nomor HP atau password salah, atau Anda belum memiliki akun. Silakan daftar terlebih dahulu.");
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 md:py-8">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-6 gap-2">
          <InstitutionLogos />
          <div className="text-center">
            <p className="text-base font-semibold text-navy">Layanan Pengaduan Bappebti</p>
            <p className="text-xs text-muted">Portal Publik</p>
          </div>
        </div>

        <Card>
          <CardContent className="pt-4">
            <h1 className="text-sm font-semibold text-navy mb-1">Masuk ke Akun Anda</h1>
            <p className="text-xs text-muted mb-4">
              Gunakan email/nomor HP terdaftar untuk memantau status pengaduan.
            </p>
            <form onSubmit={handleSubmit} className="flex flex-col gap-3">
              {error && (
                <p className="rounded-md border border-red/30 bg-red-bg px-3 py-2 text-xs text-red">
                  {error}
                </p>
              )}
              <div>
                <Label htmlFor="identifier">Email atau Nomor HP</Label>
                <Input
                  id="identifier"
                  type="text"
                  placeholder="contoh: andra.wicaksono@email.com"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  required
                />
              </div>
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="********"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="mt-2 w-full">
                Masuk
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="text-center text-xs text-muted mt-4">
          Belum memiliki akun?{" "}
          <Link href="/publik/register" className="text-navy font-medium hover:underline">
            Daftar di sini
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
