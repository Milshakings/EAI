import crypto from "crypto";

// Licencia 100% offline: el establecimiento nunca necesita internet para
// validarla (coherente con el pitch de privacidad y "cero riesgo" de la
// propuesta). Tú (EvalúaAI) generas la clave localmente con el mismo
// secreto cuando el colegio paga (venta manual / orden de compra SLEP), y
// se la entregas por correo para que la ingresen una sola vez en /plan.
//
// IMPORTANTE: EVALUAAI_LICENSE_SECRET debe existir SOLO en el servidor
// (nunca en variables NEXT_PUBLIC_*), para que nadie pueda generar claves
// válidas leyendo el código del cliente.

const SECRET = process.env.EVALUAAI_LICENSE_SECRET || "cambia-este-secreto-de-licencias";

function firmar(establecimientoId) {
  return crypto
    .createHmac("sha256", SECRET)
    .update(`${establecimientoId}:paid`)
    .digest("hex")
    .slice(0, 24); // clave corta y fácil de transcribir/escribir
}

// Formato de la clave que le entregas al colegio: EVALUA-<firma>
export function generarLicencia(establecimientoId) {
  return `EVALUA-${firmar(establecimientoId)}`;
}

export function verificarLicencia(establecimientoId, claveIngresada) {
  if (!claveIngresada) return false;
  const esperada = generarLicencia(establecimientoId);
  // comparación en tiempo constante para evitar timing attacks
  const a = Buffer.from(claveIngresada.trim());
  const b = Buffer.from(esperada);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
