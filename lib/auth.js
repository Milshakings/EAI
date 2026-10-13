import jwt from "jsonwebtoken";
import * as cookie from "cookie";
import bcrypt from "bcryptjs";

// En producción SIEMPRE usar variable de entorno fuerte.
const JWT_SECRET = process.env.EVALUAAI_JWT_SECRET || "evaluaai-piloto-secreto-local-cambiar";
const COOKIE_NAME = "evaluaai_session";
const SESSION_HOURS = 10;

export const ROLES = {
  DOCENTE_PIE: "docente_pie",
  COORDINADOR_UTP: "coordinador_utp",
};

export const MENU_POR_ROL = {
  [ROLES.DOCENTE_PIE]: ["inyector", "puente"],
  [ROLES.COORDINADOR_UTP]: ["dashboard", "puente", "inyector"],
};

export function createSessionToken(user) {
  return jwt.sign(
    {
      id: user.id,
      nombre: user.nombre,
      rol: user.rol,
      cargo: user.cargo,
      mustChangePassword: !!user.mustChangePassword,
    },
    JWT_SECRET,
    { expiresIn: `${SESSION_HOURS}h` }
  );
}

export function setSessionCookie(res, token) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: SESSION_HOURS * 60 * 60,
    })
  );
}

export function clearSessionCookie(res) {
  res.setHeader(
    "Set-Cookie",
    cookie.serialize(COOKIE_NAME, "", { path: "/", maxAge: -1 })
  );
}

export function getSessionFromReq(req) {
  const cookies = cookie.parse(req.headers.cookie || "");
  const token = cookies[COOKIE_NAME];
  if (!token) return null;
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch {
    return null;
  }
}

export function requireRole(req, res, rolesPermitidos) {
  const session = getSessionFromReq(req);
  if (!session) {
    res.status(401).json({ error: "No autenticado" });
    return null;
  }
  if (rolesPermitidos && !rolesPermitidos.includes(session.rol)) {
    res.status(403).json({ error: "No autorizado para este módulo" });
    return null;
  }
  return session;
}

// ---------- Password helpers ----------
export async function hashPassword(plain) {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain, hash) {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export { COOKIE_NAME };
