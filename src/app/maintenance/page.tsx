import { cookies } from "next/headers";
import {
  CalendarDays,
  CarFront,
  ChevronRight,
  ClockAlert,
  Gauge,
  MapPin,
  PackageCheck,
  ReceiptText,
  Settings2,
  Trash2,
  Wrench
} from "lucide-react";
import { AppShell, DeleteButton, Field, FormSection, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { MoneyInput } from "@/app/components/MoneyInput";
import { PrintReportButton } from "@/app/components/PrintReportButton";
import { createVehicleMaintenance, deleteVehicleMaintenance, updateVehicleMaintenance } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/format";
import { isManager } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function MaintenancePage({
  searchParams
}: {
  searchParams?: Promise<{ vehicle?: string }>;
}) {
  const params = await searchParams;
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canView = isManager(user);
  const vehicles = canView ? await prisma.vehicle.findMany({
    where: { fleetTrackingEnabled: true },
    include: {
      maintenanceRecords: {
        orderBy: [{ serviceDate: "desc" }, { createdAt: "desc" }]
      },
      _count: { select: { maintenanceRecords: true } }
    },
    orderBy: [{ fleetNumber: "asc" }, { plateNumber: "asc" }]
  }) : [];
  const selectedVehicle = vehicles.find((vehicle) => vehicle.id === params?.vehicle) ?? null;
  const records = selectedVehicle?.maintenanceRecords ?? [];
  const totalExpense = records.reduce((sum, record) => sum + Number(record.amount), 0);
  const latestOdometer = records.reduce((highest, record) => Math.max(highest, record.odometerKm), 0);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const warningLimit = new Date(today);
  warningLimit.setDate(warningLimit.getDate() + 30);
  const dueRecords = records.filter((record) => record.nextServiceDate && record.nextServiceDate <= warningLimit);

  return (
    <AppShell
      active="/transitos/maintenance"
      title="Araç Bakımları"
      subtitle="Şirket araçlarının bakım, parça ve servis geçmişini kalıcı olarak izleyin."
    >
      {!canView ? (
        <section className="card maintenance-access-note">
          <Wrench size={24} aria-hidden="true" />
          <div>
            <h2>Yalnız yönetici erişimi</h2>
            <p>Bakım geçmişi şirket araçlarına özel yönetim alanıdır.</p>
          </div>
        </section>
      ) : (
        <>
          {vehicles.length > 0 ? (
            <form className="maintenance-vehicle-picker" method="get">
              <label>
                <span>Araç seçimi</span>
                <select name="vehicle" defaultValue={selectedVehicle?.id ?? ""} required>
                  <option value="" disabled>Bakım geçmişi görüntülenecek aracı seçin</option>
                  {vehicles.map((vehicle) => (
                    <option key={vehicle.id} value={vehicle.id}>
                      {vehicle.fleetNumber} · {vehicle.plateNumber} · {vehicle.make ?? "Marka belirtilmedi"} {vehicle.model ?? ""}
                    </option>
                  ))}
                </select>
              </label>
              <button type="submit">Geçmişi aç</button>
            </form>
          ) : null}

          {!selectedVehicle ? (
            <section className="maintenance-selection-state">
              <div className="maintenance-selection-copy">
                <CarFront size={30} aria-hidden="true" />
                <div>
                  <h2>{vehicles.length ? "Bir araç seçin" : "Filo takip aracı bulunamadı"}</h2>
                  <p>{vehicles.length
                    ? "Bakım kayıtları yalnızca seçtiğiniz araç için açılır; diğer araçların bilgileri ekranda kalabalık oluşturmaz."
                    : "Araç kaydında “Filo Takip Sistemine dahil et” seçeneğini açarak bakım takibine başlayabilirsiniz."}</p>
                </div>
              </div>
              {vehicles.length ? (
                <div className="maintenance-fleet-grid">
                  {vehicles.map((vehicle) => (
                    <a className="maintenance-fleet-card" href={`/transitos/maintenance?vehicle=${encodeURIComponent(vehicle.id)}`} key={vehicle.id}>
                      <span className="maintenance-fleet-icon"><CarFront size={20} aria-hidden="true" /></span>
                      <span>
                        <strong>{vehicle.fleetNumber}</strong>
                        <small>{vehicle.plateNumber} · {vehicle._count.maintenanceRecords} bakım kaydı</small>
                      </span>
                      <ChevronRight size={19} aria-hidden="true" />
                    </a>
                  ))}
                </div>
              ) : null}
            </section>
          ) : (
            <>
              <section className="maintenance-vehicle-summary">
                <div className="maintenance-vehicle-identity">
                  <span className="maintenance-fleet-icon large"><CarFront size={25} aria-hidden="true" /></span>
                  <div>
                    <span className="project-detail-eyebrow">Seçili araç</span>
                    <h2>{selectedVehicle.fleetNumber} · {selectedVehicle.plateNumber}</h2>
                    <p>{selectedVehicle.make ?? "Marka belirtilmedi"} {selectedVehicle.model ?? ""} {selectedVehicle.modelYear ? `· ${selectedVehicle.modelYear}` : ""}</p>
                  </div>
                </div>
                <ModalAction label={<><Wrench size={18} aria-hidden="true" /> Bakım kaydı ekle</>} title={`${selectedVehicle.fleetNumber} · Yeni Bakım Kaydı`}>
                  <form className="stack" action={createVehicleMaintenance}>
                    <input type="hidden" name="vehicleId" value={selectedVehicle.id} />
                    <MaintenanceFields />
                    <div className="actions"><SubmitButton>Bakım kaydını oluştur</SubmitButton></div>
                  </form>
                </ModalAction>
              </section>

              <section className="maintenance-metrics" aria-label="Araç bakım özeti">
                <article><Wrench size={20} aria-hidden="true" /><span>Toplam kayıt</span><strong>{records.length}</strong></article>
                <article><Gauge size={20} aria-hidden="true" /><span>Son kilometre</span><strong>{latestOdometer.toLocaleString("tr-TR")} km</strong></article>
                <article><ReceiptText size={20} aria-hidden="true" /><span>Toplam bakım gideri</span><strong>{formatTRY(totalExpense)}</strong></article>
                <article><CalendarDays size={20} aria-hidden="true" /><span>Son bakım</span><strong>{records[0] ? formatDate(records[0].serviceDate) : "Kayıt yok"}</strong></article>
                <article className={dueRecords.length ? "maintenance-warning-metric" : ""}><ClockAlert size={20} aria-hidden="true" /><span>Yaklaşan / geciken</span><strong>{dueRecords.length}</strong></article>
              </section>

              <section className="maintenance-history-section">
                <div className="maintenance-section-heading">
                  <div>
                    <span className="project-detail-eyebrow">Servis geçmişi</span>
                    <h2>Tüm bakım kayıtları</h2>
                    <p>En yeni servis kaydı ilk sırada gösterilir.</p>
                  </div>
                  <div className="maintenance-heading-actions"><span className="badge blue">{records.length} kayıt</span></div>
                </div>

                {records.length ? (
                  <div className="maintenance-history-list">
                    {records.map((record) => (
                      <article className="maintenance-history-card" key={record.id}>
                        <div className="maintenance-date-block">
                          <CalendarDays size={18} aria-hidden="true" />
                          <strong>{formatDate(record.serviceDate)}</strong>
                          <span>{record.odometerKm.toLocaleString("tr-TR")} km</span>
                        </div>
                        <div className="maintenance-card-copy">
                          <span className="maintenance-provider"><MapPin size={16} aria-hidden="true" /> {record.serviceProvider}</span>
                          <div className="chip-row"><span className="badge blue">{record.maintenanceType}</span>{maintenanceStatus(record.nextServiceDate, today)}</div>
                          <h3>{record.workPerformed}</h3>
                          <p><PackageCheck size={16} aria-hidden="true" /> {record.replacedParts || "Parça değişimi belirtilmedi"}</p>
                          {record.nextServiceDate || record.nextServiceOdometer ? <p className="maintenance-next-service"><ClockAlert size={16} /> Sonraki bakım: {record.nextServiceDate ? formatDate(record.nextServiceDate) : "Tarih belirtilmedi"}{record.nextServiceOdometer ? ` · ${record.nextServiceOdometer.toLocaleString("tr-TR")} km` : ""}</p> : null}
                        </div>
                        <div className="maintenance-card-action">
                          <strong>{formatTRY(Number(record.amount))}</strong>
                          <ModalAction label="Özet raporu" title={`${selectedVehicle.fleetNumber} · Bakım Özeti`} buttonClassName="ghost compact-button">
                            <MaintenanceReport vehicle={selectedVehicle} record={record} />
                            <div className="maintenance-report-actions">
                              <PrintReportButton targetId={`maintenance-report-${record.id}`} label="PDF / Yazdır" />
                              <ModalAction label={<><Settings2 size={16} aria-hidden="true" /> Düzenle</>} title="Bakım Kaydını Düzenle" buttonClassName="ghost compact-button">
                                <form className="stack" action={updateVehicleMaintenance}>
                                  <input type="hidden" name="id" value={record.id} />
                                  <input type="hidden" name="vehicleId" value={selectedVehicle.id} />
                                  <MaintenanceFields record={record} />
                                  <div className="actions"><SubmitButton>Değişiklikleri kaydet</SubmitButton></div>
                                </form>
                              </ModalAction>
                              <form action={deleteVehicleMaintenance}>
                                <input type="hidden" name="id" value={record.id} />
                                <DeleteButton ariaLabel={`${formatDate(record.serviceDate)} bakım kaydını sil`}>
                                  <Trash2 size={16} aria-hidden="true" /> Kaydı sil
                                </DeleteButton>
                              </form>
                            </div>
                          </ModalAction>
                        </div>
                      </article>
                    ))}
                  </div>
                ) : (
                  <div className="maintenance-empty-state">
                    <Wrench size={28} aria-hidden="true" />
                    <h3>Henüz bakım kaydı yok</h3>
                    <p>İlk servis veya tamir kaydını ekleyerek aracın bakım geçmişini oluşturmaya başlayın.</p>
                  </div>
                )}
              </section>
            </>
          )}
        </>
      )}
    </AppShell>
  );
}

function MaintenanceFields({ record }: { record?: any }) {
  return (
    <>
      <FormSection title="Servis bilgileri" description="Bakımın nerede ve ne zaman yapıldığını kaydedin.">
        <Field label="Bakım türü" hint="Kaydı raporlarda sınıflandırır."><select name="maintenanceType" defaultValue={record?.maintenanceType ?? "Periyodik Bakım"}><option>Periyodik Bakım</option><option>Arıza / Onarım</option><option>Lastik</option><option>Muayene Hazırlığı</option><option>Kaporta / Boya</option><option>Elektrik / Elektronik</option><option>Diğer</option></select></Field>
        <Field label="Servis / tamirhane" hint="İşlemi yapan firma veya usta."><input name="serviceProvider" defaultValue={record?.serviceProvider ?? ""} required /></Field>
        <Field label="Bakım tarihi" hint="Aracın servise girdiği tarih."><input name="serviceDate" type="date" defaultValue={dateInputValue(record?.serviceDate)} required /></Field>
        <Field label="Araç kilometresi" hint="Bakım anındaki kilometre."><input name="odometerKm" type="number" inputMode="numeric" min="0" step="1" defaultValue={record?.odometerKm ?? ""} required /></Field>
        <Field label="Toplam masraf" hint="Nokta otomatik eklenir; kuruş için virgül kullanılır."><MoneyInput name="amount" label="₺ Bakım masrafı" defaultValue={record ? Number(record.amount) : 0} required /></Field>
        <Field label="Fatura / fiş no" hint="Masraf belgesi referansı."><input name="invoiceNumber" defaultValue={record?.invoiceNumber ?? ""} /></Field>
      </FormSection>
      <FormSection title="Yapılan işlemler" description="Bakım kapsamını ve değişen parçaları ayrıntılı yazın.">
        <Field label="Yapılan bakımlar" hint="Yağ değişimi, fren kontrolü, motor işlemleri gibi."><textarea name="workPerformed" rows={4} defaultValue={record?.workPerformed ?? ""} required /></Field>
        <Field label="Değişen parçalar" hint="Parça adı, marka veya adet bilgileri."><textarea name="replacedParts" rows={3} defaultValue={record?.replacedParts ?? ""} /></Field>
      </FormSection>
      <FormSection title="Ek notlar" description="Garanti, sonraki kontrol veya fatura bilgileri." optional>
        <Field label="Sonraki bakım tarihi" hint="Yaklaşan bakım uyarısı oluşturur."><input name="nextServiceDate" type="date" defaultValue={dateInputValue(record?.nextServiceDate)} /></Field>
        <Field label="Sonraki bakım kilometresi" hint="Kilometre bazlı bakım hedefi."><input name="nextServiceOdometer" type="number" inputMode="numeric" min="0" step="1" defaultValue={record?.nextServiceOdometer ?? ""} /></Field>
        <Field label="Not" hint="İsteğe bağlı açıklama."><textarea name="notes" rows={3} defaultValue={record?.notes ?? ""} /></Field>
      </FormSection>
    </>
  );
}

function MaintenanceReport({ vehicle, record }: { vehicle: any; record: any }) {
  return (
    <section className="maintenance-report" id={`maintenance-report-${record.id}`}>
      <header className="report-brand">
        <div>
          <span>TransitOS / Filo Operasyonları</span>
          <h2>Araç Bakım Raporu</h2>
          <p>Belge No: BKM-{record.id.slice(-8).toUpperCase()}</p>
        </div>
        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
      </header>
      <div className="maintenance-report-vehicle"><span>Araç</span><strong>{vehicle.fleetNumber} · {vehicle.plateNumber}</strong><p>{vehicle.make ?? "-"} {vehicle.model ?? ""} {vehicle.modelYear ? `· ${vehicle.modelYear}` : ""}</p></div>
      <div className="maintenance-report-grid">
        <ReportItem label="Bakım türü" value={record.maintenanceType} />
        <ReportItem label="Bakım tarihi" value={formatDate(record.serviceDate)} />
        <ReportItem label="Kilometre" value={`${record.odometerKm.toLocaleString("tr-TR")} km`} />
        <ReportItem label="Servis / tamirhane" value={record.serviceProvider} />
        <ReportItem label="Toplam masraf" value={formatTRY(Number(record.amount))} />
        <ReportItem label="Fatura / fiş no" value={record.invoiceNumber || "-"} />
        <ReportItem label="Sonraki bakım" value={[record.nextServiceDate ? formatDate(record.nextServiceDate) : "", record.nextServiceOdometer ? `${record.nextServiceOdometer.toLocaleString("tr-TR")} km` : ""].filter(Boolean).join(" · ") || "Planlanmadı"} />
      </div>
      <ReportSection title="Yapılan bakımlar" value={record.workPerformed} />
      <ReportSection title="Değişen parçalar" value={record.replacedParts || "Parça değişimi belirtilmedi."} />
      <ReportSection title="Notlar" value={record.notes || "Ek not bulunmuyor."} />
      <footer><span>Şeflek Tur Turizm & Yolcu Taşımacılığı</span><span>Rapor tarihi: {new Date().toLocaleDateString("tr-TR")}</span></footer>
    </section>
  );
}

function ReportItem({ label, value }: { label: string; value: string }) {
  return <div><span>{label}</span><strong>{value}</strong></div>;
}

function ReportSection({ title, value }: { title: string; value: string }) {
  return <section><h3>{title}</h3><p>{value}</p></section>;
}

function dateInputValue(date?: Date) {
  return date ? date.toISOString().slice(0, 10) : undefined;
}

function formatDate(date: Date) {
  return date.toLocaleDateString("tr-TR", { day: "2-digit", month: "long", year: "numeric" });
}

function maintenanceStatus(nextDate: Date | null, today: Date) {
  if (!nextDate) return null;
  const days = Math.ceil((nextDate.getTime() - today.getTime()) / 86_400_000);
  if (days < 0) return <span className="badge red">{Math.abs(days)} gün gecikti</span>;
  if (days <= 30) return <span className="badge yellow">{days === 0 ? "Bugün" : `${days} gün kaldı`}</span>;
  return <span className="badge green">Planlı</span>;
}
