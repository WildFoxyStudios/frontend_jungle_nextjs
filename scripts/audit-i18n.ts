#!/usr/bin/env tsx
/**
 * audit-i18n.ts — Multi-locale i18n auditor.
 *
 * Two responsibilities:
 *
 *  1. Frontend message catalog audit. For every locale under
 *     `frontend/apps/web/messages/<locale>.json`, compute coverage relative
 *     to the canonical English reference (`en.json`). Optionally fill any
 *     missing keys with the English default value (when invoked with
 *     `--write-stubs`) so the app keeps shipping a usable string instead
 *     of a raw dotted key.
 *
 *  2. Legacy PHP dictionary audit. Walk the original WoWonder Sunshine
 *     theme (`Script/themes/sunshine/layout/**\/*.phtml`) extracting every
 *     `$wo['lang']['<key>']` reference, deduplicate, and report which
 *     legacy keys still don't have any equivalent surface in the new
 *     React/Next.js catalog. The mapping is best-effort (legacy keys are
 *     snake_case, modern keys are dotted/camelCase) — any legacy key whose
 *     normalized form ("snake-case → camelCase, comparing as a substring
 *     anywhere in the dotted path") cannot be located is flagged.
 *
 * Output:
 *   - `docs/i18n-coverage.md` — human-readable summary committed to repo.
 *   - When `--write-stubs` is passed, also rewrites locale JSON files with
 *     English fallbacks for every missing key.
 *
 * Usage (from repo root):
 *   pnpm -C frontend run audit:i18n
 *   pnpm -C frontend run audit:i18n -- --write-stubs
 */

import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");
const MESSAGES_DIR = path.join(REPO_ROOT, "frontend", "apps", "web", "messages");
const LEGACY_THEME_DIR = path.join(REPO_ROOT, "Script", "themes", "sunshine", "layout");
const LEGACY_LANG_FILE = path.join(REPO_ROOT, "Script", "assets", "languages", "english.php");
const COVERAGE_OUT = path.join(REPO_ROOT, "docs", "i18n-coverage.md");

const LOCALES = ["en", "es", "fr", "ar", "pt", "de", "tr", "ru", "it", "zh", "hi", "id", "ja", "ko", "nl", "pl", "fa"] as const;

type JsonRecord = { [key: string]: unknown };

function isPlainObject(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function flatten(input: unknown, prefix = ""): Record<string, string> {
  const out: Record<string, string> = {};
  if (!isPlainObject(input)) return out;
  for (const [key, raw] of Object.entries(input)) {
    const next = prefix ? `${prefix}.${key}` : key;
    if (isPlainObject(raw)) {
      Object.assign(out, flatten(raw, next));
    } else if (typeof raw === "string") {
      out[next] = raw;
    } else {
      out[next] = String(raw);
    }
  }
  return out;
}

function setDeep(target: JsonRecord, dotted: string, value: string): void {
  const parts = dotted.split(".");
  let cursor: JsonRecord = target;
  for (let i = 0; i < parts.length - 1; i++) {
    const segment = parts[i] as string;
    const existing = cursor[segment];
    if (!isPlainObject(existing)) {
      const fresh: JsonRecord = {};
      cursor[segment] = fresh;
      cursor = fresh;
    } else {
      cursor = existing;
    }
  }
  cursor[parts[parts.length - 1] as string] = value;
}

async function walk(dir: string, predicate: (full: string) => boolean): Promise<string[]> {
  let entries: import("node:fs").Dirent[];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return [];
  }
  const matches: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      matches.push(...(await walk(full, predicate)));
    } else if (entry.isFile() && predicate(full)) {
      matches.push(full);
    }
  }
  return matches;
}

async function loadJson(file: string): Promise<JsonRecord> {
  const raw = await fs.readFile(file, "utf-8");
  return JSON.parse(raw) as JsonRecord;
}

async function writeJson(file: string, data: JsonRecord): Promise<void> {
  await fs.writeFile(file, `${JSON.stringify(data, null, 2)}\n`, "utf-8");
}

const PHTML_LANG_RE = /\$wo\s*\[\s*'lang'\s*\]\s*\[\s*'([a-zA-Z0-9_]+)'\s*\]/g;
const PHP_DOUBLE_RE = /\$wo\s*\[\s*"lang"\s*\]\s*\[\s*"([a-zA-Z0-9_]+)"\s*\]/g;

async function extractLegacyKeysFromPhtml(): Promise<Set<string>> {
  const files = await walk(LEGACY_THEME_DIR, (full) => full.endsWith(".phtml"));
  const keys = new Set<string>();
  for (const file of files) {
    const text = await fs.readFile(file, "utf-8");
    for (const re of [PHTML_LANG_RE, PHP_DOUBLE_RE]) {
      re.lastIndex = 0;
      let match: RegExpExecArray | null;
      while ((match = re.exec(text)) !== null) {
        keys.add(match[1] as string);
      }
    }
  }
  return keys;
}

