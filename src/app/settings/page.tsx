import Link from "next/link";
import { cookies } from "next/headers";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { createAccessUser, deleteAccessUser, updateAccessUser } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageUsers, roleTitle } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function SettingsPage() {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canManage = canManageUsers(user);
  const [users, subcontractors, projects, companies] = canManage
    ? await Promise.all([
      prisma.user.findMany({
        include: { subcontractor: true, serviceProjects: true, ownerProjects: true, ownerCompanies: true },
        orderBy: [{ role: "asc" }, { displayName: "asc" }]
      }),
      prisma.subcontractor.findMany({ orderBy: { companyName: "asc" } }),
      prisma.project.findMany({ orderBy: { name: "asc" } }),
      prisma.projectCompany.findMany({ orderBy: { name: "asc" } })
    ])
    : [[], [], [], []];

  return (
    <AppShell active="/transitos/settings" title="Ayarlar" subtitle="Oturum, kullanıcı yetkileri ve panel erişimleri.">
      <section className="settings-grid">
        <article className="card">
          <h2 style={{ marginTop: 0 }}>Oturum</h2>
          <p className="muted">Kullanıcı: {user?.displayName ?? "Şeflek Tur"}</p>
          <p className="muted">Rol: {roleTitle(user?.role)}</p>
        </article>
        <article className="card">
          <h2 style={{ marginTop: 0 }}>Paneller</h2>
          <div className="stack">
            {canManage ? <Link className="ghost compact-button" href="/site-admin">Site düzenleme paneli</Link> : null}
            <Link className="ghost compact-button" href="/seflektur">Şeflek Tur sitesi</Link>
            <Link className="ghost compact-button" href="/transitos/dashboard">TransitOS paneli</Link>
          </div>
        </article>
        <article className="card">
          <h2 style={{ marginTop: 0 }}>Yetki Modeli</h2>
          <p className="muted">Yönetici tam yetkili, servis sorumlusu atanmış projelerde düzenleyebilir, taşeron ve proje sahibi kendi verilerini sadece görüntüler.</p>
        </article>
      </section>

      {canManage ? (
        <section className="card section">
          <div className="record-head">
            <div>
              <h2 style={{ marginTop: 0 }}>Kullanıcı Yetkileri</h2>
              <p className="muted">Servis sorumlusu ve proje sahibi için proje ataması buradan yapılır.</p>
            </div>
            <ModalAction label="Kullanıcı Ekle" title="Kullanıcı Ekle">
              <form className="stack" action={createAccessUser}>
                <input type="hidden" name="_returnTo" value="/transitos/settings" />
                <UserFields projects={projects} companies={companies} subcontractors={subcontractors} />
                <div className="actions"><SubmitButton>✓ Kullanıcı Ekle</SubmitButton></div>
              </form>
            </ModalAction>
          </div>

          <table className="table section user-access-table">
            <thead><tr><th>Kullanıcı</th><th>Rol</th><th>Bağlı Kayıt</th><th>Projeler</th><th></th></tr></thead>
            <tbody>
              {users.map((item) => {
                const projectNames = item.role === "SERVICE_SUPERVISOR"
                  ? item.serviceProjects.map((project) => project.name)
                  : item.role === "PROJECT_OWNER"
                    ? [...item.ownerCompanies.map((company) => company.name), ...item.ownerProjects.map((project) => project.name)]
                    : [];
                return (
                  <tr key={item.id}>
                    <td data-label="Kullanıcı"><strong>{item.displayName}</strong><br /><small className="muted">{item.loginId}</small></td>
                    <td data-label="Rol"><span className="badge blue">{roleTitle(item.role)}</span></td>
                    <td data-label="Bağlı kayıt">{item.subcontractor?.companyName ?? "-"}</td>
                    <td data-label="Projeler">{projectNames.join(", ") || "-"}</td>
                    <td data-label="İşlemler">
                      <ModalAction label="..." title={`${item.displayName} Yetkileri`}>
                        <div className="stack">
                          <form className="stack" action={updateAccessUser}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="_returnTo" value="/transitos/settings" />
                            <UserFields user={item} projects={projects} companies={companies} subcontractors={subcontractors} />
                            <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
                          </form>
                          <form className="stack" action={deleteAccessUser}>
                            <input type="hidden" name="id" value={item.id} />
                            <input type="hidden" name="_returnTo" value="/transitos/settings" />
                            <p>Bu kullanıcı giriş yetkisi silinecek. Emin misiniz?</p>
                            <div className="actions"><DeleteButton>Kullanıcıyı Sil</DeleteButton></div>
                          </form>
                        </div>
                      </ModalAction>
                    </td>
                  </tr>
                );
              })}
              {users.length === 0 ? <tr><td colSpan={5}>Henüz kullanıcı kaydı yok.</td></tr> : null}
            </tbody>
          </table>
        </section>
      ) : null}
    </AppShell>
  );
}

