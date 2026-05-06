/**
 * Merges `liveRoom` from messages/en.json into each locale file so missing
 * keys fall back to English instead of showing raw message paths.
 * Existing per-locale `liveRoom` keys are preserved (spread after en).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const messagesDir = path.join(__dirname, "..", "messages");
const en = JSON.parse(fs.readFileSync(path.join(messagesDir, "en.json"), "utf8"));
const liveEn = en.liveRoom;
if (!liveEn || typeof liveEn !== "object") {
  console.error("en.json missing liveRoom");
  process.exit(1);
}

const files = fs.readdirSync(messagesDir).filter((f) => f.endsWith(".json"));
for (const f of files) {
  if (f === "en.json") continue;
  const p = path.join(messagesDir, f);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  j.liveRoom = { ...liveEn, ...(j.liveRoom && typeof j.liveRoom === "object" ? j.liveRoom : {}) };
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log("merged liveRoom →", f);
}
