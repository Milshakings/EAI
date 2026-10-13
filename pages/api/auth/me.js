import { getSessionFromReq } from "../../../lib/auth";

export default function handler(req, res) {
  const session = getSessionFromReq(req);
  if (!session) {
    return res.status(401).json({ error: "No autenticado" });
  }
  return res.status(200).json(session);
}
