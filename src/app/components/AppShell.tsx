import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Banknote,
  Bus,
  CalendarDays,
  ChartNoAxesCombined,
  FolderKanban,
  Gauge,
  House,
  MapPinned,
  Menu,
  MinusCircle,
  Settings,
  UserRound,
  UsersRound
} from "lucide-react";
import { readSessionToken } from "@/lib/auth";
import { getMarketTickerItems } from "@/lib/market-data";
import { roleTitle } from "@/lib/permissions";
import { ExpandableProfileCard, SkiperTickerRail } from "@/app/components/RegistryInterfaceKit";
import { LogoutButton } from "@/app/components/LogoutButton";
export { ModalAction } from "@/app/components/ModalAction";

const navItems = [
  { label: "Panel", path: "/dashboard", icon: Gauge },
  { label: "Taşeronlar", path: "/subcontractors", icon: UsersRound },
  { label: "Araçlar", path: "/vehicles", icon: Bus },
  { label: "Sürücüler", path: "/drivers", icon: UserRound },
  { label: "Projeler", path: "/projects", icon: FolderKanban },
  { label: "Rotalar", path: "/routes", icon: MapPinned },
  { label: "Giderler", path: "/expenses", icon: MinusCircle },
  { label: "Finans", path: "/finance", icon: ChartNoAxesCombined },
  { label: "Takvim", path: "/calendar", icon: CalendarDays },
  { label: "Hakedişler", path: "/earnings", icon: Banknote },
  { label: "Ayarlar", path: "/settings", icon: Settings }
] as const;

export async function AppShell({
  active,
  title,
  subtitle,
  children
}: {
  active: string;
  title: string;
  subtitle: string;
  children: React.ReactNode;
}) {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  if (!user?.role) {
    const nextPath = active.startsWith("/transitos") ? active : `/transitos${active}`;
    redirect(`/login?next=${encodeURIComponent(nextPath)}`);
  }
  const displayName = user?.displayName ?? "Şeflek Tur";
  const currentRoleTitle = roleTitle(user?.role);
  const activePath = active.replace(/^\/transitos/, "");
  const tickerItems = await getMarketTickerItems([
    "USD/TL: güncel veri bekleniyor",
    "EUR/TL: güncel veri bekleniyor",
    "Motorin İstanbul Avrupa: güncel veri bekleniyor",
    "Benzin İstanbul Avrupa: güncel veri bekleniyor"
  ]);
  const visibleNavItems = navItems
    .filter((item) => isNavVisible(item.label, user?.role))
    .map((item) => user?.role === "PROJECT_OWNER" && item.label === "Hakedişler" ? { ...item, label: "Faturalar" } : item);

  return (
    <main className="shell transitos-shell">
      <aside className="sidebar aceternity-sidebar" aria-label="TransitOS ana menüsü" data-collapsible="auto">
        <span className="aceternity-sidebar-glow" aria-hidden="true" />
        <span className="aceternity-sidebar-rail-label" aria-hidden="true">Menü</span>
        <div className="brand">
          <img src="/seflek-logo-white.png" alt="Seflek Tur" />
          <strong className="sidebar-brand-title">SeflekTur Transit<span>OS</span></strong>
          <small className="sidebar-brand-meta">{currentRoleTitle} · {displayName}</small>
        </div>
        <nav className="nav desktop-nav aceternity-sidebar-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
            <Link key={item.path} className={`${isActive ? "active" : ""} aceternity-sidebar-link`} href={`/transitos${item.path}`}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );})}
        </nav>
        <details className="mobile-nav-menu">
          <summary>
            <Menu size={18} />
            <span>{visibleNavItems.find((item) => item.path === activePath)?.label ?? "Menü"}</span>
          </summary>
          <nav className="nav aceternity-sidebar-nav">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              const isActive = activePath === item.path;
              return (
                <Link key={item.path} className={`${isActive ? "active" : ""} aceternity-sidebar-link`} href={`/transitos${item.path}`}>
                  <Icon size={18} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </details>
        <Link className="site-return-link" href="/seflektur">
          <House size={17} />
          <span>Şeflek Tur sitesine dön</span>
        </Link>
      </aside>

      <section className="content magic-bento-surface">
        <div className="topbar">
          <div>
            <h1 className="title">{title}</h1>
            <p className="muted">{subtitle}</p>
          </div>
          <div className="topbar-actions">
            <Link className="ghost compact-button home-return-button" href="/">
              <House size={16} />
              Ana sayfaya dön
            </Link>
            <ExpandableProfileCard
              title={displayName}
              subtitle={currentRoleTitle}
              meta="Aktif oturum"
              badge={<LogoutButton />}
              compact
            >
              <Link className="ghost compact-button" href="/transitos/settings">
                <Settings size={15} />
                Ayarlar
              </Link>
            </ExpandableProfileCard>
          </div>
        </div>
        {children}
        <div className="transitos-rate-ticker" aria-label="Döviz ve akaryakıt bilgi bandı">
          <SkiperTickerRail items={tickerItems} />
        </div>
      </section>
    </main>
  );
}

function isNavVisible(label: string, role?: string) {
  if (role === "SERVICE_SUPERVISOR") {
    return !["Giderler", "Hakedişler", "Ayarlar"].includes(label);
  }
  if (role === "SUBCONTRACTOR") {
    return !["Taşeronlar", "Sürücüler", "Giderler", "Finans", "Takvim"].includes(label);
  }
  if (role === "PROJECT_OWNER") {
    return !["Taşeronlar", "Giderler", "Finans", "Ayarlar"].includes(label);
  }
  return true;
}

export function Field({ label, hint, children }: { label: string; hint: string; children: React.ReactNode }) {
  return (
    <label className="field-row">
      <span>
        <strong>{label}</strong>
        <small>{hint}</small>
      </span>
      {children}
    </label>
  );
}

export function SubmitButton({ children = "Kaydet" }: { children?: React.ReactNode }) {
  return (
    <button className="primary compact" type="submit">
      {children}
    </button>
  );
}

export function DeleteButton({ children = "Sil" }: { children?: React.ReactNode }) {
  return (
    <button className="danger" type="submit">
      {children}
    </button>
  );
}
