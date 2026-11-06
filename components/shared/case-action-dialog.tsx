"use client";

import * as React from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { SearchableSelect } from "@/components/shared/searchable-select";
import { FileUploader } from "@/components/shared/file-uploader";
import { CaseActionDefinition, ActionButtonTone } from "@/lib/case-actions";
import { ComplaintCase } from "@/lib/types";
import type { VariantProps } from "class-variance-authority";

type ButtonVariant = VariantProps<typeof buttonVariants>["variant"];

export const TONE_TO_BUTTON_VARIANT: Record<ActionButtonTone, ButtonVariant> = {
  primary: "default",
  secondary: "secondary",
  success: "success",
  destructive: "destructive",
  muted: "outline",
};

/**
 * Generic confirmation modal for every "Tindakan Berikutnya" action — shows
 * what will happen (impact summary) and collects the action's required
 * fields before executing it.
 */
export function CaseActionDialog({
  action,
  complaintCase,
  open,
  onOpenChange,
  onConfirm,
}: {
  action: CaseActionDefinition;
  complaintCase: ComplaintCase;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (values: Record<string, string>) => void;
}) {
  const [values, setValues] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (open) {
      const defaults: Record<string, string> = {};
      for (const f of action.fields) {
        defaults[f.id] = f.defaultValue ? f.defaultValue(complaintCase) : "";
      }
      // eslint-disable-next-line react-hooks/set-state-in-effect -- re-seed field defaults each time the dialog opens for a (possibly different) action
      setValues(defaults);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps -- only re-seed defaults when the dialog opens for this action
  }, [open, action.id]);

  const impact = action.impact(complaintCase);
  const canConfirm = action.fields.every(
    (f) => (!f.required || values[f.id]?.trim()) && (f.type !== "pdf" || !values[f.id] || values[f.id].toLowerCase().endsWith(".pdf"))
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{action.modalTitle}</DialogTitle>
          <DialogDescription>{action.body(complaintCase)}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 rounded-md border border-border bg-muted-bg/40 p-2.5 mb-3 text-xs">
          <div>
            <p className="text-muted">Status baru</p>
            <p className="font-medium text-foreground mt-0.5">{impact.status}</p>
          </div>
          <div>
            <p className="text-muted">Penanggung jawab baru</p>
            <p className="font-medium text-foreground mt-0.5">{impact.owner}</p>
          </div>
          <div>
            <p className="text-muted">Batas waktu</p>
            <p className="font-medium text-foreground mt-0.5">{impact.sla}</p>
          </div>
        </div>

        <div className="space-y-2.5">
          {action.fields.map((f) => (
            <div key={f.id}>
              <Label htmlFor={f.id}>
                {f.label} {f.required ? <span className="text-red">*</span> : <span className="text-muted">(opsional)</span>}
              </Label>
              {f.type === "textarea" && (
                <Textarea
                  id={f.id}
                  value={values[f.id] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  className="min-h-[70px] text-sm"
                />
              )}
              {f.type === "text" && (
                <Input
                  id={f.id}
                  value={values[f.id] ?? ""}
                  placeholder={f.placeholder}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                />
              )}
              {f.type === "pdf" && (
                <>
                  <FileUploader
                    files={values[f.id] ? [values[f.id]] : []}
                    onChange={(files) => setValues((prev) => ({ ...prev, [f.id]: files[0] ?? "" }))}
                    multiple={false}
                    maxFiles={1}
                    accept=".pdf"
                    label="Unggah dokumen bukti (PDF)"
                  />
                  {values[f.id] && !values[f.id].toLowerCase().endsWith(".pdf") && (
                    <p className="text-[11px] text-red mt-1">Berkas harus berformat PDF.</p>
                  )}
                </>
              )}
              {f.type === "date" && (
                <Input
                  id={f.id}
                  type="date"
                  value={values[f.id] ?? ""}
                  onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                />
              )}
              {f.type === "select" &&
                (f.optionGroups ? (
                  <SearchableSelect
                    id={f.id}
                    value={values[f.id] ?? ""}
                    onChange={(v) => setValues((prev) => ({ ...prev, [f.id]: v }))}
                    groups={f.optionGroups}
                  />
                ) : (
                  <Select
                    id={f.id}
                    value={values[f.id] ?? ""}
                    onChange={(e) => setValues((prev) => ({ ...prev, [f.id]: e.target.value }))}
                  >
                    <option value="">Pilih...</option>
                    {f.options?.map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </Select>
                ))}
            </div>
          ))}
        </div>

        <DialogFooter>
          <Button variant="secondary" size="sm" onClick={() => onOpenChange(false)}>
            Batal
          </Button>
          <Button
            size="sm"
            variant={TONE_TO_BUTTON_VARIANT[action.tone]}
            disabled={!canConfirm}
            onClick={() => {
              onConfirm(values);
              onOpenChange(false);
            }}
          >
            {action.confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
