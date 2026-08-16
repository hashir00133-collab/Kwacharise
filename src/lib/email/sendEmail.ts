import { Resend } from "resend";

type SendEmailParams = {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
};

function getRequiredEnv(name: string) {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Missing environment variable: ${name}`);
  }

  return value;
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

export async function sendEmail({
  to,
  subject,
  html,
  text,
}: SendEmailParams) {
  const resendApiKey = getRequiredEnv("RESEND_API_KEY");
  const fromEmail = getRequiredEnv("RESEND_FROM_EMAIL");
  const fromName = process.env.RESEND_FROM_NAME || "KwachaRise";

  const resend = new Resend(resendApiKey);

  const from = `${fromName} <${fromEmail}>`;

  const { data, error } = await resend.emails.send({
    from,
    to,
    subject,
    html,
    text,
  });

  if (error) {
    throw new Error(error.message || "Failed to send email.");
  }

  return data;
}

export function buildEmailTemplate({
  title,
  message,
  actionText,
  actionUrl,
}: {
  title: string;
  message: string;
  actionText?: string;
  actionUrl?: string;
}) {
  const safeTitle = escapeHtml(title);
  const safeMessage = escapeHtml(message);

  const safeAction =
    actionText && actionUrl
      ? `
        <div style="margin-top: 24px;">
          <a
            href="${escapeHtml(actionUrl)}"
            style="background:#00b86b;color:#ffffff;text-decoration:none;padding:12px 18px;border-radius:10px;font-weight:700;display:inline-block;"
          >
            ${escapeHtml(actionText)}
          </a>
        </div>
      `
      : "";

  return `
    <div style="margin:0;padding:0;background:#07090f;font-family:Arial,Helvetica,sans-serif;color:#dde2ef;">
      <div style="max-width:620px;margin:0 auto;padding:32px 18px;">
        <div style="background:#0e1526;border:1px solid #172036;border-radius:18px;padding:28px;">
          <div style="display:flex;align-items:center;gap:10px;margin-bottom:24px;">
            <div style="background:#00b86b;color:#ffffff;width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;font-weight:800;">
              K
            </div>

            <h2 style="margin:0;color:#ffffff;font-size:22px;">
              KwachaRise
            </h2>
          </div>

          <h1 style="margin:0 0 14px;color:#ffffff;font-size:26px;line-height:1.3;">
            ${safeTitle}
          </h1>

          <p style="margin:0;color:#9bb7d6;font-size:15px;line-height:1.7;">
            ${safeMessage}
          </p>

          ${safeAction}

          <p style="margin-top:28px;color:#4e6880;font-size:12px;line-height:1.6;">
            This is an automated message from KwachaRise. Please do not share your account login details with anyone.
          </p>
        </div>
      </div>
    </div>
  `;
}