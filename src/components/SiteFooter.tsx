import Link from "next/link";
import { site } from "@/lib/site";

// サイト共通のフッター（PHPの footer.php のような部品）
export function SiteFooter() {
  return (
    <footer className="relative z-10 border-t-[6px] border-game-gold bg-game-green shadow-[0_-4px_8px_rgba(90,70,48,0.25)] px-5 py-7 text-center text-xs leading-loose text-white">
      {/* ヘッダーと同じ白丸ロゴ、その下にサイト名 */}
      <div className="mb-4 flex flex-col items-center gap-2">
        <span className="grid size-12 shrink-0 place-items-center rounded-full bg-white shadow-md">
          <img src="/logo.svg" alt="" width={205} height={195} className="h-7 w-auto" />
        </span>
        <p className="text-lg font-extrabold tracking-widest">{site.name}</p>
      </div>
      <p>{site.name}は『刀剣乱舞ぱずぎり』の非公式ファンサイトです。公式とは関係ありません。</p>
      <p className="mt-3">
        <Link href="/privacy" className="underline underline-offset-4 hover:text-white/80">プライバシーポリシー</Link>
      </p>
      {/* 著作権表記：本家（公式サイトと同じ書き方）と、このサイト */}
      <p className="mt-4 text-white/80">ゲーム内の画像・名称の著作権は権利者に帰属します。</p>
      <p className="mt-1 text-[0.6rem] text-white/80 sm:text-xs">
        <span className="inline-block whitespace-nowrap">©2026 EXNOA LLC/NITRO PLUS</span> ／ <span className="inline-block whitespace-nowrap">© 2026 {site.name}</span>
      </p>
    </footer>
  );
}
