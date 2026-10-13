import {
  KKProfileStatus,
  OfficialPosition,
  Prisma,
  Role,
  SKFederationPosition,
} from "@prisma/client";
import { NextResponse } from "next/server";

import { sendAccountDeletedEmail, sendAccountUpdatedEmail } from "@/lib/admin-account-email";
import { requireApiRole } from "@/lib/api-auth";
import { prisma } from "@/lib/db";
import { logAudit } from "@/lib/audit";
import {
  ASSEMBLY_FREQUENCY,
  CIVIL_STATUS,
  CLASSIFICATION,
  EDUCATION,
  ageGroup,
  kkAge,
  NO_ASSEMBLY_REASON,
  SPECIFIC_NEEDS,
  WORK_STATUS,
} from "@/lib/kk-survey";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ userId: string }> };
type Input = Record<string, unknown>;

class RequestError extends Error {}

function has(input: Input, key: string) {
  return Object.prototype.hasOwnProperty.call(input, key);
}

function readText(input: Input, key: string, max = 120, nullable = false): string | null | undefined {
  if (!has(input, key)) return undefined;
  const value = input[key];
  if (value === null && nullable) return null;
  if (typeof value !== "string") throw new RequestError(`${key} must be text.`);
  const clean = value.normalize("NFC").replace(/[\u0000-\u001F\u007F]/g, " ").trim();
  if (clean.length > max) throw new RequestError(`${key} is too long.`);
  return clean || (nullable ? null : "");
}

function readBoolean(input: Input, key: string): boolean | undefined {
  if (!has(input, key)) return undefined;
  if (typeof input[key] !== "boolean") throw new RequestError(`${key} must be true or false.`);
  return input[key] as boolean;
}

function readChoice(input: Input, key: string, choices: readonly string[], nullable = false) {
  const value = readText(input, key, 120, nullable);
  if (value === undefined || value === null || value === "") return value;
  if (!choices.includes(value)) throw new RequestError(`Choose a valid ${key}.`);
  return value;
}

function readBirthdate(input: Input): Date | null | undefined {
  const value = readText(input, "birthdate", 10, true);
  if (value === undefined) return undefined;
  if (value === null || value === "") return null;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new RequestError("Enter a valid birthdate.");
  const date = new Date(`${value}T00:00:00.000Z`);
  if (Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== value) {
    throw new RequestError("Enter a valid birthdate.");
  }
  const age = kkAge(date);
  if (age < 15 || age > 30) throw new RequestError("KK Members must be between 15 and 30 years old.");
  return date;
}

const accountSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  status: true,
  createdAt: true,
  updatedAt: true,
  official: {
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      contactNo: true,
      municipality: true,
      barangay: true,
      municipalityId: true,
      barangayId: true,
      position: true,
      skFederationOfficer: true,
      skFederationPosition: true,
      status: true,
      admissionStatus: true,
      municipalityRef: { select: { id: true, name: true } },
      barangayRef: { select: { id: true, name: true } },
    },
  },
  skOfficialProfile: {
    select: {
      firstName: true,
      middleName: true,
      lastName: true,
      municipality: true,
      province: true,
      barangay: true,
      position: true,
    },
  },
  kkProfile: {
    select: {
      id: true,
      email: true,
      firstName: true,
      middleName: true,
      lastName: true,
      suffix: true,
      contactNumber: true,
      region: true,
      province: true,
      purokZone: true,
      sexAssignedAtBirth: true,
      birthdate: true,
      civilStatus: true,
      educationalBackground: true,
      youthClassification: true,
      specificNeedsCategory: true,
      workStatus: true,
      registeredSkVoter: true,
      registeredNationalVoter: true,
      votedLastElection: true,
      attendedKkAssembly: true,
      kkAssemblyAttendanceFrequency: true,
      noKkAssemblyReason: true,
      status: true,
      municipalityId: true,
      barangayId: true,
      municipality: { select: { id: true, name: true } },
      barangay: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.UserSelect;

export async function GET(_request: Request, context: RouteContext) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;
  const { userId } = await context.params;

  const account = await prisma.user.findFirst({
    where: { id: userId, role: { in: [Role.OFFICIAL, Role.KK_MEMBER] } },
    select: accountSelect,
  });
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });

  return NextResponse.json({ account: { ...account, email: account.kkProfile?.email ?? account.email } }, { headers: { "Cache-Control": "no-store" } });
}