async function extractLegacyKeysFromEnglishPhp(): Promise<Set<string>> {
  const keys = new Set<string>();
  let text: string;
  try {
    text = await fs.readFile(LEGACY_LANG_FILE, "utf-8");
  } catch {
    return keys;
  }
  // Match `'<key>' => '...',` or `"<key>" => "...",`.
  const re = /'([a-zA-Z0-9_]+)'\s*=>/g;
  const re2 = /"([a-zA-Z0-9_]+)"\s*=>/g;
  for (const r of [re, re2]) {
    r.lastIndex = 0;
    let m: RegExpExecArray | null;
    while ((m = r.exec(text)) !== null) {
      keys.add(m[1] as string);
    }
  }
  return keys;
}

function snakeToCamel(snake: string): string {
  return snake.replace(/_([a-z0-9])/g, (_, ch: string) => ch.toUpperCase());
}

function legacyKeyMatches(legacy: string, modernPath: string): boolean {
  // Compare on lowercased camelCase form so e.g. "forget_password" hits "auth.forgotPassword".
  const camelLegacy = snakeToCamel(legacy.toLowerCase());
  const lowerPath = modernPath.toLowerCase();
  if (lowerPath.includes(camelLegacy.toLowerCase())) return true;
  // Also consider last-segment-only match.
  const lastSegment = modernPath.split(".").pop()?.toLowerCase() ?? "";
  if (lastSegment === camelLegacy.toLowerCase()) return true;
  // Heuristic synonyms.
  const synonyms: Record<string, string[]> = {
    forget_password: ["forgotpassword"],
    sign_in: ["signin"],
    sign_up: ["signup"],
    log_in: ["login", "signin"],
    log_out: ["logout", "signout"],
  };
  for (const alt of synonyms[legacy] ?? []) {
    if (lowerPath.includes(alt)) return true;
  }
  return false;
}

interface LocaleReport {
  locale: string;
  totalKeys: number;
  presentKeys: number;
  missingKeys: string[];
  extraKeys: string[];
}

interface LegacyReport {
  totalLegacyKeys: number;
  unmappedLegacyKeys: string[];
  unmappedSample: string[];
}

async function auditLocales(writeStubs: boolean): Promise<{ reports: LocaleReport[]; reference: Record<string, string> }> {
  const enFile = path.join(MESSAGES_DIR, "en.json");
  const enJson = await loadJson(enFile);
  const enFlat = flatten(enJson);
  const reports: LocaleReport[] = [];
  for (const locale of LOCALES) {
    const file = path.join(MESSAGES_DIR, `${locale}.json`);
    let json: JsonRecord;
    try {
      json = await loadJson(file);
    } catch {
      json = {};
    }
    const flat = flatten(json);
    const missing: string[] = [];
    for (const key of Object.keys(enFlat)) {
      if (!(key in flat)) missing.push(key);
    }
    const extra: string[] = [];
    for (const key of Object.keys(flat)) {
      if (!(key in enFlat)) extra.push(key);
    }
    reports.push({
      locale,
      totalKeys: Object.keys(enFlat).length,
      presentKeys: Object.keys(enFlat).length - missing.length,
      missingKeys: missing,
      extraKeys: extra,
    });
    if (writeStubs && missing.length > 0 && locale !== "en") {
      for (const key of missing) {
        setDeep(json, key, enFlat[key] as string);
      }
      await writeJson(file, json);
    }
  }
  return { reports, reference: enFlat };
}

async function auditLegacy(reference: Record<string, string>): Promise<LegacyReport> {
  const phtmlKeys = await extractLegacyKeysFromPhtml();
  const phpKeys = await extractLegacyKeysFromEnglishPhp();
  const all = new Set<string>([...phtmlKeys, ...phpKeys]);
  const modernPaths = Object.keys(reference);
  const unmapped: string[] = [];
  for (const legacy of all) {
    let mapped = false;
    for (const modern of modernPaths) {
      if (legacyKeyMatches(legacy, modern)) {
        mapped = true;
        break;
      }
    }
    if (!mapped) unmapped.push(legacy);
  }
  unmapped.sort();
  return {
    totalLegacyKeys: all.size,
    unmappedLegacyKeys: unmapped,
    unmappedSample: unmapped.slice(0, 60),
  };
}

function pct(numerator: number, denominator: number): string {
  if (denominator === 0) return "100%";
  return `${((numerator / denominator) * 100).toFixed(1)}%`;
}

