import { useEffect, useState } from "react";
import Layout from "../components/Layout";
import { getSessionFromReq, MENU_POR_ROL, ROLES } from "../lib/auth";
import { Mail, MessageCircle, KeyRound, CheckCircle2 } from "lucide-react";

export default function Plan({ user, menu }) {
  const [plan, setPlan] = useState(null);
  const [clave, setClave] = useState("");
  const [activando, setActivando] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState(false);

  useEffect(() => {
    cargar();
  }, []);

  function cargar() {
    fetch("/api/plan/status")
      .then((res) => res.json())
      .then(setPlan);
  }

  async function activar(e) {
    e.preventDefault();
    setError("");
    setActivando(true);
    try {
      const res = await fetch("/api/plan/activar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clave }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo activar la licencia");
      setPlan(data);
      setOk(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setActivando(false);
    }
  }

  const esCoordinador = user.rol === ROLES.COORDINADOR_UTP;

  return (
    <Layout user={user} menu={menu}>
      <div className="page-header">
        <div className="eyebrow">Plan y facturación</div>
        <h1>Plan del establecimiento</h1>
        <p>El plan gratuito incluye 5 informes generados con IA por mes. Sin tarjetas ni suscripción automática.</p>
      </div>

      {!plan && <p style={{ color: "var(--ink-400)" }}>Cargando…</p>}

      {plan && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, maxWidth: 520 }}>
          <div className="card">
            {plan.plan === "paid" ? (
              <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--green-500)" }}>
                <CheckCircle2 size={18} />
                <strong>Plan pagado activo — informes ilimitados</strong>
              </div>
            ) : (
              <>
                <h3 style={{ fontSize: 15, marginBottom: 10 }}>Uso este mes</h3>
                <div style={{ fontSize: 28, fontWeight: 700, fontFamily: "var(--font-display)" }}>
                  {plan.generadosEsteMes} / {plan.limiteMensual}
                </div>
                <div style={{ height: 8, background: "var(--navy-800)", borderRadius: 99, marginTop: 10, overflow: "hidden" }}>
                  <div
                    style={{
                      height: "100%",
                      width: `${Math.min(100, (plan.generadosEsteMes / plan.limiteMensual) * 100)}%`,
                      background: plan.bloqueado ? "var(--red-500)" : "var(--teal-400)",
                    }}
                  />
                </div>
                {plan.bloqueado && (
                  <p style={{ fontSize: 13, color: "#fca5a5", marginTop: 10 }}>
                    Alcanzaste el cupo gratuito de este mes. El cupo se renueva automáticamente el próximo mes, o
                    puedes activar el plan pagado ahora para seguir generando informes sin límite.
                  </p>
                )}
              </>
            )}
          </div>

          {plan.plan !== "paid" && (
            <div className="card">
              <h3 style={{ fontSize: 15, marginBottom: 10 }}>Solicitar plan pagado</h3>
              <p style={{ fontSize: 13, color: "var(--ink-400)", marginBottom: 14 }}>
                La venta es directa con nuestro equipo (orden de compra, transferencia o convenio con el SLEP).
                Escríbenos y te enviamos la cotización y, al confirmar el pago, la clave de licencia de tu
                establecimiento.
              </p>
              <div style={{ display: "flex", gap: 10, marginBottom: 18, flexWrap: "wrap" }}>
                <a className="btn-primary" href={`mailto:${plan.contacto?.email}`} style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}>
                  <Mail size={15} /> {plan.contacto?.email}
                </a>
                <a
                  className="btn-secondary"
                  href={`https://wa.me/${plan.contacto?.whatsapp?.replace(/\D/g, "")}`}
                  target="_blank"
                  rel="noreferrer"
                  style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 6 }}
                >
                  <MessageCircle size={15} /> WhatsApp
                </a>
              </div>

              {esCoordinador ? (
                <form onSubmit={activar} style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                  <label style={{ fontSize: 12, color: "var(--ink-200)", display: "flex", alignItems: "center", gap: 6 }}>
                    <KeyRound size={14} /> Ya tengo una clave de licencia
                  </label>
                  <div style={{ display: "flex", gap: 8 }}>
                    <input
                      value={clave}
                      onChange={(e) => setClave(e.target.value)}
                      placeholder="EVALUA-xxxxxxxxxxxxxxxxxxxxxxxx"
                      style={{ flex: 1 }}
                    />
                    <button className="btn-primary" disabled={activando || !clave.trim()}>
                      {activando ? "Activando…" : "Activar"}
                    </button>
                  </div>
                  {error && <div className="error-box">{error}</div>}
                  {ok && <div style={{ color: "var(--green-500)", fontSize: 13 }}>¡Licencia activada!</div>}
                </form>
              ) : (
                <p style={{ fontSize: 12, color: "var(--ink-400)" }}>
                  Solo Coordinación UTP puede activar la licencia del establecimiento.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (!session) return { redirect: { destination: "/login", permanent: false } };

  const menu = MENU_POR_ROL[session.rol] || [];
  return { props: { user: session, menu } };
}
