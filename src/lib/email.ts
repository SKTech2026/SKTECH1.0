import nodemailer from "nodemailer";

type SendEmailParams = {
  to: string;
  subject: string;
  text: string;
  html: string;
};

const EMAIL_TIMEOUT_MS = 60000;

function getConfiguredFromAddress(): string {
  return (
    process.env.EMAIL_FROM ??
    process.env.BREVO_FROM_EMAIL ??
    process.env.EMAIL_SERVER_USER ??
    process.env.EMAIL_USER ??
    ""
  );
}

function getSmtpTransporter() {
  const host = process.env.EMAIL_SERVER_HOST ?? process.env.SMTP_HOST;
  const port = process.env.EMAIL_SERVER_PORT ?? process.env.SMTP_PORT;
  const user = process.env.EMAIL_SERVER_USER ?? process.env.EMAIL_USER;
  const password = process.env.EMAIL_SERVER_PASSWORD ?? process.env.EMAIL_PASS;

  if (!host || !port || !user || !password) {
    throw new Error("Missing email server environment variables.");
  }

  const parsedPort = Number(port);
  if (!Number.isInteger(parsedPort) || parsedPort <= 0) {
    throw new Error("Email server port must be a valid positive integer.");
  }

  return nodemailer.createTransport({
    host,
    port: parsedPort,
    secure: parsedPort === 465,
    connectionTimeout: EMAIL_TIMEOUT_MS,
    greetingTimeout: EMAIL_TIMEOUT_MS,
    socketTimeout: EMAIL_TIMEOUT_MS,
    auth: {
      user,
      pass: password,
    },
  });
}

async function sendEmailWithResend(params: SendEmailParams) {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    return false;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: getConfiguredFromAddress(),
      to: [params.to],
      subject: params.subject,
      text: params.text,
      html: params.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Resend email delivery failed with status ${response.status}: ${errorBody}`);
  }

  return true;
}

async function sendEmailWithBrevo(params: SendEmailParams) {
  const apiKey = process.env.BREVO_API_KEY;
  if (!apiKey) {
    return false;
  }

  const fromEmail = process.env.BREVO_FROM_EMAIL ?? getConfiguredFromAddress();
  if (!fromEmail) {
    throw new Error("Missing Brevo sender email. Set BREVO_FROM_EMAIL or EMAIL_FROM.");
  }

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      "api-key": apiKey,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      sender: {
        email: fromEmail,
        ...(process.env.BREVO_FROM_NAME ? { name: process.env.BREVO_FROM_NAME } : {}),
      },
      to: [{ email: params.to }],
      subject: params.subject,
      textContent: params.text,
      htmlContent: params.html,
    }),
  });

  if (!response.ok) {
    const errorBody = await response.text().catch(() => "");
    throw new Error(`Brevo email delivery failed with status ${response.status}: ${errorBody}`);
  }

  return true;
}

async function sendEmailWithSmtp(params: SendEmailParams) {
  const transporter = getSmtpTransporter();

  await transporter.sendMail({
    from: getConfiguredFromAddress(),
    to: params.to,
    subject: params.subject,
    text: params.text,
    html: params.html,
  });
}

export async function sendEmail(params: SendEmailParams) {
  const sentWithResend = await sendEmailWithResend(params);
  if (sentWithResend) {
    return;
  }

  const sentWithBrevo = await sendEmailWithBrevo(params);
  if (sentWithBrevo) {
    return;
  }

  await sendEmailWithSmtp(params);
}
