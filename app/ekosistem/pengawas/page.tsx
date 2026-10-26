import { redirect } from "next/navigation";

// Dashboard disembunyikan untuk peran ini (List Revisi 11 #7) — langsung ke modul kerja utama.
export default function EkosistemPengawasIndex() {
  redirect("/ekosistem/pengawas/pengaduan");
}
