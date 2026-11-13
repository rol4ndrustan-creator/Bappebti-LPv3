import { redirect } from "next/navigation";

// Revisi 17 #1: menu "Tanpa Pialang User ID" disembunyikan karena antreannya
// sama dengan Triase Pengaduan. URL lama diarahkan ke satu pintu triase.
export default function PengaduanTanpaPlatformPage() {
  redirect("/bappebti/pengaduan/triase");
}
