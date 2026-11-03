import { PageHeader } from "@/components/shared/page-header";
import { RiskBadge } from "@/components/shared/badges";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from "@/components/ui/table";
import { MEMBERS } from "@/lib/mock-data";

export default function KinerjaAnggotaPage() {
  return (
    <div>
      <PageHeader
        title="Kinerja Anggota"
        description="Ringkasan kinerja penanganan pengaduan oleh seluruh anggota (pialang) yang terdaftar."
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Anggota</TableHead>
                <TableHead>Tipe</TableHead>
                <TableHead>Bursa</TableHead>
                <TableHead>Kliring</TableHead>
                <TableHead>Total Kasus</TableHead>
                <TableHead>Handled</TableHead>
                <TableHead>Unhandled</TableHead>
                <TableHead>SLA Breach</TableHead>
                <TableHead>Critical</TableHead>
                <TableHead>Rata-Rata Resolusi</TableHead>
                <TableHead>SLA %</TableHead>
                <TableHead>Risiko</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {MEMBERS.map((m) => (
                <TableRow key={m.name}>
                  <TableCell className="font-medium whitespace-nowrap">{m.name}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.type}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.bursa}</TableCell>
                  <TableCell className="text-muted whitespace-nowrap">{m.kliring}</TableCell>
                  <TableCell>{m.totalCases}</TableCell>
                  <TableCell>{m.handled}</TableCell>
                  <TableCell>{m.unhandled}</TableCell>
                  <TableCell>{m.slaBreach}</TableCell>
                  <TableCell>{m.critical}</TableCell>
                  <TableCell className="whitespace-nowrap">{m.avgResolution}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2 min-w-[100px]">
                      <Progress value={m.slaPercent} className="w-16" />
                      <span className="text-xs text-muted">{m.slaPercent}%</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <RiskBadge risk={m.risk} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
