import { neon } from "@neondatabase/serverless";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { defaultState, normalizeState } from "./defaults";

const localPath = process.env.VERCEL
  ? path.join("/tmp", "sopung-instrument-survey-db.json")
  : path.join(process.cwd(), ".data", "db.json");

globalThis.__sopungState ||= clone(defaultState);

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function hasDatabase() {
  return Boolean(process.env.DATABASE_URL);
}

async function readLocalState() {
  try {
    const raw = await readFile(localPath, "utf8");
    return normalizeState(JSON.parse(raw));
  } catch {
    const seeded = clone(defaultState);
    try {
      await writeLocalState(seeded);
    } catch {
      globalThis.__sopungState = seeded;
    }
    return seeded;
  }
}

async function writeLocalState(state) {
  await mkdir(path.dirname(localPath), { recursive: true });
  await writeFile(localPath, JSON.stringify(normalizeState(state), null, 2) + "\n");
}

async function ensureRemoteState(sql) {
  await sql`
    create table if not exists app_state (
      id text primary key,
      data jsonb not null,
      updated_at timestamptz not null default now()
    )
  `;
  const rows = await sql`select id from app_state where id = 'main'`;
  if (!rows.length) {
    await sql`
      insert into app_state (id, data)
      values ('main', ${JSON.stringify(defaultState)}::jsonb)
    `;
  }
}

export async function readState() {
  if (!hasDatabase()) return readLocalState();

  try {
    const sql = neon(process.env.DATABASE_URL);
    await ensureRemoteState(sql);
    const rows = await sql`select data from app_state where id = 'main'`;
    return normalizeState(rows[0]?.data);
  } catch {
    return normalizeState(globalThis.__sopungState);
  }
}

export async function writeState(nextState) {
  const state = normalizeState(nextState);
  if (!hasDatabase()) {
    try {
      await writeLocalState(state);
    } catch {
      globalThis.__sopungState = state;
    }
    return state;
  }

  try {
    const sql = neon(process.env.DATABASE_URL);
    await ensureRemoteState(sql);
    await sql`
      update app_state
      set data = ${JSON.stringify(state)}::jsonb, updated_at = now()
      where id = 'main'
    `;
  } catch {
    globalThis.__sopungState = state;
  }
  return state;
}

export async function updateState(mutator) {
  const state = await readState();
  const nextState = await mutator(clone(state));
  return writeState(nextState || state);
}
