export const SESSION_COOKIE = "e2ee_presenter";

const encoder = new TextEncoder();

async function hmacHex(key: string, message: string): Promise<string> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    encoder.encode(key),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(message)));
  return Array.from(sig, (b) => b.toString(16).padStart(2, "0")).join("");
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export function passwordConfigured(): boolean {
  return Boolean(process.env.PRESENTER_PASSWORD);
}

/** Session token is derived from the password, so changing the password logs everyone out. */
export async function expectedSessionToken(): Promise<string | null> {
  const password = process.env.PRESENTER_PASSWORD;
  if (!password) return null;
  return hmacHex(password, "presenter-session:v1");
}

export async function isValidSession(token: string | undefined): Promise<boolean> {
  const expected = await expectedSessionToken();
  return Boolean(expected && token && constantTimeEqual(token, expected));
}

export async function checkPassword(input: string): Promise<boolean> {
  const password = process.env.PRESENTER_PASSWORD;
  if (!password) return false;
  // Compare MACs rather than raw strings so timing doesn't leak the length
  const [a, b] = await Promise.all([hmacHex("pw-check", input), hmacHex("pw-check", password)]);
  return constantTimeEqual(a, b);
}
