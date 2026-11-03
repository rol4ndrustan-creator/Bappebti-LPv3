"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { SecurityIllustration } from "@/components/shared/security-illustration";
import { useInternalAuth, INTERNAL_ACCOUNTS } from "@/lib/internal-auth";
import { ShieldCheck, Lock, Eye, AlertTriangle } from "lucide-react";

const SECURITY_POINTS = [
  {
    icon: Lock,
    text: "Data pelapor dan bukti pengaduan bersifat rahasia. Akses hanya untuk kebutuhan penanganan kasus (need-to-know basis).",
  },
  {
    icon: Eye,
    text: "Setiap akses dan perubahan data tercatat pada Audit Log sesuai kebijakan privasi dan keamanan informasi Bappebti.",
  },
  {
    icon: AlertTriangle,
    text: "Dilarang membagikan kredensial login. Segera laporkan ke Tim Keamanan Informasi bila mencurigai penyalahgunaan akun.",
  },
];

export default function MasukInternalPage() {
  const router = useRouter();
  const { login } = useInternalAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const account = INTERNAL_ACCOUNTS.find((a) => a.username.toLowerCase() === username.trim().toLowerCase());
    if (login(username, password)) {
      router.push(account!.portalHref);
    } else {
      setError("Username atau password salah.");
    }
  }

  return (
    <div className="min-h-screen flex bg-background">
      {/* Security / branding panel — hidden on small screens */}
      <div className="hidden md:flex relative w-[42%] max-w-md shrink-0 text-white">
        <div className="absolute inset-0">
          <SecurityIllustration />
        </div>
        <div className="relative z-10 flex flex-col justify-between p-8">
          <div>
            <div className="flex items-center gap-2">
              <span className="flex h-9 w-9 items-center justify-center rounded-md border border-white/40 bg-white/10 text-sm font-bold">
                B
              </span>
              <span className="text-sm font-semibold">Layanan Pengaduan Bappebti</span>
            </div>
            <h1 className="text-xl font-semibold mt-8 leading-snug">
              Portal Internal Staf &amp; Regulator
            </h1>
            <p className="text-xs text-white/75 mt-2 max-w-xs">
              Akses khusus untuk staf Bappebti, Pialang, Bursa, Kliring, dan Asosiasi dalam
              menangani pengaduan konsumen.
            </p>
          </div>

          <div className="space-y-3">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1 text-[11px] font-medium">
              <ShieldCheck className="size-3.5" /> Selaras dengan ISO/IEC 27701 — Sistem Manajemen Informasi Privasi
            </div>
            <ul className="space-y-2.5">
              {SECURITY_POINTS.map((p, i) => (
                <li key={i} className="flex items-start gap-2 text-[11px] text-white/85 leading-relaxed">
                  <p.icon className="size-3.5 shrink-0 mt-0.5" />
                  <span>{p.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* Login form */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 py-10">
        <div className="w-full max-w-sm">
          <div className="flex md:hidden flex-col items-center mb-6 gap-2">
            <div className="flex size-10 items-center justify-center rounded-md bg-navy text-white text-base font-bold bg-linear-to-b from-white/20 to-transparent shadow-sm shadow-black/20">
              B
            </div>
            <div className="text-center">
              <p className="text-sm font-semibold text-navy">Layanan Pengaduan Bappebti</p>
              <p className="text-[11px] text-muted">Masuk Internal — Staf &amp; Regulator</p>
            </div>
          </div>

          {/* Compact security notice for mobile, where the side panel is hidden */}
          <div className="md:hidden mb-4 rounded-md border border-amber/40 bg-amber-bg/40 px-3 py-2.5 flex items-start gap-2">
            <ShieldCheck className="size-4 text-amber shrink-0 mt-0.5" />
            <p className="text-[11px] text-foreground/90 leading-relaxed">
              Data pelapor bersifat rahasia dan dilindungi sesuai ISO/IEC 27701. Jangan membagikan
              kredensial login Anda kepada siapa pun.
            </p>
          </div>

          <Card>
            <CardContent className="pt-4">
              <h1 className="text-sm font-semibold text-navy mb-1">Masuk ke Portal Internal</h1>
              <p className="text-xs text-muted mb-4">
                Khusus staf Pialang, Bursa, Kliring, Bappebti, dan Admin Sistem.
              </p>
              <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                {error && (
                  <p className="rounded-md border border-red/30 bg-red-bg px-3 py-2 text-xs text-red">
                    {error}
                  </p>
                )}
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    type="text"
                    placeholder="contoh: dewi"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
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

              <details className="mt-4 group">
                <summary className="text-[11px] text-navy font-medium cursor-pointer select-none">
                  Lihat Kredensial Demo
                </summary>
                <div className="mt-2 rounded-md border border-border overflow-hidden">
                  <table className="w-full text-[11px]">
                    <thead className="bg-muted-bg text-muted">
                      <tr>
                        <th className="text-left font-medium px-2 py-1.5">Persona</th>
                        <th className="text-left font-medium px-2 py-1.5">Username</th>
                        <th className="text-left font-medium px-2 py-1.5">Password</th>
                      </tr>
                    </thead>
                    <tbody>
                      {INTERNAL_ACCOUNTS.map((a) => (
                        <tr key={a.username} className="border-t border-border">
                          <td className="px-2 py-1.5">
                            <p className="font-medium text-foreground">{a.name}</p>
                            <p className="text-muted">{a.institution}</p>
                          </td>
                          <td className="px-2 py-1.5 font-mono">{a.username}</td>
                          <td className="px-2 py-1.5 font-mono">{a.password}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </details>
            </CardContent>
          </Card>

          <p className="text-center text-[11px] text-muted mt-4">
            <Link href="/publik" className="hover:underline">
              Kembali ke halaman utama
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
