import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";
import {
  toPublicUser,
  type Role,
  type Store,
  type User,
} from "@resto/core";

const SECRET = process.env.AUTH_SECRET ?? "dev-insecure-secret-change-me";
const TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000;

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64);
  return `${salt.toString("hex")}:${hash.toString("hex")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [saltHex, hashHex] = stored.split(":");
  if (!saltHex || !hashHex) return false;
  const expected = Buffer.from(hashHex, "hex");
  const actual = scryptSync(password, Buffer.from(saltHex, "hex"), 64);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

interface TokenPayload {
  sub: string;
  orgId: string;
  role: Role;
  exp: number;
}

function b64url(input: Buffer | string): string {
  return Buffer.from(input)
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function sign(data: string): string {
  return b64url(createHmac("sha256", SECRET).update(data).digest());
}

export function signToken(user: User): string {
  const payload: TokenPayload = {
    sub: user.id,
    orgId: user.orgId,
    role: user.role,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const body = b64url(JSON.stringify(payload));
  return `${body}.${sign(body)}`;
}

export function verifyToken(token: string): TokenPayload | null {
  const [body, sig] = token.split(".");
  if (!body || !sig) return null;
  const expected = sign(body);
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const payload = JSON.parse(
      Buffer.from(body.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
    ) as TokenPayload;
    return payload.exp > Date.now() ? payload : null;
  } catch {
    return null;
  }
}

export interface Session {
  user: User;
  orgId: string;
}

export function getSession(request: Request, store: Store): Session | null {
  const header = request.headers.get("authorization") ?? "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : "";
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const user = store.users.find((u) => u.id === payload.sub);
  return user ? { user, orgId: user.orgId } : null;
}

export function login(store: Store, email: string, password: string) {
  const user = store.users.find(
    (u) => u.email.toLowerCase() === email.trim().toLowerCase(),
  );
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new Error("Invalid email or password");
  }
  return { token: signToken(user), user: toPublicUser(user) };
}

/** Create the demo owner the first time the store has no users. */
export function ensureSeedUser(store: Store): void {
  if (store.users.length > 0) return;
  const org = store.orgs[0];
  if (!org) return;
  store.users.push({
    id: "usr_owner",
    orgId: org.id,
    email: "owner@demo.test",
    name: "Demo Owner",
    role: "owner",
    passwordHash: hashPassword("demo1234"),
  });
}
