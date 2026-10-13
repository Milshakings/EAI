import { requireRole } from "../../../lib/auth";
import { getEstadoPlan } from "../../../lib/plan";

export default function handler(req, res) {
  const session = requireRole(req, res, null); // cualquier usuario autenticado
  if (!session) return;

  return res.status(200).json(getEstadoPlan());
}