export async function PATCH(request: Request, context: RouteContext) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;
  const { userId } = await context.params;
  let input: Input;
  try {
    input = await request.json() as Input;
  } catch {
    return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  }

  try {
    const account = await prisma.user.findFirst({
      where: { id: userId, role: { in: [Role.OFFICIAL, Role.KK_MEMBER] } },
      select: accountSelect,
    });
    if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
    const accountEmail = account.kkProfile?.email ?? account.email;

    const nameSource = account.role === Role.KK_MEMBER
      ? account.kkProfile
      : account.official ?? account.skOfficialProfile;
    const firstName = (readText(input, "firstName", 100) ?? nameSource?.firstName ?? "").trim();
    const middleInput = readText(input, "middleName", 100, true);
    const middleName = middleInput === undefined ? nameSource?.middleName ?? null : middleInput;
    const lastName = (readText(input, "lastName", 100) ?? nameSource?.lastName ?? "").trim();
    const suffix = readText(input, "suffix", 30, true);
    const hasNameEdit = ["firstName", "middleName", "lastName", "suffix"].some((key) => has(input, key));
    if (hasNameEdit && (!firstName || !lastName)) {
      throw new RequestError("First and last name are required.");
    }

    const userData: Prisma.UserUpdateInput = {};
    if (hasNameEdit) userData.name = [firstName, middleName, lastName, suffix ?? ""].filter(Boolean).join(" ");
    const contactKey = account.role === Role.OFFICIAL ? "contactNumber" : "contactNumber";
    const contact = readText(input, contactKey, 30, true);
    if (contact !== undefined && contact !== null && contact && !/^\+?[0-9 ()-]{7,30}$/.test(contact)) {
      throw new RequestError("Enter a valid contact number.");
    }

    const municipalityIdInput = readText(input, "municipalityId", 80, true);
    const barangayIdInput = readText(input, "barangayId", 80, true);
    const locationEdited = municipalityIdInput !== undefined || barangayIdInput !== undefined;
    let location: { municipality: { id: string; name: string; province: string }; barangay: { id: string; name: string } } | null = null;
    if (locationEdited) {
      const municipalityId = municipalityIdInput ?? account.kkProfile?.municipalityId ?? account.official?.municipalityId ?? null;
      const barangayId = barangayIdInput ?? account.kkProfile?.barangayId ?? account.official?.barangayId ?? null;
      if (municipalityId && barangayId) {
        const [municipality, barangay] = await Promise.all([
          prisma.municipality.findUnique({ where: { id: municipalityId }, select: { id: true, name: true, province: true } }),
          prisma.barangay.findUnique({ where: { id: barangayId }, select: { id: true, name: true, municipalityId: true } }),
        ]);
        if (!municipality || !barangay || barangay.municipalityId !== municipality.id) {
          throw new RequestError("Choose a barangay within the selected municipality.");
        }
        location = { municipality, barangay };
      } else if (account.role === Role.KK_MEMBER || (account.skOfficialProfile && (!municipalityId || !barangayId))) {
        throw new RequestError("Choose both a municipality and barangay.");
      }
    }

    const officialData: Prisma.SKOfficialUncheckedUpdateInput = {};
    const officialProfileData: Prisma.SKOfficialProfileUncheckedUpdateInput = {};
    const kkData: Prisma.KKMemberProfileUncheckedUpdateInput = {};
    if (account.role === Role.OFFICIAL) {
      if (has(input, "firstName")) officialData.firstName = firstName;
      if (has(input, "middleName")) officialData.middleName = middleName;
      if (has(input, "lastName")) officialData.lastName = lastName;
      if (suffix !== undefined) officialData.suffix = suffix;
      if (contact !== undefined) officialData.contactNo = contact;
      if (locationEdited) {
        officialData.municipalityId = location?.municipality.id ?? null;
        officialData.barangayId = location?.barangay.id ?? null;
        officialData.municipality = location?.municipality.name ?? null;
        officialData.barangay = location?.barangay.name ?? null;
        if (account.skOfficialProfile && location) {
          officialProfileData.province = location.municipality.province;
          officialProfileData.municipality = location.municipality.name;
          officialProfileData.barangay = location.barangay.name;
        }
      }
      const position = readText(input, "position", 40, true);
      if (position !== undefined) {
        if (position !== null && !Object.values(OfficialPosition).includes(position as OfficialPosition)) {
          throw new RequestError("Choose a valid official position.");
        }
        officialData.position = position as OfficialPosition | null;
        officialProfileData.position = position as OfficialPosition;
      }
      const federationOfficer = readBoolean(input, "skFederationOfficer");
      const federationPosition = readText(input, "skFederationPosition", 40, true);
      if (federationOfficer !== undefined) officialData.skFederationOfficer = federationOfficer;
      if (federationOfficer === false && federationPosition === undefined) officialData.skFederationPosition = null;
      if (federationPosition !== undefined) {
        if (federationPosition !== null && !Object.values(SKFederationPosition).includes(federationPosition as SKFederationPosition)) {
          throw new RequestError("Choose a valid federation position.");
        }
        officialData.skFederationPosition = federationPosition as SKFederationPosition | null;
        if (federationPosition) officialData.skFederationOfficer = true;
      }
      if (hasNameEdit) {
        officialProfileData.firstName = firstName;
        officialProfileData.middleName = middleName;
        officialProfileData.lastName = lastName;
      }
      if (!account.official && (contact !== undefined || has(input, "skFederationOfficer") || has(input, "skFederationPosition"))) {
        throw new RequestError("This legacy Official profile does not store those fields.");
      }
      if (position === null && account.skOfficialProfile) {
        throw new RequestError("Position cannot be cleared while this legacy profile exists.");
      }
    } else if (account.kkProfile) {
      if (has(input, "firstName")) kkData.firstName = firstName;
      if (has(input, "middleName")) kkData.middleName = middleName;
      if (has(input, "lastName")) kkData.lastName = lastName;
      if (suffix !== undefined) kkData.suffix = suffix;
      if (contact !== undefined) kkData.contactNumber = contact;
      if (locationEdited) {
        kkData.municipalityId = location!.municipality.id;
        kkData.barangayId = location!.barangay.id;
        kkData.province = location!.municipality.province;
      }
      const region = readText(input, "region", 80);
      const purokZone = readText(input, "purokZone", 120);
      if (region !== undefined) kkData.region = region;
      if (purokZone !== undefined) kkData.purokZone = purokZone;
      const birthdate = readBirthdate(input);
      if (birthdate !== undefined) {
        if (birthdate === null && account.kkProfile.status === KKProfileStatus.VERIFIED) {
          throw new RequestError("A verified KK profile must keep its birthdate.");
        }
        kkData.birthdate = birthdate;
        const age = birthdate ? kkAge(birthdate) : null;
        kkData.age = age;
        kkData.youthAgeGroup = age === null ? null : ageGroup(age);
      }
      const choices: Array<[string, readonly string[], keyof Prisma.KKMemberProfileUncheckedUpdateInput]> = [
        ["sexAssignedAtBirth", ["Male", "Female"], "sexAssignedAtBirth"],
        ["civilStatus", CIVIL_STATUS, "civilStatus"],
        ["educationalBackground", EDUCATION, "educationalBackground"],
        ["youthClassification", CLASSIFICATION, "youthClassification"],
        ["specificNeedsCategory", SPECIFIC_NEEDS, "specificNeedsCategory"],
        ["workStatus", WORK_STATUS, "workStatus"],
        ["kkAssemblyAttendanceFrequency", ASSEMBLY_FREQUENCY, "kkAssemblyAttendanceFrequency"],
        ["noKkAssemblyReason", NO_ASSEMBLY_REASON, "noKkAssemblyReason"],
      ];
      for (const [key, values, field] of choices) {
        const value = readChoice(input, key, values, true);
        if (value !== undefined) (kkData[field] as unknown) = value;
      }
      for (const key of ["registeredSkVoter", "registeredNationalVoter", "votedLastElection", "attendedKkAssembly"] as const) {
        const value = readBoolean(input, key);
        if (value !== undefined) kkData[key] = value;
      }
      if (kkData.attendedKkAssembly === true) kkData.noKkAssemblyReason = null;
      if (kkData.attendedKkAssembly === false) kkData.kkAssemblyAttendanceFrequency = null;
      if (kkData.youthClassification && kkData.youthClassification !== "Youth with Specific Needs") {
        kkData.specificNeedsCategory = null;
      }
    }

    const hasProfileEdits = Object.keys(officialData).length > 0 || Object.keys(officialProfileData).length > 0 || Object.keys(kkData).length > 0;
    const simpleName = readText(input, "name", 180);
    if (!hasProfileEdits && !hasNameEdit && simpleName === undefined) {
      throw new RequestError("Choose at least one safe account field to update.");
    }
    userData.updatedAt = new Date();
    if (simpleName !== undefined && !hasNameEdit) userData.name = simpleName;

    if (account.role === Role.OFFICIAL && hasProfileEdits && !account.official && !account.skOfficialProfile) {
      throw new RequestError("This Official has no profile record to update.");
    }
    if (account.role === Role.KK_MEMBER && hasProfileEdits && !account.kkProfile) {
      throw new RequestError("This KK Member has no profile record to update.");
    }

    if (account.kkProfile && account.kkProfile.status === KKProfileStatus.VERIFIED && (hasNameEdit || has(input, "birthdate"))) {
      const finalBirthdate = has(input, "birthdate") ? readBirthdate(input) : account.kkProfile.birthdate;
      if (finalBirthdate) {
        const duplicate = await prisma.kKMemberProfile.findFirst({
          where: {
            id: { not: account.kkProfile.id },
            status: KKProfileStatus.VERIFIED,
            firstName: { equals: firstName, mode: "insensitive" },
            middleName: middleName ? { equals: middleName, mode: "insensitive" } : null,
            lastName: { equals: lastName, mode: "insensitive" },
            birthdate: finalBirthdate,
          },
          select: { id: true },
        });
        if (duplicate) throw new RequestError("This correction matches another approved KK registration and cannot be saved.");
      }
    }

    await prisma.$transaction(async (tx) => {
      if (Object.keys(userData).length > 0) {
        await tx.user.update({ where: { id: userId }, data: userData });
      }
      if (account.official && Object.keys(officialData).length > 0) {
        await tx.sKOfficial.update({ where: { userId }, data: officialData });
      }
      if (account.skOfficialProfile && Object.keys(officialProfileData).length > 0) {
        await tx.sKOfficialProfile.update({ where: { userId }, data: officialProfileData });
      }
      if (account.kkProfile && Object.keys(kkData).length > 0) {
        await tx.kKMemberProfile.update({ where: { userId }, data: kkData });
      }
    });

    await logAudit({ userId: guard.session.user.id, action: "ADMIN_ACCOUNT_UPDATED", model: "User", recordId: userId });
    let notificationSent = false;
    if (accountEmail) {
      try {
        await sendAccountUpdatedEmail(accountEmail);
        notificationSent = true;
      } catch {
        notificationSent = false;
      }
    }
    return NextResponse.json({ updated: true, notificationSent });
  } catch (error) {
    const status = error instanceof RequestError ? 400 : 500;
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to update account." }, { status });
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  const guard = await requireApiRole([Role.ADMIN]);
  if (guard.error) return guard.error;
  const { userId } = await context.params;
  let input: Input;
  try {
    input = await request.json() as Input;
  } catch {
    return NextResponse.json({ error: "Type DELETE or the account email to confirm." }, { status: 400 });
  }

  const account = await prisma.user.findFirst({
    where: { id: userId, role: { in: [Role.OFFICIAL, Role.KK_MEMBER] } },
    select: { id: true, email: true, role: true, kkProfile: { select: { email: true } } },
  });
  if (!account) return NextResponse.json({ error: "Account not found." }, { status: 404 });
  const accountEmail = account.kkProfile?.email ?? account.email;
  const confirmation = typeof input.confirmation === "string" ? input.confirmation.trim() : "";
  const confirmed = confirmation === "DELETE" || Boolean(accountEmail && confirmation.toLowerCase() === accountEmail.toLowerCase());
  if (!confirmed) {
    return NextResponse.json({ error: "Type DELETE or the account email exactly to confirm." }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      if (accountEmail) {
        const email = { equals: accountEmail, mode: "insensitive" as const };
        await Promise.all([
          tx.kKRegistrationOTP.deleteMany({ where: { email } }),
          tx.officialOTP.deleteMany({ where: { email } }),
          tx.verificationCode.deleteMany({ where: { email } }),
        ]);
      }
      if (account.role === Role.OFFICIAL) {
        const invitations = await tx.kKInvitation.findMany({ where: { createdById: userId }, select: { id: true } });
        const invitationIds = invitations.map((item) => item.id);
        if (invitationIds.length) {
          await Promise.all([
            tx.kKInvitation.updateMany({ where: { id: { in: invitationIds } }, data: { active: false } }),
            tx.kKRegistrationOTP.deleteMany({ where: { invitationId: { in: invitationIds } } }),
          ]);
        }
        await tx.sKOfficial.deleteMany({ where: { userId } });
      }
      await tx.auditLog.create({
        data: {
          userId: guard.session.user.id,
          action: "ADMIN_ACCOUNT_PERMANENTLY_DELETED",
          model: "User",
          recordId: userId,
        },
      });
      await tx.user.delete({ where: { id: userId } });
    });
  } catch {
    return NextResponse.json({ error: "Account could not be deleted safely. No records were removed." }, { status: 409 });
  }

  let notificationSent = false;
  if (accountEmail) {
    try {
      await sendAccountDeletedEmail(accountEmail);
      notificationSent = true;
    } catch {
      notificationSent = false;
    }
  }
  return NextResponse.json({ deleted: true, notificationSent });
}
