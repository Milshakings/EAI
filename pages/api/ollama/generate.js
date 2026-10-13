import { requireRole, ROLES } from "../../../lib/auth";
import { generarConOllama, OLLAMA_MODEL } from "../../../lib/ollama";
import { D170_SYSTEM_PROMPT, buildUserPrompt } from "../../../lib/d170Prompt";
import { getEstadoPlan, registrarUso } from "../../../lib/plan";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const session = requireRole(req, res, [ROLES.DOCENTE_PIE, ROLES.COORDINADOR_UTP]);
  if (!session) return;

  const estadoPlan = getEstadoPlan();
  if (estadoPlan.bloqueado) {
    return res.status(402).json({
      error: `Alcanzaste el cupo gratuito de ${estadoPlan.limiteMensual} informes este mes.`,
      cuotaAgotada: true,
      enGracia: estadoPlan.enGracia,
      contacto: estadoPlan.contacto,
    });
  }

  const { alumno, curso, observaciones } = req.body || {};
  if (!observaciones || observaciones.trim().length < 10) {
    return res.status(400).json({
      error:
        "El texto extraído del documento/foto es muy corto o está vacío. Revisa el OCR e inténtalo de nuevo.",
    });
  }

  try {
    const borrador = await generarConOllama({
      system: D170_SYSTEM_PROMPT,
      prompt: buildUserPrompt({ alumno, curso, observaciones }),
    });

    // Validación mínima de estructura del borrador
    const seccionesEsperadas = [
      "Antecedentes generales",
      "Motivo de evaluación",
      "Síntesis diagnóstica",
      "Necesidad Educativa Especial",
    ];
    const faltantes = seccionesEsperadas.filter(
      (s) => !borrador.toLowerCase().includes(s.toLowerCase().slice(0, 12))
    );

    const estadoActualizado = registrarUso();

    return res.status(200).json({
      borrador,
      modeloUsado: OLLAMA_MODEL,
      advertencias:
        faltantes.length > 0
          ? [`El borrador podría estar incompleto. Revisa: ${faltantes.join(", ")}`]
          : [],
      plan: estadoActualizado,
    });
  } catch (err) {
    return res.status(502).json({ error: err.message });
  }
}
