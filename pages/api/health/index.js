import fs from "fs";
import path from "path";
import { getEstadoPlan } from "../../../lib/plan";
import { OLLAMA_HOST, OLLAMA_MODEL } from "../../../lib/ollama";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const dataDir = path.join(process.cwd(), "data");
  let diskOk = true;
  let freeHint = null;
  try {
    fs.accessSync(dataDir, fs.constants.W_OK);
  } catch {
    diskOk = false;
  }

  // Chequeo rápido de Ollama (timeout corto)
  let ollamaOk = false;
  let ollamaError = null;
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), 2500);
    const r = await fetch(`${OLLAMA_HOST}/api/tags`, { signal: controller.signal });
    clearTimeout(t);
    ollamaOk = r.ok;
    if (!r.ok) ollamaError = `HTTP ${r.status}`;
  } catch (e) {
    ollamaError = e.name === "AbortError" ? "timeout" : e.message;
  }

  const plan = getEstadoPlan();

  const status = diskOk && ollamaOk ? "ok" : "degraded";

  return res.status(status === "ok" ? 200 : 503).json({
    status,
    version: "0.2.0",
    timestamp: new Date().toISOString(),
    checks: {
      diskWritable: diskOk,
      ollama: { ok: ollamaOk, host: OLLAMA_HOST, model: OLLAMA_MODEL, error: ollamaError },
      plan: {
        establecimientoId: plan.establecimientoId,
        plan: plan.plan,
        generadosEsteMes: plan.generadosEsteMes,
        restantes: plan.restantes,
        enGracia: plan.enGracia,
      },
    },
  });
}
