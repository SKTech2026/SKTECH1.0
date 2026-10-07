import { Role } from "@prisma/client";
import { NextResponse } from "next/server";

import { requireApiRole } from "@/lib/api-auth";
import { getKkAnalyticsData, resolveKkAnalyticsScope } from "@/lib/kk/analytics";
import { kkAnalyticsCsv } from "@/lib/kk/analytics-export";
import { parseKkAnalyticsRange } from "@/lib/kk/analytics-range";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const guard = await requireApiRole([Role.ADMIN, Role.STAFF, Role.OFFICIAL]);
  if (guard.error) return guard.error;
  const scope = await resolveKkAnalyticsScope();
  if (!scope || scope.role !== guard.session.user.role ||
    (scope.role === Role.STAFF && scope.municipalityId !== guard.session.user.municipalityPresidentId)) {
    return NextResponse.json({ error: "Forbidden." }, { status: 403 });
  }
  const range = parseKkAnalyticsRange(new URL(request.url).searchParams.get("range") ?? undefined);
  try {
    const data = await getKkAnalyticsData(scope, range);
    const now = new Date();
    const dayParts = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now);
    const part = (type: string) => dayParts.find((item) => item.type === type)?.value ?? "00";
    const day = `${part("year")}-${part("month")}-${part("day")}`;
    return new NextResponse(kkAnalyticsCsv(data, now), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="kk-analytics-${scope.role.toLowerCase()}-${range}-${day}.csv"`,
        "Cache-Control": "private, no-store",
        "X-Content-Type-Options": "nosniff",
      },
    });
  } catch {
    return NextResponse.json({ error: "Unable to export KK analytics." }, { status: 500 });
  }
}
