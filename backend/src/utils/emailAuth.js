const nodemailer = require("nodemailer");

const normalizeEmail = (value = "") => value.trim().toLowerCase();

const generateVerificationCode = (length = 6) => {
  const min = 10 ** (length - 1);
  const max = 10 ** length - 1;
  return String(Math.floor(Math.random() * (max - min + 1)) + min);
};

const buildVerificationEmail = (name, code, minutes = 10) => {
  const displayName = name || "there";
  const subject = "Verify your Lapreh account";
  const text = `Hello ${displayName},\n\nUse the verification code below to activate your Lapreh account:\n\n${code}\n\nThis code expires in ${minutes} minutes.\n\nIf you did not create an account, you can safely ignore this email.`;
  const html = `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;">
      <h2 style="color: #8f1f39;">Verify your Lapreh account</h2>
      <p>Hello ${displayName},</p>
      <p>Use the verification code below to activate your Lapreh account:</p>
      <div style="display: inline-block; margin: 16px 0; padding: 12px 18px; border-radius: 8px; background: #fdf2f4; font-size: 24px; letter-spacing: 4px; font-weight: 700; color: #8f1f39;">${code}</div>
      <p>This code expires in ${minutes} minutes.</p>
      <p>If you did not create an account, you can safely ignore this email.</p>
    </div>
  `;

  return { subject, text, html };
};

const sendVerificationEmail = async ({ to, name, code, minutes = 10 }) => {
  const resendApiKey = process.env.RESEND_API_KEY?.trim();
  const { subject, text, html } = buildVerificationEmail(name, code, minutes);

  if (resendApiKey) {
    const from = process.env.MAIL_FROM?.trim();
    if (!from) {
      throw new Error("MAIL_FROM must be set to a verified sender when using Resend.");
    }

    if (typeof fetch !== "function") {
      throw new Error("The Resend email API requires Node.js 18 or newer.");
    }

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from, to, subject, text, html }),
    });

    if (!response.ok) {
      const details = (await response.text()).slice(0, 500);
      throw new Error(`Resend API request failed (${response.status}): ${details}`);
    }

    return;
  }

  const smtpHost = process.env.SMTP_HOST?.trim();
  const smtpPort = Number(process.env.SMTP_PORT || 587);
  const smtpUser = process.env.SMTP_USER?.trim();
  const smtpPass = process.env.SMTP_PASS?.trim();

  if (!smtpHost || !smtpUser || !smtpPass) {
    throw new Error(
      "SMTP configuration is missing. Please set SMTP_HOST, SMTP_PORT, SMTP_USER, and SMTP_PASS in your backend .env file."
    );
  }

  const transport = nodemailer.createTransport({
    host: smtpHost,
    port: smtpPort,
    secure: smtpPort === 465,
    auth: {
      user: smtpUser,
      pass: smtpPass,
    },
  });

  await transport.sendMail({
    from: process.env.MAIL_FROM || smtpUser,
    to,
    subject,
    text,
    html,
  });
};

module.exports = {
  buildVerificationEmail,
  generateVerificationCode,
  normalizeEmail,
  sendVerificationEmail,
};
