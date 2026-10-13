// Capa de datos local para el MVP avanzado (v0.2).
// JSON + validación Zod + bloqueo simple en memoria + backup atómico.
// Interfaz estable para migrar después a SQLite sin romper los callers.

import fs from "fs";
import path from "path";
import { z } from "zod";

const DATA_DIR = path.join(process.cwd(), "data");
const BACKUP_DIR = path.join(DATA_DIR, "backups");
const INFORMES_PATH = path.join(DATA_DIR, "informes.json");
const USERS_PATH = path.join(DATA_DIR, "users.json");
const PLAN_PATH = path.join(DATA_DIR, "plan.json");

// ---------- Schemas (contrato de datos) ----------

export const UserSchema = z.object({
  id: z.string(),
  rut: z.string(),
  nombre: z.string(),
  passwordHash: z.string(),
  mustChangePassword: z.boolean().default(false),
  rol: z.enum(["docente_pie", "coordinador_utp"]),
  cargo: z.string(),
  createdAt: z.string().optional(),
  updatedAt: z.string().optional(),
});

export const InformeSchema = z.object({
  id: z.string(),
  alumno: z.string(),
  rutAlumno: z.string().default(""),
  curso: z.string().default(""),
  diagnostico: z.string().default(""),
  necesidad: z.string().default("Por definir"),
  apoyos: z.array(z.string()).default([]),
  estado: z.enum(["en_revision", "aprobado"]).default("en_revision"),
  sincronizadoFudei: z.boolean().default(false),
  textoOriginal: z.string().default(""),
  ocrConfidence: z.number().min(0).max(1).nullable().default(null),
  borrador: z.string(),
  modeloUsado: z.string().optional(),
  creadoPor: z.string(),
  fechaCreacion: z.string(),
  fechaAprobacion: z.string().nullable().default(null),
  horasAhorradas: z.number().default(4),
});

export const PlanSchema = z.object({
  establecimientoId: z.string(),
  plan: z.enum(["free", "paid"]).default("free"),
  limiteMensual: z.number().default(5),
  mesActual: z.string(),
  generadosEsteMes: z.number().default(0),
  licenciaActivada: z.string().nullable().default(null),
  fechaActivacion: z.string().nullable().default(null),
  graciaHasta: z.string().nullable().default(null),
  contacto: z.object({
    email: z.string(),
    whatsapp: z.string(),
  }),
  logActivaciones: z
    .array(
      z.object({
        fecha: z.string(),
        clave: z.string(),
        por: z.string().optional(),
      })
    )
    .default([]),
});

// ---------- Mutex simple en memoria ----------
const locks = new Map();

async function withLock(filePath, fn) {
  while (locks.get(filePath)) {
    await new Promise((r) => setTimeout(r, 15));
  }
  locks.set(filePath, true);
  try {
    return await fn();
  } finally {
    locks.delete(filePath);
  }
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function readJson(filePath) {
  const raw = fs.readFileSync(filePath, "utf-8");
  return JSON.parse(raw);
}

function writeJson(filePath, data) {
  ensureDir(path.dirname(filePath));
  const tmp = `${filePath}.tmp`;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, filePath);
}

// ---------- Backup ----------
export function crearBackup(motivo = "manual") {
  ensureDir(BACKUP_DIR);
  const ts = new Date().toISOString().replace(/[:.]/g, "-");
  const dest = path.join(BACKUP_DIR, `backup-${ts}-${motivo}`);
  fs.mkdirSync(dest, { recursive: true });
  for (const file of ["users.json", "informes.json", "plan.json"]) {
    const src = path.join(DATA_DIR, file);
    if (fs.existsSync(src)) {
      fs.copyFileSync(src, path.join(dest, file));
    }
  }
  return dest;
}

// ---------- Users ----------
export function getUsers() {
  const data = readJson(USERS_PATH);
  return z.array(UserSchema).parse(data);
}

export function findUserByRut(rut) {
  return getUsers().find((u) => u.rut === rut) || null;
}

export function findUserById(id) {
  return getUsers().find((u) => u.id === id) || null;
}

export function updateUser(id, changes) {
  return withLock(USERS_PATH, async () => {
    const users = getUsers();
    const idx = users.findIndex((u) => u.id === id);
    if (idx === -1) return null;
    const updated = UserSchema.parse({
      ...users[idx],
      ...changes,
      updatedAt: new Date().toISOString(),
    });
    users[idx] = updated;
    writeJson(USERS_PATH, users);
    return updated;
  });
}

// ---------- Informes ----------
export function getInformes() {
  const data = readJson(INFORMES_PATH);
  return z.array(InformeSchema).parse(data);
}

export function getInformeById(id) {
  return getInformes().find((i) => i.id === id) || null;
}

export function addInforme(informe) {
  return withLock(INFORMES_PATH, async () => {
    const parsed = InformeSchema.parse(informe);
    const informes = getInformes();
    informes.unshift(parsed);
    writeJson(INFORMES_PATH, informes);
    return parsed;
  });
}

export function updateInforme(id, changes) {
  return withLock(INFORMES_PATH, async () => {
    const informes = getInformes();
    const idx = informes.findIndex((i) => i.id === id);
    if (idx === -1) return null;
    const updated = InformeSchema.parse({ ...informes[idx], ...changes });
    informes[idx] = updated;
    writeJson(INFORMES_PATH, informes);
    return updated;
  });
}

// ---------- Plan (usado por lib/plan.js) ----------
export function getPlanRaw() {
  return PlanSchema.parse(readJson(PLAN_PATH));
}

export function savePlanRaw(plan) {
  return withLock(PLAN_PATH, async () => {
    const parsed = PlanSchema.parse(plan);
    writeJson(PLAN_PATH, parsed);
    return parsed;
  });
}
