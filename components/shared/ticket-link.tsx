import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Nomor tiket sebagai tautan aktif ke halaman detail pengaduan (List Revisi 16 #2).
 * Dipakai di seluruh tabel pengaduan agar detail dapat dibuka tanpa kolom Aksi.
 */
export function TicketLink({ ticket, href, className }: { ticket: string; href: string; className?: string }) {
  return (
    <Link
      href={href}
      title={`Buka detail pengaduan ${ticket}`}
      className={cn(
        "font-semibold text-navy whitespace-nowrap underline-offset-2 hover:underline focus-visible:underline focus-visible:outline-none cursor-pointer",
        className
      )}
    >
      {ticket}
    </Link>
  );
}
