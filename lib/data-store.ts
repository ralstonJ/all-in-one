import "server-only";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

/**
 * Where the demo data lives.
 * - Locally: `.data/` in the project (gitignored), kept between restarts.
 * - On Vercel: the function's temporary folder, because the project folder is
 *   read-only there. Data works for demos but resets whenever Vercel starts a
 *   new server instance, and separate instances don't share it. A real
 *   database is the long-term fix.
 */
export const DATA_DIR = process.env.VERCEL
  ? path.join(os.tmpdir(), "all-in-one-data")
  : path.join(process.cwd(), ".data");

export function dataPath(...parts: string[]): string {
  return path.join(/*turbopackIgnore: true*/ DATA_DIR, ...parts);
}

/** Latest copy of each file written by this server process. */
const memory = new Map<string, string>();
let warned = false;

/** Read a JSON file from the data folder (this process's latest write wins). */
export function readJson<T>(name: string): T | undefined {
  const cached = memory.get(name);
  if (cached) return JSON.parse(cached) as T;
  try {
    const text = fs.readFileSync(dataPath(name), "utf8");
    memory.set(name, text);
    return JSON.parse(text) as T;
  } catch {
    return undefined;
  }
}

/**
 * Write a JSON file to the data folder. If the disk can't be written, keep the
 * data in memory so pages keep working instead of crashing.
 */
export function writeJson(name: string, value: unknown, pretty = false): void {
  const text = JSON.stringify(value, null, pretty ? 2 : undefined);
  memory.set(name, text);
  try {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    fs.writeFileSync(dataPath(name), text);
  } catch (err) {
    if (!warned) {
      warned = true;
      console.warn(`[data-store] Could not write to ${DATA_DIR}; keeping data in memory only.`, err);
    }
  }
}
