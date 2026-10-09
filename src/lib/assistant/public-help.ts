export const PUBLIC_REFUSAL =
  "I can only help with public SKTECH information, portal navigation, and safe system guidance.";

export const PUBLIC_UNCONFIGURED =
  "AI assistant is not configured yet. You can still ask basic public SKTECH navigation questions.";

const publicKnowledge = {
  greeting:
    "Hi! I can help you with SKTECH, the Official Portal, KK Portal, login, registration, YouthPass, certificates, and public verification.",
  clarify:
    "Pwede kitang tulungan. Ano ang gusto mong gawin sa SKTECH — mag-login, mag-register bilang SK Official, gamitin ang KK Portal, o mag-verify ng YouthPass/certificate?",
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
    "YouthPass is a digital pass for an eligible KK member. Issued YouthPass and certificates can be checked through the QR code or public link on the record. Verification shows limited public details; this assistant cannot look up private records or generate verification IDs.",
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

const filipinoKnowledge: Partial<Record<PublicTopic, string>> = {
  overview:
    "Ang SKTECH ay capstone at prototype na digital governance platform para sa SK sa Oriental Mindoro. May public portal guidance ito at mga role-protected feature tulad ng profiles, events, attendance, at Digital IDs. Hindi ito opisyal na government system maliban kung pormal na ma-adopt at ma-authorize.",
  registration:
    "Para mag-register bilang SK Official, pumunta sa /official/auth/register. Para sumali sa KK Portal, kailangan ng natatanging invitation link mula sa inyong barangay SK Chairperson; i-verify ang email at kumpletuhin ang profile. Walang pampublikong KK sign-up code.",
  login:
    "Para mag-login bilang KK member, pumunta sa /kk/login gamit ang verified email at password. Kung bago ka pa lang, kailangan muna ng invitation link mula sa barangay SK Chairperson. Ang SK Officials ay sa /official/auth, at Admin/Staff ay sa /login. Hindi ko masusuri ang iyong account dito.",
  invitation:
    "Para sumali sa KK Portal, gamitin ang natatanging invitation link mula sa inyong barangay SK Chairperson, i-verify ang email, at kumpletuhin ang KK profile. Walang pampublikong invite code.",
  kk:
    "Ang KK Portal sa /kk ay para sa mga Katipunan ng Kabataan member. Makikita rito ang sariling profile, YouthPass, at mga certificate. Para makasali, humingi ng invitation link sa barangay SK Chairperson.",
  verification:
    "Ang YouthPass ay digital pass para sa eligible na KK member. Para i-verify ang YouthPass o certificate, buksan ang QR code o link sa inisyung record. Limitadong pampublikong detalye lang ang ipinapakita; hindi ko mabubuksan ang pribadong records.",
  official:
    "Ang SK Official Portal ay nasa /official/auth. Para mag-register, pumunta sa /official/auth/register. Ang Admin at Staff ay gumagamit ng /login.",
  publicPages:
    "Ang SKTECH landing page ay /. Ang KK Portal ay /kk; KK login ay /kk/login; SK Official Portal ay /official/auth; at Admin/Staff login ay /login.",
};

const blockedRequest =
  /(?:private|personal|someone(?:'s)?|another user(?:'s)?|specific user|individual|my account|account status|user status|look up|lookup|fetch|show me|give me|list all|query|retrieve).{0,55}(?:record|profile|email|phone|birth|address|status|account|member|user|data)|(?:pakita|ipakita|hanapin|tingnan|kunin).{0,55}(?:profile|record|email|phone|account|data|detalye|impormasyon).{0,30}(?:ni |ng |ibang|someone|user)|(?:give|show|reveal|share|provide|send|ano|ibigay|pakita).{0,30}(?:password|api[ -]?key|secret|token)|(?:api[ -]?key|secret|token|database|sql|internal prompt|system prompt|bypass|hack|ignore (?:previous|all) instructions|jailbreak|admin-only|private data|personal data|weather|stock market|love letter|poem|homework|recipe|gambl(?:e|ing)|casino|politics)/i;

export function classifyPublicQuestion(message: string): PublicTopic | null {
  const input = message.trim().toLowerCase();
  if (!input || blockedRequest.test(input)) return null;

  // Reject unrelated requests even if they contain a public topic as a pretext.
  if (/(?:write|compose|create|generate|solve|code|draw|translate|summarize|gumawa|sumulat).{0,60}(?:letter|poem|story|essay|homework|program|image|song|joke|recipe|tula|takdang.aralin)/i.test(input)) return null;

  if (/^(?:hi|hello|hey|good (?:morning|afternoon|evening)|kumusta|kamusta|musta|magandang (?:umaga|hapon|gabi))(?: po| sktech| ask sktech)?[!.?\s]*$/.test(input)) return "greeting";
  if (/^(?:pano|paano|how|how to|help|tulong|patulong|paano gamitin(?: ito)?|pano gamitin(?: ito)?)(?: po)?[?.!\s]*$/.test(input)) return "clarify";

  if (/face liveness|face verification|facial verification/.test(input)) return "face";
  if (/youthpass|certificate|sertipiko|qr code|public verif|verify (?:an? )?(?:id|pass|record)|beripika|i-?verify/.test(input)) return "verification";
  if (/invitation|invite|join(?:ing)? (?:the )?kk|kk registration|sumali|paano pumasok sa kk/.test(input)) return "invitation";
  if (/register|registration|sign[ -]?up|rehistro|magpa.?rehistro/.test(input)) return "registration";
  if (/login|log in|sign[ -]?in|mag.?login|access (?:my |the )?(?:portal|dashboard)|forgot password|reset password|password help|nakalimutan.{0,20}password/.test(input)) return "login";
  if (/kk portal|katipunan ng kabataan|kk member|kabataan/.test(input)) return "kk";
  if (/official (?:portal|login|sign[ -]?in|account)|sk official|opisyal/.test(input)) return "official";
  if (/privacy|security|consent|safe|protected/.test(input)) return "security";
  if (/staff|admin|who can access|who uses|roles|permissions/.test(input)) return "roles";
  if (/where (?:is|can)|navigate|public page|website|site|route|saan|nasaan/.test(input)) return "publicPages";
  if (/feature|digital id|attendance|announcement|event|profiling|registration/.test(input)) return "features";
  if (/sktech|official|capstone|demo|prototype|paano gamitin ito|pano gamitin ito/.test(input)) return "overview";
  return null;
}

export function getPublicKnowledge(topic: PublicTopic, message = ""): string {
  const filipino = /\b(?:paano|pano|mag.?login|mag.?register|sumali|kabataan|opisyal|sertipiko|beripika|saan|nasaan|gamitin|tulong|patulong|nakalimutan)\b/i.test(message);
  return filipino ? filipinoKnowledge[topic] ?? publicKnowledge[topic] : publicKnowledge[topic];
}
