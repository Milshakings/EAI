import { useEffect, useState } from "react";
import Link from "next/link";
import { Zap } from "lucide-react";

export default function PlanBadge() {
  const [plan, setPlan] = useState(null);

  function cargar() {
    fetch("/api/plan/status")
      .then((res) => (res.ok ? res.json() : null))
      .then(setPlan)
      .catch(() => {});
  }

  useEffect(() => {
    cargar();
    window.addEventListener("evaluaai:plan-actualizado", cargar);
    return () => window.removeEventListener("evaluaai:plan-actualizado", cargar);
  }, []);

  if (!plan) return null;

  if (plan.plan === "paid") {
    return (
      <Link href="/plan" className="user-chip" style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 8, textDecoration: "none" }}>
        <Zap size={13} color="var(--teal-300)" />
        <span style={{ fontSize: 12, color: "var(--teal-300)", fontWeight: 600 }}>Plan pagado activo</span>
      </Link>
    );
  }

  const pct = Math.min(100, (plan.generadosEsteMes / plan.limiteMensual) * 100);

  return (
    <Link href="/plan" className="user-chip" style={{ display: "block", marginBottom: 8, textDecoration: "none" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "var(--ink-200)" }}>
        <span>Plan gratuito</span>
        <span>
          {plan.generadosEsteMes}/{plan.limiteMensual} informes
        </span>
      </div>
      <div style={{ height: 5, background: "var(--navy-700)", borderRadius: 99, marginTop: 6, overflow: "hidden" }}>
        <div
          style={{
            height: "100%",
            width: `${pct}%`,
            background: plan.bloqueado ? "var(--red-500)" : "var(--teal-400)",
          }}
        />
      </div>
    </Link>
  );
}
