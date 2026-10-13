import { sendEmail } from "@/lib/email";

export async function sendAccountUpdatedEmail(email: string) {
  await sendEmail({
    to: email,
    subject: "Your SKTECH account information was updated",
    text: "Your SKTECH account information was updated by an administrator. Please sign in and review your profile. Contact SKTECH support if you have questions.",
    html: "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172033\"><h1 style=\"font-size:20px\">SKTECH account update</h1><p>Your SKTECH account information was updated by an administrator.</p><p>Please sign in and review your profile. Contact SKTECH support if you have questions.</p></div>",
  });
}

export async function sendAccountDeletedEmail(email: string) {
  await sendEmail({
    to: email,
    subject: "Your SKTECH account was permanently deleted",
    text: "Your SKTECH account was permanently deleted by an administrator. Its email address may be used for a future registration. Contact SKTECH support if you believe this was a mistake.",
    html: "<div style=\"font-family:Arial,sans-serif;max-width:560px;margin:0 auto;color:#172033\"><h1 style=\"font-size:20px\">SKTECH account deleted</h1><p>Your SKTECH account was permanently deleted by an administrator.</p><p>Its email address may be used for a future registration. Contact SKTECH support if you believe this was a mistake.</p></div>",
  });
}
