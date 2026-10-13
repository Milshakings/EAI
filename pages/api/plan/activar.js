import { requireRole, ROLES } from "../../../lib/auth";
import { activarLicencia } from "../../../lib/plan";

export default function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  // Solo Coordinación UTP puede activar el plan pagado del establecimiento.
  const session = requireRole(req, res, [ROLES.COORDINADOR_UTP]);
  if (!session) return;

  const { clave } = req.body || {};
  if (!clave) return res.status(400).json({ error: "Ingresa la clave de licencia" });

  const resultado = activarLicencia(clave);
  if (!resultado.ok) return res.status(400).json({ error: resultado.error });

  return res.status(200).json(resultado.estado);
}