function buildMarkdown(reports: LocaleReport[], legacy: LegacyReport, wroteStubs: boolean): string {
  const lines: string[] = [];
  lines.push("# i18n coverage report");
  lines.push("");
  lines.push("> Auto-generated by `frontend/scripts/audit-i18n.ts`. Do not edit by hand.");
  lines.push(">");
  lines.push("> Run `pnpm -C frontend run audit:i18n` to refresh, or `pnpm -C frontend run audit:i18n -- --write-stubs` to also backfill missing locale strings with the English default.");
  lines.push("");
  lines.push("## Frontend message catalogs");
  lines.push("");
  lines.push("Reference: `frontend/apps/web/messages/en.json`.");
  lines.push("");
  lines.push("| Locale | Coverage | Present | Missing | Extra |");
  lines.push("|:------:|---------:|--------:|--------:|------:|");
  for (const report of reports) {
    lines.push(
      `| \`${report.locale}\` | ${pct(report.presentKeys, report.totalKeys)} | ${report.presentKeys} | ${report.missingKeys.length} | ${report.extraKeys.length} |`,
    );
  }
  lines.push("");
  if (wroteStubs) {
    lines.push("> **Stubs written**: missing keys were filled with English defaults during this run.");
    lines.push("");
  }
  lines.push("### Per-locale missing keys");
  lines.push("");
  for (const report of reports) {
    if (report.missingKeys.length === 0) continue;
    lines.push(`#### \`${report.locale}\` — ${report.missingKeys.length} missing`);
    lines.push("");
    lines.push("```");
    for (const key of report.missingKeys.slice(0, 200)) lines.push(key);
    if (report.missingKeys.length > 200) lines.push(`… and ${report.missingKeys.length - 200} more`);
    lines.push("```");
    lines.push("");
  }
  lines.push("### Per-locale extra (orphan) keys");
  lines.push("");
  let anyExtra = false;
  for (const report of reports) {
    if (report.extraKeys.length === 0) continue;
    anyExtra = true;
    lines.push(`#### \`${report.locale}\` — ${report.extraKeys.length} extra`);
    lines.push("");
    lines.push("```");
    for (const key of report.extraKeys.slice(0, 100)) lines.push(key);
    if (report.extraKeys.length > 100) lines.push(`… and ${report.extraKeys.length - 100} more`);
    lines.push("```");
    lines.push("");
  }
  if (!anyExtra) {
    lines.push("All locale catalogs are aligned — no orphan keys detected.");
    lines.push("");
  }
  lines.push("## Legacy WoWonder dictionary parity");
  lines.push("");
  lines.push(`Scanned **${legacy.totalLegacyKeys}** distinct \`$wo['lang']['…']\` keys across the legacy Sunshine theme + \`Script/assets/languages/english.php\`.`);
  lines.push("");
  lines.push(`Unmapped (no obvious counterpart found in \`en.json\` via snake-case → camelCase substring matching): **${legacy.unmappedLegacyKeys.length}**`);
  lines.push("");
  if (legacy.unmappedSample.length > 0) {
    lines.push("First 60 unmapped legacy keys (full list available with --verbose flag in future versions):");
    lines.push("");
    lines.push("```");
    for (const key of legacy.unmappedSample) lines.push(key);
    lines.push("```");
    lines.push("");
  }
  lines.push("> Note: the matcher is heuristic. Many of these legacy keys describe screens that the green-field web app deliberately omits (admin panel, alternative website modes, mobile API v2, etc.) and are therefore expected to remain unmapped. Use this list as a checklist when adding new screens to the new app.");
  lines.push("");
  return lines.join("\n");
}

async function main(): Promise<void> {
  const writeStubs = process.argv.includes("--write-stubs");
  const { reports, reference } = await auditLocales(writeStubs);
  const legacy = await auditLegacy(reference);
  const md = buildMarkdown(reports, legacy, writeStubs);
  await fs.mkdir(path.dirname(COVERAGE_OUT), { recursive: true });
  await fs.writeFile(COVERAGE_OUT, md, "utf-8");
  // eslint-disable-next-line no-console
  console.log(`Wrote ${path.relative(REPO_ROOT, COVERAGE_OUT)}`);
  for (const report of reports) {
    // eslint-disable-next-line no-console
    console.log(`  ${report.locale}: ${pct(report.presentKeys, report.totalKeys)} (${report.missingKeys.length} missing)`);
  }
  // eslint-disable-next-line no-console
  console.log(`Legacy unmapped: ${legacy.unmappedLegacyKeys.length} / ${legacy.totalLegacyKeys}`);
  if (writeStubs) {
    // eslint-disable-next-line no-console
    console.log("Stubs written.");
  }
}

main().catch((err: unknown) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
