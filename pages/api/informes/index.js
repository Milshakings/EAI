import { v4 as uuidv4 } from "uuid";
import { requireRole, ROLES } from "../../../lib/auth";
import { getInformes, addInforme } from "../../../lib/db";

export default async function handler(req, res) {
  const session = requireRole(req, res, [ROLES.DOCENTE_PIE, ROLES.COORDINADOR_UTP]);
  if (!session) return;

  if (req.method === "GET") {
    return res.status(200).json(getInformes());
  }

  if (req.method === "POST") {
    const {
      alumno,
      rutAlumno,
      curso,
      diagnostico,
      necesidad,
      apoyos,
      borrador,
      textoOriginal,
      ocrConfidence,
      modeloUsado,
    } = req.body || {};

    if (!alumno || !borrador) {
      return res.status(400).json({ error: "Faltan datos del alumno o el borrador generado" });
    }

    const nuevo = {
      id: `inf-${uuidv4().slice(0, 8)}`,
      alumno,
      rutAlumno: rutAlumno || "",
      curso: curso || "",
      diagnostico: diagnostico || "",
      necesidad: necesidad || "Por definir",
      apoyos: Array.isArray(apoyos) ? apoyos : [],
      estado: "en_revision",
      sincronizadoFudei: false,
      textoOriginal: textoOriginal || "",
      ocrConfidence: typeof ocrConfidence === "number" ? ocrConfidence : null,
      borrador,
      modeloUsado: modeloUsado || null,
      creadoPor: session.id,
      fechaCreacion: new Date().toISOString().slice(0, 10),
      fechaAprobacion: null,
      horasAhorradas: 4,
    };

    const creado = await addInforme(nuevo);
    return res.status(201).json(creado);
  }

  return res.status(405).json({ error: "Método no permitido" });
}
