"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { EcosystemCategory } from "@/lib/types";

const CATEGORIES: EcosystemCategory[] = ["Pialang", "Bursa", "Kliring", "Asosiasi"];

export interface NewEcosystemValues {
  name: string;
  category: EcosystemCategory;
  license: string;
  bursa?: string;
  kliring?: string;
}

/** Registers a new ecosystem entity (Platform/Pialang, Bursa, Kliring, or Asosiasi) — submitted entries start as "Menunggu Persetujuan" until approved in Persetujuan Pendaftaran. */
export function AddEcosystemDialog({
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
  onConfirm: (values: NewEcosystemValues) => void;
}) {
  const [name, setName] = React.useState("");
  const [category, setCategory] = React.useState<EcosystemCategory>(CATEGORIES[0]);
  const [license, setLicense] = React.useState("");
  const [bursa, setBursa] = React.useState(bursaOptions[0] ?? "");
  const [kliring, setKliring] = React.useState(kliringOptions[0] ?? "");

  function reset() {
    setName("");
    setCategory(CATEGORIES[0]);
    setLicense("");
    setBursa(bursaOptions[0] ?? "");
    setKliring(kliringOptions[0] ?? "");
  }

  const needsRouting = category === "Pialang";
  const canConfirm = name.trim() && license.trim() && (!needsRouting || (bursa && kliring));

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
          <DialogTitle>Daftarkan Entitas Ekosistem</DialogTitle>
          <DialogDescription>
            Pendaftaran akan berstatus &quot;Menunggu Persetujuan&quot; sampai disetujui pada Persetujuan Pendaftaran.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-2.5">
          <div>
            <Label htmlFor="eco-name">Nama Entitas</Label>
            <Input id="eco-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Contoh: PT Contoh Berjangka" />
          </div>
          <div>
            <Label htmlFor="eco-category">Kategori</Label>
            <Select id="eco-category" value={category} onChange={(e) => setCategory(e.target.value as EcosystemCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="eco-license">Nomor Izin</Label>
            <Input id="eco-license" value={license} onChange={(e) => setLicense(e.target.value)} placeholder="Contoh: PBK-015/BAPPEBTI/2026" />
          </div>
          {needsRouting && (
            <>
              <div>
                <Label htmlFor="eco-bursa">Bursa</Label>
                <Select id="eco-bursa" value={bursa} onChange={(e) => setBursa(e.target.value)}>
                  {bursaOptions.map((b) => (
                    <option key={b} value={b}>{b}</option>
                  ))}
                </Select>
              </div>
              <div>
                <Label htmlFor="eco-kliring">Kliring</Label>
                <Select id="eco-kliring" value={kliring} onChange={(e) => setKliring(e.target.value)}>
                  {kliringOptions.map((k) => (
                    <option key={k} value={k}>{k}</option>
                  ))}
                </Select>
              </div>
            </>
          )}
        </div>
        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>Batal</Button>
          <Button
            size="sm"
            disabled={!canConfirm}
            onClick={() => {
              onConfirm({
                name: name.trim(),
                category,
                license: license.trim(),
                bursa: needsRouting ? bursa : undefined,
                kliring: needsRouting ? kliring : undefined,
              });
              reset();
              onOpenChange(false);
            }}
          >
            Daftarkan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
