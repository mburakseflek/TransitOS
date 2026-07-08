import { cookies } from "next/headers";
import { Eye, Pencil, Trash2 } from "lucide-react";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { createDriverDocument, deleteDriverDocument, updateVehicle } from "@/app/actions";
import { DriverDocumentUploadInputs } from "@/app/components/DriverDocumentUploadInputs";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditOperations, vehicleAccessWhere } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function DriversPage() {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canEdit = canEditOperations(user);

  const vehicles = await prisma.vehicle.findMany({
    where: vehicleAccessWhere(user),
    include: { subcontractor: true, documents: { orderBy: { createdAt: "desc" } } },
    orderBy: { fleetNumber: "asc" }
  });

  const driverVehicles = vehicles.filter((vehicle) => vehicle.driverName || vehicle.driverPhone);

  return (
    <AppShell active="/transitos/drivers" title="Sürücüler" subtitle="Araçlara tanımlı şoförler ve evrak görünümü.">
      <section className="grid">
        <Metric title="Tanımlı Şoför" value={driverVehicles.length} />
        <Metric title="Araç" value={vehicles.length} />
        <Metric title="Evrak" value={vehicles.reduce((sum, vehicle) => sum + vehicle.documents.length, 0)} />
        <Metric title="Eksik Şoför" value={vehicles.length - driverVehicles.length} />
      </section>

      <section className="stack section">
        {vehicles.map((vehicle) => (
          <article className="card status-card" key={vehicle.id}>
            <div className="record-head">
              <div>
                <h2 style={{ margin: 0 }}>{vehicle.driverName || "Şoför tanımsız"}</h2>
                <div className="chip-row">
                  <span className={vehicle.driverName ? "badge green" : "badge yellow"}>{vehicle.driverName ? "Aktif kayıt" : "Eksik bilgi"}</span>
                  <span className="badge gray">{vehicle.fleetNumber} · {vehicle.plateNumber}</span>
                  <span className="badge blue">{vehicle.documents.length} evrak</span>
                </div>
              </div>
              {canEdit ? (
                <ModalAction
                  label={<Pencil size={17} aria-hidden="true" />}
                  ariaLabel={`${vehicle.fleetNumber} şoför bilgilerini düzenle`}
                  buttonClassName="ghost icon-button"
                  title={`${vehicle.fleetNumber} Şoför Bilgileri`}
                >
                  <form className="stack" action={updateVehicle}>
                    <input type="hidden" name="id" value={vehicle.id} />
                    <input type="hidden" name="_returnTo" value="/transitos/drivers" />
                    <input type="hidden" name="fleetNumber" value={vehicle.fleetNumber} />
                    <input type="hidden" name="plateNumber" value={vehicle.plateNumber} />
                    <input type="hidden" name="subcontractorId" value={vehicle.subcontractorId ?? ""} />
                    <input type="hidden" name="make" value={vehicle.make ?? ""} />
                    <input type="hidden" name="model" value={vehicle.model ?? ""} />
                    <input type="hidden" name="modelYear" value={vehicle.modelYear ?? ""} />
                    <input type="hidden" name="capacity" value={vehicle.capacity} />
                    <input type="hidden" name="status" value={vehicle.status} />
                    <Field label="Şoför Adı Soyadı" hint="Araca bağlı sürücü adı.">
                      <input name="driverName" defaultValue={vehicle.driverName ?? ""} />
                    </Field>
                    <Field label="Telefon" hint="+90 formatında saklanır.">
                      <input name="driverPhone" defaultValue={vehicle.driverPhone ?? ""} />
                    </Field>
                    <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
                  </form>
                </ModalAction>
              ) : null}
            </div>
            <div className="section">
              <p className="muted">Telefon: {vehicle.driverPhone || "-"}</p>
              <p className="muted">Taşeron: {vehicle.subcontractor?.companyName ?? "Atanmamış"}</p>
              <div className="document-section">
                <div className="record-head">
                  <strong>Sürücü ve Araç Evrakları</strong>
                  {canEdit ? (
                    <ModalAction label="Evrak Yükle" title={`${vehicle.fleetNumber} Evrak Yükle`}>
                      <form className="stack" action={createDriverDocument}>
                        <input type="hidden" name="vehicleId" value={vehicle.id} />
                        <input type="hidden" name="_returnTo" value="/transitos/drivers" />
                        <DriverDocumentUploadInputs />
                        <div className="actions"><SubmitButton>✓ Evrakı Kaydet</SubmitButton></div>
                      </form>
                    </ModalAction>
                  ) : null}
                </div>
                <div className="document-grid">
                  {vehicle.documents.map((document) => (
                    <article className="document-card" key={document.id}>
                      <div className="document-thumb">
                        {document.fileUrl.toLowerCase().endsWith(".pdf")
                          ? <iframe src={document.fileUrl} title={document.title} />
                          : <img src={document.fileUrl} alt={document.title} />}
                      </div>
                      <div>
                        <strong>{document.title}</strong>
                        <small>{document.createdAt.toLocaleDateString("tr-TR")}</small>
                      </div>
                      <div className="actions">
                        <a className="ghost compact-button icon-button" href={document.fileUrl} target="_blank" rel="noreferrer" aria-label={`${document.title} evrak önizle`}>
                          <Eye size={17} aria-hidden="true" />
                        </a>
                        {canEdit ? (
                          <form action={deleteDriverDocument}>
                            <input type="hidden" name="id" value={document.id} />
                            <input type="hidden" name="_returnTo" value="/transitos/drivers" />
                            <DeleteButton ariaLabel={`${document.title} evrak sil`}>
                              <Trash2 size={17} aria-hidden="true" />
                            </DeleteButton>
                          </form>
                        ) : null}
                      </div>
                    </article>
                  ))}
                  {vehicle.documents.length === 0 ? <p className="muted">Henüz evrak yüklenmemiş.</p> : null}
                </div>
              </div>
            </div>
          </article>
        ))}
        {vehicles.length === 0 ? <section className="card muted">Henüz araç ve şoför kaydı yok.</section> : null}
      </section>
    </AppShell>
  );
}

function Metric({ title, value }: { title: string; value: number }) {
  return (
    <article className="card metric">
      <span className="muted">{title}</span>
      <strong>{value}</strong>
    </article>
  );
}
