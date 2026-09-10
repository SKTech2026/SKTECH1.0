import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";



type UpdateStaffAccessBody = {
  action?: string;
  userId?: string;
  status?: UserStatus;
  terminationReason?: string;
};

const ALLOWED_STAFF_STATUSES = new Set<UserStatus>([
  UserStatus.APPROVED,
  UserStatus.INACTIVE,
]);

const parseStaffStatus = (value: unknown): UserStatus | null =>
  Object.values(UserStatus).includes(value as UserStatus)
    ? (value as UserStatus)
    : null;

const requireAdminSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== Role.ADMIN || session.user.status !== UserStatus.APPROVED) {
    return {
      error: NextResponse.json(
        { error: "Only approved admin accounts can manage staff access." },
        { status: 403 },
      ),
    };
  }

  const currentUser = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { status: true },
  });
  if (!currentUser || currentUser.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  return { session };
};

export async function GET() {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    const staffUsers = await prisma.user.findMany({
      where: {
        role: Role.STAFF,
      },
      orderBy: {
        createdAt: "desc",
      },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        status: true,
        createdAt: true,
      },
    });

    return NextResponse.json({ data: staffUsers }, { status: 200 });
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/staff-access error:", error);
    return NextResponse.json(
      { error: "Failed to fetch staff access records." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const guard = await requireAdminSession();
    if (guard.error) {
      return guard.error;
    }

    let body: UpdateStaffAccessBody;
    try {
      body = (await request.json()) as UpdateStaffAccessBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const userId = body.userId?.trim();
    const action = body.action;
    const terminationReason = body.terminationReason?.trim() ?? "";

    if (action === "terminate") {
      if (!userId || !terminationReason) {
        return NextResponse.json(
          { error: "userId and terminationReason are required for termination." },
          { status: 400 },
        );
      }
      if (userId === guard.session.user.id) {
        return NextResponse.json({ error: "Admins cannot terminate their own account." }, { status: 400 });
      }

      const existing = await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, role: true, status: true },
      });

      if (!existing) {
        return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
      }
      if (existing.role !== Role.STAFF) {
        return NextResponse.json(
          { error: "This endpoint can only terminate STAFF accounts." },
          { status: 400 },
        );
      }
      if (existing.status === UserStatus.TERMINATED) {
        return NextResponse.json({ error: "Staff account is already terminated." }, { status: 409 });
      }

      const updated = await prisma.$transaction(async (tx) => {
        const result = await tx.user.update({
          where: { id: userId },
          data: {
            status: UserStatus.TERMINATED,
            terminatedAt: new Date(),
            terminatedById: guard.session.user.id,
            terminationReason,
          },
          select: { id: true, status: true },
        });

        await tx.auditLog.create({
          data: {
            action: "TERMINATE_STAFF",
            model: "User",
            recordId: result.id,
            userId: guard.session.user.id,
          },
        });

        return result;
      });

      return NextResponse.json(
        { message: "Staff account terminated successfully.", data: updated },
        { status: 200 },
      );
    }

    if (action !== undefined && action !== null) {
      return NextResponse.json({ error: "Unsupported staff access action." }, { status: 400 });
    }

    const status = parseStaffStatus(body.status);

    if (!userId || !status || !ALLOWED_STAFF_STATUSES.has(status)) {
      return NextResponse.json(
        { error: "userId and status (APPROVED|INACTIVE) are required." },
        { status: 400 },
      );
    }

    const existing = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        role: true,
        status: true,
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Staff account not found." }, { status: 404 });
    }

    if (existing.role !== Role.STAFF) {
      return NextResponse.json(
        { error: "This endpoint can only update STAFF accounts." },
        { status: 400 },
      );
    }

    if (existing.status === UserStatus.TERMINATED) {
      return NextResponse.json(
        { error: "Terminated staff accounts cannot be reactivated or deactivated." },
        { status: 409 },
      );
    }

    const updated = await prisma.user.update({
      where: { id: userId },
      data: {
        status,
      },
      select: {
        id: true,
        status: true,
      },
    });

    return NextResponse.json(
      {
        message: "Staff access updated successfully.",
        data: updated,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("PATCH /api/staff-access error:", error);
    return NextResponse.json(
      { error: "Failed to update staff access." },
      { status: 500 },
    );
  }
}



