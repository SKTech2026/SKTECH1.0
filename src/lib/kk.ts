import { AdmissionStatus, OfficialPosition, OfficialRole, OfficialStatus, Role, UserStatus } from "@prisma/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function getChairScope() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.OFFICIAL || session.user.status !== UserStatus.APPROVED) return null;
  const official = await prisma.sKOfficial.findUnique({
    where: { userId: session.user.id },
    select: { municipalityId: true, barangayId: true, position: true, role: true, status: true, admissionStatus: true },
  });
  if (!official?.municipalityId || !official.barangayId || official.position !== OfficialPosition.SK_CHAIRPERSON || official.role !== OfficialRole.CHAIRPERSON || official.status !== OfficialStatus.ACTIVE || official.admissionStatus !== AdmissionStatus.APPROVED) return null;
  return { userId: session.user.id, municipalityId: official.municipalityId, barangayId: official.barangayId };
}

export async function getKKUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id || session.user.role !== Role.KK_MEMBER) return null;
  const user = await prisma.user.findUnique({ where: { id: session.user.id }, select: { id: true, email: true, emailVerified: true, role: true, status: true } });
  return user?.role === Role.KK_MEMBER && user.status === UserStatus.APPROVED && user.emailVerified ? user : null;
}

export async function getActiveInvitation(code: string) {
  if (!/^[a-f0-9]{48}$/.test(code)) return null;
  const invitation = await prisma.kKInvitation.findUnique({
    where: { code },
    select: {
      id: true, municipalityId: true, barangayId: true, active: true, expiresAt: true,
      municipality: { select: { name: true, province: true } },
      barangay: { select: { name: true, municipalityId: true } },
      createdBy: { select: { role: true, status: true, official: { select: { role: true, position: true, status: true, admissionStatus: true, municipalityId: true, barangayId: true } } } },
    },
  });
  const official = invitation?.createdBy.official;
  if (!invitation?.active || invitation.expiresAt <= new Date() || invitation.createdBy.role !== Role.OFFICIAL || invitation.createdBy.status !== UserStatus.APPROVED || !official || official.role !== OfficialRole.CHAIRPERSON || official.position !== OfficialPosition.SK_CHAIRPERSON || official.status !== OfficialStatus.ACTIVE || official.admissionStatus !== AdmissionStatus.APPROVED || official.municipalityId !== invitation.municipalityId || official.barangayId !== invitation.barangayId || invitation.barangay.municipalityId !== invitation.municipalityId) return null;
  return invitation;
}
