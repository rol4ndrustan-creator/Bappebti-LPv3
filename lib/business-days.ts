// Kalender hari kerja untuk perhitungan batas waktu Mekanisme Penanganan
// Perselisihan Nasabah PBK. Semua tenggat pada mekanisme tersebut dinyatakan
// dalam "hari kerja" (Senin–Jumat, di luar hari libur nasional).

/**
 * Hari libur nasional bertanggal tetap (format MM-DD), berlaku setiap tahun.
 * Hari libur bertanggal bergerak (Idulfitri, Iduladha, Nyepi, Waisak, Imlek,
 * Tahun Baru Islam, Maulid Nabi, Isra Mikraj, Kenaikan Isa Almasih, Jumat Agung)
 * serta cuti bersama ditetapkan setiap tahun melalui SKB 3 Menteri — tambahkan
 * tanggalnya ke HOLIDAYS_BY_DATE agar perhitungan hari kerja tetap akurat.
 */
const FIXED_HOLIDAYS_MMDD = new Set([
  "01-01", // Tahun Baru Masehi
  "05-01", // Hari Buruh Internasional
  "06-01", // Hari Lahir Pancasila
  "08-17", // Hari Kemerdekaan RI
  "12-25", // Hari Raya Natal
]);

/** Hari libur/cuti bersama bertanggal spesifik (format YYYY-MM-DD) sesuai SKB 3 Menteri tahun berjalan. */
export const HOLIDAYS_BY_DATE = new Set<string>([]);

function pad(n: number): string {
  return String(n).padStart(2, "0");
}

export function isBusinessDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0 || day === 6) return false;
  const mmdd = `${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  if (FIXED_HOLIDAYS_MMDD.has(mmdd)) return false;
  if (HOLIDAYS_BY_DATE.has(`${date.getFullYear()}-${mmdd}`)) return false;
  return true;
}

/** Tanggal setelah `days` hari kerja dari `start` (jam yang sama). Hari mulai tidak dihitung. */
export function addBusinessDays(start: Date, days: number): Date {
  const d = new Date(start);
  let remaining = days;
  while (remaining > 0) {
    d.setDate(d.getDate() + 1);
    if (isBusinessDay(d)) remaining--;
  }
  return d;
}

export function addCalendarDays(start: Date, days: number): Date {
  const d = new Date(start);
  d.setDate(d.getDate() + days);
  return d;
}

/**
 * Jumlah hari kerja (berdasarkan tanggal, tanpa jam) dari `from` sampai `to`.
 * 0 = tanggal yang sama; negatif berarti tenggat telah terlewati sebanyak itu.
 */
export function businessDaysBetween(from: Date, to: Date): number {
  const a = new Date(from.getFullYear(), from.getMonth(), from.getDate());
  const b = new Date(to.getFullYear(), to.getMonth(), to.getDate());
  if (a.getTime() === b.getTime()) return 0;
  const forward = b > a;
  const [start, end] = forward ? [a, b] : [b, a];
  const cursor = new Date(start);
  let count = 0;
  while (cursor < end) {
    cursor.setDate(cursor.getDate() + 1);
    if (isBusinessDay(cursor)) count++;
  }
  return forward ? count : -count;
}
