// Uso (lo corres TÚ, no el colegio):
//   EVALUAAI_LICENSE_SECRET=tu-secreto node scripts/generar-licencia.js colegio-san-andres
//
// Debe usarse el MISMO valor de EVALUAAI_LICENSE_SECRET que está configurado
// en el servidor del colegio (su .env.local), o la licencia no calzará.
// Este script es standalone (no importa lib/license.js) para poder
// ejecutarse con `node` sin pasar por el compilador de Next.js.

const crypto = require("crypto");

const SECRET = process.env.EVALUAAI_LICENSE_SECRET || "cambia-este-secreto-de-licencias";
const establecimientoId = process.argv[2];

if (!establecimientoId) {
  console.error("Uso: node scripts/generar-licencia.js <establecimientoId>");
  process.exit(1);
}

function generarLicencia(id) {
  const firma = crypto.createHmac("sha256", SECRET).update(`${id}:paid`).digest("hex").slice(0, 24);
  return `EVALUA-${firma}`;
}

const clave = generarLicencia(establecimientoId);
console.log(`\nEstablecimiento: ${establecimientoId}`);
console.log(`Clave de licencia (plan pagado, informes ilimitados): ${clave}\n`);
