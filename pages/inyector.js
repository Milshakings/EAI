import { useState } from "react";
import Layout from "../components/Layout";
import UploadOCR from "../components/UploadOCR";
import InformeEditor from "../components/InformeEditor";
import { getSessionFromReq, MENU_POR_ROL } from "../lib/auth";
import { Sparkles, Loader2, RefreshCw, AlertTriangle, CheckCircle2 } from "lucide-react";

const PASOS = { DATOS: 1, TEXTO: 2, BORRADOR: 3 };

export default function Inyector({ user, menu }) {
  const [paso, setPaso] = useState(PASOS.DATOS);
  const [form, setForm] = useState({
    alumno: "",
    rutAlumno: "",
    curso: "",
    diagnostico: "",
    necesidad: "Transitoria",
    apoyosTexto: "",
  });
  const [texto, setTexto] = useState("");
  const [ocrConfidence, setOcrConfidence] = useState(null);
  const [generando, setGenerando] = useState(false);
  const [error, setError] = useState("");
  const [advertencias, setAdvertencias] = useState([]);
  const [informe, setInforme] = useState(null);
  const [cuotaAgotada, setCuotaAgotada] = useState(null);
  const [modeloUsado, setModeloUsado] = useState(null);

  function update(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  function handleTextExtracted({ text, confidence }) {
    setTexto(text || "");
    setOcrConfidence(typeof confidence === "number" ? confidence : null);
  }

  async function generarBorrador() {
    setError("");
    setAdvertencias([]);
    setGenerando(true);
    setCuotaAgotada(null);

    try {
      const res = await fetch("/api/ollama/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumno: form.alumno,
          curso: form.curso,
          observaciones: texto,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data.cuotaAgotada) {
          setCuotaAgotada(data);
          return;
        }
        throw new Error(data.error || "No se pudo generar el borrador");
      }

      const apoyos = form.apoyosTexto
        .split(",")
        .map((a) => a.trim())
        .filter(Boolean);

      const resInforme = await fetch("/api/informes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          alumno: form.alumno,
          rutAlumno: form.rutAlumno,
          curso: form.curso,
          diagnostico: form.diagnostico,
          necesidad: form.necesidad,
          apoyos,
          borrador: data.borrador,
          textoOriginal: texto,
          ocrConfidence: ocrConfidence,
          modeloUsado: data.modeloUsado,
        }),
      });

      const nuevoInforme = await resInforme.json();
      if (!resInforme.ok) {
        throw new Error(nuevoInforme.error || "No se pudo guardar el informe");
      }

      setInforme(nuevoInforme);
      setModeloUsado(data.modeloUsado || null);
      setAdvertencias(data.advertencias || []);
      setPaso(PASOS.BORRADOR);
      window.dispatchEvent(new Event("evaluaai:plan-actualizado"));
    } catch (err) {
      setError(err.message);
    } finally {
      setGenerando(false);
    }
  }

  function reiniciar() {
    setForm({
      alumno: "",
      rutAlumno: "",
      curso: "",
      diagnostico: "",
      necesidad: "Transitoria",
      apoyosTexto: "",
    });
    setTexto("");
    setOcrConfidence(null);
    setInforme(null);
    setError("");
    setAdvertencias([]);
    setCuotaAgotada(null);
    setModeloUsado(null);
    setPaso(PASOS.DATOS);
  }

  return (
    <Layout user={user} menu={menu}>
      <div className="page-header">
        <div className="eyebrow">Módulo 1</div>
        <h1>Inyector Normativo</h1>
        <p>
          De apuntes dispersos a un borrador de Perfil Neuro-Psico-Educativo
          (Decreto 170) listo para revisión, en segundos y sin salir de la red
          del establecimiento.
        </p>
      </div>

      {paso === PASOS.DATOS && (
        <div className="card" style={{ maxWidth: 560, display: "flex", flexDirection: "column", gap: 12 }}>
          <h3 style={{ fontSize: 15 }}>1. Datos del estudiante</h3>
          <Campo label="Nombre completo" value={form.alumno} onChange={(v) => update("alumno", v)} required />
          <div style={{ display: "flex", gap: 10 }}>
            <Campo label="RUT" value={form.rutAlumno} onChange={(v) => update("rutAlumno", v)} placeholder="23.456.789-0" />
            <Campo label="Curso" value={form.curso} onChange={(v) => update("curso", v)} placeholder="4° Básico A" />
          </div>
          <Campo label="Diagnóstico (si ya se conoce)" value={form.diagnostico} onChange={(v) => update("diagnostico", v)} />
          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "var(--ink-200)" }}>Tipo de NEE</label>
            <select value={form.necesidad} onChange={(e) => update("necesidad", e.target.value)}>
              <option>Transitoria</option>
              <option>Permanente</option>
            </select>
          </div>
          <Campo
            label="Apoyos requeridos (separados por coma)"
            value={form.apoyosTexto}
            onChange={(v) => update("apoyosTexto", v)}
            placeholder="Fonoaudiología, Psicopedagogía"
          />
          <button
            className="btn-primary"
            disabled={!form.alumno.trim()}
            onClick={() => setPaso(PASOS.TEXTO)}
            style={{ alignSelf: "flex-start" }}
          >
            Continuar
          </button>
        </div>
      )}

      {paso === PASOS.TEXTO && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 640 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: 15 }}>2. Observaciones del profesional</h3>
            <button className="btn-secondary" onClick={() => setPaso(PASOS.DATOS)} style={{ fontSize: 13 }}>
              ← Volver
            </button>
          </div>

          <UploadOCR onTextExtracted={handleTextExtracted} />

          {texto && (
            <div className="card" style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <label style={{ fontSize: 13, color: "var(--ink-200)" }}>
                  Texto extraído / pegado (puedes editarlo)
                </label>
                {ocrConfidence !== null && (
                  <span
                    className={`badge ${ocrConfidence >= 0.8 ? "ok" : ocrConfidence >= 0.6 ? "precaucion" : "alerta"}`}
                    style={{ fontSize: 11 }}
                  >
                    Confianza OCR: {Math.round(ocrConfidence * 100)}%
                  </span>
                )}
              </div>
              <textarea
                rows={9}
                value={texto}
                onChange={(e) => setTexto(e.target.value)}
                style={{ lineHeight: 1.5, fontSize: 13.5 }}
                placeholder="El texto de las observaciones aparecerá aquí..."
              />
              {error && <div className="error-box">{error}</div>}
              {cuotaAgotada && (
                <div className="error-box" style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                    <AlertTriangle size={16} />
                    {cuotaAgotada.error}
                  </div>
                  {cuotaAgotada.contacto && (
                    <p style={{ fontSize: 13, margin: 0 }}>
                      Contacto ventas: {cuotaAgotada.contacto.email} · {cuotaAgotada.contacto.whatsapp}
                    </p>
                  )}
                </div>
              )}
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                <button
                  className="btn-primary"
                  disabled={generando || texto.trim().length < 10}
                  onClick={generarBorrador}
                  style={{ display: "inline-flex", alignItems: "center", gap: 8 }}
                >
                  {generando ? (
                    <>
                      <Loader2 size={16} className="spin" />
                      Generando borrador…
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      Generar borrador Decreto 170
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {paso === PASOS.BORRADOR && informe && (
        <div style={{ display: "flex", flexDirection: "column", gap: 14, maxWidth: 720 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: 10 }}>
            <div>
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>3. Revisión y firma del borrador</h3>
              {modeloUsado && (
                <p style={{ fontSize: 12, color: "var(--ink-400)", margin: 0 }}>
                  Generado con modelo local: <strong>{modeloUsado}</strong>
                </p>
              )}
            </div>
            <div style={{ display: "flex", gap: 8 }}>
              <button
                className="btn-secondary"
                onClick={() => {
                  setPaso(PASOS.TEXTO);
                  setInforme(null);
                }}
                style={{ display: "inline-flex", alignItems: "center", gap: 6, fontSize: 13 }}
              >
                <RefreshCw size={14} />
                Regenerar
              </button>
              <button className="btn-secondary" onClick={reiniciar} style={{ fontSize: 13 }}>
                Nuevo informe
              </button>
            </div>
          </div>

          {advertencias.length > 0 && (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(245,165,36,0.08)",
                border: "1px solid rgba(245,165,36,0.25)",
                fontSize: 13,
                color: "var(--ink-200)",
              }}
            >
              <strong>Advertencias del generador:</strong>
              <ul style={{ margin: "6px 0 0 18px", padding: 0 }}>
                {advertencias.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            </div>
          )}

          <InformeEditor informe={informe} onFirmar={(actualizado) => setInforme(actualizado)} />

          {informe.estado === "aprobado" && (
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "12px 14px",
                borderRadius: 10,
                background: "rgba(34,197,94,0.08)",
                border: "1px solid rgba(34,197,94,0.25)",
                fontSize: 13,
                color: "var(--green-500)",
              }}
            >
              <CheckCircle2 size={16} />
              Informe firmado. Ya puedes sincronizarlo desde el módulo <strong>Puente Copiloto</strong>.
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

function Campo({ label, value, onChange, placeholder, required }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 6, flex: 1 }}>
      <label style={{ fontSize: 12, color: "var(--ink-200)" }}>
        {label}
        {required && " *"}
      </label>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
      />
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (!session) {
    return { redirect: { destination: "/login", permanent: false } };
  }
  const menu = MENU_POR_ROL[session.rol] || [];
  if (!menu.includes("inyector")) {
    return { redirect: { destination: `/${menu[0] || "login"}`, permanent: false } };
  }
  return { props: { user: session, menu } };
}
