import Link from "next/link";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import {
  Banknote,
  Bus,
  CalendarDays,
  ChartNoAxesCombined,
  CircleHelp,
  ClipboardCheck,
  FolderKanban,
  Gauge,
  House,
  Menu,
  MinusCircle,
  Settings,
  UserRound,
  UsersRound
} from "lucide-react";
import { readSessionToken } from "@/lib/auth";
import { roleTitle } from "@/lib/permissions";
import { ExpandableProfileCard } from "@/app/components/RegistryInterfaceKit";
import { MarketTicker } from "@/app/components/MarketTicker";
import { LogoutButton } from "@/app/components/LogoutButton";
export { ModalAction } from "@/app/components/ModalAction";

const navItems = [
  { label: "Panel", path: "/dashboard", icon: Gauge },
  { label: "Taşeronlar", path: "/subcontractors", icon: UsersRound },
  { label: "Araçlar", path: "/vehicles", icon: Bus },
  { label: "Anketler", path: "/surveys", icon: ClipboardCheck },
  { label: "Sürücüler", path: "/drivers", icon: UserRound },
  { label: "Projeler", path: "/projects", icon: FolderKanban },
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
  if (user.role === "SITE_MODERATOR") redirect("/site-admin");
  const displayName = user?.displayName ?? "Şeflek Tur";
  const currentRoleTitle = roleTitle(user?.role);
  const activePath = active.replace(/^\/transitos/, "");
  const tickerItems = [
    "USD/TL: güncel veri bekleniyor",
    "EUR/TL: güncel veri bekleniyor",
    "Motorin İstanbul Avrupa: güncel veri bekleniyor",
    "Benzin İstanbul Avrupa: güncel veri bekleniyor"
  ];
  const visibleNavItems = navItems
    .filter((item) => isNavVisible(item.label, user?.role))
    .map((item) => user?.role === "PROJECT_OWNER" && item.label === "Hakedişler" ? { ...item, label: "Faturalar" } : item);
  const activeNavLabel = visibleNavItems.find((item) => item.path === activePath)?.label ?? "Menü";
  const guide = roleGuide(user.role);

  return (
    <main className="shell transitos-shell" data-user-role={user.role}>
      <input className="mobile-drawer-check" id="transitos-mobile-drawer" type="checkbox" aria-hidden="true" />
      <div className="transitos-mobile-chrome" aria-label="TransitOS mobil hızlı menü">
        <Link className="transitos-mobile-logo" href="/transitos/dashboard" aria-label="TransitOS ana panele dön">
          <img src="/brand/seflek-logo-navy.png" alt="Seflek Tur" />
        </Link>
        <label className="mobile-drawer-open" htmlFor="transitos-mobile-drawer" aria-label="TransitOS menüsünü aç">
          <Menu size={22} />
          <span>{activeNavLabel}</span>
        </label>
      </div>
      <label className="mobile-drawer-backdrop" htmlFor="transitos-mobile-drawer" aria-label="Menüyü kapat" />
      <nav className="mobile-drawer-panel" aria-label="Mobil TransitOS menüsü">
        <div className="mobile-drawer-head">
          <img src="/brand/seflek-logo-navy.png" alt="Seflek Tur" />
          <label htmlFor="transitos-mobile-drawer">Kapat</label>
        </div>
        {visibleNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = activePath === item.path;
          return (
            <Link key={item.path} className={`${isActive ? "active" : ""} aceternity-sidebar-link`} href={`/transitos${item.path}` as never}>
              <Icon size={19} />
              <span>{item.label}</span>
            </Link>
          );
        })}
        <LogoutButton className="mobile-drawer-logout" />
        <Link className="site-return-link mobile-site-return-link" href="/seflektur">
          <House size={17} />
          <span>Siteye dön</span>
        </Link>
      </nav>
      <aside className="sidebar aceternity-sidebar" aria-label="TransitOS ana menüsü" data-collapsible="auto">
        <span className="aceternity-sidebar-glow" aria-hidden="true" />
        <div className="brand">
          <img src="/brand/seflek-logo-navy.png" alt="Seflek Tur" />
          <strong className="sidebar-brand-title">SeflekTur Transit<span>OS</span></strong>
          <small className="sidebar-brand-meta">{currentRoleTitle} · {displayName}</small>
        </div>
        <nav className="nav desktop-nav aceternity-sidebar-nav">
          {visibleNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = activePath === item.path;
            return (
            <Link key={item.path} className={`${isActive ? "active" : ""} aceternity-sidebar-link`} href={`/transitos${item.path}` as never}>
              <Icon size={18} />
              <span>{item.label}</span>
            </Link>
          );})}
        </nav>
        <LogoutButton className="sidebar-logout-button" />
        <Link className="site-return-link" href="/seflektur" title="Şeflek Tur sitesine dön">
          <House size={17} />
          <span>Siteye dön</span>
        </Link>
      </aside>

      <section className="content magic-bento-surface">
        <div className="topbar">
          <div>
            <h1 className="title">{title}</h1>
            <p className="muted">{subtitle}</p>
          </div>
          <div className="topbar-actions">
            <LogoutButton className="ghost compact-button topbar-logout-button" />
            <Link className="ghost compact-button home-return-button" href="/">
              <House size={16} />
              Ana sayfaya dön
            </Link>
            <ExpandableProfileCard
              title={displayName}
              subtitle={currentRoleTitle}
              meta="Aktif oturum"
              compact
            >
              <Link className="ghost compact-button" href="/transitos/settings">
                <Settings size={15} />
                Ayarlar
              </Link>
            </ExpandableProfileCard>
          </div>
        </div>
        <section className="role-guide-card" aria-label="Bu ekranda ne yapabilirsiniz?">
          <CircleHelp size={20} aria-hidden="true" />
          <div>
            <strong>{guide.title}</strong>
            <span>{guide.body}</span>
          </div>
          <Link href={guide.href as never}>{guide.action}</Link>
        </section>
        {children}
        <MarketTicker fallbackItems={tickerItems} placement="app" />
      </section>
    </main>
  );
}

