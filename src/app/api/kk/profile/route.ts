import { KKProfileStatus } from "@prisma/client";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getKKUser } from "@/lib/kk";
import { ageGroup, ASSEMBLY_FREQUENCY, CIVIL_STATUS, CLASSIFICATION, EDUCATION, kkAge, NO_ASSEMBLY_REASON, SPECIFIC_NEEDS, WORK_STATUS } from "@/lib/kk-survey";

export const dynamic = "force-dynamic";

const text = (body: Record<string, unknown>, key: string, max = 120) => {
  const value = body[key];
  return typeof value === "string" && value.trim().length <= max ? value.trim() : "";
};

const oneOf = (value: string, options: readonly string[]) => options.includes(value);

export async function POST(request: Request) {
  const member = await getKKUser();
  if (!member?.email) return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  let body: Record<string, unknown>;
  try { body = await request.json() as Record<string, unknown>; } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }); }
  const profile = await prisma.kKMemberProfile.findUnique({ where: { userId: member.id }, select: { id: true, status: true, barangayId: true } });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });
  if (profile.status !== KKProfileStatus.DRAFT && profile.status !== KKProfileStatus.NEEDS_CORRECTION) return NextResponse.json({ error: "This profile cannot be edited now." }, { status: 409 });

  const firstName = text(body, "firstName", 100);
  const lastName = text(body, "lastName", 100);
  const birthInput = text(body, "birthdate", 10);
  const birthdate = /^\d{4}-\d{2}-\d{2}$/.test(birthInput) ? new Date(`${birthInput}T00:00:00.000Z`) : null;
  if (!firstName || !lastName || !birthdate || Number.isNaN(birthdate.getTime()) || birthdate.toISOString().slice(0, 10) !== birthInput) return NextResponse.json({ error: "Valid name and birthdate are required." }, { status: 400 });
  const age = kkAge(birthdate);
  if (age < 15 || age > 30) return NextResponse.json({ error: "KK profiling is for ages 15 through 30." }, { status: 400 });
  const civilStatus = text(body, "civilStatus");
  const educationalBackground = text(body, "educationalBackground");
  const youthClassification = text(body, "youthClassification");
  const specificNeedsCategory = text(body, "specificNeedsCategory");
  const workStatus = text(body, "workStatus");
  const sexAssignedAtBirth = text(body, "sexAssignedAtBirth");
  const kkAssemblyAttendanceFrequency = text(body, "kkAssemblyAttendanceFrequency");
  const noKkAssemblyReason = text(body, "noKkAssemblyReason");
  if (!oneOf(sexAssignedAtBirth, ["Male", "Female"]) || !oneOf(civilStatus, CIVIL_STATUS) || !oneOf(educationalBackground, EDUCATION) || !oneOf(youthClassification, CLASSIFICATION) || !oneOf(workStatus, WORK_STATUS)) return NextResponse.json({ error: "Choose valid demographic answers." }, { status: 400 });
  if (youthClassification === "Youth with Specific Needs" ? !oneOf(specificNeedsCategory, SPECIFIC_NEEDS) : Boolean(specificNeedsCategory)) return NextResponse.json({ error: "Choose a valid specific needs category." }, { status: 400 });
  const attendedKkAssembly = body.attendedKkAssembly;
  if (attendedKkAssembly === true ? !oneOf(kkAssemblyAttendanceFrequency, ASSEMBLY_FREQUENCY) || Boolean(noKkAssemblyReason) : attendedKkAssembly === false ? !oneOf(noKkAssemblyReason, NO_ASSEMBLY_REASON) || Boolean(kkAssemblyAttendanceFrequency) : true) return NextResponse.json({ error: "Complete the KK assembly answers." }, { status: 400 });
  const voterFields = ["registeredSkVoter", "registeredNationalVoter", "votedLastElection"] as const;
  if (voterFields.some(key => typeof body[key] !== "boolean")) return NextResponse.json({ error: "Complete all voter answers." }, { status: 400 });
  if (body.dataPrivacyConsent !== true || body.profilingConsent !== true || typeof body.aggregateReportingConsent !== "boolean" || typeof body.communicationConsent !== "boolean") return NextResponse.json({ error: "Privacy and profiling consent are required." }, { status: 400 });
  const region = text(body, "region", 80);
  const province = text(body, "province", 80);
  const purokZone = text(body, "purokZone", 120);
  const contactNumber = text(body, "contactNumber", 30);
  if (!region || !province || !purokZone || !/^\+?[0-9 ()-]{7,30}$/.test(contactNumber)) return NextResponse.json({ error: "Complete the location and contact fields." }, { status: 400 });
  const duplicate = await prisma.kKMemberProfile.findFirst({ where: { id: { not: profile.id }, barangayId: profile.barangayId, firstName: { equals: firstName, mode: "insensitive" }, lastName: { equals: lastName, mode: "insensitive" }, birthdate }, select: { id: true } });
  if (duplicate) return NextResponse.json({ error: "A matching profile already exists in this barangay. Contact your SK Chairperson." }, { status: 409 });
  const updated = await prisma.kKMemberProfile.updateMany({
    where: { userId: member.id, status: { in: [KKProfileStatus.DRAFT, KKProfileStatus.NEEDS_CORRECTION] } },
    data: {
      firstName, lastName, middleName: text(body, "middleName", 100) || null, suffix: text(body, "suffix", 30) || null,
      region, province, purokZone, sexAssignedAtBirth, birthdate, age, email: member.email, contactNumber,
      civilStatus, youthAgeGroup: ageGroup(age), educationalBackground, youthClassification,
      specificNeedsCategory: specificNeedsCategory || null, workStatus,
      registeredSkVoter: body.registeredSkVoter as boolean, registeredNationalVoter: body.registeredNationalVoter as boolean,
      votedLastElection: body.votedLastElection as boolean, attendedKkAssembly: attendedKkAssembly as boolean,
      kkAssemblyAttendanceFrequency: kkAssemblyAttendanceFrequency || null, noKkAssemblyReason: noKkAssemblyReason || null,
      dataPrivacyConsent: true, profilingConsent: true, aggregateReportingConsent: body.aggregateReportingConsent as boolean,
      communicationConsent: body.communicationConsent as boolean, consentedAt: new Date(), status: KKProfileStatus.PENDING_VERIFICATION,
      reviewedAt: null,
    },
  });
  if (!updated.count) return NextResponse.json({ error: "Profile status changed. Reload the page." }, { status: 409 });
  return NextResponse.json({ status: KKProfileStatus.PENDING_VERIFICATION });
}
