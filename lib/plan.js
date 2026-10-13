import { verificarLicencia } from "./license";
import { getPlanRaw, savePlanRaw } from "./db";

function mesActualISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
}

function resetearSiCorresponde(plan) {
  const mes = mesActualISO();
  if (plan.mesActual !== mes) {
    plan.mesActual = mes;
    plan.generadosEsteMes = 0;
    // la gracia se limpia al cambiar de mes
    if (plan.graciaHasta && plan.graciaHasta < new Date().toISOString()) {
      plan.graciaHasta = null;
    }
  }
  return plan;
}

export function getEstadoPlan() {
  let plan = resetearSiCorresponde(getPlanRaw());
  // persistimos el reset de mes si ocurrió
  if (plan.mesActual === mesActualISO() && getPlanRaw().mesActual !== plan.mesActual) {
    savePlanRaw(plan);
  }

  const esPago = plan.plan === "paid";
  const enGracia =
    !esPago &&
    plan.graciaHasta &&
    new Date(plan.graciaHasta) > new Date();

  const restantes = esPago || enGracia
    ? null
    : Math.max(0, plan.limiteMensual - plan.generadosEsteMes);

  const bloqueado = !esPago && !enGracia && restantes === 0;

  return {
    establecimientoId: plan.establecimientoId,
    plan: plan.plan,
    limiteMensual: plan.limiteMensual,
    generadosEsteMes: plan.generadosEsteMes,
    restantes,
    bloqueado,
    enGracia: !!enGracia,
    graciaHasta: plan.graciaHasta,
    fechaActivacion: plan.fechaActivacion,
    contacto: plan.contacto,
  };
}

export function registrarUso() {
  const plan = resetearSiCorresponde(getPlanRaw());
  if (plan.plan !== "paid") {
    plan.generadosEsteMes += 1;
    // Si se agota el cupo, damos 7 días de gracia automática (mejor UX de venta)
    if (plan.generadosEsteMes >= plan.limiteMensual && !plan.graciaHasta) {
      const gracia = new Date();
      gracia.setDate(gracia.getDate() + 7);
      plan.graciaHasta = gracia.toISOString();
    }
    savePlanRaw(plan);
  }
  return getEstadoPlan();
}

export function puedeGenerar() {
  return !getEstadoPlan().bloqueado;
}

export function activarLicencia(clave, activadoPor = "sistema") {
  const plan = getPlanRaw();
  const valida = verificarLicencia(plan.establecimientoId, clave);
  if (!valida) {
    return { ok: false, error: "Clave de licencia inválida para este establecimiento." };
  }

  plan.plan = "paid";
  plan.licenciaActivada = clave.trim();
  plan.fechaActivacion = new Date().toISOString();
  plan.graciaHasta = null;
  plan.logActivaciones = plan.logActivaciones || [];
  plan.logActivaciones.push({
    fecha: plan.fechaActivacion,
    clave: clave.trim().slice(0, 12) + "…",
    por: activadoPor,
  });

  savePlanRaw(plan);
  return { ok: true, estado: getEstadoPlan() };
}
