"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { RiskBadge, TrendBadge } from "@/components/shared/badges";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/shared/toast-provider";
import { addSupervisoryAction } from "@/lib/mock-service/supervisory-store";
import { MEMBERS, ACTIVE_BURSA } from "@/lib/mock-data";

function todayLabel(): string {
  return new Date().toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric" });
}

const monitoredMembers = MEMBERS.filter((m) => m.bursa === ACTIVE_BURSA);

export default function PlatformMonitoringPage() {
  const { showToast } = useToast();
  const [expanded, setExpanded] = useState<string | null>(null);
  const [explainOpen, setExplainOpen] = useState<string | null>(null);
  const [explainText, setExplainText] = useState("");

  return (
    <div>
      <PageHeader
        title="Pialang Monitoring"
        description={`Pemantauan kinerja pialang yang berada di bawah supervisi ${ACTIVE_BURSA}.`}
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Pialang</TableHead>
                <TableHead>Total Kasus</TableHead>
                <TableHead>Kasus Terbuka</TableHead>
                <TableHead>Overdue</TableHead>
                <TableHead>Kritis</TableHead>
                <TableHead>Rata-Rata Respon</TableHead>
                <TableHead>SLA %</TableHead>
                <TableHead>Risiko</TableHead>
                <TableHead>Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {monitoredMembers.map((m) => {
                const openCases = m.unhandled + m.slaBreach;
                const isExpanded = expanded === m.name;
                const isExplaining = explainOpen === m.name;
                return (
                  <>
                    <TableRow key={m.name}>
                      <TableCell className="font-medium text-navy">{m.name}</TableCell>
                      <TableCell>{m.totalCases}</TableCell>
                      <TableCell>{openCases}</TableCell>
                      <TableCell className={m.slaBreach > 0 ? "text-red font-medium" : ""}>{m.slaBreach}</TableCell>
                      <TableCell className={m.critical > 0 ? "text-red font-medium" : ""}>{m.critical}</TableCell>
                      <TableCell>{m.avgResolution}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 min-w-[100px]">
                          <Progress value={m.slaPercent} className="h-1.5 w-16" />
                          <span>{m.slaPercent}%</span>
                        </div>
                      </TableCell>
                      <TableCell><RiskBadge risk={m.risk} /></TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1.5">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setExpanded(isExpanded ? null : m.name)}
                          >
                            {isExpanded ? "Tutup Kinerja" : "Lihat Kinerja"}
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => {
                              addSupervisoryAction({
                                date: todayLabel(),
                                platform: m.name,
                                action: "Kirim pengingat supervisi",
                                ticket: "-",
                                due: "-",
                                status: "Berjalan",
                              });
                              showToast(`Pengingat supervisi terkirim ke ${m.name}`);
                            }}
                          >
                            Kirim Pengingat Supervisi
                          </Button>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setExplainOpen(isExplaining ? null : m.name)}
                          >
                            Minta Penjelasan Pialang
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                    {isExpanded && (
                      <TableRow key={`${m.name}-detail`}>
                        <TableCell colSpan={9} className="bg-muted-bg/40">
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 py-2 text-xs">
                            <div>
                              <p className="text-muted text-[11px] uppercase tracking-wide">Kasus Ditangani</p>
                              <p className="font-semibold text-navy text-sm">{m.handled}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[11px] uppercase tracking-wide">Kasus Belum Ditangani</p>
                              <p className="font-semibold text-navy text-sm">{m.unhandled}</p>
                            </div>
                            <div>
                              <p className="text-muted text-[11px] uppercase tracking-wide">Tren</p>
                              <p className="mt-0.5"><TrendBadge trend={m.trend} /></p>
                            </div>
                            <div>
                              <p className="text-muted text-[11px] uppercase tracking-wide">Kategori Dominan</p>
                              <p className="font-semibold text-navy text-sm">{m.category}</p>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                    {isExplaining && (
                      <TableRow key={`${m.name}-explain`}>
                        <TableCell colSpan={9} className="bg-muted-bg/40">
                          <div className="py-2 space-y-2 max-w-xl">
                            <p className="text-xs font-medium text-navy">
                              Permintaan penjelasan kepada {m.name}
                            </p>
                            <Textarea
                              placeholder="Tuliskan pertanyaan atau permintaan penjelasan kepada pialang..."
                              value={explainText}
                              onChange={(e) => setExplainText(e.target.value)}
                            />
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                disabled={!explainText.trim()}
                                onClick={() => {
                                  addSupervisoryAction({
                                    date: todayLabel(),
                                    platform: m.name,
                                    action: `Minta penjelasan: ${explainText.trim()}`,
                                    ticket: "-",
                                    due: "-",
                                    status: "Menunggu Respon",
                                  });
                                  showToast(`Permintaan penjelasan terkirim ke ${m.name}`);
                                  setExplainText("");
                                  setExplainOpen(null);
                                }}
                              >
                                Kirim
                              </Button>
                              <Button variant="outline" size="sm" onClick={() => setExplainOpen(null)}>
                                Batal
                              </Button>
                            </div>
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
