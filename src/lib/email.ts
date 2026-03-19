import nodemailer from "nodemailer";
import {
  defaultEmailTemplates,
  normalizeCmsData,
  type CmsData,
  type EmailSettings,
  type EmailTemplates,
} from "@/lib/cms";

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
  batch?: string;
  age?: string;
  gender?: string;
  strengthLevel?: string;
  preferredSlot?: string;
  notes?: string;
  currentWeight?: string;
  targetWeight?: string;
  startDate?: string;
  endDate?: string;
};

type ResolvedTemplate = {
  userSubject: string;
  userHtml: string;
  userText: string;
  adminSubject: string;
  adminHtml: string;
  adminText: string;
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

function normalizeFormType(formType: string): SubmissionEmailContext["formType"] {
  return String(formType || "").trim().toLowerCase();
}

function resolveFormLabel(formType: string): string {
  const normalized = normalizeFormType(formType);
  if (normalized === "trial") return "2-Day Trial";
  if (normalized === "plan_enquiry") return "Membership Plan Enquiry";
  if (normalized === "personal_training") return "Personal Training Enquiry";
  if (normalized === "weight_loss_program") return "LAP / Weight Loss Program";
  return formType || "Website Form";
}

function usingGlobalDefaultTemplates(emailTemplates: EmailTemplates): boolean {
  return (
    emailTemplates.userSubject === defaultEmailTemplates.userSubject &&
    emailTemplates.userHtml === defaultEmailTemplates.userHtml &&
    emailTemplates.userText === defaultEmailTemplates.userText &&
    emailTemplates.adminSubject === defaultEmailTemplates.adminSubject &&
    emailTemplates.adminHtml === defaultEmailTemplates.adminHtml &&
    emailTemplates.adminText === defaultEmailTemplates.adminText
  );
}

function resolveFormTemplates(context: SubmissionEmailContext): ResolvedTemplate {
  const formType = normalizeFormType(context.formType);
  const formLabel = resolveFormLabel(context.formType);

  if (formType === "trial") {
    return {
      userSubject: "Your 2-Day Trial Request is Received - Wani's Club Level Up",
      userText:
        "Hi {{name}}, your 2-Day Trial request is received. Preferred batch: {{batch}}. Our team will contact you shortly.",
      userHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up</div><div style=\"padding:20px;color:#e4e4e7\"><h2 style=\"margin:0 0 10px 0;color:#fff\">Hi {{name}}, trial request confirmed</h2><p style=\"margin:0 0 8px 0\">Preferred batch: <b>{{batch}}</b></p><p style=\"margin:0 0 8px 0\">Goal: {{goal}}</p><p style=\"margin:0;color:#a1a1aa\">Our team will call you shortly with next steps.</p></div></div></div>",
      adminSubject: "New Trial Form Submission - {{name}}",
      adminText:
        "New trial submission: {{name}} | {{email}} | {{phone}} | Batch: {{batch}} | Goal: {{goal}} | {{submittedAt}}",
      adminHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Admin Alert - Trial Form</div><div style=\"padding:20px;color:#e4e4e7\"><p style=\"margin:0 0 8px 0\"><b>Name:</b> {{name}}</p><p style=\"margin:0 0 8px 0\"><b>Email:</b> {{email}}</p><p style=\"margin:0 0 8px 0\"><b>Phone:</b> {{phone}}</p><p style=\"margin:0 0 8px 0\"><b>Batch:</b> {{batch}}</p><p style=\"margin:0 0 8px 0\"><b>Goal:</b> {{goal}}</p><p style=\"margin:0;color:#a1a1aa\">Submitted at {{submittedAt}}</p></div></div></div>",
    };
  }

  if (formType === "plan_enquiry") {
    return {
      userSubject: "Plan Enquiry Received - {{planName}}",
      userText:
        "Hi {{name}}, we received your enquiry for {{planName}} ({{planPrice}}). Our team will share payment details soon.",
      userHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up</div><div style=\"padding:20px;color:#e4e4e7\"><h2 style=\"margin:0 0 10px 0;color:#fff\">Hi {{name}}, enquiry received</h2><p style=\"margin:0 0 8px 0\">Plan: <b>{{planName}}</b></p><p style=\"margin:0 0 8px 0\">Price: <b>{{planPrice}}</b></p><p style=\"margin:0;color:#a1a1aa\">We will contact you with payment and onboarding details.</p></div></div></div>",
      adminSubject: "New Plan Enquiry - {{planName}}",
      adminText:
        "Plan enquiry: {{name}} | {{email}} | {{phone}} | Plan: {{planName}} | Price: {{planPrice}} | {{submittedAt}}",
      adminHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Admin Alert - Plan Enquiry</div><div style=\"padding:20px;color:#e4e4e7\"><p style=\"margin:0 0 8px 0\"><b>Name:</b> {{name}}</p><p style=\"margin:0 0 8px 0\"><b>Email:</b> {{email}}</p><p style=\"margin:0 0 8px 0\"><b>Phone:</b> {{phone}}</p><p style=\"margin:0 0 8px 0\"><b>Plan:</b> {{planName}}</p><p style=\"margin:0 0 8px 0\"><b>Price:</b> {{planPrice}}</p><p style=\"margin:0;color:#a1a1aa\">Submitted at {{submittedAt}}</p></div></div></div>",
    };
  }

  if (formType === "personal_training") {
    return {
      userSubject: "Personal Training Enquiry Received",
      userText:
        "Hi {{name}}, your Personal Training enquiry is received. Preferred slot: {{preferredSlot}}. We will contact you shortly.",
      userHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up</div><div style=\"padding:20px;color:#e4e4e7\"><h2 style=\"margin:0 0 10px 0;color:#fff\">Hi {{name}}, enquiry received</h2><p style=\"margin:0 0 8px 0\">Preferred Slot: <b>{{preferredSlot}}</b></p><p style=\"margin:0 0 8px 0\">Goal: {{goal}}</p><p style=\"margin:0;color:#a1a1aa\">Our trainer will connect with you shortly.</p></div></div></div>",
      adminSubject: "New Personal Training Enquiry - {{name}}",
      adminText:
        "PT enquiry: {{name}} | {{email}} | {{phone}} | Slot: {{preferredSlot}} | Goal: {{goal}} | {{submittedAt}}",
      adminHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Admin Alert - Personal Training</div><div style=\"padding:20px;color:#e4e4e7\"><p style=\"margin:0 0 8px 0\"><b>Name:</b> {{name}}</p><p style=\"margin:0 0 8px 0\"><b>Email:</b> {{email}}</p><p style=\"margin:0 0 8px 0\"><b>Phone:</b> {{phone}}</p><p style=\"margin:0 0 8px 0\"><b>Preferred Slot:</b> {{preferredSlot}}</p><p style=\"margin:0 0 8px 0\"><b>Goal:</b> {{goal}}</p><p style=\"margin:0;color:#a1a1aa\">Submitted at {{submittedAt}}</p></div></div></div>",
    };
  }

  if (formType === "weight_loss_program") {
    return {
      userSubject: "{{program}} Registration Received",
      userText:
        "Hi {{name}}, your {{program}} registration is received. Plan: {{planName}}. We will share onboarding details shortly.",
      userHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up</div><div style=\"padding:20px;color:#e4e4e7\"><h2 style=\"margin:0 0 10px 0;color:#fff\">Hi {{name}}, registration confirmed</h2><p style=\"margin:0 0 8px 0\">Program: <b>{{program}}</b></p><p style=\"margin:0 0 8px 0\">Plan: <b>{{planName}}</b></p><p style=\"margin:0 0 8px 0\">Start Date: {{startDate}}</p><p style=\"margin:0;color:#a1a1aa\">Our team will contact you with the next steps.</p></div></div></div>",
      adminSubject: "New {{program}} Registration - {{name}}",
      adminText:
        "Program registration: {{name}} | {{email}} | {{phone}} | Program: {{program}} | Plan: {{planName}} | Goal: {{goal}} | {{submittedAt}}",
      adminHtml:
        "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Admin Alert - LAP/Weight Loss</div><div style=\"padding:20px;color:#e4e4e7\"><p style=\"margin:0 0 8px 0\"><b>Name:</b> {{name}}</p><p style=\"margin:0 0 8px 0\"><b>Email:</b> {{email}}</p><p style=\"margin:0 0 8px 0\"><b>Phone:</b> {{phone}}</p><p style=\"margin:0 0 8px 0\"><b>Program:</b> {{program}}</p><p style=\"margin:0 0 8px 0\"><b>Plan:</b> {{planName}}</p><p style=\"margin:0 0 8px 0\"><b>Goal:</b> {{goal}}</p><p style=\"margin:0;color:#a1a1aa\">Submitted at {{submittedAt}}</p></div></div></div>",
    };
  }

  return {
    userSubject: `${formLabel} Request Received`,
    userText:
      "Hi {{name}}, your form submission is received. Our team will contact you shortly.",
    userHtml:
      "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Wani's Club Level Up</div><div style=\"padding:20px;color:#e4e4e7\"><h2 style=\"margin:0 0 10px 0;color:#fff\">Hi {{name}}, submission received</h2><p style=\"margin:0;color:#a1a1aa\">Our team will contact you shortly.</p></div></div></div>",
    adminSubject: `New ${formLabel} Submission - {{name}}`,
    adminText:
      "New submission: {{name}} | {{email}} | {{phone}} | Form: {{formType}} | {{submittedAt}}",
    adminHtml:
      "<div style=\"font-family:Arial,sans-serif;background:#0a0a0a;padding:24px\"><div style=\"max-width:640px;margin:0 auto;background:#111;border:1px solid #27272a;border-radius:14px;overflow:hidden\"><div style=\"padding:18px;background:linear-gradient(90deg,#ff7d00,#ff9f43);color:#111;font-weight:700\">Admin Alert - New Submission</div><div style=\"padding:20px;color:#e4e4e7\"><p style=\"margin:0 0 8px 0\"><b>Name:</b> {{name}}</p><p style=\"margin:0 0 8px 0\"><b>Email:</b> {{email}}</p><p style=\"margin:0 0 8px 0\"><b>Phone:</b> {{phone}}</p><p style=\"margin:0 0 8px 0\"><b>Form:</b> {{formType}}</p><p style=\"margin:0;color:#a1a1aa\">Submitted at {{submittedAt}}</p></div></div></div>",
  };
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
    formLabel: resolveFormLabel(context.formType),
    submittedAt: context.submittedAt,
    name: context.name,
    email: context.email,
    phone: context.phone,
    program: context.program || context.planName || "Not specified",
    planName: context.planName || "Not specified",
    planPrice: context.planPrice || "Not specified",
    goal: context.goal || "Not specified",
    batch: context.batch || "Not specified",
    age: context.age || "Not specified",
    gender: context.gender || "Not specified",
    strengthLevel: context.strengthLevel || "Not specified",
    preferredSlot: context.preferredSlot || "Not specified",
    notes: context.notes || "Not specified",
    currentWeight: context.currentWeight || "Not specified",
    targetWeight: context.targetWeight || "Not specified",
    startDate: context.startDate || "Not specified",
    endDate: context.endDate || "Not specified",
  };

  const useCmsTemplates = !usingGlobalDefaultTemplates(emailTemplates);
  const formTemplates = resolveFormTemplates(context);

  const fromDisplay = emailSettings.fromName?.trim() || "Wani's Club Level Up";
  const fromEmail = emailSettings.fromEmail?.trim() || emailSettings.user;
  const from = `${fromDisplay} <${fromEmail}>`;

  const sent: string[] = [];

  if (context.email) {
    const userSubjectTemplate = useCmsTemplates ? emailTemplates.userSubject : formTemplates.userSubject;
    const userHtmlTemplate = useCmsTemplates ? emailTemplates.userHtml : formTemplates.userHtml;
    const userTextTemplate = useCmsTemplates ? emailTemplates.userText : formTemplates.userText;

    await transporter.sendMail({
      from,
      to: context.email,
      subject: applyTemplate(userSubjectTemplate, templateContext),
      html: applyTemplate(userHtmlTemplate, templateContext),
      text: applyTemplate(userTextTemplate, templateContext),
    });
    sent.push(context.email);
  }

  const adminRecipients = (emailSettings.adminNotifyEmails || []).filter(Boolean);
  if (adminRecipients.length > 0) {
    const adminSubjectTemplate = useCmsTemplates ? emailTemplates.adminSubject : formTemplates.adminSubject;
    const adminHtmlTemplate = useCmsTemplates ? emailTemplates.adminHtml : formTemplates.adminHtml;
    const adminTextTemplate = useCmsTemplates ? emailTemplates.adminText : formTemplates.adminText;

    await transporter.sendMail({
      from,
      to: adminRecipients.join(","),
      subject: applyTemplate(adminSubjectTemplate, templateContext),
      html: applyTemplate(adminHtmlTemplate, templateContext),
      text: applyTemplate(adminTextTemplate, templateContext),
    });
    sent.push(...adminRecipients);
  }

  return { ok: true, skipped: false as const, sent };
}
