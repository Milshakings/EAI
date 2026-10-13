import { requireRole, ROLES } from "../../../lib/auth";
import { getInformes } from "../../../lib/db";

export default function handler(req, res) {
  const session = requireRole(req, res, [ROLES.COORDINADOR_UTP, ROLES.DOCENTE_PIE]);
  if (!session) return;

  const informes = getInformes();

  const horasRecuperadas = informes.reduce((acc, i) => acc + (i.horasAhorradas || 0), 0);

  const alertas = informes
    .filter((i) => i.estado !== "aprobado")
    .map((i) => ({
      id: i.id,
      alumno: i.alumno,
      mensaje: "Documentación incompleta (PIE) - En revisión",
      nivel: "precaucion",
    }));

  const informesFaltaEspecialista = informes.filter(
    (i) => i.estado === "aprobado" && (i.apoyos || []).length === 0
  );
  informesFaltaEspecialista.forEach((i) =>
    alertas.push({
      id: i.id,
      alumno: i.alumno,
      mensaje: "Evaluación especialista faltante - Plazo normativo",
      nivel: "alerta",
    })
  );

  informes
    .filter((i) => i.estado === "aprobado" && (i.apoyos || []).length > 0)
    .forEach((i) =>
      alertas.push({
        id: i.id,
        alumno: i.alumno,
        mensaje: "Informe inicial aprobado - Conforme",
        nivel: "ok",
      })
    );

  // Serie simulada de asistencia crítica (semanas 1-6), como en el dashboard de la propuesta.
  const asistenciaSemanal = [
    { semana: "S1", asistencia: 96 },
    { semana: "S2", asistencia: 92 },
    { semana: "S3", asistencia: 87 },
    { semana: "S4", asistencia: 78 },
    { semana: "S5", asistencia: 68 },
    { semana: "S6", asistencia: 64 },
  ];

  return res.status(200).json({
    horasRecuperadas,
    rangoObjetivoHoras: [20, 35],
    totalInformes: informes.length,
    informesAprobados: informes.filter((i) => i.estado === "aprobado").length,
    informesEnRevision: informes.filter((i) => i.estado !== "aprobado").length,
    sincronizadosFudei: informes.filter((i) => i.sincronizadoFudei).length,
    alertas,
    asistenciaSemanal,
  });
}
