import { Role, UserStatus } from "@prisma/client";
import { compare } from "bcryptjs";

type InternalUser = { role: Role; status: UserStatus; password: string | null } | null;

export async function validInternalCredentials(
  user: InternalUser,
  password: string,
  requestedRole?: string,
): Promise<boolean> {
  if (!user?.password || !password ||
      (user.role !== Role.ADMIN && user.role !== Role.STAFF) ||
      user.status !== UserStatus.APPROVED ||
      (requestedRole && requestedRole !== user.role)) return false;
  return compare(password, user.password);
}
