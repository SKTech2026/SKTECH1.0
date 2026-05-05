import { PrismaAdapter } from "@auth/prisma-adapter";
import { OfficialOtpPurpose, Role, UserStatus } from "@prisma/client";
import { compare } from "bcryptjs";
import type { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";

import { prisma } from "@/lib/db";

const CREDENTIAL_ROLES = new Set<Role>([Role.ADMIN, Role.STAFF]);
const OTP_PATTERN = /^\d{6}$/;
const AUTH_SECRET =
  process.env.NEXTAUTH_SECRET?.trim() ||
  process.env.AUTH_SECRET?.trim() ||
  process.env.FACE_SECRET?.trim();

if (!process.env.NEXTAUTH_URL) {
  const derivedBaseUrl =
    process.env.AUTH_URL?.trim() ||
    process.env.NEXT_PUBLIC_BASE_URL?.trim() ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "");

  if (derivedBaseUrl) {
    process.env.NEXTAUTH_URL = derivedBaseUrl;
  }
}

type SafeUserSelect = {
  id: string;
  role: Role;
  status: UserStatus;
  employeeId: string | null;
  municipalityPresidentId: string | null;
  municipalityOfficerId: string | null;
};

const isMissingColumnError = (error: unknown) =>
  Boolean(
    error &&
      typeof error === "object" &&
      "code" in error &&
      (error as { code?: string }).code === "P2022",
  );

const isDatabaseConnectionError = (error: unknown) => {
  const message =
    error instanceof Error
      ? [error.message, error.cause instanceof Error ? error.cause.message : ""].join(" ")
      : JSON.stringify(error);

  return /tenant\/user|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|connection|database/i.test(message);
};

const getUserByEmailSafe = async (email: string) => {
  try {
    return await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        password: true,
        image: true,
        role: true,
        status: true,
        municipalityPresidentId: true,
        municipalityOfficerId: true,
      },
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        password: true,
        image: true,
        role: true,
        status: true,
      },
    });

    return fallback
      ? {
          ...fallback,
          municipalityPresidentId: null,
          municipalityOfficerId: null,
        }
      : null;
  }
};

const getUserByEmployeeIdSafe = async (employeeId: string) => {
  try {
    return await prisma.user.findUnique({
      where: { employeeId },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        password: true,
        role: true,
        status: true,
        image: true,
        municipalityPresidentId: true,
        municipalityOfficerId: true,
      },
    });
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await prisma.user.findUnique({
      where: { employeeId },
      select: {
        id: true,
        employeeId: true,
        name: true,
        email: true,
        password: true,
        role: true,
        status: true,
        image: true,
      },
    });

    return fallback
      ? {
          ...fallback,
          municipalityPresidentId: null,
          municipalityOfficerId: null,
        }
      : null;
  }
};

const getUserTokenFieldsByEmailSafe = async (
  email: string,
): Promise<SafeUserSelect | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        status: true,
        employeeId: true,
        municipalityPresidentId: true,
        municipalityOfficerId: true,
      },
    });
    return user;
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        role: true,
        status: true,
        employeeId: true,
      },
    });

    return fallback
      ? {
          ...fallback,
          municipalityPresidentId: null,
          municipalityOfficerId: null,
        }
      : null;
  }
};

