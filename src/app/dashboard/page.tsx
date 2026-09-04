import { Prisma, Role } from "@prisma/client";
import { getServerSession } from "next-auth";
import { prisma } from "@/lib/db";
import { authOptions } from "@/lib/auth";
import { requireRole } from "@/lib/roleGuard";
import DashboardAnalyticsClient, {
  DashboardAnalytics,
} from "./DashboardAnalyticsClient";
import LiveRefreshWrapper from "./LiveRefreshWrapper";

const hourToLabel = (hour: number) => {
  const normalizedHour = ((hour % 24) + 24) % 24;
  const meridiem = normalizedHour >= 12 ? "PM" : "AM";
  const twelveHour = normalizedHour % 12 === 0 ? 12 : normalizedHour % 12;
  return `${twelveHour}:00 ${meridiem}`;
};

const dateToKey = (value: Date) => value.toISOString().slice(0, 10);

const calculateAge = (birthDate: Date | null) => {
  if (!birthDate) return null;
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDelta = today.getMonth() - birthDate.getMonth();
  if (monthDelta < 0 || (monthDelta === 0 && today.getDate() < birthDate.getDate())) {
    age -= 1;
  }
  return age >= 0 ? age : null;
};

const ageGroupFor = (birthDate: Date | null) => {
  const age = calculateAge(birthDate);
  if (age === null) return "Unknown";
  if (age <= 17) return "15-17";
  if (age <= 21) return "18-21";
  if (age <= 24) return "22-24";
  return "25+";
};

const addBreakdown = (map: Map<string, number>, key: string | null | undefined) => {
  const label = key || "Unspecified";
  map.set(label, (map.get(label) ?? 0) + 1);
};

