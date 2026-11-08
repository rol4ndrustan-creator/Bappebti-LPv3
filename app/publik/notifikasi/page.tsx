"use client";

import { useState } from "react";
import { TicketLink } from "@/components/shared/ticket-link";
import Link from "next/link";
import { PageHeader } from "@/components/shared/page-header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import { NOTIFICATIONS } from "@/lib/mock-data";
import { NotificationItem } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";

export default function NotifikasiPage() {
  const { showToast } = useToast();
  const [items, setItems] = useState<NotificationItem[]>(NOTIFICATIONS);

  function markAsRead(index: number) {
    setItems((prev) =>
      prev.map((item, i) => (i === index ? { ...item, status: "Dibaca" } : item))
    );
    showToast("Notifikasi ditandai sebagai dibaca.");
  }

  return (
    <div>
      <PageHeader
        title="Notifikasi"
        description="Daftar pemberitahuan terkait status dan tindak lanjut pengaduan Anda."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Waktu</TableHead>
            <TableHead>Tiket</TableHead>
            <TableHead>Jenis Notifikasi</TableHead>
            <TableHead>Pesan</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((n, i) => (
            <TableRow key={i}>
              <TableCell className="whitespace-nowrap text-muted">{n.time}</TableCell>
              <TableCell><TicketLink ticket={n.ticket} href={`/publik/pengaduan/${n.ticket}`} /></TableCell>
              <TableCell className="whitespace-nowrap">{n.type}</TableCell>
              <TableCell className="max-w-[360px]">{n.message}</TableCell>
              <TableCell>
                <Badge variant={n.status === "Belum Dibaca" ? "amber" : "muted"}>
                  {n.status.toUpperCase()}
                </Badge>
              </TableCell>
              <TableCell>
                <div className="flex items-center gap-2 whitespace-nowrap">
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={n.status === "Dibaca"}
                    onClick={() => markAsRead(i)}
                  >
                    Tandai dibaca
                  </Button>
                  <Link href={`/publik/pengaduan/${n.ticket}`}>
                    <Button size="sm" variant="secondary">
                      Lihat tiket
                    </Button>
                  </Link>
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
