"use client";

import * as React from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { ECOSYSTEM_CATEGORY_CONFIG, ECOSYSTEM_ENTITIES, ROUTING_CHANGE_REQUESTS } from "@/lib/mock-data";
import { useEcosystemCategoryConfig } from "@/lib/mock-service/ecosystem-category-store";
import { useEcosystemEntities } from "@/lib/mock-service/ecosystem-store";
import { useRoutingMappings } from "@/lib/mock-service/routing-store";
import { requestRoutingChange, useRoutingChangeRequests } from "@/lib/mock-service/routing-change-store";
import { RoutingMapping } from "@/lib/types";
import { useToast } from "@/components/shared/toast-provider";
import { RefreshCw, Clock3 } from "lucide-react";

function entityIdByName(entities: ReturnType<typeof useEcosystemEntities>, name: string): string {
  return entities.find((e) => e.name === name)?.id ?? "";
}

export default function RoutingMappingSetupPage() {
  const categories = useEcosystemCategoryConfig(ECOSYSTEM_CATEGORY_CONFIG);
  // Always read platforms and their category-bound destination options from
  // the live entity store (not the static seed array), so a freshly
  // registered/approved entity or a newly activated category shows up here
  // immediately instead of only after a full data reset.
  const entities = useEcosystemEntities(ECOSYSTEM_ENTITIES);
  const changeRequests = useRoutingChangeRequests(ROUTING_CHANGE_REQUESTS);
  const { showToast } = useToast();

  // Dynamic destination columns: every active category other than
  // Platform/Pialang itself (the row entity type) — both "Ecosystem Aktif"
  // categories (Bursa, Kliring, Custody, ...) and "Ecosystem Pengawas" ones
  // (Asosiasi, ...) are valid routing destinations.
  const destinationCategories = React.useMemo(
    () => categories.filter((c) => c.active && c.shortDescription !== "Pialang"),
    [categories]
  );

  // Base rows: every approved, non-disabled platform, seeded with its
  // already-known Bursa/Kliring relationship; routing-store edits are
  // merged on top by useRoutingMappings below.
  const baseRows = React.useMemo<RoutingMapping[]>(
    () =>
      entities
        .filter((e) => e.category === "Pialang" && e.status === "Disetujui" && !e.disabled)
        .map((platform) => {
          const mappings: Record<string, string> = {};
          for (const cat of destinationCategories) {
            if (cat.shortDescription === "Bursa") mappings.Bursa = entityIdByName(entities, platform.bursa ?? "");
            else if (cat.shortDescription === "Kliring") mappings.Kliring = entityIdByName(entities, platform.kliring ?? "");
            else mappings[cat.shortDescription] = "";
          }
          return {
            platformId: platform.id,
            platformName: platform.name,
            mappings,
            updatedAt: platform.bursa ? "10 Jun 2026" : undefined,
            updatedBy: platform.bursa ? "Bambang Setiawan" : undefined,
          };
        }),
    [entities, destinationCategories]
  );
  const rows = useRoutingMappings(baseRows);

  const entitiesById = React.useMemo(() => new Map(entities.map((e) => [e.id, e])), [entities]);
  function entityName(id: string): string {
    if (!id) return "-";
    return entitiesById.get(id)?.name ?? "-";
  }

  function pendingFor(platformId: string) {
    return changeRequests.find((r) => r.status === "Menunggu" && r.platformId === platformId);
  }

  // "Perbaharui" dialog
  const [editing, setEditing] = React.useState<{ platformId: string; platformName: string; draft: Record<string, string> } | null>(null);

  function startEdit(row: (typeof rows)[number]) {
    const draft: Record<string, string> = {};
    for (const cat of destinationCategories) {
      draft[cat.shortDescription] = row.mappings[cat.shortDescription] || "";
    }
    setEditing({ platformId: row.platformId, platformName: row.platformName, draft });
  }

  function saveEdit() {
    if (!editing) return;
    const row = rows.find((r) => r.platformId === editing.platformId);
    requestRoutingChange({
      platformId: editing.platformId,
      platformName: editing.platformName,
      before: row?.mappings ?? {},
      after: editing.draft,
      requestedBy: "Anda (Petugas Admin)",
    });
    showToast("Perubahan routing mapping diajukan untuk persetujuan.");
    setEditing(null);
  }

  return (
    <div>
      <PageHeader
        title="Setup Routing Mapping"
        description="Pemetaan setiap pialang terhadap institusi (Bursa, Kliring, Asosiasi, dan kategori ekosistem lainnya) yang menanganinya. Kolom mengikuti seluruh kategori ekosistem yang sedang aktif."
      />

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Pialang</TableHead>
            {destinationCategories.map((c) => (
              <TableHead key={c.id}>{c.shortDescription}</TableHead>
            ))}
            <TableHead>Terakhir Diperbarui</TableHead>
            <TableHead>Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => {
            const pending = pendingFor(row.platformId);
            return (
              <TableRow key={row.platformId}>
                <TableCell className="font-medium text-navy whitespace-nowrap">{row.platformName}</TableCell>
                {destinationCategories.map((c) => (
                  <TableCell key={c.id} className="whitespace-nowrap">
                    {entityName(row.mappings[c.shortDescription])}
                  </TableCell>
                ))}
                <TableCell className="whitespace-nowrap text-muted">
                  {row.updatedAt ? (
                    <>
                      {row.updatedAt}
                      {row.updatedBy && <div className="text-[11px]">oleh {row.updatedBy}</div>}
                    </>
                  ) : (
                    "-"
                  )}
                  {pending && (
                    <div className="mt-1">
                      <Badge variant="amber" className="gap-1">
                        <Clock3 className="size-3" /> MENUNGGU PERSETUJUAN
                      </Badge>
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  <Button size="sm" variant="outline" disabled={!!pending} onClick={() => startEdit(row)}>
                    <RefreshCw className="size-3.5" /> Perbaharui
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
          {rows.length === 0 && (
            <TableRow>
              <TableCell colSpan={destinationCategories.length + 3} className="text-center text-muted py-6">
                Belum ada pialang terdaftar.
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>

      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Perbaharui Routing Mapping</DialogTitle>
            <DialogDescription>{editing?.platformName}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {editing &&
              destinationCategories.map((cat) => {
                const options = entities.filter(
                  (e) => e.category === cat.shortDescription && e.status === "Disetujui" && !e.disabled
                );
                return (
                  <div key={cat.id}>
                    <Label htmlFor={`routing-${cat.id}`}>Category Ekosistem — {cat.shortDescription}</Label>
                    <Select
                      id={`routing-${cat.id}`}
                      value={editing.draft[cat.shortDescription] || ""}
                      onChange={(e) =>
                        setEditing((prev) => prev && { ...prev, draft: { ...prev.draft, [cat.shortDescription]: e.target.value } })
                      }
                    >
                      <option value="">Belum ditentukan</option>
                      {options.map((o) => (
                        <option key={o.id} value={o.id}>{o.name}</option>
                      ))}
                    </Select>
                  </div>
                );
              })}
          </div>
          <DialogFooter>
            <Button size="sm" variant="secondary" onClick={() => setEditing(null)}>Cancel</Button>
            <Button size="sm" onClick={saveEdit}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
