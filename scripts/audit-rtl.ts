#!/usr/bin/env tsx
/**
 * audit-rtl.ts — Right-to-left readiness audit.
 *
 * Generates `docs/rtl-audit.md` with three checks:
 *   1. Confirms `<html dir>` is set per-locale in `apps/web/src/app/layout.tsx`.
 *   2. Confirms Tailwind v4 is in use (RTL variants are built-in, no plugin needed).
 *   3. Counts physical (LTR-biased) Tailwind utilities used across `apps/web/src`
 *      to surface candidate components that would benefit from logical
 *      properties (`ms-*`/`me-*`/`ps-*`/`pe-*`/`start-*`/`end-*`) or explicit
 *      `rtl:` overrides.
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const WEB_SRC = path.join(REPO_ROOT, "frontend", "apps", "web", "src");
const LAYOUT_FILE = path.join(WEB_SRC, "app", "layout.tsx");
const WEB_PKG = path.join(REPO_ROOT, "frontend", "apps", "web", "package.json");
const I18N_FILE = path.join(WEB_SRC, "i18n.ts");
const OUTPUT = path.join(REPO_ROOT, "docs", "rtl-audit.md");

const RTL_LOCALES = ["ar", "fa", "he", "ur"] as const;

const PHYSICAL_PATTERNS: Array<[RegExp, string]> = [
  [/\bml-\d/g, "ml-N"],
  [/\bmr-\d/g, "mr-N"],
  [/\bpl-\d/g, "pl-N"],
  [/\bpr-\d/g, "pr-N"],
  [/\bleft-\d/g, "left-N"],
  [/\bright-\d/g, "right-N"],
  [/\bborder-l\b/g, "border-l"],
  [/\bborder-r\b/g, "border-r"],
  [/\brounded-l\w*/g, "rounded-l*"],
  [/\brounded-r\w*/g, "rounded-r*"],
  [/\btext-left\b/g, "text-left"],
  [/\btext-right\b/g, "text-right"],
];

async function walk(dir: string, extOk: (file: string) => boolean): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const results: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      results.push(...(await walk(full, extOk)));
    } else if (entry.isFile() && extOk(full)) {
      results.push(full);
    }
  }
  return results;
}

