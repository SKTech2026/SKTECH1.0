import {
  AdmissionStatus,
  OfficialRole,
  OfficialStatus,
  Role,
  UserStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";


type JoinOfficialBody = {
  firstName?: string;
  lastName?: string;
  middleName?: string;
  email?: string;
  contactNo?: string;
  address?: string;
  officialRole?: OfficialRole;
};

type UpdateAdmissionBody = {
  userId?: string;
  status?: UserStatus;
};

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const parseOfficialRole = (value: unknown): OfficialRole =>
  Object.values(OfficialRole).includes(value as OfficialRole)
    ? (value as OfficialRole)
    : OfficialRole.OTHER;

const parseUserStatus = (value: unknown): UserStatus | null =>
  Object.values(UserStatus).includes(value as UserStatus)
    ? (value as UserStatus)
    : null;

const splitName = (fullName: string | null | undefined) => {
  const tokens = (fullName ?? "")
    .split(/\s+/)
    .map((token) => token.trim())
    .filter(Boolean);

  if (tokens.length === 0) {
    return { firstName: "SK", lastName: "Official" };
  }

  if (tokens.length === 1) {
    return { firstName: tokens[0], lastName: "Official" };
  }

  return {
    firstName: tokens[0],
    lastName: tokens.slice(1).join(" "),
  };
};

const requireStaffOrAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.status !== UserStatus.APPROVED) {
    return {
      error: NextResponse.json(
        { error: "Only approved staff/admin accounts can manage admissions." },
        { status: 403 },
      ),
    };
  }

  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  return { session };
};