function roleGuide(role: string) {
  if (role === "SUBCONTRACTOR") return {
    title: "Size ait operasyon alanı",
    body: "Yalnız firmanızın araçları, taşıdığı servisler, güzergahlar ve hakedişleri gösterilir.",
    href: "/transitos/projects",
    action: "Servislerimi gör"
  };
  if (role === "PROJECT_OWNER") return {
    title: "Proje sahibi görünümü",
    body: "Yalnız sahibi olduğunuz projeler, servis planları, araçlar ve faturalar gösterilir.",
    href: "/transitos/projects",
    action: "Projelerimi gör"
  };
  if (role === "SERVICE_SUPERVISOR") return {
    title: "Operasyon çalışma alanı",
    body: "Size atanan projelerin servis, araç ve güzergah işlemlerini buradan yönetebilirsiniz.",
    href: "/transitos/projects",
    action: "Operasyona git"
  };
  return {
    title: "Yönetici çalışma alanı",
    body: "Önce projeyi seçin, ardından güzergah ve servis işlemlerini adım adım tamamlayın.",
    href: "/transitos/projects",
    action: "Projeleri yönet"
  };
}

function isNavVisible(label: string, role?: string) {
  if (role === "SERVICE_SUPERVISOR") {
    return !["Giderler", "Hakedişler", "Ayarlar"].includes(label);
  }
  if (role === "SUBCONTRACTOR") {
    return !["Taşeronlar", "Anketler", "Sürücüler", "Giderler", "Finans", "Takvim"].includes(label);
  }
  if (role === "PROJECT_OWNER") {
    return !["Taşeronlar", "Anketler", "Giderler", "Finans", "Ayarlar"].includes(label);
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

export function FormSection({
  title,
  description,
  children,
  optional = false
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  optional?: boolean;
}) {
  return (
    <fieldset className="form-flow-section">
      <legend>
        <strong>{title}</strong>
        {optional ? <span>İsteğe bağlı</span> : null}
      </legend>
      <p>{description}</p>
      <div className="form-flow-fields">{children}</div>
    </fieldset>
  );
}

export function SubmitButton({ children = "Kaydet" }: { children?: React.ReactNode }) {
  return (
    <button className="primary compact" type="submit">
      {children}
    </button>
  );
}

export function DeleteButton({ children = "Sil", ariaLabel }: { children?: React.ReactNode; ariaLabel?: string }) {
  return (
    <button className="danger" type="submit" aria-label={ariaLabel}>
      {children}
    </button>
  );
}
