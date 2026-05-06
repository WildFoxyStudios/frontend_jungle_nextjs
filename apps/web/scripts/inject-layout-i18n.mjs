/**
 * Injects header.themeSunshine + nav.navReorderHint. Run from frontend/apps/web:
 *   node scripts/inject-layout-i18n.mjs
 */
import fs from "node:fs";
import path from "node:path";

const themeSunshine = {
  en: "Sunshine",
  es: "Sunshine",
  de: "Sunshine",
  fr: "Sunshine",
  pt: "Sunshine",
  it: "Sunshine",
  nl: "Sunshine",
  pl: "Sunshine",
  ru: "Sunshine",
  tr: "Sunshine",
  ja: "Sunshine",
  ko: "Sunshine",
  zh: "Sunshine",
  hi: "Sunshine",
  id: "Sunshine",
  fa: "Sunshine",
  ar: "Sunshine",
};

const navReorderHint = {
  en: "Reorder shortcuts on desktop — use the grips in the left sidebar.",
  es: "Reordena atajos en el escritorio con las asas de la barra lateral.",
  de: "Shortcuts auf dem Desktop mit den Griffen in der linken Leiste sortieren.",
  fr: "Réorganisez les raccourcis sur ordinateur avec les poignées de la barre latérale gauche.",
  pt: "Reordene atalhos no desktop usando as alças na barra lateral.",
  it: "Riordina le scelte rapide su desktop con le maniglie nella barra laterale sinistra.",
  nl: "Herkoppel snelkoppelingen op desktop met de grepen links.",
  pl: "Zmieniaj kolejność skrótów na pulpicie uchwytami na lewym pasku.",
  ru: "Меняйте порядок ярлыков на ПК через ручки в левой панели.",
  tr: "Masaüstünde kısayol sırasını sol şeritteki kulplarla düzenleyin.",
  ja: "デスクトップでは左サイドバーのつまみからショートカットの並びを変更できます。",
  ko: "데스크톱에서는 왼쪽 사이드바의 손잡이로 바로가기 순서를 변경하세요.",
  zh: "桌面端可在左侧栏用把手调整快捷方式顺序。",
  hi: "डेस्कटॉप पर बाएँ साइडबार के हैंडल से शॉर्टकट क्रम बदलें।",
  id: "Sesuaikan urutan pintasan di desktop lewat pegangan di sidebar kiri.",
  fa: "در دسکتاپ ترتیب میانبر را با دستهٔ نوار کناری چپ تغییر دهید.",
  ar: "على سطح المكتب غيّر ترتيب الاختصارات بمقابض الشريط الأيسر.",
};

const dir = path.join(process.cwd(), "messages");

for (const file of fs.readdirSync(dir).filter((f) => f.endsWith(".json"))) {
  const loc = path.basename(file, ".json");
  const fp = path.join(dir, file);
  const j = JSON.parse(fs.readFileSync(fp, "utf8"));
  if (!j.header) throw new Error(`no header ${file}`);
  if (!j.nav) throw new Error(`no nav ${file}`);
  j.header.themeSunshine = themeSunshine[loc];
  j.nav.navReorderHint = navReorderHint[loc];
  fs.writeFileSync(fp, `${JSON.stringify(j, null, 2)}\n`, "utf8");
}
