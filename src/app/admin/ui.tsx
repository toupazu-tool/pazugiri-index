// 管理画面で使う、小さな部品（お知らせ、入力欄の見た目）
export const inputClass = "w-full rounded border border-notebook-line bg-white px-2 py-1.5";
export const buttonClass = "rounded bg-notebook-green px-3 py-1.5 text-xs font-bold text-white hover:opacity-90";
export const subButtonClass = "rounded border border-notebook-line bg-white px-3 py-1.5 text-xs font-bold hover:bg-notebook-beige";
export const dangerButtonClass = "rounded border border-notebook-red bg-white px-3 py-1.5 text-xs font-bold text-notebook-red hover:bg-[#fbeaea]";

export function Notice({ msg, error }: { msg?: string; error?: string }) {
  if (error) return <p role="alert" className="mb-4 rounded border border-notebook-red bg-[#fbeaea] px-3 py-2 font-bold text-notebook-red">{error}</p>;
  if (msg) return <p role="status" className="mb-4 rounded border border-notebook-green bg-[#eef6e9] px-3 py-2 font-bold text-notebook-green">{msg}</p>;
  return null;
}

export function Field({ label, children, hint }: { label: string; children: React.ReactNode; hint?: string }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-bold">{label}</span>
      {children}
      {hint && <span className="mt-0.5 block text-xs text-notebook-muted">{hint}</span>}
    </label>
  );
}

export const KIND_LABELS: Record<string, string> = { material: "素材", sword: "刀剣男士", koban: "小判", other: "その他" };