const mapToBreakdown = (map: Map<string, number>) =>
  Array.from(map.entries())
    .map(([label, count]) => ({ label, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const authorizedSession = requireRole(session, [Role.ADMIN, Role.STAFF]);
  const isStaff = authorizedSession.user.role === Role.STAFF;
  const staffMunicipalityId =
    isStaff
      ? (authorizedSession.user.municipalityPresidentId ?? null)
      : null;
  const scopedStaffMunicipalityId = staffMunicipalityId ?? "__unassigned_staff__";
  const officialWhere: Prisma.SKOfficialWhereInput = isStaff
    ? { municipalityId: scopedStaffMunicipalityId }
    : {};
  const attendanceWhere: Prisma.OfficialAttendanceWhereInput = isStaff
    ? { official: { municipalityId: scopedStaffMunicipalityId } }
    : {};
  const eventWhere: Prisma.EventWhereInput = isStaff
    ? {
        officialAttendances: {
          some: {
            official: {
              municipalityId: scopedStaffMunicipalityId,
            },
          },
        },
      }
    : {};

  const [events, attendanceRecords, officials] = await Promise.all([
    prisma.event.findMany({
      where: eventWhere,
      select: {
        id: true,
        title: true,
        eventDate: true,
      },
      orderBy: {
        eventDate: "desc",
      },
    }),
    prisma.officialAttendance.findMany({
      where: attendanceWhere,
      include: {
        official: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    }),
    prisma.sKOfficial.findMany({
      where: officialWhere,
      select: {
        id: true,
        birthDate: true,
        sex: true,
        municipality: true,
        barangay: true,
        sitio: true,
        position: true,
        skFederationOfficer: true,
        skFederationPosition: true,
        status: true,
        admissionStatus: true,
      },
    }),
  ]);

  const totalEvents = events.length;
  const totalAttendance = attendanceRecords.length;
  const checkedInCount = attendanceRecords.filter(
    (record) => record.timeOut === null
  ).length;
  const checkedOutCount = totalAttendance - checkedInCount;
  const activeCheckIns = checkedInCount;
  const uniqueOfficialsCount = new Set(
    attendanceRecords.map((record) => record.officialId)
  ).size;
  const averageAttendancePerEvent =
    totalEvents === 0 ? 0 : totalAttendance / totalEvents;

  const attendanceByEvent = new Map<string, number>();
  let generalAttendanceCount = 0;
  for (const record of attendanceRecords) {
    if (record.eventId) {
      attendanceByEvent.set(
        record.eventId,
        (attendanceByEvent.get(record.eventId) ?? 0) + 1
      );
    } else {
      generalAttendanceCount += 1;
    }
  }

  const attendancePerEvent: DashboardAnalytics["attendancePerEvent"] = events.map((event) => ({
    eventId: event.id,
    eventTitle: event.title,
    count: attendanceByEvent.get(event.id) ?? 0,
  }));

  if (generalAttendanceCount > 0) {
    attendancePerEvent.push({
      eventId: null,
      eventTitle: "General Attendance",
      count: generalAttendanceCount,
    });
  }

  attendancePerEvent.sort((a, b) => b.count - a.count);

  const attendanceTrendMap = new Map<string, number>();
  for (const record of attendanceRecords) {
    const dateKey = dateToKey(record.createdAt);
    attendanceTrendMap.set(
      dateKey,
      (attendanceTrendMap.get(dateKey) ?? 0) + 1
    );
  }

  const attendanceTrend = Array.from(attendanceTrendMap.entries())
    .sort(([dateA], [dateB]) => dateA.localeCompare(dateB))
    .map(([date, count]) => ({
      date,
      label: new Intl.DateTimeFormat("en-US", {
        month: "short",
        day: "numeric",
      }).format(new Date(`${date}T00:00:00.000Z`)),
      count,
    }));

  const officialById = new Map(
    attendanceRecords.map((record) => [
      record.official.id,
      `${record.official.firstName} ${record.official.lastName}`,
    ])
  );
  const officialAttendanceCount = new Map<string, number>();
  for (const record of attendanceRecords) {
    officialAttendanceCount.set(
      record.officialId,
      (officialAttendanceCount.get(record.officialId) ?? 0) + 1
    );
  }
  const mostActiveOfficialEntry = Array.from(officialAttendanceCount.entries())
    .sort((a, b) => b[1] - a[1])[0];
  const mostActiveOfficial = mostActiveOfficialEntry
    ? {
        officialId: mostActiveOfficialEntry[0],
        name:
          officialById.get(mostActiveOfficialEntry[0]) ?? "Unknown Official",
        count: mostActiveOfficialEntry[1],
      }
    : null;

  const highestAttendanceEventEntry = attendancePerEvent[0];
  const highestAttendanceEvent =
    highestAttendanceEventEntry && highestAttendanceEventEntry.count > 0
      ? {
          eventId: highestAttendanceEventEntry.eventId,
          title: highestAttendanceEventEntry.eventTitle,
          count: highestAttendanceEventEntry.count,
        }
      : null;

  const checkInHourMap = new Map<number, number>();
  for (const record of attendanceRecords) {
    const hour = record.timeIn.getHours();
    checkInHourMap.set(hour, (checkInHourMap.get(hour) ?? 0) + 1);
  }
  const peakCheckInHourEntry = Array.from(checkInHourMap.entries()).sort(
    (a, b) => b[1] - a[1]
  )[0];
  const peakCheckInHour = peakCheckInHourEntry
    ? {
        hour: peakCheckInHourEntry[0],
        label: hourToLabel(peakCheckInHourEntry[0]),
        count: peakCheckInHourEntry[1],
      }
    : null;

  const sexMap = new Map<string, number>();
  const ageMap = new Map<string, number>();
  const municipalityMap = new Map<string, number>();
  const barangayMap = new Map<string, number>();
  const sitioMap = new Map<string, number>();
  const positionMap = new Map<string, number>();
  const skfedMap = new Map<string, number>();
  const lifecycleMap = new Map<string, number>();

  for (const official of officials) {
    addBreakdown(sexMap, official.sex);
    addBreakdown(ageMap, ageGroupFor(official.birthDate));
    addBreakdown(municipalityMap, official.municipality);
    addBreakdown(barangayMap, official.barangay);
    addBreakdown(sitioMap, official.sitio);
    addBreakdown(positionMap, official.position);
    addBreakdown(
      skfedMap,
      official.skFederationOfficer
        ? (official.skFederationPosition ?? "SKFED Officer")
        : "Not SKFED",
    );
    addBreakdown(lifecycleMap, `${official.admissionStatus}/${official.status}`);
  }

  const analytics: DashboardAnalytics = {
    totals: {
      totalEvents,
      totalAttendance,
      activeCheckIns,
      uniqueOfficialsCount,
      averageAttendancePerEvent,
      checkedInCount,
      checkedOutCount,
      registeredOfficialsCount: officials.length,
    },
    attendancePerEvent,
    attendanceTrend,
    mostActiveOfficial,
    highestAttendanceEvent,
    peakCheckInHour,
    profile: {
      sexBreakdown: mapToBreakdown(sexMap),
      ageBreakdown: mapToBreakdown(ageMap),
      municipalityBreakdown: mapToBreakdown(municipalityMap),
      barangayBreakdown: mapToBreakdown(barangayMap),
      sitioBreakdown: mapToBreakdown(sitioMap),
      positionBreakdown: mapToBreakdown(positionMap),
      skFederationBreakdown: mapToBreakdown(skfedMap),
      lifecycleBreakdown: mapToBreakdown(lifecycleMap),
      missingOptionalDimensions: ["education", "employment", "ip affiliation"],
    },
  };

  return (
    <LiveRefreshWrapper>
      <div className="space-y-6">
        <div className="rounded-xl border border-glass-border bg-surface-elevated px-6 py-5 shadow-xl">
          <h1 className="text-3xl font-semibold text-foreground">
            Governance Analytics Command Center
          </h1>
          <p className="mt-2 text-sm text-muted">
            Strategic attendance intelligence across events and officials.
          </p>
        </div>

        <DashboardAnalyticsClient analytics={analytics} />
      </div>
    </LiveRefreshWrapper>
  );
}
