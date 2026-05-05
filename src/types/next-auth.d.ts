import type { Role, UserStatus } from "@prisma/client";
import type { DefaultSession } from "next-auth";
import "next-auth";
import "next-auth/jwt";

declare module "next-auth" {
  interface Session {
    user: DefaultSession["user"] & {
      id: string;
      role: Role;
      status: UserStatus;
      employeeId: string | null;
      municipalityPresidentId: string | null;
      municipalityOfficerId: string | null;
    };
  }

  interface User {
    role?: Role;
    status?: UserStatus;
    employeeId?: string | null;
    municipalityPresidentId?: string | null;
    municipalityOfficerId?: string | null;
    authMethod?: string;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id?: string;
    role?: Role;
    status?: UserStatus;
    employeeId?: string | null;
    municipalityPresidentId?: string | null;
    municipalityOfficerId?: string | null;
  }
}
