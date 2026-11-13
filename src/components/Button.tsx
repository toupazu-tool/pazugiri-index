import Link from "next/link";
import type { ReactNode } from "react";

// 仮の共通ボタン。デザインが決まったら、このファイルの見た目だけ直せば全体に反映される
type ButtonProps = {
  href: string;
  children: ReactNode;
  className?: string;
};

export function Button({ href, children, className = "" }: ButtonProps) {
  return (
    <Link
      href={href}
      className={`inline-flex min-h-12 items-center justify-center rounded-xl bg-notebook-green px-6 py-2 text-center text-base font-bold text-white shadow-md transition hover:opacity-90 ${className}`.trim()}
    >
      {children}
    </Link>
  );
}