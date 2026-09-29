import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { COMPLIANCE_LIMITATION, getComplianceMetrics, METRIC_DEFINITIONS } from "@/lib/compliance/metrics";

export const dynamic = "force-dynamic";

function csvCell(value: string | number): string {
  const plain = String(value);
  const safe = /^[\s\u0000-\u001f]*[=+\-@]/u.test(plain) ? `'${plain}` : plain;
  return `"${safe.replace(/"/g, '""')}"`;
}

const csvRow = (values: (string | number)[]) => values.map(csvCell).join(",");

export async function GET() {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;

  try {
    const { generatedAt, summary, indicators, municipalities } = await getComplianceMetrics();
    const lines = [
      csvRow(["SKTECH operational indicators", generatedAt]),
      csvRow(["Limitation", COMPLIANCE_LIMITATION]),
      "",
      csvRow(["Metric", "Value"]),
      ...Object.entries(summary).map(([key, value]) => csvRow([key, value])),
      ...Object.entries(indicators).map(([key, value]) => csvRow([key, value])),
      "",
      csvRow(["Metric definitions"]),
      ...METRIC_DEFINITIONS.map((definition) => csvRow([definition])),
      "",
      csvRow(["Municipality", "Reference barangays", "Registered officials", "Approved officials", "Active officials", "Approved staff", "Linked events", "Attendance logs", "Missing location records", "Operational status"]),
      ...municipalities.map((row) => csvRow([
        row.name, row.barangayCount, row.registeredOfficials, row.approvedOfficials,
        row.activeOfficials, row.approvedStaff, row.eventsLinked, row.attendanceLogs,
        row.missingLocationRecords, row.operationalStatus,
      ])),
    ];

    return new NextResponse(`\uFEFF${lines.join("\r\n")}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="sktech-operational-indicators.csv"',
        "Cache-Control": "private, no-store",
      },
    });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/admin/compliance/export error:", error);
    return NextResponse.json({ error: "Failed to export operational indicators." }, { status: 500 });
  }
}
