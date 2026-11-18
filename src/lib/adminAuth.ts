// 管理画面のログイン（GitHub でログインして、オーナーのアカウントだけ通す）
// ログインできたら、署名付きの Cookie（PHP でいうセッション）を渡す。中身を書き換えると署名が合わなくなり、無効になる
//
// 使う環境変数（値は Vercel と手元の .env.local にだけ置く。チャットや Git に書かない）
//   GITHUB_CLIENT_ID / GITHUB_CLIENT_SECRET … GitHub の OAuth App の値
//   ADMIN_GITHUB_LOGIN … 入ってよい GitHub のユーザー名（toupazu-tool）
//   ADMIN_SESSION_SECRET … Cookie の署名に使う長いランダムな文字
//   ADMIN_DEV_BYPASS … 手元の開発（npm run dev）だけ、1 にするとログインを省ける
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const SESSION_COOKIE = "pz_admin";
export const STATE_COOKIE = "pz_admin_state";
const SESSION_DAYS = 7;

const encoder = new TextEncoder();

function base64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  let s = "";
  for (const b of arr) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

async function hmac(data: string): Promise<string> {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret || secret.length < 32) throw new Error("ADMIN_SESSION_SECRET が設定されていないか、短すぎます");
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return base64url(await crypto.subtle.sign("HMAC", key, encoder.encode(data)));
}

// 長さが同じかつ中身が同じか（時間で中身を当てられないよう、最後まで比べる）
function safeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** ログインできた人に渡す Cookie の中身を作る（「ユーザー名.期限.署名」） */
export async function createSessionValue(login: string): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + SESSION_DAYS * 24 * 60 * 60;
  const body = `${login}.${exp}`;
  return `${body}.${await hmac(body)}`;
}

/** Cookie の中身が正しければユーザー名、だめなら null */
export async function verifySessionValue(value: string | undefined): Promise<string | null> {
  if (!value) return null;
  const parts = value.split(".");
  if (parts.length !== 3) return null;
  const [login, exp, sig] = parts;
  if (!safeEqual(sig, await hmac(`${login}.${exp}`))) return null;
  if (Number(exp) < Date.now() / 1000) return null;
  if (!isAllowedLogin(login)) return null;
  return login;
}

export function isAllowedLogin(login: string): boolean {
  const allowed = process.env.ADMIN_GITHUB_LOGIN;
  return Boolean(allowed) && login.toLowerCase() === allowed!.toLowerCase();
}

function devBypass(): boolean {
  return process.env.NODE_ENV === "development" && process.env.ADMIN_DEV_BYPASS === "1";
}

/** 今ログインしている管理人のユーザー名（していなければ null） */
export async function getAdmin(): Promise<string | null> {
  if (devBypass()) return "dev";
  const store = await cookies();
  return verifySessionValue(store.get(SESSION_COOKIE)?.value);
}

/** 管理画面の中で使う：ログインしていなければログイン画面へ */
export async function requireAdmin(): Promise<string> {
  const admin = await getAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

/** ランダムな文字（ログインのときのなりすまし防止用） */
export function randomToken(bytes = 24): string {
  return base64url(crypto.getRandomValues(new Uint8Array(bytes)));
}

export const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  path: "/",
};
export const SESSION_MAX_AGE = SESSION_DAYS * 24 * 60 * 60;
