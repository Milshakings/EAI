import { AlertTriangle, AlertCircle, CheckCircle2 } from "lucide-react";

export function StatCard({ label, value, hint }) {
  return (
    <div className="card">
      <div style={{ fontSize: 12, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8, fontFamily: "var(--font-display)" }}>{value}</div>
      {hint && <div style={{ fontSize: 12, color: "var(--ink-400)", marginTop: 4 }}>{hint}</div>}
    </div>
  );
}

export function GaugeCard({ horas, rango }) {
  const [min, max] = rango;
  const pct = Math.max(0, Math.min(100, (horas / max) * 100));
  const dentroDeRango = horas >= min && horas <= max;

  return (
    <div className="card">
      <div style={{ fontSize: 12, color: "var(--ink-400)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        Termómetro de carga
      </div>
      <div style={{ fontSize: 30, fontWeight: 700, marginTop: 8, fontFamily: "var(--font-display)" }}>
        {horas} hrs
      </div>
      <div style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 10 }}>
        recuperadas este período (meta {min}–{max} hrs)
      </div>
      <div style={{ height: 8, background: "var(--navy-800)", borderRadius: 99, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: dentroDeRango ? "var(--green-500)" : "var(--teal-400)",
            transition: "width 0.4s ease",
          }}
        />
      </div>
    </div>
  );
}

const ICONO_NIVEL = {
  alerta: <AlertTriangle size={15} color="var(--red-500)" />,
  precaucion: <AlertCircle size={15} color="var(--amber-500)" />,
  ok: <CheckCircle2 size={15} color="var(--green-500)" />,
};

export function AlertList({ alertas }) {
  if (!alertas?.length) {
    return <p style={{ color: "var(--ink-400)", fontSize: 13 }}>Sin novedades por ahora.</p>;
  }
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {alertas.map((a, i) => (
        <div
          key={`${a.id}-${i}`}
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "9px 12px",
            background: "var(--navy-800)",
            borderRadius: 10,
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 9, fontSize: 13 }}>
            {ICONO_NIVEL[a.nivel]}
            <span>
              <strong>{a.alumno}</strong> — {a.mensaje}
            </span>
          </div>
          <span className={`badge ${a.nivel}`}>
            {a.nivel === "alerta" ? "Alerta" : a.nivel === "precaucion" ? "Precaución" : "OK"}
          </span>
        </div>
      ))}
    </div>
  );
}
