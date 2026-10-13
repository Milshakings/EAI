import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getSessionFromReq, MENU_POR_ROL } from "../lib/auth";
import { Cable, CheckCircle2, Loader2 } from "lucide-react";

export default function Puente({ user, menu }) {
  const [informes, setInformes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [sincronizando, setSincronizando] = useState(null);
  const [campos, setCampos] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    cargarInformes();
  }, []);

  function cargarInformes() {
    setCargando(true);
    fetch("/api/informes")
      .then((res) => res.json())
      .then((data) => setInformes(data.filter((i) => i.estado === "aprobado")))
      .finally(() => setCargando(false));
  }

  async function sincronizar(id) {
    setError("");
    setSincronizando(id);
    setCampos(null);
    try {
      const res = await fetch("/api/fudei/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo sincronizar");
      setCampos({ id, ...data.camposFudei });
      cargarInformes();
    } catch (err) {
      setError(err.message);
    } finally {
      setSincronizando(null);
    }
  }

  return (
    <Layout user={user} menu={menu}>
      <div className="page-header">
        <div className="eyebrow">Módulo 2</div>
        <h1>Puente Copiloto</h1>
        <p>
          Mapea automáticamente los informes PIE aprobados al formato del Formulario Único de Ingreso FUDEI,
          eliminando la doble digitación y el riesgo de discrepancias entre plataformas.
        </p>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 14 }}>{error}</div>}

      {cargando && <p style={{ color: "var(--ink-400)" }}>Cargando informes aprobados…</p>}

      {!cargando && informes.length === 0 && (
        <p style={{ color: "var(--ink-400)" }}>
          Aún no hay informes firmados. Ve al Inyector Normativo para generar y firmar uno.
        </p>
      )}

      <div style={{ display: "flex", flexDirection: "column", gap: 12, maxWidth: 720 }}>
        {informes.map((inf) => (
          <div key={inf.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>{inf.alumno}</div>
              <div style={{ fontSize: 12, color: "var(--ink-400)" }}>
                {inf.curso || "Sin curso"} · {inf.diagnostico || "Sin diagnóstico"}
              </div>
            </div>

            {inf.sincronizadoFudei ? (
              <span className="badge ok">
                <CheckCircle2 size={13} /> Sincronizado
              </span>
            ) : (
              <button className="btn-primary" disabled={sincronizando === inf.id} onClick={() => sincronizar(inf.id)}>
                <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
                  {sincronizando === inf.id ? (
                    <Loader2 size={15} style={{ animation: "spin 1s linear infinite" }} />
                  ) : (
                    <Cable size={15} />
                  )}
                  {sincronizando === inf.id ? "Sincronizando…" : "Sincronizar a FUDEI"}
                </span>
              </button>
            )}
          </div>
        ))}
      </div>

      {campos && (
        <div className="card" style={{ marginTop: 20, maxWidth: 480 }}>
          <h3 style={{ fontSize: 15, marginBottom: 12 }}>Campos mapeados — listos para copiar al Formulario FUDEI</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            {Object.entries(campos)
              .filter(([k]) => k !== "id")
              .map(([label, value]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
                  <span style={{ color: "var(--ink-400)" }}>{label}</span>
                  <span style={{ fontWeight: 600 }}>{value}</span>
                </div>
              ))}
          </div>
          <p style={{ fontSize: 11, color: "var(--ink-400)", marginTop: 12 }}>
            FUDEI aún no ofrece una API pública de integración; estos campos se generan para copiarlos en el
            formulario ministerial en minutos, sin re-digitar desde cero.
          </p>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const menu = MENU_POR_ROL[session.rol] || [];
  if (!menu.includes("puente")) {
    return { redirect: { destination: `/${menu[0] || "login"}`, permanent: false } };
  }

  return { props: { user: session, menu } };
}
