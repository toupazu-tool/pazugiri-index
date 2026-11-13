import type { ReactNode } from "react";
import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadRoundedFont } from "@/lib/font";
import { site } from "@/lib/site";

/** LINEやXの共有カード画像の大きさ */
export const OG_IMAGE_SIZE = { width: 1200, height: 630 };
export const OG_IMAGE_CONTENT_TYPE = "image/png";

type SiteOgImage = {
  kind: "site";
  title: string;
  subtitle: string;
  toolsLine: string;
};

type ToolOgImage = {
  kind: "tool";
  title: string;
  subtitle: string;
  kicker?: string;
};

export type OgImageOptions = SiteOgImage | ToolOgImage;

async function loadLogoAndFont(text: string) {
  const logo = await readFile(join(process.cwd(), "public/logo.svg"), "base64");
  const font = await loadRoundedFont(text);
  return { logo, font };
}

function LogoBadge({ logo, size = 150, img = 100 }: { logo: string; size?: number; img?: number }) {
  const imgH = Math.round(img * 0.95);
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: 999,
        background: "#fff",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        boxShadow: "0 4px 12px rgba(90,70,48,0.3)",
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={`data:image/svg+xml;base64,${logo}`} width={img} height={imgH} alt="" />
    </div>
  );
}

function Frame({ children, footer }: { children: ReactNode; footer?: string }) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        position: "relative",
        display: "flex",
        background: "#4a8520",
        padding: 28,
        fontFamily: "Rounded",
      }}
    >
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#fffdf6",
          border: "8px solid #c9a227",
          borderRadius: 40,
          color: "#5a4630",
        }}
      >
        {children}
      </div>
      {footer ? (
        <div style={{ position: "absolute", bottom: 40, right: 64, display: "flex", fontSize: 26, color: "#8a7350" }}>
          {footer}
        </div>
      ) : null}
    </div>
  );
}

/** トップや共通のフォールバック用。サイト全体を表すカード */
export async function createSiteOgImage(options: Omit<SiteOgImage, "kind">) {
  const text = `${options.title}${options.subtitle}${options.toolsLine}・`;
  const { logo, font } = await loadLogoAndFont(text);

  return new ImageResponse(
    (
      <Frame>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
            <LogoBadge logo={logo} />
            <div style={{ fontSize: 80, lineHeight: 1.2 }}>{options.title}</div>
          </div>
          <div style={{ marginTop: 36, fontSize: 36 }}>{options.subtitle}</div>
          <div style={{ marginTop: 20, fontSize: 30, color: "#8a7350" }}>{options.toolsLine}</div>
        </div>
      </Frame>
    ),
    { ...OG_IMAGE_SIZE, fonts: [{ name: "Rounded", data: font, weight: 800, style: "normal" }] },
  );
}

/** 各ツールページ用。小さな「ぱずぎり」＋大きなツール名 */
export async function createToolOgImage(options: Omit<ToolOgImage, "kind">) {
  const kicker = options.kicker ?? "ぱずぎり";
  const footer = `${site.name}・${site.tagline}`;
  const text = `${kicker}${options.title}${options.subtitle}${footer}`;
  const { logo, font } = await loadLogoAndFont(text);

  return new ImageResponse(
    (
      <Frame footer={footer}>
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <LogoBadge logo={logo} />
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 44, color: "#4a8520" }}>{kicker}</div>
            <div style={{ fontSize: 68, lineHeight: 1.2 }}>{options.title}</div>
          </div>
        </div>
        <div style={{ marginTop: 40, fontSize: 36 }}>{options.subtitle}</div>
      </Frame>
    ),
    { ...OG_IMAGE_SIZE, fonts: [{ name: "Rounded", data: font, weight: 800, style: "normal" }] },
  );
}
