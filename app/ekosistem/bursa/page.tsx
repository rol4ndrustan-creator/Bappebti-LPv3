import { redirect } from "next/navigation";

// Dashboard khusus Bursa/Kliring dihapus (List Revisi 14 #5): pekerjaan Bursa & Kliring
// dilakukan di Ekosistem Active dengan konteks peran yang sesuai.
export default function BursaIndex() {
  redirect("/ekosistem/active/pengaduan?peran=Bursa");
}