function UserFields({
  user,
  subcontractors,
  projects,
  companies
}: {
  user?: any;
  subcontractors: { id: string; companyName: string }[];
  projects: { id: string; name: string; clientCompany: string }[];
  companies: { id: string; name: string }[];
}) {
  const assignedProjectIds = new Set([
    ...(user?.serviceProjects?.map((project: any) => project.id) ?? [])
  ]);
  const assignedCompanyIds = new Set(user?.ownerCompanies?.map((company: any) => company.id) ?? []);

  return (
    <>
      <Field label="Ad Soyad / Ünvan" hint="Panel üzerinde görünecek kullanıcı adı.">
        <input name="displayName" defaultValue={user?.displayName ?? ""} required />
      </Field>
      <Field label="Giriş ID" hint="Kullanıcının giriş ekranında yazacağı ID.">
        <input name="loginId" defaultValue={user?.loginId ?? ""} required />
      </Field>
      <Field label="Şifre" hint="Boş bırakılırsa mevcut şifre korunur, yeni kullanıcıda 1234 verilir.">
        <input name="password" type="password" />
      </Field>
      <Field label="Rol" hint="Kullanıcının TransitOS içindeki yetki modeli.">
        <select name="role" defaultValue={user?.role ?? "SERVICE_SUPERVISOR"}>
          <option value="MANAGER">Yönetici</option>
          <option value="SERVICE_SUPERVISOR">Servis Sorumlusu</option>
          <option value="SUBCONTRACTOR">Taşeron</option>
          <option value="PROJECT_OWNER">Proje Sahibi</option>
        </select>
      </Field>
      <Field label="Taşeron bağlantısı" hint="Sadece taşeron kullanıcılarında kullanılır.">
        <select name="subcontractorId" defaultValue={user?.subcontractorId ?? ""}>
          <option value="">Taşeron seçilmedi</option>
          {subcontractors.map((item) => <option key={item.id} value={item.id}>{item.companyName}</option>)}
        </select>
      </Field>
      <Field label="Servis sorumlusu proje yetkileri" hint="Yalnız servis sorumlusu rolünde doğrudan proje erişimi verir.">
        <div className="checkbox-grid">
          {projects.map((project) => (
            <label key={project.id}>
              <input name="projectIds" type="checkbox" value={project.id} defaultChecked={assignedProjectIds.has(project.id)} />
              <span>{project.name}<small>{project.clientCompany}</small></span>
            </label>
          ))}
          {projects.length === 0 ? <p className="muted">Önce proje ekleyin.</p> : null}
        </div>
      </Field>
      <Field label="Proje sahibi şirket yetkileri" hint="Proje sahibi, seçilen şirketin bugünkü ve daha sonra eklenecek tüm projelerini görür.">
        <div className="checkbox-grid">
          {companies.map((company) => (
            <label key={company.id}>
              <input name="companyIds" type="checkbox" value={company.id} defaultChecked={assignedCompanyIds.has(company.id)} />
              <span>{company.name}</span>
            </label>
          ))}
          {companies.length === 0 ? <p className="muted">Önce Projeler panelinden proje şirketi ekleyin.</p> : null}
        </div>
      </Field>
    </>
  );
}