const getUserTokenFieldsByIdSafe = async (
  id: string,
): Promise<SafeUserSelect | null> => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
        employeeId: true,
        municipalityPresidentId: true,
        municipalityOfficerId: true,
      },
    });
    return user;
  } catch (error) {
    if (!isMissingColumnError(error)) {
      throw error;
    }

    const fallback = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        status: true,
        employeeId: true,
      },
    });

    return fallback
      ? {
          ...fallback,
          municipalityPresidentId: null,
          municipalityOfficerId: null,
        }
      : null;
  }
};

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: AUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  session: {
    strategy: "jwt",
  },
  providers: (() => {
    const providers: NextAuthOptions["providers"] = [
      CredentialsProvider({
        name: "Credentials",
        credentials: {
          userId: { label: "User ID", type: "text" },
          password: { label: "Password", type: "password" },
          role: { label: "Role", type: "text" },
          officialEmail: { label: "Official Email", type: "email" },
          officialPassword: { label: "Official Password", type: "password" },
          officialOtp: { label: "Official OTP", type: "text" },
        },
        async authorize(credentials) {
          try {
            const officialEmail = credentials?.officialEmail?.trim().toLowerCase();
            const officialPassword = credentials?.officialPassword;
            const officialOtp = credentials?.officialOtp?.trim();

            if (officialEmail && officialOtp) {
              if (!OTP_PATTERN.test(officialOtp)) {
                return null;
              }

              const user = await getUserByEmailSafe(officialEmail);

              if (!user || user.role !== Role.OFFICIAL || !user.email) {
                return null;
              }

              const otpRecord = await prisma.officialOTP.findFirst({
                where: {
                  email: officialEmail,
                  purpose: OfficialOtpPurpose.LOGIN,
                  expiresAt: { gt: new Date() },
                },
                orderBy: { createdAt: "desc" },
                select: {
                  id: true,
                  code: true,
                },
              });

              if (!otpRecord) {
                return null;
              }

              const otpMatches = await compare(officialOtp, otpRecord.code);
              if (!otpMatches) {
                return null;
              }

              await prisma.officialOTP.deleteMany({
                where: {
                  email: officialEmail,
                  purpose: OfficialOtpPurpose.LOGIN,
                },
              });

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                status: user.status,
                municipalityPresidentId: user.municipalityPresidentId,
                municipalityOfficerId: user.municipalityOfficerId,
                authMethod: "OFFICIAL_OTP",
              };
            }

            if (officialEmail && officialPassword && !officialOtp) {
              const user = await getUserByEmailSafe(officialEmail);

              if (!user || user.role !== Role.OFFICIAL || !user.password || !user.email) {
                return null;
              }

              const passwordMatches = await compare(officialPassword, user.password);
              if (!passwordMatches) {
                return null;
              }

              return {
                id: user.id,
                name: user.name,
                email: user.email,
                image: user.image,
                role: user.role,
                status: user.status,
                municipalityPresidentId: user.municipalityPresidentId,
                municipalityOfficerId: user.municipalityOfficerId,
                authMethod: "OFFICIAL_PASSWORD",
              };
            }

            const userId = credentials?.userId?.trim();
            const password = credentials?.password;
            const roleInput = credentials?.role?.toUpperCase();

            if (!userId || !password) {
              return null;
            }

            let user = await getUserByEmployeeIdSafe(userId);
            if (!user && userId.includes("@")) {
              user = await getUserByEmailSafe(userId.toLowerCase());
            }

            if (!user?.password) {
              return null;
            }

            if (!CREDENTIAL_ROLES.has(user.role)) {
              return null;
            }

            if (roleInput && roleInput !== user.role) {
              return null;
            }

            const passwordMatches = await compare(password, user.password);
            if (!passwordMatches) {
              return null;
            }

            return {
              id: user.id,
              employeeId: user.employeeId,
              name: user.name,
              email: user.email,
              image: user.image,
              role: user.role,
              status: user.status,
              municipalityPresidentId: user.municipalityPresidentId,
              municipalityOfficerId: user.municipalityOfficerId,
            };
          } catch (error) {
            console.error("Credentials authorize error:", error);
            if (isDatabaseConnectionError(error)) {
              throw new Error("DatabaseUnavailable");
            }
            return null;
          }
        },
      }),
    ];

    const googleClientId = process.env.GOOGLE_CLIENT_ID;
    const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

    if (googleClientId && googleClientSecret) {
      providers.push(
        GoogleProvider({
          clientId: googleClientId,
          clientSecret: googleClientSecret,
        }),
      );
    }

    return providers;
  })(),
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === "google" && user.email) {
        const existingUser = await prisma.user.findUnique({
          where: { email: user.email },
          select: { role: true, status: true },
        });

        if (!existingUser) {
          return "/join-official?error=not_registered";
        }

        if (existingUser.role !== Role.OFFICIAL) {
          return "/login?error=use_credentials";
        }

        if (existingUser.status !== UserStatus.APPROVED) {
          return "/login?error=official_pending";
        }
      }

      if (account?.provider === "credentials") {
        const credentialUser = user as
          | { role?: Role; status?: UserStatus; authMethod?: string }
          | undefined;

        if (
          credentialUser?.authMethod === "OFFICIAL_OTP" ||
          credentialUser?.authMethod === "OFFICIAL_PASSWORD"
        ) {
          if (credentialUser.role !== Role.OFFICIAL) {
            return false;
          }
          return true;
        }

        const role = credentialUser?.role;
        if (!role || !CREDENTIAL_ROLES.has(role)) {
          return false;
        }

        if (credentialUser?.status !== UserStatus.APPROVED) {
          return "/login?error=account_not_approved";
        }
      }

      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        token.id = user.id;
      }

      if (user && "role" in user && user.role) {
        token.role = user.role as Role;
      }

      if (user && "status" in user && user.status) {
        token.status = user.status as UserStatus;
      }

      if (user && "employeeId" in user) {
        token.employeeId = (user.employeeId as string | null | undefined) ?? null;
      }

      if (user && "municipalityPresidentId" in user) {
        token.municipalityPresidentId =
          (user.municipalityPresidentId as string | null | undefined) ?? null;
      }

      if (user && "municipalityOfficerId" in user) {
        token.municipalityOfficerId =
          (user.municipalityOfficerId as string | null | undefined) ?? null;
      }

      if ((!token.id || !token.role) && token.email) {
        const dbUser = await getUserTokenFieldsByEmailSafe(token.email);

        if (dbUser) {
          token.id = dbUser.id;
          token.role = dbUser.role;
          token.status = dbUser.status;
          token.employeeId = dbUser.employeeId;
          token.municipalityPresidentId = dbUser.municipalityPresidentId;
          token.municipalityOfficerId = dbUser.municipalityOfficerId;
        }
      }

      if (
        (!token.role ||
          !token.status ||
          token.employeeId === undefined ||
          token.municipalityPresidentId === undefined ||
          token.municipalityOfficerId === undefined) &&
        token.id
      ) {
        const dbUserById = await getUserTokenFieldsByIdSafe(token.id);

        if (dbUserById) {
          token.id = dbUserById.id;
          token.role = dbUserById.role;
          token.status = dbUserById.status;
          token.employeeId = dbUserById.employeeId;
          token.municipalityPresidentId = dbUserById.municipalityPresidentId;
          token.municipalityOfficerId = dbUserById.municipalityOfficerId;
        }
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id ?? token.sub ?? "";
        session.user.role = (token.role as Role | undefined) ?? Role.OFFICIAL;
        session.user.status = (token.status as UserStatus | undefined) ?? UserStatus.PENDING;
        session.user.employeeId = (token.employeeId as string | null | undefined) ?? null;
        session.user.municipalityPresidentId =
          (token.municipalityPresidentId as string | null | undefined) ?? null;
        session.user.municipalityOfficerId =
          (token.municipalityOfficerId as string | null | undefined) ?? null;
      }

      return session;
    },
  },
};
