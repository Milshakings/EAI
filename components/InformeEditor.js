import { useState } from "react";
import { PenLine, ShieldCheck, Loader2 } from "lucide-react";

// "Control Humano": el sistema nunca reemplaza la firma. El profesional
// siempre revisa y edita el 80% técnico generado antes de aprobar.
export default function InformeEditor({ informe, onFirmar }) {
  const [texto, setTexto] = useState(informe.borrador);
  const [guardando, setGuardando] = useState(false);
  const [firmando, setFirmando] = useState(false);
  const [error, setError] = useState("");
  const firmado = informe.estado === "aprobado";

  async function guardarCambios(nuevoEstado) {
    setError("");
    if (nuevoEstado === "aprobado") setFirmando(true);
    else setGuardando(true);

    try {
      const res = await fetch(`/api/informes/${informe.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ borrador: texto, estado: nuevoEstado }),
      });
      if (!res.ok) throw new Error((await res.json()).error || "No se pudo guardar");
      const actualizado = await res.json();
      onFirmar?.(actualizado);
    } catch (err) {
      setError(err.message);
    } finally {
      setGuardando(false);
      setFirmando(false);
    }
  }

  return (
    <div className="card" style={{ display: "flex", flexDirection: "column", gap: 12 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <h3 style={{ fontSize: 15 }}>Borrador — {informe.alumno}</h3>
        <span className={`badge ${firmado ? "ok" : "precaucion"}`}>
          {firmado ? "Firmado" : "Pendiente de revisión"}
        </span>
      </div>

      <textarea
        rows={14}
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        disabled={firmado}
        style={{ lineHeight: 1.55, fontSize: 13.5 }}
      />

      <p style={{ fontSize: 12, color: "var(--ink-400)" }}>
        Este texto es una base técnica generada por IA local (Ollama). Revísalo, corrígelo y personalízalo
        antes de firmar: la firma es siempre tuya, no del sistema.
      </p>

      {error && <div className="error-box">{error}</div>}

      {!firmado && (
        <div style={{ display: "flex", gap: 10 }}>
          <button className="btn-secondary" disabled={guardando} onClick={() => guardarCambios(informe.estado)}>
            {guardando ? "Guardando…" : "Guardar cambios"}
          </button>
          <button className="btn-primary" disabled={firmando} onClick={() => guardarCambios("aprobado")}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              {firmando ? <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} /> : <PenLine size={15} />}
              {firmando ? "Firmando…" : "Aprobar y firmar"}
            </span>
          </button>
        </div>
      )}

      {firmado && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green-500)", fontSize: 13 }}>
          <ShieldCheck size={16} /> Aprobado el {informe.fechaAprobacion}
        </div>
      )}
    </div>
  );
}
