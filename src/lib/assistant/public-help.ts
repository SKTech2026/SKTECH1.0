export const PUBLIC_REFUSAL =
  "I can only help with public SKTECH information, portal navigation, and safe system guidance.";

export const PUBLIC_UNCONFIGURED =
  "AI assistant is not configured yet. You can still ask basic public SKTECH navigation questions.";

const publicKnowledge = {
  overview:
    "SKTECH is a capstone and prototype digital governance platform for SK operations in Oriental Mindoro. It supports official profiles, Digital IDs, events, attendance, announcements, and role-protected dashboards. It is not an official government system unless formally adopted and authorized.",
  kk:
    "The KK Portal at /kk is for Katipunan ng Kabataan members. Members can use a secure profile, YouthPass, and issued certificates. Registration begins with a unique invitation link from an authorized barangay SK Chairperson; there is no public sign-up code.",
  login:
    "KK members sign in at /kk/login with their verified email and password. SK Officials use /official/auth. Admin and Staff use the Internal Portal at /login. Dashboard access depends on the account role and approval status; this public assistant cannot check an individual's account.",
  registration:
    "KK members join through a unique invitation link from their barangay SK Chairperson, then verify their email and complete their profile. SK Officials can start at /official/auth/register. Admin and Staff accounts are managed through authorized internal processes.",
  invitation:
    "To join the KK Portal, open the unique invitation link provided by your barangay SK Chairperson, verify your email, and complete your KK profile. Do not use a made-up invite code.",
  verification:
    "YouthPass and certificate public verification pages open from the QR code or link on an issued record. The pages show only limited verification details; this public assistant cannot look up private records or generate verification IDs.",
  features:
    "SKTECH includes official and KK profiles, Digital ID and YouthPass, certificates, events, attendance, announcements, and role-specific dashboards. Availability depends on the user's role and approval status.",
  security:
    "SKTECH uses role-protected dashboards, invitation-based KK registration, email verification, and consent-based member profiling. Public verification shows limited details from issued records; private profile information stays in authorized workspaces.",
  roles:
    "KK members use the KK Portal for their own records. SK Officials coordinate barangay KK records, Municipal Staff work within their municipality, and Provincial Admin oversees province-wide operations. Each dashboard requires the appropriate account and permissions.",
  official:
    "SK Officials use /official/auth for their portal. Approved accounts reach their dashboard; pending accounts can complete or review admission steps. Admin and Staff use /login instead.",
  publicPages:
    "The main SKTECH landing page is at /. The KK Portal is at /kk. KK members sign in at /kk/login, SK Officials at /official/auth, and Admin or Staff at /login. An invitation link must come from the barangay SK Chairperson.",
  face:
    "Face Liveness is part of SKTECH's identity verification workflow for authorized users. It helps check that a live person is present during eligible registration or verification steps.",
} as const;

export type PublicTopic = keyof typeof publicKnowledge;

const blockedRequest =
  /(?:private|personal|someone(?:'s)?|another user(?:'s)?|specific user|individual|my account|account status|user status|look up|lookup|fetch|show me|give me|list all|query|retrieve).{0,55}(?:record|profile|email|phone|birth|address|status|account|member|user|data)|(?:password|api[ -]?key|secret|token|database|sql|internal prompt|system prompt|bypass|hack|ignore (?:previous|all) instructions|jailbreak|admin-only|private data|personal data|weather|stock market|love letter|poem|homework|recipe)/i;

export function classifyPublicQuestion(message: string): PublicTopic | null {
  const input = message.trim().toLowerCase();
  if (!input || blockedRequest.test(input)) return null;

  // Reject unrelated requests even if they contain a public topic as a pretext.
  if (/(?:write|compose|create|generate|solve|code|draw|translate|summarize).{0,60}(?:letter|poem|story|essay|homework|program|image|song|joke|recipe)/i.test(input)) return null;

  if (/face liveness|face verification|facial verification/.test(input)) return "face";
  if (/youthpass|certificate|qr code|public verif|verify (?:an? )?(?:id|pass|record)/.test(input)) return "verification";
  if (/invitation|invite|join(?:ing)? (?:the )?kk|kk registration/.test(input)) return "invitation";
  if (/register|registration|sign[ -]?up/.test(input)) return "registration";
  if (/login|log in|sign[ -]?in|access (?:my |the )?(?:portal|dashboard)/.test(input)) return "login";
  if (/kk portal|katipunan ng kabataan|kk member/.test(input)) return "kk";
  if (/official (?:portal|login|sign[ -]?in|account)|sk official/.test(input)) return "official";
  if (/privacy|security|consent|safe|protected/.test(input)) return "security";
  if (/staff|admin|who can access|who uses|roles|permissions/.test(input)) return "roles";
  if (/where (?:is|can)|navigate|public page|website|site|route/.test(input)) return "publicPages";
  if (/feature|digital id|attendance|announcement|event|profiling|registration/.test(input)) return "features";
  if (/sktech|official|capstone|demo|prototype/.test(input)) return "overview";
  return null;
}

export function getPublicKnowledge(topic: PublicTopic): string {
  return publicKnowledge[topic];
}
