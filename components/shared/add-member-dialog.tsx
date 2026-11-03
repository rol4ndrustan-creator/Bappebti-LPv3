"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";

const MEMBER_TYPES = ["Pialang Berjangka", "Pedagang Aset Kripto"];

export interface NewMemberValues {
  name: string;
  type: string;
  license: string;
  bursa: string;
  kliring: string;
}

/** Registers a new Platform/Pialang, Bursa, or Kliring member into the master data list (Admin > Master Data Anggota). */
export function AddMemberDialog({
  open,
  onOpenChange,
  bursaOptions,
  kliringOptions,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bursaOptions: string[];
  kliringOptions: string[];
  onConfirm: (values: NewMemberValues) => void;
}) {
  const [name, setName] = React.useState("");
  const [type, setType] = React.useState(MEMBER_TYPES[0]);
  const [license, setLicense] = React.useState("");
  const [bursa, setBursa] = React.useState(bursaOptions[0] ?? "");
  const [kliring, setKliring] = React.useState(kliringOptions[0] ?? "");

  function reset() {
    setName("");
    setType(MEMBER_TYPES[0]);
    setLicense("");
    setBursa(bursaOptions[0] ?? "");
    setKliring(kliringOptions[0] ?? "");
  }

  const canConfirm = name.trim() && license.trim() && bursa && kliring;

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) reset();
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Tambah Anggota</DialogTitle>
          <DialogDescription>
            Daftarkan anggota baru (Pialang, Bursa, atau Kliring) ke master data.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5">
          <div>
            <Label htmlFor="member-name">Nama Anggota</Label>
            <Input id="member-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: PT Contoh Berjangka" />
          </div>
          <div>
            <Label htmlFor="member-type">Tipe</Label>
            <Select id="member-type" value={type} onChange={(e) => setType(e.target.value)}>
              {MEMBER_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="member-license">Nomor Izin</Label>
            <Input id="member-license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Contoh: PBK-010/BAPPEBTI/2026" />
          </div>
          <div>
            <Label htmlFor="member-bursa">Bursa</Label>
            <Select id="member-bursa" value={bursa} onChange={(e) => setBursa(e.target.value)}>
              {bursaOptions.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="member-kliring">Kliring</Label>
            <Select id="member-kliring" value={kliring} onChange={(e) => setKliring(e.target.value)}>
              {kliringOptions.map((k) => (
                <option key={k} value={k}>
                  {k}
                </option>
              ))}
            </Select>
          </div>
        </div>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            disabled={!canConfirm}
            onClick={() => {
              onConfirm({ name: name.trim(), type, license: license.trim(), bursa, kliring });
              reset();
              onOpenChange(false);
            }}
          >
            Tambah Anggota
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
