// 共有カード画像用に、使う文字だけのフォントをGoogle Fontsから取ってくる
export async function loadRoundedFont(text: string, weight = 800) {
  const url = `https://fonts.googleapis.com/css2?family=M+PLUS+Rounded+1c:wght@${weight}&text=${encodeURIComponent(text)}`;
  const css = await (await fetch(url)).text();
  const src = css.match(/src: url\((.+?)\) format\('(opentype|truetype)'\)/);
  if (!src) throw new Error("フォントが読み込めませんでした");
  return (await fetch(src[1])).arrayBuffer();
}
