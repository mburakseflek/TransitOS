import Link from "next/link";
import { Auth01Panel, FloatingInput, FrequencySelector } from "@/app/components/RegistryInterfaceKit";
import { LoginFormShell, LoginSubmitButton } from "@/app/login/LoginFormShell";

export default async function LoginPage({
  searchParams
}: {
  searchParams?: Promise<{ next?: string; error?: string }>;
}) {
  const params = await searchParams;
  const nextPath = safeNextPath(params?.next);
  const isSiteAdminLogin = nextPath.startsWith("/site-admin");

  return (
    <main
      id={isSiteAdminLogin ? "site-admin-login-screen" : "transitos-login-screen"}
      className={`login-page ${isSiteAdminLogin ? "site-admin-login-page" : "transitos-login-page"}`}
    >
      <LoginFormShell className={`card login-card ${isSiteAdminLogin ? "site-admin-login-card" : "transitos-login-card"}`}>
        <input type="hidden" name="next" value={nextPath} />
        {isSiteAdminLogin ? <SiteAdminLoginHeader /> : <TransitOSLoginHeader />}

        {!isSiteAdminLogin ? (
          <FrequencySelector
            name="role"
            label="Giriş profili"
            defaultValue="MANAGER"
            options={[
              { value: "MANAGER", label: "Yönetici", tone: "blue" },
              { value: "SERVICE_SUPERVISOR", label: "Servis Sorumlusu", tone: "green" },
              { value: "SUBCONTRACTOR", label: "Taşeron", tone: "yellow" },
              { value: "PROJECT_OWNER", label: "Proje Sahibi", tone: "gray" }
            ]}
          />
        ) : (
          <input type="hidden" name="role" value="MANAGER" />
        )}

        <div className="field">
          <FloatingInput
            name="loginId"
            label={isSiteAdminLogin ? "Site yönetici ID" : "Kullanıcı ID"}
            placeholder={isSiteAdminLogin ? "Site yönetici ID'nizi yazın" : "Kullanıcı ID'nizi yazın"}
            required
            autoComplete="username"
          />
          <small className="login-field-hint">Yöneticiniz tarafından verilen kullanıcı ID’sini girin.</small>
        </div>

        <div className="field">
          <FloatingInput name="password" label="Şifre" placeholder="Şifrenizi yazın" type="password" required autoComplete="current-password" />
          <small className="login-field-hint">Şifreniz büyük ve küçük harfe duyarlıdır.</small>
        </div>

        {params?.error ? <p className="login-error">{params.error}</p> : null}

        <LoginSubmitButton pendingLabel={isSiteAdminLogin ? "Site yönetimi açılıyor..." : "Giriş yapılıyor..."}>
          {isSiteAdminLogin ? "Site Yönetimine Gir" : "Giriş Yap"}
        </LoginSubmitButton>

        <Link className="ghost login-home-link" href={isSiteAdminLogin ? "/seflektur" : "/"}>
          {isSiteAdminLogin ? "Kurumsal siteye dön" : "Ana sayfaya dön"}
        </Link>
      </LoginFormShell>
    </main>
  );
}

function TransitOSLoginHeader() {
  return (
    <>
      <Auth01Panel
        title="SeflekTur Operasyon Merkezi"
        body="Taşeron, araç, güzergah ve servis planlamasını tek veri merkezi üzerinden yöneten kurumsal TransitOS platformu."
        mode="transitos"
      />
      <div className="brand transitos-login-brand" aria-label="TransitOS">
        <span className="transitos-login-brand-word">Transit</span>
        <span className="transitos-login-brand-os">OS</span>
      </div>
    </>
  );
}

function SiteAdminLoginHeader() {
  return (
    <>
      <div className="site-admin-login-logo">
        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
      </div>
      <Auth01Panel
        title="Kurumsal Site Yönetimi"
        body="Şeflek Tur web sitesi içerikleri, görselleri, formları ve yayın akışını düzenlemek için güvenli yönetim girişi."
        mode="site"
      />
    </>
  );
}

function safeNextPath(next?: string) {
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/transitos/dashboard";
}
