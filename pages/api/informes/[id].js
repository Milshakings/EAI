import { requireRole, ROLES } from "../../../lib/auth";
import { getInformeById, updateInforme } from "../../../lib/db";

export default function handler(req, res) {
  const session = requireRole(req, res, [ROLES.DOCENTE_PIE, ROLES.COORDINADOR_UTP]);
  if (!session) return;

  const { id } = req.query;

  if (req.method === "GET") {
    const informe = getInformeById(id);
    if (!informe) return res.status(404).json({ error: "Informe no encontrado" });
    return res.status(200).json(informe);
  }

  if (req.method === "PUT") {
    const informe = getInformeById(id);
    if (!informe) return res.status(404).json({ error: "Informe no encontrado" });

    const { borrador, estado } = req.body || {};
    const changes = {};
    if (typeof borrador === "string") changes.borrador = borrador;

    // "Control humano": solo aquí se marca como aprobado/firmado, nunca automáticamente.
    if (estado === "aprobado" && informe.estado !== "aprobado") {
      changes.estado = "aprobado";
      changes.fechaAprobacion = new Date().toISOString().slice(0, 10);
    }

    const actualizado = updateInforme(id, changes);
    return res.status(200).json(actualizado);
  }

  return res.status(405).json({ error: "Método no permitido" });
}
