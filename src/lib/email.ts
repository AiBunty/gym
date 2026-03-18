import nodemailer from "nodemailer";
import { normalizeCmsData, type CmsData, type EmailSettings, type EmailTemplates } from "@/lib/cms";

export type SubmissionEmailContext = {
  formType: string;
  submittedAt: string;
  name: string;
  email: string;
  phone: string;
  program: string;
  planName: string;
  planPrice: string;
  goal: string;
};

function getCmsUrls(): string[] {
  const directUrls = [
    process.env.APPS_SCRIPT_CMS_URL,
    process.env.APPS_SCRIPT_CMS_WRITE_URL,
  ].filter(Boolean) as string[];

  const deploymentId = process.env.NEXT_PUBLIC_APPSCRIPT_DEPLOYMENT_ID;
  const deploymentUrl = deploymentId
    ? `https://script.google.com/macros/s/${deploymentId}/exec`
    : null;

  return Array.from(new Set([...directUrls, ...(deploymentUrl ? [deploymentUrl] : [])]));
}

function looksLikeHtml(text: string): boolean {
  const trimmed = text.trim().toLowerCase();
  return trimmed.startsWith("<!doctype html") || trimmed.startsWith("<html");
}

function unwrapCmsPayload(raw: unknown): unknown {
  if (!raw || typeof raw !== "object") return raw;
  const record = raw as Record<string, unknown>;
  return record.data ?? raw;
}

export async function loadEmailConfigFromCms(): Promise<{ emailSettings: EmailSettings; emailTemplates: EmailTemplates }> {
  const cmsUrls = getCmsUrls();

  for (const url of cmsUrls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const text = await response.text();
      if (!response.ok || looksLikeHtml(text)) continue;

      const raw = JSON.parse(text);
      const normalized = normalizeCmsData(unwrapCmsPayload(raw));
      return {
        emailSettings: normalized.emailSettings,
        emailTemplates: normalized.emailTemplates,
      };
    } catch {
      continue;
    }
  }

  const fallback = normalizeCmsData(null);
  return {
    emailSettings: fallback.emailSettings,
    emailTemplates: fallback.emailTemplates,
  };
}

export async function loadCmsConfigFromRemote(): Promise<CmsData> {
  const cmsUrls = getCmsUrls();

  for (const url of cmsUrls) {
    try {
      const response = await fetch(url, {
        method: "GET",
        cache: "no-store",
        headers: { Accept: "application/json" },
      });

      const text = await response.text();
      if (!response.ok || looksLikeHtml(text)) continue;

      const raw = JSON.parse(text);
      return normalizeCmsData(unwrapCmsPayload(raw));
    } catch {
      continue;
    }
  }

  return normalizeCmsData(null);
}

export function applyTemplate(template: string, context: Record<string, string>): string {
  return template.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    return context[key] ?? "";
  });
}

export function getProviderDefaults(provider: EmailSettings["provider"]) {
  switch (provider) {
    case "gmail":
      return { host: "smtp.gmail.com", port: 587, secure: false };
    case "zoho":
      return { host: "smtp.zoho.com", port: 587, secure: false };
    case "stackmail":
      return { host: "smtp.stackmail.com", port: 587, secure: false };
    case "yahoo":
      return { host: "smtp.mail.yahoo.com", port: 587, secure: false };
    case "titan":
      return { host: "smtp.titan.email", port: 587, secure: false };
    default:
      return { host: "", port: 587, secure: false };
  }
}

export async function createTransporter(settings: EmailSettings) {
  if (!settings.enabled) {
    throw new Error("SMTP is disabled in Email Settings.");
  }

  const defaults = getProviderDefaults(settings.provider);
  const host = settings.host || defaults.host;
  const port = Number(settings.port || defaults.port);
  const secure = Boolean(settings.secure);

  if (!host || !settings.user || !settings.password) {
    throw new Error("SMTP host, user and password are required.");
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: settings.user,
      pass: settings.password,
    },
  });

  await transporter.verify();
  return transporter;
}

export async function sendSubmissionEmails(context: SubmissionEmailContext) {
  const { emailSettings, emailTemplates } = await loadEmailConfigFromCms();
  if (!emailSettings.enabled) return { ok: true, skipped: true as const };

  const transporter = await createTransporter(emailSettings);

  const templateContext: Record<string, string> = {
    formType: context.formType,
    submittedAt: context.submittedAt,
    name: context.name,
    email: context.email,
    phone: context.phone,
    program: context.program || context.planName,
    planName: context.planName,
    planPrice: context.planPrice,
    goal: context.goal,
  };

  const fromDisplay = emailSettings.fromName?.trim() || "Wani's Club Level Up";
  const fromEmail = emailSettings.fromEmail?.trim() || emailSettings.user;
  const from = `${fromDisplay} <${fromEmail}>`;

  const sent: string[] = [];

  if (context.email) {
    await transporter.sendMail({
      from,
      to: context.email,
      subject: applyTemplate(emailTemplates.userSubject, templateContext),
      html: applyTemplate(emailTemplates.userHtml, templateContext),
      text: applyTemplate(emailTemplates.userText, templateContext),
    });
    sent.push(context.email);
  }

  const adminRecipients = (emailSettings.adminNotifyEmails || []).filter(Boolean);
  if (adminRecipients.length > 0) {
    await transporter.sendMail({
      from,
      to: adminRecipients.join(","),
      subject: applyTemplate(emailTemplates.adminSubject, templateContext),
      html: applyTemplate(emailTemplates.adminHtml, templateContext),
      text: applyTemplate(emailTemplates.adminText, templateContext),
    });
    sent.push(...adminRecipients);
  }

  return { ok: true, skipped: false as const, sent };
}
