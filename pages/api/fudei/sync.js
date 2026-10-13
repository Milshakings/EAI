import { requireRole, ROLES } from "../../../lib/auth";
import { getInformeById, updateInforme } from "../../../lib/db";

// NOTA: la plataforma FUDEI del Mineduc no expone una API pública para
// integrarse desde software de terceros. Este endpoint simula el mapeo de
// campos que el "Puente Copiloto" haría, y deja los datos listos para que el
// coordinador PIE los copie/valide en el sitio ministerial en minutos en vez
// de re-digitarlos a mano. Si en el futuro el Mineduc habilita una API o
// convenio de interoperabilidad, este es el único archivo que debiera cambiar.

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const session = requireRole(req, res, [ROLES.COORDINADOR_UTP, ROLES.DOCENTE_PIE]);
  if (!session) return;

  const { id } = req.body || {};
  const informe = getInformeById(id);
  if (!informe) return res.status(404).json({ error: "Informe no encontrado" });
  if (informe.estado !== "aprobado") {
    return res.status(400).json({ error: "El informe debe estar aprobado/firmado antes de sincronizar a FUDEI" });
  }

  const camposFudei = {
    "RUT Alumno": informe.rutAlumno || "[Falta información: especificar]",
    Nombres: informe.alumno,
    "Diagnóstico Principal": informe.diagnostico || "[Falta información: especificar]",
    "Necesidades de Apoyo": (informe.apoyos || []).join(", ") || "[Falta información: especificar]",
    "Tipo de NEE": informe.necesidad || "[Falta información: especificar]",
    "Fecha de Aprobación": informe.fechaAprobacion,
  };

  updateInforme(id, { sincronizadoFudei: true });

  return res.status(200).json({ ok: true, camposFudei });
}
