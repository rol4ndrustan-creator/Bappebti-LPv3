"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/shared/toast-provider";
import { DEFAULT_PARAMS, PARAM_LABEL, updateParams, useBusinessParams } from "@/lib/mock-service/params-store";
import { BusinessParams } from "@/lib/types";
import { SlidersHorizontal } from "lucide-react";

const KEYS = Object.keys(PARAM_LABEL) as (keyof BusinessParams)[];

export default function ParameterBisnisPage() {
  const params = useBusinessParams();
  const { showToast } = useToast();
  const [draft, setDraft] = React.useState<Record<keyof BusinessParams, string> | null>(null);
  const values = draft ?? (Object.fromEntries(KEYS.map((k) => [k, String(params[k])])) as Record<keyof BusinessParams, string>);
  const invalid = KEYS.some((k) => !(Number(values[k]) >= 1));
  const dirty = KEYS.some((k) => Number(values[k]) !== params[k]);

  return (
    <div>
      <PageHeader
        title="Parameter Bisnis & SLA"
        description="Pengaturan parameter yang mengendalikan siklus tiket: auto-approve review Pialang, hitung mundur SLA, batas kedaluwarsa perkara, jendela arbitrase, dan auto-close resolusi."
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {KEYS.map((k) => (
          <Card key={k}>
            <CardContent className="py-4 space-y-1.5">
              <Label htmlFor={`param-${k}`} className="flex items-center gap-1.5">
                <SlidersHorizontal className="size-3.5 text-navy" /> {PARAM_LABEL[k].label}
              </Label>
              <div className="flex items-center gap-2">
                <Input
                  id={`param-${k}`}
                  type="number"
                  min={1}
                  className="w-32"
                  value={values[k]}
                  onChange={(e) => setDraft({ ...values, [k]: e.target.value })}
                />
                <span className="text-xs text-muted">{PARAM_LABEL[k].unit}</span>
                <span className="text-[11px] text-muted ml-auto">Standar: {DEFAULT_PARAMS[k]}</span>
              </div>
              <p className="text-[11px] text-muted">{PARAM_LABEL[k].help}</p>
            </CardContent>
          </Card>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <Button
          size="sm"
          disabled={invalid || !dirty}
          onClick={() => {
            updateParams(Object.fromEntries(KEYS.map((k) => [k, Math.round(Number(values[k]))])) as unknown as BusinessParams);
            setDraft(null);
            showToast("Parameter bisnis & SLA tersimpan dan langsung berlaku.");
          }}
        >
          Simpan Parameter
        </Button>
        <Button size="sm" variant="secondary" onClick={() => setDraft(Object.fromEntries(KEYS.map((k) => [k, String(DEFAULT_PARAMS[k])])) as Record<keyof BusinessParams, string>)}>
          Kembalikan ke Standar
        </Button>
      </div>
      {invalid && <p className="mt-2 text-xs text-red">Setiap parameter harus bernilai minimal 1.</p>}
    </div>
  );
}
