import { Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";



const requireAdminOrStaff = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  if (session.user.status !== UserStatus.APPROVED) return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  if (session.user.role !== Role.ADMIN && session.user.role !== Role.STAFF) return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  return { session };
};

export async function DELETE() {
  try {
    const authError = await requireAdminOrStaff();
    if (authError.error) {
      return authError.error;
    }
    return NextResponse.json(
      { error: "Permanent deletion is disabled. Use edit, unpublish, deactivate, or archive instead." },
      { status: 409 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("DELETE /api/events/[id] error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}



