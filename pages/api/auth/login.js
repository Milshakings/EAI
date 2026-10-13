import { findUserByRut } from "../../../lib/db";
import {
  createSessionToken,
  setSessionCookie,
  verifyPassword,
} from "../../../lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  const { rut, password } = req.body || {};
  if (!rut || !password) {
    return res.status(400).json({ error: "Ingresa RUT y contraseña" });
  }

  const user = findUserByRut(rut.trim());
  if (!user) {
    return res.status(401).json({ error: "RUT o contraseña incorrectos" });
  }

  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) {
    return res.status(401).json({ error: "RUT o contraseña incorrectos" });
  }

  const token = createSessionToken(user);
  setSessionCookie(res, token);

  return res.status(200).json({
    id: user.id,
    nombre: user.nombre,
    rol: user.rol,
    cargo: user.cargo,
    mustChangePassword: !!user.mustChangePassword,
  });
}
