import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadRoundedFont } from "@/lib/font";
import { site } from "@/lib/site";

// LINEやXで共有したときに出るカード画像（1200×630）
// キャラの絵は使わず、文字とロゴだけで作る
export const alt = "ぱずぎり イベントノルマ計算ツール｜ぱずぎり目録";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
  const logo = await readFile(join(process.cwd(), "public/logo.svg"), "base64");
  const lines = ["ぱずぎり", "イベントノルマ計算ツール", "欲しい報酬から1日のノルマがわかる", site.name, site.tagline];
  const font = await loadRoundedFont(lines.join("") + "・");

  return new ImageResponse(
    (
      <div style={{ width: "100%", height: "100%", position: "relative", display: "flex", background: "#4a8520", padding: 28, fontFamily: "Rounded" }}>
        <div style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", background: "#fffdf6", border: "8px solid #c9a227", borderRadius: 40, color: "#5a4630" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <div style={{ width: 150, height: 150, borderRadius: 999, background: "#fff", display: "flex", alignItems: "center", justifyContent: "center", boxShadow: "0 4px 12px rgba(90,70,48,0.3)" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={`data:image/svg+xml;base64,${logo}`} width={100} height={95} alt="" />
            </div>
            <div style={{ display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 44, color: "#4a8520" }}>ぱずぎり</div>
              <div style={{ fontSize: 68, lineHeight: 1.2 }}>イベントノルマ計算ツール</div>
            </div>
          </div>
          <div style={{ marginTop: 40, fontSize: 36 }}>欲しい報酬から1日のノルマがわかる</div>
        </div>
        <div style={{ position: "absolute", bottom: 40, right: 64, display: "flex", fontSize: 26, color: "#8a7350" }}>
          {site.name}・{site.tagline}
        </div>
      </div>
    ),
    { ...size, fonts: [{ name: "Rounded", data: font, weight: 800, style: "normal" }] },
  );
}
