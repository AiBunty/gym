import crypto from "crypto";

type AdminTokenPayload = {
  username: string;
  iat: number;
  exp: number;
};

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getTokenSecret(): string {
  return process.env.ADMIN_TOKEN_SECRET || process.env.ADMIN_PANEL_KEY || "change-me-in-env";
}

function base64UrlEncode(input: string | Buffer): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function base64UrlDecode(input: string): string {
  const padded = input.replace(/-/g, "+").replace(/_/g, "/") + "===".slice((input.length + 3) % 4);
  return Buffer.from(padded, "base64").toString("utf-8");
}

function sign(unsignedToken: string): string {
  return base64UrlEncode(crypto.createHmac("sha256", getTokenSecret()).update(unsignedToken).digest());
}

export function createAdminToken(username: string): string {
  const now = Date.now();
  const payload: AdminTokenPayload = {
    username,
    iat: now,
    exp: now + TOKEN_TTL_MS,
  };

  const header = base64UrlEncode(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = base64UrlEncode(JSON.stringify(payload));
  const unsigned = `${header}.${body}`;
  const signature = sign(unsigned);
  return `${unsigned}.${signature}`;
}

export function verifyAdminToken(token: string): { ok: true; payload: AdminTokenPayload } | { ok: false; message: string } {
  if (!token || typeof token !== "string") {
    return { ok: false, message: "Missing token" };
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return { ok: false, message: "Invalid token format" };
  }

  const [header, body, signature] = parts;
  const unsigned = `${header}.${body}`;
  const expectedSignature = sign(unsigned);

  const provided = Buffer.from(signature);
  const expected = Buffer.from(expectedSignature);
  if (provided.length !== expected.length || !crypto.timingSafeEqual(provided, expected)) {
    return { ok: false, message: "Invalid token signature" };
  }

  try {
    const payload = JSON.parse(base64UrlDecode(body)) as AdminTokenPayload;
    if (!payload?.username || !payload?.exp) {
      return { ok: false, message: "Invalid token payload" };
    }
    if (payload.exp < Date.now()) {
      return { ok: false, message: "Token expired" };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, message: "Invalid token payload" };
  }
}