async function checkLayoutDir(): Promise<{ ok: boolean; detail: string }> {
  const text = await fs.readFile(LAYOUT_FILE, "utf-8");
  const ok = /dir=\{?dir/.test(text) || /dir="rtl"/.test(text) || /dir\s*=\s*\{/.test(text);
  return {
    ok,
    detail: ok
      ? "`<html dir>` is set dynamically in `frontend/apps/web/src/app/layout.tsx` based on the active locale."
      : "Missing `dir` attribute on `<html>` element.",
  };
}

async function checkTailwindV4(): Promise<{ ok: boolean; detail: string }> {
  const pkg = JSON.parse(await fs.readFile(WEB_PKG, "utf-8")) as {
    devDependencies?: Record<string, string>;
    dependencies?: Record<string, string>;
  };
  const version = pkg.devDependencies?.tailwindcss ?? pkg.dependencies?.tailwindcss ?? "missing";
  const ok = version.includes("4.");
  return {
    ok,
    detail: ok
      ? `Tailwind v4 (\`${version}\`) provides built-in \`rtl:\` and \`ltr:\` variants plus logical properties (\`ms-*\`, \`me-*\`, \`ps-*\`, \`pe-*\`, \`start-*\`, \`end-*\`). No \`tailwindcss-rtl\` plugin is required.`
      : `Tailwind version is \`${version}\` — RTL variants are built-in only on v3.3+. Consider upgrading or installing \`tailwindcss-rtl\`.`,
  };
}

async function checkLocales(): Promise<{ rtl: string[]; ltr: string[] }> {
  const text = await fs.readFile(I18N_FILE, "utf-8");
  const match = text.match(/locales\s*=\s*\[([^\]]+)\]/);
  if (!match) return { rtl: [], ltr: [] };
  const locales = (match[1] as string)
    .split(",")
    .map((s) => s.replace(/[^a-z]/gi, ""))
    .filter(Boolean);
  const rtl = locales.filter((l) => (RTL_LOCALES as readonly string[]).includes(l));
  const ltr = locales.filter((l) => !(RTL_LOCALES as readonly string[]).includes(l));
  return { rtl, ltr };
}

async function scanPhysicalUtilities(): Promise<{ totalHits: number; perFile: Array<{ file: string; counts: Record<string, number> }> }> {
  const files = await walk(WEB_SRC, (f) => f.endsWith(".tsx") || f.endsWith(".ts"));
  const perFile: Array<{ file: string; counts: Record<string, number> }> = [];
  let totalHits = 0;
  for (const file of files) {
    const text = await fs.readFile(file, "utf-8");
    const counts: Record<string, number> = {};
    for (const [re, label] of PHYSICAL_PATTERNS) {
      re.lastIndex = 0;
      const m = text.match(re);
      if (m && m.length) {
        counts[label] = m.length;
        totalHits += m.length;
      }
    }
    if (Object.keys(counts).length > 0) {
      perFile.push({ file: path.relative(REPO_ROOT, file), counts });
    }
  }
  perFile.sort((a, b) => sumCounts(b.counts) - sumCounts(a.counts));
  return { totalHits, perFile };
}

function sumCounts(counts: Record<string, number>): number {
  return Object.values(counts).reduce((acc, n) => acc + n, 0);
}

async function main(): Promise<void> {
  const layout = await checkLayoutDir();
  const tailwind = await checkTailwindV4();
  const locales = await checkLocales();
  const { totalHits, perFile } = await scanPhysicalUtilities();

  const lines: string[] = [];
  lines.push("# RTL audit");
  lines.push("");
  lines.push("> Auto-generated by `frontend/scripts/audit-rtl.ts`. Re-run with `pnpm -C frontend run audit:rtl`.");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- HTML \`dir\`: ${layout.ok ? "OK" : "FAIL"} — ${layout.detail}`);
  lines.push(`- Tailwind RTL support: ${tailwind.ok ? "OK" : "FAIL"} — ${tailwind.detail}`);
  lines.push(`- RTL locales declared: ${locales.rtl.length > 0 ? locales.rtl.map((l) => `\`${l}\``).join(", ") : "none"}`);
  lines.push(`- LTR locales declared: ${locales.ltr.length} (\`${locales.ltr.join(", ")}\`)`);
  lines.push("");
  lines.push("## How RTL is wired");
  lines.push("");
  lines.push("`apps/web/src/app/layout.tsx` reads the active locale via `next-intl`'s `getLocale()` and emits");
  lines.push("`<html lang={locale} dir={dir}>` where `dir` is `\"rtl\"` for `ar` / `fa` / `he` / `ur` and `\"ltr\"`");
  lines.push("otherwise. Browsers then auto-mirror logical properties, flexbox row direction, and form controls.");
  lines.push("");
  lines.push("Tailwind v4 ships native variants for direction-aware styling:");
  lines.push("");
  lines.push("- `rtl:flex-row-reverse`, `rtl:text-right`, `rtl:rotate-180` etc.");
  lines.push("- Logical-property utilities: `ms-*` (margin-inline-start), `me-*` (margin-inline-end),");
  lines.push("  `ps-*`, `pe-*`, `start-*`, `end-*`, `border-s`, `border-e`, `rounded-s-*`, `rounded-e-*`.");
  lines.push("");
  lines.push("No additional Tailwind plugin (e.g. `tailwindcss-rtl`) is required.");
  lines.push("");
  lines.push("## Physical-utility usage (candidates for logical-property migration)");
  lines.push("");
  lines.push(`Total hits: **${totalHits}** across **${perFile.length}** files.`);
  lines.push("");
  lines.push("These utilities don't auto-mirror under `dir=\"rtl\"`. Migrate to logical properties (e.g. `ml-2 → ms-2`) or guard with a `rtl:` modifier when visual flipping is desired.");
  lines.push("");
  lines.push("| File | ml-N | mr-N | pl-N | pr-N | left-N | right-N | border-l | border-r | rounded-l* | rounded-r* | text-left | text-right |");
  lines.push("|------|-----:|-----:|-----:|-----:|-------:|--------:|---------:|---------:|-----------:|-----------:|----------:|-----------:|");
  for (const row of perFile.slice(0, 50)) {
    const c = row.counts;
    lines.push(
      `| \`${row.file}\` | ${c["ml-N"] ?? 0} | ${c["mr-N"] ?? 0} | ${c["pl-N"] ?? 0} | ${c["pr-N"] ?? 0} | ${c["left-N"] ?? 0} | ${c["right-N"] ?? 0} | ${c["border-l"] ?? 0} | ${c["border-r"] ?? 0} | ${c["rounded-l*"] ?? 0} | ${c["rounded-r*"] ?? 0} | ${c["text-left"] ?? 0} | ${c["text-right"] ?? 0} |`,
    );
  }
  if (perFile.length > 50) {
    lines.push("");
    lines.push(`… and ${perFile.length - 50} more files. Run the script to regenerate the full report.`);
  }
  lines.push("");
  lines.push("## Verifying RTL locally");
  lines.push("");
  lines.push("1. Switch the active locale via the language picker (or set the `NEXT_LOCALE` cookie to `ar`).");
  lines.push("2. DevTools → Elements → confirm `<html dir=\"rtl\">`.");
  lines.push("3. Toolbar/sidebar should mirror; icons and chevrons should flip where intended.");
  lines.push("4. Use the Playwright visual regression suite (D3) to baseline RTL screenshots.");
  lines.push("");

  await fs.mkdir(path.dirname(OUTPUT), { recursive: true });
  await fs.writeFile(OUTPUT, lines.join("\n"), "utf-8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(REPO_ROOT, OUTPUT)}`);
  // eslint-disable-next-line no-console
  console.log(`  layout dir: ${layout.ok ? "OK" : "FAIL"}`);
  // eslint-disable-next-line no-console
  console.log(`  tailwind v4: ${tailwind.ok ? "OK" : "FAIL"}`);
  // eslint-disable-next-line no-console
  console.log(`  RTL locales: ${locales.rtl.join(", ") || "none"}`);
  // eslint-disable-next-line no-console
  console.log(`  physical-utility hits: ${totalHits} across ${perFile.length} files`);
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
