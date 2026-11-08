import Link from "next/link";
import { site } from "@/lib/site";

// サイト共通のヘッダー（PHPの header.php のように、どのページでも読み込む部品）
export function SiteHeader() {
  return (
    <header className="relative z-10 border-b-[6px] border-game-gold bg-game-green shadow-[0_4px_8px_rgba(90,70,48,0.25)] px-6 py-5 text-white">
      {/* ロゴとサイト名を押すとトップページへ戻る */}
      <Link href="/" className="mx-auto flex max-w-2xl items-center gap-4">
        {/* 自作ロゴ（public/logo.svg）を白丸に入れる */}
        <span className="grid size-14 shrink-0 sm:size-[72px] place-items-center rounded-full bg-white shadow-md">
          <img src="/logo.svg" alt="" width={205} height={195} className="h-8 w-auto sm:h-11" />
        </span>
        <span className="block">
          <span className="block text-2xl leading-tight font-extrabold tracking-widest sm:text-3xl">{site.name}</span>
          <span className="mt-1.5 block text-xs tracking-wider sm:text-sm text-white/90">刀剣乱舞ぱずぎり非公式サイト</span>
        </span>
      </Link>
    </header>
  );
}
