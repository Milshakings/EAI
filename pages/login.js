import { useState } from "react";
import { useRouter } from "next/router";
import { getSessionFromReq, MENU_POR_ROL } from "../lib/auth";
import { Shield, Cpu, Lock } from "lucide-react";

export default function Login() {
  const [rut, setRut] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);
  const router = useRouter();

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setCargando(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rut: rut.trim(), password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "No se pudo iniciar sesión");

      const primeraRuta = MENU_POR_ROL[data.rol]?.[0] || "inyector";
      router.push(`/${primeraRuta}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        background:
          "radial-gradient(1200px circle at 15% 10%, rgba(53,214,207,0.12), transparent 45%), radial-gradient(900px circle at 85% 90%, rgba(53,214,207,0.06), transparent 40%), var(--navy-950)",
      }}
    >
      <div style={{ width: "100%", maxWidth: 420 }}>
        <div style={{ textAlign: "center", marginBottom: 28 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
            <span
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: "var(--teal-400)",
                boxShadow: "0 0 16px var(--teal-400)",
              }}
            />
            <h1 style={{ fontSize: 26, letterSpacing: "-0.02em" }}>EvalúaAI</h1>
          </div>
          <p style={{ fontSize: 14, color: "var(--ink-400)", margin: 0 }}>
            Asistente normativo offline para Programas de Integración Escolar
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="card"
          style={{ display: "flex", flexDirection: "column", gap: 18, padding: "28px 26px" }}
        >
          <div>
            <h2 style={{ fontSize: 17, marginBottom: 4 }}>Ingreso al sistema</h2>
            <p style={{ fontSize: 13, color: "var(--ink-400)", margin: 0 }}>
              Procesamiento 100 % local · Sin envío de datos a la nube
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "var(--ink-200)" }}>RUT</label>
            <input
              value={rut}
              onChange={(e) => setRut(e.target.value)}
              placeholder="12.345.678-9"
              autoComplete="username"
              required
              disabled={cargando}
            />
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            <label style={{ fontSize: 12, color: "var(--ink-200)" }}>Contraseña</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              autoComplete="current-password"
              required
              disabled={cargando}
            />
          </div>

          {error && <div className="error-box">{error}</div>}

          <button className="btn-primary" type="submit" disabled={cargando}>
            {cargando ? "Ingresando…" : "Ingresar"}
          </button>

          <div
            style={{
              marginTop: 4,
              padding: "12px 14px",
              borderRadius: 10,
              background: "rgba(53,214,207,0.06)",
              border: "1px solid rgba(53,214,207,0.15)",
              fontSize: 12,
              color: "var(--ink-400)",
              lineHeight: 1.55,
            }}
          >
            <strong style={{ color: "var(--ink-200)" }}>Credenciales de demostración</strong>
            <br />
            Profesional PIE → <code>12.345.678-9</code> / <code>pie2026</code>
            <br />
            Coordinación UTP → <code>9.876.543-2</code> / <code>utp2026</code>
          </div>
        </form>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, marginTop: 22 }}>
          {[
            { icon: Lock, label: "Offline" },
            { icon: Shield, label: "Privacidad" },
            { icon: Cpu, label: "IA local" },
          ].map(({ icon: Icon, label }) => (
            <div
              key={label}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 6,
                padding: "14px 8px",
                borderRadius: 12,
                background: "rgba(15,32,56,0.6)",
                border: "1px solid var(--navy-700)",
                fontSize: 12,
                color: "var(--ink-400)",
              }}
            >
              <Icon size={18} color="var(--teal-400)" />
              {label}
            </div>
          ))}
        </div>

        <p style={{ textAlign: "center", fontSize: 11, color: "var(--ink-400)", marginTop: 20, opacity: 0.7 }}>
          EvalúaAI v0.2 · Piloto GovTech · Decreto 170
        </p>
      </div>
    </div>
  );
}

export async function getServerSideProps({ req }) {
  const session = getSessionFromReq(req);
  if (session) {
    const primeraRuta = MENU_POR_ROL[session.rol]?.[0] || "inyector";
    return { redirect: { destination: `/${primeraRuta}`, permanent: false } };
  }
  return { props: {} };
}
