// 「GitHub でログイン」を押したとき：GitHub のログイン画面へ送る
import { NextResponse } from "next/server";
import { STATE_COOKIE, cookieOptions, randomToken } from "@/lib/adminAuth";

export async function GET(request: Request) {
  const clientId = process.env.GITHUB_CLIENT_ID;
  if (!clientId) return new Response("GITHUB_CLIENT_ID が設定されていません", { status: 500 });
  const origin = new URL(request.url).origin;
  const state = randomToken();
  const url = new URL("https://github.com/login/oauth/authorize");
  url.searchParams.set("client_id", clientId);
  url.searchParams.set("redirect_uri", `${origin}/api/admin/auth/callback`);
  url.searchParams.set("scope", "read:user");
  url.searchParams.set("state", state);
  url.searchParams.set("allow_signup", "false");
  const res = NextResponse.redirect(url);
  // GitHub から戻ってきたときに、本当にここから出発したかを確かめる合言葉（10分だけ有効）
  res.cookies.set(STATE_COOKIE, state, { ...cookieOptions, maxAge: 600 });
  return res;
}
