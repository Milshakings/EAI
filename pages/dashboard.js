import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { StatCard, GaugeCard, AlertList } from "../components/DashboardWidgets";
import { getSessionFromReq, MENU_POR_ROL } from "../lib/auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

export default function Dashboard({ user, menu }) {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/dashboard/stats")
      .then((res) => {
        if (!res.ok) throw new Error("No se pudieron cargar las métricas");
        return res.json();
      })
      .then(setStats)
      .catch((err) => setError(err.message));
  }, []);

  return (
    <Layout user={user} menu={menu}>
      <div className="page-header">
        <div className="eyebrow">Visibilidad en tiempo real</div>
        <h1>Dashboard de Trazabilidad UTP</h1>
        <p>
          Termómetro de carga, auditoría preventiva de plazos normativos y alerta temprana de inasistencia,
          para tomar decisiones pedagógicas antes de que un estudiante se desvincule.
        </p>
      </div>

      {error && <div className="error-box" style={{ marginBottom: 16 }}>{error}</div>}

      {!stats && !error && <p style={{ color: "var(--ink-400)" }}>Cargando métricas…</p>}

      {stats && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div className="grid-4">
            <GaugeCard horas={stats.horasRecuperadas} rango={stats.rangoObjetivoHoras} />
            <StatCard label="Informes totales" value={stats.totalInformes} hint="registrados en el piloto" />
            <StatCard label="Aprobados / firmados" value={stats.informesAprobados} />
            <StatCard label="Sincronizados a FUDEI" value={stats.sincronizadosFudei} />
          </div>

          <div className="grid-2">
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 12 }}>Auditoría preventiva</h3>
              <AlertList alertas={stats.alertas} />
            </div>

            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 4 }}>Alerta temprana de inasistencia</h3>
              <p style={{ fontSize: 12, color: "var(--ink-400)", marginBottom: 10 }}>
                Cruce de asistencia semanal de estudiantes NEE — permite intervenir antes de la deserción.
              </p>
              <ResponsiveContainer width="100%" height={190}>
                <LineChart data={stats.asistenciaSemanal}>
                  <CartesianGrid stroke="var(--navy-700)" strokeDasharray="3 3" />
                  <XAxis dataKey="semana" stroke="var(--ink-400)" fontSize={12} />
                  <YAxis stroke="var(--ink-400)" fontSize={12} domain={[50, 100]} />
                  <Tooltip
                    contentStyle={{ background: "var(--navy-800)", border: "1px solid var(--navy-700)", borderRadius: 8 }}
                  />
                  <Line type="monotone" dataKey="asistencia" stroke="var(--teal-400)" strokeWidth={2.5} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const menu = MENU_POR_ROL[session.rol] || [];
  if (!menu.includes("dashboard")) {
    return { redirect: { destination: `/${menu[0] || "login"}`, permanent: false } };
  }

  return { props: { user: session, menu } };
}
