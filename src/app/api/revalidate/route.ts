// 「作り直し」の合図を受け取る入口
// DB を管理画面以外（Claude Code の SQL など）で変えたときに呼ぶと、トップ・一覧・イベントページが作り直される
// 合言葉（REVALIDATE_TOKEN、長いランダムな文字）を知っている人だけ使える
//   呼び方：POST /api/revalidate  ヘッダー Authorization: Bearer <合言葉>
import { revalidateTag } from "next/cache";

function sameText(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function POST(request: Request) {
  const token = process.env.REVALIDATE_TOKEN;
  const given = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!token || token.length < 32 || !sameText(given, token)) {
    return Response.json({ ok: false }, { status: 401 });
  }
  // すぐに古いページを出さないようにする（次に開いた人から新しいページ）
  revalidateTag("events", { expire: 0 });
  return Response.json({ ok: true, revalidated: "events" });
}
