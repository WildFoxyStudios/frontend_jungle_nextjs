/** Adds search_extra keys for reels/sounds tab to all messages/*.json — run from apps/web */
import fs from "node:fs";
import path from "node:path";

const dir = path.join(import.meta.dirname, "..", "messages");

/** @type {Record<string, { noReels: string; reelSoundsTab: string; noSounds: string }>} */
const LOC = {
  en: { noReels: "No reels found.", reelSoundsTab: "Sounds", noSounds: "No sounds found." },
  es: { noReels: "No hay reels.", reelSoundsTab: "Sonidos", noSounds: "No se encontraron sonidos." },
  fr: {
    noReels: "Aucun reel trouvé.",
    reelSoundsTab: "Sons",
    noSounds: "Aucun son trouvé.",
  },
  de: { noReels: "Keine Reels gefunden.", reelSoundsTab: "Sounds", noSounds: "Keine Sounds gefunden." },
  pt: { noReels: "Nenhum reel encontrado.", reelSoundsTab: "Sons", noSounds: "Nenhum som encontrado." },
  it: { noReels: "Nessun reel trovato.", reelSoundsTab: "Suoni", noSounds: "Nessun suono trovato." },
  nl: {
    noReels: "Geen reels gevonden.",
    reelSoundsTab: "Geluiden",
    noSounds: "Geen geluiden gevonden.",
  },
  pl: { noReels: "Brak reelów.", reelSoundsTab: "Dźwięki", noSounds: "Nie znaleziono dźwięków." },
  ru: { noReels: "Рилсы не найдены.", reelSoundsTab: "Звуки", noSounds: "Звуки не найдены." },
  tr: { noReels: "Reels bulunamadı.", reelSoundsTab: "Sesler", noSounds: "Ses bulunamadı." },
  ja: { noReels: "リールが見つかりません。", reelSoundsTab: "サウンド", noSounds: "サウンドが見つかりません。" },
  ko: { noReels: "릴이 없습니다.", reelSoundsTab: "사운드", noSounds: "사운드를 찾을 수 없습니다." },
  zh: { noReels: "没有找到短视频。", reelSoundsTab: "音频", noSounds: "没有找到音频。" },
  ar: { noReels: "لا توجد مقاطع ريلز.", reelSoundsTab: "الأصوات", noSounds: "لم يُعثر على أصوات." },
  fa: { noReels: "ریلی پیدا نشد.", reelSoundsTab: "صداها", noSounds: "صدایی پیدا نشد." },
  hi: { noReels: "कोई रील नहीं मिली।", reelSoundsTab: "ध्वनियाँ", noSounds: "कोई ध्वनि नहीं मिली।" },
  id: { noReels: "Tidak ada reel.", reelSoundsTab: "Suara", noSounds: "Tidak ada suara." },
};

for (const f of fs.readdirSync(dir).filter((x) => x.endsWith(".json"))) {
  const code = f.replace(".json", "");
  const patch = LOC[code];
  if (!patch) continue;
  const p = path.join(dir, f);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  if (!j.search_extra) j.search_extra = {};
  j.search_extra.noReels = patch.noReels;
  j.search_extra.reelSoundsTab = patch.reelSoundsTab;
  j.search_extra.noSounds = patch.noSounds;
  fs.writeFileSync(p, `${JSON.stringify(j, null, 2)}\n`, "utf8");
  console.log("patched", f);
}
