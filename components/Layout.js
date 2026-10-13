import Link from "next/link";
import { useRouter } from "next/router";
import { LayoutDashboard, FileUp, Cable, LogOut } from "lucide-react";
import PlanBadge from "./PlanBadge";

const ITEMS = {
  dashboard: { href: "/dashboard", label: "Dashboard UTP", icon: LayoutDashboard },
  inyector: { href: "/inyector", label: "Inyector Normativo", icon: FileUp },
  puente: { href: "/puente", label: "Puente Copiloto", icon: Cable },
};

const ROL_LABEL = {
  docente_pie: "Profesional PIE",
  coordinador_utp: "Coordinación UTP",
};

export default function Layout({ user, menu, children }) {
  const router = useRouter();

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/login");
  }

  return (
    <div className="app-shell">
      <nav className="sidebar">
        <div className="sidebar-brand">
          <span className="dot" />
          EvalúaAI
        </div>

        {menu.map((key) => {
          const item = ITEMS[key];
          if (!item) return null;
          const Icon = item.icon;
          const active = router.pathname === item.href;
          return (
            <Link key={key} href={item.href} className={`nav-item ${active ? "active" : ""}`}>
              <Icon size={17} />
              {item.label}
            </Link>
          );
        })}

        <div className="sidebar-footer">
          <PlanBadge />
          <div className="user-chip">
            <div className="name">{user?.nombre}</div>
            <div className="role">{ROL_LABEL[user?.rol] || user?.cargo}</div>
          </div>
          <button className="logout-btn" onClick={handleLogout}>
            <span style={{ display: "inline-flex", alignItems: "center", gap: 6 }}>
              <LogOut size={13} /> Cerrar sesión
            </span>
          </button>
        </div>
      </nav>

      <main className="main">{children}</main>
    </div>
  );
}
