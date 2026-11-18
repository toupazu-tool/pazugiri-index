// GitHub でログインして戻ってきたとき：オーナーのアカウントか確かめて、管理画面に入れる
import { NextResponse } from "next/server";
import { SESSION_COOKIE, SESSION_MAX_AGE, STATE_COOKIE, cookieOptions, createSessionValue, isAllowedLogin } from "@/lib/adminAuth";

function fail(origin: string, reason: string) {
  const res = NextResponse.redirect(`${origin}/admin/login?error=${encodeURIComponent(reason)}`);
  res.cookies.delete(STATE_COOKIE);
  return res;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const origin = url.origin;
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const saved = request.headers.get("cookie")?.match(new RegExp(`${STATE_COOKIE}=([^;]+)`))?.[1];
  if (!code || !state || !saved || state !== saved) return fail(origin, "ログインをやり直してください");

  // GitHub に「この code はうちのアプリのものか」を確かめて、合鍵（アクセストークン）をもらう
  const tokenRes = await fetch("https://github.com/login/oauth/access_token", {
    method: "POST",
    headers: { Accept: "application/json", "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.GITHUB_CLIENT_ID,
      client_secret: process.env.GITHUB_CLIENT_SECRET,
      code,
      redirect_uri: `${origin}/api/admin/auth/callback`,
    }),
  });
  const token = (await tokenRes.json()) as { access_token?: string };
  if (!token.access_token) return fail(origin, "GitHub でのログインに失敗しました");

  // ログインした人の GitHub のユーザー名を聞く（合鍵はこのあと使わないので保存しない）
  const userRes = await fetch("https://api.github.com/user", {
    headers: { Authorization: `Bearer ${token.access_token}`, Accept: "application/vnd.github+json", "User-Agent": "pazugiri-index-admin" },
  });
  const user = (await userRes.json()) as { login?: string };
  if (!user.login || !isAllowedLogin(user.login)) return fail(origin, "このアカウントでは管理画面に入れません");

  const res = NextResponse.redirect(`${origin}/admin`);
  res.cookies.set(SESSION_COOKIE, await createSessionValue(user.login), { ...cookieOptions, maxAge: SESSION_MAX_AGE });
  res.cookies.delete(STATE_COOKIE);
  return res;
}
