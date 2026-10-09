import type { DashboardRole } from "@/lib/assistant/sktech-help";

export type TourStep = { title: string; body: string };

export const roleTours: Record<DashboardRole, readonly TourStep[]> = {
  ADMIN: [
    { title: "Welcome to SKTECH Admin", body: "Monitor province-wide SK operations, analytics, users, compliance, and system health." },
    { title: "Analytics and Reports", body: "Review SK, KK, attendance, certificate, and compliance data for better decision-making." },
    { title: "User and Access Management", body: "Manage staff access, admissions, officials, and role-based permissions." },
    { title: "Notifications and Alerts", body: "Check announcements, chat alerts, and important system updates in the notification center." },
    { title: "SKTECH AI Assistant", body: "Use the AI assistant for page-specific guidance, navigation help, and system support." },
  ],
  STAFF: [
    { title: "Welcome to Staff Dashboard", body: "Manage municipality-level SK operations and review assigned records." },
    { title: "Admissions and Profiles", body: "Review official submissions and profile updates within your assigned municipality." },
    { title: "Municipality Analytics", body: "Track KK and SK activity, reports, and local trends for your municipality." },
    { title: "Announcements and Communication", body: "Stay updated through announcements, chat, and notifications." },
    { title: "SKTECH AI Assistant", body: "Ask the assistant for help with your current page or workflow." },
  ],
  OFFICIAL: [
    { title: "Welcome to Official Dashboard", body: "Manage barangay-level youth governance tools and SKTECH services." },
    { title: "KK Management", body: "Review KK members, invite youth, manage profiles, and track barangay youth participation." },
    { title: "Certificates and Youth Services", body: "Issue certificates and support youth records using secure digital tools." },
    { title: "Analytics and Notifications", body: "Check barangay KK analytics, announcements, chat, and notification alerts." },
    { title: "SKTECH AI Assistant", body: "Ask the assistant how to use your dashboard features safely." },
  ],
  KK_MEMBER: [
    { title: "Welcome to KK Portal", body: "Access your KK profile, YouthPass, certificates, and youth participation records." },
    { title: "Complete Your Profile", body: "Fill out your KK profile and consent forms so your SK officials can verify your record." },
    { title: "YouthPass", body: "Use your YouthPass for identification and public verification when available." },
    { title: "Certificates", body: "View, print, and verify certificates issued through SKTECH." },
    { title: "Notifications and AI Help", body: "Check updates and ask the AI assistant for help using the KK Portal." },
  ],
};

export const onboardingStorageKey = (role: DashboardRole) =>
  `sktech:onboarding:${role.toLowerCase().replace("_", "-")}:v1`;