export async function POST(request: Request) {
  try {
    let body: JoinOfficialBody;
    try {
      body = (await request.json()) as JoinOfficialBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const firstName = body.firstName?.trim() ?? "";
    const lastName = body.lastName?.trim() ?? "";
    const middleName = body.middleName?.trim() || null;
    const email = body.email?.trim().toLowerCase() ?? "";
    const contactNo = body.contactNo?.trim() || null;
    const address = body.address?.trim() || null;
    const role = parseOfficialRole(body.officialRole);

    if (!firstName || !lastName || !email) {
      return NextResponse.json(
        { error: "First name, last name, and email are required." },
        { status: 400 },
      );
    }

    if (!EMAIL_REGEX.test(email)) {
      return NextResponse.json({ error: "A valid email is required." }, { status: 400 });
    }

    const fullName = `${firstName} ${lastName}`;
    const termStart = new Date();

    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        official: {
          select: {
            id: true,
          },
        },
      },
    });

    if (existingUser && existingUser.role !== Role.OFFICIAL) {
      return NextResponse.json(
        { error: "This email is already assigned to a non-official account." },
        { status: 409 },
      );
    }

    const result = await prisma.$transaction(async (tx) => {
      const user = existingUser
        ? await tx.user.update({
            where: { id: existingUser.id },
            data: {
              name: fullName,
              role: Role.OFFICIAL,
              status: UserStatus.PENDING,
              email,
            },
            select: { id: true, status: true, email: true },
          })
        : await tx.user.create({
            data: {
              name: fullName,
              email,
              role: Role.OFFICIAL,
              status: UserStatus.PENDING,
            },
            select: { id: true, status: true, email: true },
          });

      if (existingUser?.official?.id) {
        await tx.sKOfficial.update({
          where: { id: existingUser.official.id },
          data: {
            firstName,
            lastName,
            middleName,
            role,
            status: OfficialStatus.INACTIVE,
            termStart,
            termEnd: null,
            email,
            contactNo,
            address,
          },
        });
      } else {
        await tx.sKOfficial.create({
          data: {
            firstName,
            lastName,
            middleName,
            role,
            status: OfficialStatus.INACTIVE,
            termStart,
            termEnd: null,
            email,
            contactNo,
            address,
            userId: user.id,
          },
        });
      }

      return user;
    });

    return NextResponse.json(
      {
        message: "Official registration submitted. Please wait for staff approval.",
        data: result,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("POST /api/official-requests error:", error);
    return NextResponse.json(
      { error: "Failed to submit official registration." },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  try {
    const guard = await requireStaffOrAdminSession();
    if (guard.error) {
      return guard.error;
    }
    const currentSession = guard.session;
    const staffMunicipalityId =
      currentSession.user.role === Role.STAFF
        ? (currentSession.user.municipalityPresidentId ?? null)
        : null;

    if (currentSession.user.role === Role.STAFF && !staffMunicipalityId) {
      return NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      );
    }

    const { searchParams } = new URL(request.url);
    const statusParam = parseUserStatus(searchParams.get("status"));

    const users = await prisma.user.findMany({
      where: {
        role: Role.OFFICIAL,
        ...(staffMunicipalityId ? { municipalityOfficerId: staffMunicipalityId } : {}),
        ...(statusParam ? { status: statusParam } : {}),
      },
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        municipalityOfficerId: true,
        municipalityAsOfficer: {
          select: {
            id: true,
            name: true,
            province: true,
          },
        },
        createdAt: true,
        official: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            role: true,
            status: true,
            contactNo: true,
            address: true,
          },
        },
      },
    });

    return NextResponse.json({ data: users }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/official-requests error:", error);
    return NextResponse.json(
      { error: "Failed to fetch official requests." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireStaffOrAdminSession();
    if (guard.error) {
      return guard.error;
    }
    const currentSession = guard.session;
    const staffMunicipalityId =
      currentSession.user.role === Role.STAFF
        ? (currentSession.user.municipalityPresidentId ?? null)
        : null;

    if (currentSession.user.role === Role.STAFF && !staffMunicipalityId) {
      return NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      );
    }

    let body: UpdateAdmissionBody;
    try {
      body = (await request.json()) as UpdateAdmissionBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const userId = body.userId?.trim();
    const status = parseUserStatus(body.status);

    if (!userId || !status) {
      return NextResponse.json(
        { error: "userId and valid status are required." },
        { status: 400 },
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        role: true,
        municipalityOfficerId: true,
        official: {
          select: {
            id: true,
          },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found." }, { status: 404 });
    }

    if (user.role !== Role.OFFICIAL) {
      return NextResponse.json(
        { error: "Only OFFICIAL users can be updated through this endpoint." },
        { status: 400 },
      );
    }

    if (
      currentSession.user.role === Role.STAFF &&
      user.municipalityOfficerId !== staffMunicipalityId
    ) {
      return NextResponse.json(
        { error: "You can only update officials within your municipality." },
        { status: 403 },
      );
    }

    const response = await prisma.$transaction(async (tx) => {
      const updatedUser = await tx.user.update({
        where: { id: user.id },
        data: {
          role: Role.OFFICIAL,
          status,
        },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
        },
      });

      const officialStatus =
        status === UserStatus.APPROVED ? OfficialStatus.ACTIVE : OfficialStatus.INACTIVE;
      const profileStatus =
        status === UserStatus.APPROVED
          ? AdmissionStatus.APPROVED
          : status === UserStatus.PENDING
            ? AdmissionStatus.PENDING
            : AdmissionStatus.REJECTED;

      if (user.official?.id) {
        await tx.sKOfficial.update({
          where: { id: user.official.id },
          data: {
            status: officialStatus,
          },
        });
      } else if (status === UserStatus.APPROVED) {
        const parsedName = splitName(user.name);
        await tx.sKOfficial.create({
          data: {
            firstName: parsedName.firstName,
            lastName: parsedName.lastName,
            role: OfficialRole.OTHER,
            status: OfficialStatus.ACTIVE,
            termStart: new Date(),
            userId: user.id,
          },
        });
      }

      await tx.sKOfficialProfile.updateMany({
        where: { userId: user.id },
        data: {
          status: profileStatus,
        },
      });

      return updatedUser;
    });

    return NextResponse.json(
      { message: "Official admission updated.", data: response },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("PATCH /api/official-requests error:", error);
    return NextResponse.json(
      { error: "Failed to update official admission." },
      { status: 500 },
    );
  }
}



