import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

type AppRole = "ADMIN" | "STAFF" | "OFFICIAL";
type AppStatus = "PENDING" | "APPROVED" | "REJECTED" | "INACTIVE";
type RoleRule = {
  prefix:
    | "/dashboard/admin"
    | "/dashboard/staff"
    | "/dashboard/official"
    | "/dashboard/officials"
    | "/dashboard/events"
    | "/dashboard/scan"
    | "/mobile/staff-scanner"
    | "/mobile/official";
  allowed: AppRole[];
  requiresApproved?: boolean;
  pendingAllowedPaths?: string[];
};

const ROLE_RULES: RoleRule[] = [
  { prefix: "/dashboard/admin", allowed: ["ADMIN"], requiresApproved: true },
  { prefix: "/dashboard/staff", allowed: ["STAFF"], requiresApproved: true },
  {
    prefix: "/dashboard/official",
    allowed: ["OFFICIAL"],
    requiresApproved: false,
    pendingAllowedPaths: ["/dashboard/official", "/dashboard/official/admission"],
  },
  { prefix: "/dashboard/officials", allowed: ["ADMIN", "STAFF"], requiresApproved: true },
  { prefix: "/dashboard/events", allowed: ["ADMIN", "STAFF"], requiresApproved: true },
  { prefix: "/dashboard/scan", allowed: ["ADMIN", "STAFF"], requiresApproved: true },
  { prefix: "/mobile/staff-scanner", allowed: ["STAFF"], requiresApproved: true },
  { prefix: "/mobile/official", allowed: ["OFFICIAL"], requiresApproved: true },
];

function matchRoleRule(pathname: string): RoleRule | undefined {
  return ROLE_RULES.find(
    (rule) => pathname === rule.prefix || pathname.startsWith(`${rule.prefix}/`),
  );
}

export async function proxy(request: NextRequest) {
  const pathname = request.nextUrl.pathname;
  const roleRule = matchRoleRule(pathname);

  if (!roleRule) {
    return NextResponse.next();
  }

  const token = await getToken({
    req: request,
    secret:
      process.env.NEXTAUTH_SECRET?.trim() ||
      process.env.AUTH_SECRET?.trim() ||
      process.env.FACE_SECRET?.trim(),
  });

  if (!token) {
    const signInUrl = new URL("/login", request.url);
    if (
      roleRule.allowed.length === 1 &&
      (roleRule.allowed[0] === "ADMIN" || roleRule.allowed[0] === "STAFF")
    ) {
      signInUrl.searchParams.set("role", roleRule.allowed[0]);
    }
    signInUrl.searchParams.set(
      "callbackUrl",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.redirect(signInUrl);
  }

  const role = token.role as AppRole | undefined;
  const status = token.status as AppStatus | undefined;
  const municipalityPresidentId = token.municipalityPresidentId as string | null | undefined;

  if (!role || !roleRule.allowed.includes(role)) {
    return NextResponse.redirect(new URL("/unauthorized", request.url));
  }

  if (roleRule.prefix === "/dashboard/staff" && role === "STAFF" && !municipalityPresidentId) {
    const allowedWithoutMunicipality =
      pathname === "/dashboard/staff" || pathname.startsWith("/dashboard/staff/settings");

    if (!allowedWithoutMunicipality) {
      return NextResponse.redirect(new URL("/unauthorized?error=staff_unassigned", request.url));
    }
  }

  if (roleRule.prefix === "/dashboard/official" && role === "OFFICIAL" && status !== "APPROVED") {
    const allowedPendingPath = (roleRule.pendingAllowedPaths ?? []).some(
      (allowedPath) =>
        pathname === allowedPath || pathname.startsWith(`${allowedPath}/`),
    );

    if (!allowedPendingPath) {
      return NextResponse.redirect(new URL("/dashboard/official", request.url));
    }

    return NextResponse.next();
  }

  if (roleRule.requiresApproved && status !== "APPROVED") {
    const errorCode = role === "OFFICIAL" ? "official_pending" : "account_not_approved";
    return NextResponse.redirect(new URL(`/login?error=${errorCode}`, request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/admin/:path*",
    "/dashboard/staff/:path*",
    "/dashboard/official/:path*",
    "/dashboard/officials/:path*",
    "/dashboard/events/:path*",
    "/dashboard/scan/:path*",
    "/mobile/staff-scanner/:path*",
    "/mobile/official/:path*",
  ],
};
