// ログアウト：Cookie を消してログイン画面へ
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/adminAuth";

export async function POST(request: Request) {
  const res = NextResponse.redirect(`${new URL(request.url).origin}/admin/login`, { status: 303 });
  res.cookies.delete(SESSION_COOKIE);
  return res;
}
