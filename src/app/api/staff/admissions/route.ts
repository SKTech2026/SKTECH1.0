import {
  AdmissionStatus,
  OfficialStatus,
  Role,
  UserStatus,
} from "@prisma/client";
import { getServerSession } from "next-auth";
import { NextRequest, NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";


type UpdateAdmissionBody = {
  id?: string;
  action?: "APPROVE" | "REJECT";
  reason?: string | null;
};

const OFFICIAL_PORTAL_URL = "https://sktech-ormin.com/official/auth";

function getOfficialFullName(official: {
  firstName: string;
  middleName: string | null;
  lastName: string;
}) {
  return [official.firstName, official.middleName, official.lastName]
    .filter(Boolean)
    .join(" ");
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

const requireStaffSession = async () => {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized." }, { status: 401 }) };
  }

  if (session.user.role !== Role.STAFF) {
    return { error: NextResponse.json({ error: "Forbidden." }, { status: 403 }) };
  }

  if (session.user.status !== UserStatus.APPROVED) {
    return { error: NextResponse.json({ error: "Account is not approved." }, { status: 403 }) };
  }

  if (!session.user.municipalityPresidentId) {
    return {
      error: NextResponse.json(
        { error: "Staff account is not assigned to a municipality." },
        { status: 403 },
      ),
    };
  }

  return { session };
};

export async function GET(request: NextRequest) {
  try {
    const guard = await requireStaffSession();
    if (guard.error) {
      return guard.error;
    }

    const staffMunicipalityId = guard.session.user.municipalityPresidentId!;
    const q = request.nextUrl.searchParams.get("q")?.trim() ?? "";
    const municipalityFilter = request.nextUrl.searchParams.get("municipalityId")?.trim() ?? "";

    if (municipalityFilter && municipalityFilter !== staffMunicipalityId) {
      return NextResponse.json(
        { error: "You can only review admissions for your assigned municipality." },
        { status: 403 },
      );
    }

    const records = await prisma.sKOfficial.findMany({
      where: {
        municipalityId: staffMunicipalityId,
        admissionStatus: AdmissionStatus.PENDING,
        ...(q
          ? {
              OR: [
                { firstName: { contains: q, mode: "insensitive" } },
                { middleName: { contains: q, mode: "insensitive" } },
                { lastName: { contains: q, mode: "insensitive" } },
                { email: { contains: q, mode: "insensitive" } },
                { barangay: { contains: q, mode: "insensitive" } },
                { municipality: { contains: q, mode: "insensitive" } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        userId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        birthDate: true,
        province: true,
        email: true,
        contactNo: true,
        address: true,
        municipalityId: true,
        municipality: true,
        barangay: true,
        position: true,
        dateElected: true,
        termEnd: true,
        proofDocumentUrl: true,
        proofDocumentName: true,
        proofDocumentType: true,
        admissionStatus: true,
        createdAt: true,
        user: {
          select: {
            status: true,
          },
        },
      },
    });

    const staffMunicipality = await prisma.municipality.findUnique({
      where: { id: staffMunicipalityId },
      select: {
        id: true,
        name: true,
        province: true,
      },
    });

    return NextResponse.json(
      {
        data: records,
        filters: {
          municipalities: staffMunicipality ? [staffMunicipality] : [],
        },
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("GET /api/staff/admissions error:", error);
    return NextResponse.json({ error: "Failed to load admissions queue." }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const guard = await requireStaffSession();
    if (guard.error) {
      return guard.error;
    }

    const reviewerId = guard.session.user.id;
    const staffMunicipalityId = guard.session.user.municipalityPresidentId!;

    let body: UpdateAdmissionBody;
    try {
      body = (await request.json()) as UpdateAdmissionBody;
    } catch {
      return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
    }

    const id = body.id?.trim() ?? "";
    const action = body.action;
    const reason = body.reason?.trim() || null;

    if (!id || (action !== "APPROVE" && action !== "REJECT")) {
      return NextResponse.json({ error: "id and valid action are required." }, { status: 400 });
    }

    if (action === "REJECT" && (!reason || reason.length < 3)) {
      return NextResponse.json(
        { error: "Rejection reason is required (minimum 3 characters)." },
        { status: 400 },
      );
    }

    const existing = await prisma.sKOfficial.findFirst({
      where: {
        id,
        municipalityId: staffMunicipalityId,
      },
      select: {
        id: true,
        userId: true,
        firstName: true,
        middleName: true,
        lastName: true,
        email: true,
        municipality: true,
        admissionStatus: true,
        user: {
          select: {
            email: true,
          },
        },
      },
    });

    if (!existing) {
      return NextResponse.json({ error: "Admission record not found." }, { status: 404 });
    }

    if (existing.admissionStatus !== AdmissionStatus.PENDING) {
      return NextResponse.json(
        { error: "Only pending admissions can be reviewed." },
        { status: 409 },
      );
    }

    const now = new Date();
    const approved = action === "APPROVE";

    const updated = await prisma.$transaction(async (tx) => {
      const official = await tx.sKOfficial.update({
        where: { id: existing.id },
        data: {
          admissionStatus: approved ? AdmissionStatus.APPROVED : AdmissionStatus.REJECTED,
          status: approved ? OfficialStatus.ACTIVE : OfficialStatus.INACTIVE,
          rejectionReason: approved ? null : reason,
          approvedBy: reviewerId,
          approvedAt: now,
        },
        select: {
          id: true,
          admissionStatus: true,
          status: true,
          rejectionReason: true,
          approvedBy: true,
          approvedAt: true,
        },
      });

      if (existing.userId) {
        await tx.user.update({
          where: { id: existing.userId },
          data: {
            status: approved ? UserStatus.APPROVED : UserStatus.REJECTED,
            municipalityOfficerId: staffMunicipalityId,
          },
        });
      }

      await tx.auditLog.create({
        data: {
          action: approved ? "APPROVE_OFFICIAL_ADMISSION" : "REJECT_OFFICIAL_ADMISSION",
          model: "SKOfficial",
          recordId: existing.id,
          userId: reviewerId,
        },
      });

      return official;
    });

    let notificationSent = false;
    if (approved) {
      const recipient = existing.email ?? existing.user?.email;
      if (recipient) {
        const officialName = getOfficialFullName(existing);
        const escapedName = escapeHtml(officialName);
        const escapedMunicipality = existing.municipality
          ? escapeHtml(existing.municipality)
          : null;

        try {
          await sendEmail({
            to: recipient,
            subject: "SKTECH Official Admission Approved",
            text: `Good day, ${officialName},

Your Official Admission has been approved by your Municipal SK Federation Staff.

You may now access the full SKTECH Official Dashboard, including your Digital ID, announcements, attendance records, chat, and other approved features.

You can sign in at:
${OFFICIAL_PORTAL_URL}

Thank you,
SKTECH
Oriental Mindoro SK Federation E-Governance`,
            html: `
              <div style="font-family: Arial, sans-serif; background: #f6f9ff; padding: 24px; color: #06132d;">
                <div style="max-width: 560px; margin: 0 auto; background: #ffffff; border: 1px solid #dbe7ff; border-radius: 16px; overflow: hidden;">
                  <div style="background: #06132d; color: #ffffff; padding: 20px 24px;">
                    <p style="margin: 0; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: #f3c72b;">SKTECH</p>
                    <h1 style="margin: 8px 0 0; font-size: 22px;">Official Admission Approved</h1>
                  </div>
                  <div style="padding: 24px;">
                    <p style="margin: 0 0 14px;">Good day, <strong>${escapedName}</strong>,</p>
                    <p style="margin: 0 0 14px;">Your Official Admission has been approved by your Municipal SK Federation Staff.</p>
                    ${
                      escapedMunicipality
                        ? `<p style="margin: 0 0 14px;">Municipality: <strong>${escapedMunicipality}</strong></p>`
                        : ""
                    }
                    <p style="margin: 0 0 20px;">You may now access the full SKTECH Official Dashboard, including your Digital ID, announcements, attendance records, chat, and other approved features.</p>
                    <a href="${OFFICIAL_PORTAL_URL}" style="display: inline-block; background: #1452d9; color: #ffffff; text-decoration: none; font-weight: 700; padding: 12px 18px; border-radius: 10px;">Open SKTECH Official Portal</a>
                    <p style="margin: 24px 0 0; color: #5b6478; font-size: 13px;">Thank you,<br />SKTECH<br />Oriental Mindoro SK Federation E-Governance</p>
                  </div>
                </div>
              </div>
            `,
          });
          notificationSent = true;
        } catch (emailError) {
          console.warn("Official admission approval email failed.", {
            officialId: existing.id,
            error:
              emailError instanceof Error
                ? emailError.message
                : "Unknown email error",
          });
        }
      }
    }

    return NextResponse.json(
      {
        message: approved ? "Admission approved." : "Admission rejected.",
        data: updated,
        notificationSent,
      },
      { status: 200 },
    );
  } catch (error) {
    if (process.env.NODE_ENV !== "production") console.error("PATCH /api/staff/admissions error:", error);
    return NextResponse.json({ error: "Failed to update admission." }, { status: 500 });
  }
}



