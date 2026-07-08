import { cookies } from "next/headers";
import { Pencil, Trash2 } from "lucide-react";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { createSubcontractor, deleteSubcontractor, updateSubcontractor } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canManageSubcontractors } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function SubcontractorsPage() {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canManage = canManageSubcontractors(user);
  const endOfToday = new Date();
  endOfToday.setHours(23, 59, 59, 999);
  const subcontractors = canManage ? await prisma.subcontractor.findMany({
    include: { users: true, vehicles: { include: { assignments: true } }, expenses: true },
    orderBy: { companyName: "asc" }
  }) : [];

  return (
    <AppShell active="/transitos/subcontractors" title="Taşeronlar" subtitle="Firma, iletişim, vergi, giriş ve araç bağlantıları.">
      {!canManage ? <section className="card muted">Bu panel için görüntüleme yetkiniz bulunmuyor.</section> : null}
      {canManage ? (
      <>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <ModalAction label="Taşeron Ekle" title="Taşeron Ekle">
          <form className="stack" action={createSubcontractor}>
            <SubcontractorFields />
            <div className="actions"><SubmitButton>✓ Taşeron Ekle</SubmitButton></div>
          </form>
        </ModalAction>
      </div>

      <section className="stack">
        {subcontractors.map((subcontractor) => {
          const user = subcontractor.users[0];
          const assignments = subcontractor.vehicles.flatMap((vehicle) => vehicle.assignments);
          const completed = assignments.filter((assignment) => assignment.serviceDate <= endOfToday).length;
          const planned = assignments.length - completed;
          return (
            <section className="card status-card" key={subcontractor.id}>
              <div className="record-head">
                <div>
                  <h2 style={{ margin: 0 }}>{subcontractor.companyName}</h2>
                  <div className="chip-row">
                    <span className={subcontractor.status === "ACTIVE" ? "badge green" : "badge gray"}>{subcontractor.status === "ACTIVE" ? "Aktif" : "Pasif"}</span>
                    <span className={subcontractor.vehicles.length > 0 ? "badge yellow" : "badge gray"}>{subcontractor.vehicles.length} araç</span>
                    <span className="badge green">✓ {completed} taşındı</span>
                    <span className="badge yellow">◷ {planned} plan</span>
                  </div>
                </div>
                <ModalAction
                  label={<Pencil size={17} aria-hidden="true" />}
                  ariaLabel={`${subcontractor.companyName} taşeronunu düzenle`}
                  buttonClassName="ghost icon-button"
                  title={`${subcontractor.companyName} İşlemleri`}
                >
                  <div className="stack">
                    <form className="stack" action={updateSubcontractor}>
                      <input type="hidden" name="id" value={subcontractor.id} />
                      <SubcontractorFields defaults={{ ...subcontractor, loginId: user?.loginId ?? "" }} />
                      <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
                    </form>
                    <form className="stack" action={deleteSubcontractor}>
                      <input type="hidden" name="id" value={subcontractor.id} />
                      <p>Bu taşeron, kullanıcı girişi, araçları ve bağlı kayıtları silinecek.</p>
                      <div className="actions">
                        <DeleteButton ariaLabel={`${subcontractor.companyName} taşeronunu sil`}>
                          <Trash2 size={17} aria-hidden="true" />
                        </DeleteButton>
                      </div>
                    </form>
                  </div>
                </ModalAction>
              </div>
              <div className="section">
                <p><strong>Yetkili:</strong> {subcontractor.authorizedPerson}</p>
                <p className="muted">{subcontractor.phone} · {subcontractor.email ?? "E-posta yok"}</p>
                <p className="muted">Vergi: {subcontractor.taxOffice ?? "-"} / {subcontractor.taxNumber ?? "-"}</p>
                <p className="muted">Araçlar: {subcontractor.vehicles.map((vehicle) => vehicle.fleetNumber).join(", ") || "-"}</p>
              </div>
            </section>
          );
        })}
        {subcontractors.length === 0 ? <section className="card muted">Henüz taşeron kaydı yok.</section> : null}
      </section>
      </>
      ) : null}
    </AppShell>
  );
}

function SubcontractorFields({ defaults }: { defaults?: Record<string, unknown> }) {
  return (
    <>
      <Field label="Firma adı" hint="Taşeron şirketin resmi veya ticari adı.">
        <input name="companyName" defaultValue={String(defaults?.companyName ?? "")} required />
      </Field>
      <Field label="Yetkili kişi" hint="Operasyon ve ödeme için iletişim kurulacak kişi.">
        <input name="authorizedPerson" defaultValue={String(defaults?.authorizedPerson ?? "")} required />
      </Field>
      <Field label="Telefon" hint="+90 formatında saklanır.">
        <input name="phone" defaultValue={String(defaults?.phone ?? "")} />
      </Field>
      <Field label="E-posta" hint="Rapor ve resmi iletişim adresi.">
        <input name="email" defaultValue={String(defaults?.email ?? "")} />
      </Field>
      <Field label="Vergi dairesi" hint="Fatura ve cari kayıt bilgisi.">
        <input name="taxOffice" defaultValue={String(defaults?.taxOffice ?? "")} />
      </Field>
      <Field label="Vergi no" hint="Vergi numarası veya TCKN.">
        <input name="taxNumber" defaultValue={String(defaults?.taxNumber ?? "")} />
      </Field>
      <Field label="IBAN" hint="Ödeme için banka hesabı.">
        <input name="iban" defaultValue={String(defaults?.iban ?? "")} />
      </Field>
      <Field label="Adres" hint="Fatura veya merkez adresi.">
        <textarea name="address" defaultValue={String(defaults?.address ?? "")} rows={2} />
      </Field>
      <Field label="Durum" hint="Taşeron giriş ve operasyon durumu.">
        <select name="status" defaultValue={String(defaults?.status ?? "ACTIVE")}>
          <option value="ACTIVE">Aktif</option>
          <option value="PASSIVE">Pasif</option>
        </select>
      </Field>
      <Field label="Taşeron ID" hint="Taşeronun giriş ekranında kullanacağı kullanıcı adı.">
        <input name="loginId" defaultValue={String(defaults?.loginId ?? "")} />
      </Field>
      <Field label="Şifre" hint="Boş bırakılırsa mevcut şifre korunur, yeni kayıtta 1234 olur.">
        <input name="password" type="password" />
      </Field>
      <Field label="Notlar" hint="Ek açıklama.">
        <textarea name="notes" defaultValue={String(defaults?.notes ?? "")} rows={2} />
      </Field>
    </>
  );
}
