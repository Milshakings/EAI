/**
 * Seed / migración de usuarios a passwordHash (bcrypt).
 * Ejecutar una sola vez después de `npm install`:
 *   node scripts/seed-users.js
 */
const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");

const USERS_PATH = path.join(__dirname, "..", "data", "users.json");

const DEMO_USERS = [
  {
    id: "u-001",
    rut: "12.345.678-9",
    nombre: "Camila Rojas",
    password: "pie2026",
    rol: "docente_pie",
    cargo: "Educadora Diferencial PIE",
  },
  {
    id: "u-002",
    rut: "9.876.543-2",
    nombre: "Marcelo Soto",
    password: "utp2026",
    rol: "coordinador_utp",
    cargo: "Jefe UTP / Coordinación PIE",
  },
];

async function main() {
  const users = [];
  for (const u of DEMO_USERS) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    users.push({
      id: u.id,
      rut: u.rut,
      nombre: u.nombre,
      passwordHash,
      mustChangePassword: false,
      rol: u.rol,
      cargo: u.cargo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    console.log(`✓ ${u.rut} → hash generado`);
  }
  fs.writeFileSync(USERS_PATH, JSON.stringify(users, null, 2));
  console.log("\nusers.json actualizado. Contraseñas demo:");
  console.log("  PIE : pie2026");
  console.log("  UTP : utp2026");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
