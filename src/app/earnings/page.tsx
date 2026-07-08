import { cookies } from "next/headers";
import { FinancialDocumentType } from "@prisma/client";
import { PencilLine } from "lucide-react";
import { AppShell, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { AddCashDisclosure } from "@/app/components/RegistryInterfaceKit";
import {
  FinancialDocumentReport,
  MonthlyExpenseReviewCards,
  MonthlyServiceReviewCards,
  UnsignedServiceReport
} from "@/app/components/FinancialDocumentView";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { PrintReportButton } from "@/app/components/PrintReportButton";
import { cancelSubcontractorEarningDocument, issueSubcontractorEarningDocument } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/format";
import { parsePeriod, periodDateWhere } from "@/lib/period";
import { isManager, isProjectOwner, isServiceSupervisor, isSubcontractor } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function EarningsPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; range?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const endOfCurrentDay = new Date();
  endOfCurrentDay.setHours(23, 59, 59, 999);
  const completedUntil = new Date(Math.min(period.endDate.getTime(), endOfCurrentDay.getTime()));

  if (isManager(user) || isServiceSupervisor(user)) {
    const subcontractors = await prisma.subcontractor.findMany({
      include: {
        financialDocuments: {
          where: { type: FinancialDocumentType.SUBCONTRACTOR_EARNING, monthKey: period.month },
          include: { lines: { orderBy: { serviceDate: "asc" } }, createdBy: true }
        },
        vehicles: {
          include: {
            assignments: {
              where: { serviceDate: { gte: period.startDate, lte: completedUntil } },
              include: { route: true, project: true, vehicle: true },
              orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
            }
          }
        },
        expenses: {
          where: { expenseDate: periodDateWhere(period) },
          include: { vehicle: true },
          orderBy: { expenseDate: "asc" }
        }
      },
      orderBy: { companyName: "asc" }
    });
    const issuedTotal = subcontractors.reduce((sum, item) => sum + Number(item.financialDocuments[0]?.netAmount ?? 0), 0);
    const pendingTotal = subcontractors.reduce((sum, subcontractor) => {
      if (subcontractor.financialDocuments.length) return sum;
      const assignments = subcontractor.vehicles.flatMap((vehicle) => vehicle.assignments);
      const gross = assignments.reduce((total, item) => total + Number(item.pricePerService) * item.serviceCount, 0);
      const expenses = subcontractor.expenses.reduce((total, item) => total + Number(item.amount), 0);
      return sum + gross - expenses;
    }, 0);

    return (
      <AppShell active="/transitos/earnings" title="Hakedişler" subtitle="Taşeron hakedişlerini dönem bazlı oluşturun, iptal edin ve yeniden düzenleyin.">
        <PeriodFilter searchParams={params} />
        <section className="grid">
          <Metric title="Kesilmiş Hakediş" value={formatTRY(issuedTotal)} tone="green" />
          <Metric title="Kesilmeyi Bekleyen" value={formatTRY(pendingTotal)} tone="yellow" />
          <Metric title="Taşeron" value={String(subcontractors.length)} tone="blue" />
        </section>

        <section className="section">
          <AddCashDisclosure
            title="Hakediş kesim özeti"
            amount={formatTRY(issuedTotal + pendingTotal)}
            description="Kesilmiş ve henüz kesilmemiş dönem hakedişlerinin toplam görünümü."
            tone="yellow"
          >
            <span>Kesilmiş: {formatTRY(issuedTotal)}</span>
            <span>Kesilmeyi bekleyen: {formatTRY(pendingTotal)}</span>
          </AddCashDisclosure>
        </section>

        <section className="card section">
          <div className="record-head">
            <div>
              <h2 style={{ marginTop: 0 }}>Taşıyıcı Hakediş Dosyaları</h2>
              <p className="muted">Bir taşeron satırını açarak ilgili ayın servislerini, giderlerini ve kesim durumunu görüntüleyebilirsiniz.</p>
            </div>
            <span className="badge yellow">{period.month}</span>
          </div>
          <div className="stack section">
            {subcontractors.map((subcontractor) => {
              const document = subcontractor.financialDocuments[0] ?? null;
              const assignments = subcontractor.vehicles.flatMap((vehicle) => vehicle.assignments);
              const gross = assignments.reduce((sum, item) => sum + Number(item.pricePerService) * item.serviceCount, 0);
              const expenses = subcontractor.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
              const net = gross - expenses;
              const targetId = document ? `earnings-subcontractor-document-${document.id}` : `earnings-preview-${subcontractor.id}`;

              return (
                <details className="card earning-selector-card" key={subcontractor.id}>
                  <summary>
                    <span>
                      <strong>{subcontractor.companyName}</strong>
                      <small>{assignments.length} servis · {subcontractor.expenses.length} gider</small>
                    </span>
                    <span className={document ? "badge green" : "badge yellow"}>
                      {document ? `Kesildi · ${formatTRY(Number(document.netAmount))}` : `Kesilmedi · ${formatTRY(net)}`}
                    </span>
                  </summary>

                  <div className="section stack">
                    <div className="grid">
                      <Metric title="Brüt" value={formatTRY(gross)} tone="blue" />
                      <Metric title="Gider" value={formatTRY(expenses)} tone="red" />
                      <Metric title="Net" value={formatTRY(net)} tone="green" />
                    </div>

                    <div className="finance-document-actions">
                      {document ? (
                        <>
                          <PrintReportButton targetId={targetId} label="PDF / Yazdır" />
                          <ModalAction
                            label={<PencilLine size={17} aria-hidden="true" />}
                            ariaLabel={`${subcontractor.companyName} hakedişini iptal et ve düzenle`}
                            buttonClassName="danger icon-button"
                            title={`${subcontractor.companyName} hakedişi iptal edilsin mi?`}
                            tone="danger"
                          >
                            <form className="stack" action={cancelSubcontractorEarningDocument}>
                              <input type="hidden" name="documentId" value={document.id} />
                              <input type="hidden" name="_returnTo" value={`/transitos/earnings?month=${period.month}&range=${period.range}`} />
                              <div className="confirm-panel danger-soft">
                                <strong>Bu hakediş iptal edilecek.</strong>
                                <p>Servis ve gider kayıtları silinmez. Gerekli düzenlemeleri yaptıktan sonra aynı dönem için yeniden hakediş oluşturabilirsiniz.</p>
                              </div>
                              <div className="actions"><SubmitButton>İptal et ve düzenlemeye aç</SubmitButton></div>
                            </form>
                          </ModalAction>
                        </>
                      ) : (
                        <ModalAction label="Hakediş Oluştur" title={`${subcontractor.companyName} Hakedişi`}>
                          <form className="stack" action={issueSubcontractorEarningDocument}>
                            <input type="hidden" name="subcontractorId" value={subcontractor.id} />
                            <input type="hidden" name="_returnTo" value={`/transitos/earnings?month=${period.month}&range=${period.range}`} />
                            <PeriodOptionField currentMonth={period.month} label="Kesim dönemi" hint="Hakediş hangi ay için oluşturulacak?" />
                            <details className="document-preview-toggle" open>
                              <summary>Önizle</summary>
                              <MonthlyServiceReviewCards assignments={assignments} mode="carrier" monthKey={period.month} />
                              <MonthlyExpenseReviewCards expenses={subcontractor.expenses} />
                            </details>
                            <label className="field-row">
                              <span><strong>Not</strong><small>Hakediş iç notu.</small></span>
                              <textarea name="notes" rows={3} />
                            </label>
                            <div className="actions"><SubmitButton>✓ Hakedişi Kes</SubmitButton></div>
                          </form>
                        </ModalAction>
                      )}
                    </div>

                    {document ? (
                      <FinancialDocumentReport
                        document={document}
                        title="Taşıyıcı Hakediş Belgesi"
                        owner={subcontractor.companyName}
                        targetId={targetId}
                      />
                    ) : (
                      <UnsignedServiceReport
                        assignments={assignments}
                        monthKey={period.month}
                        owner={subcontractor.companyName}
                        targetId={targetId}
                      />
                    )}
                  </div>
                </details>
              );
            })}
            {subcontractors.length === 0 ? <p className="muted">Hakediş oluşturulacak taşeron yok.</p> : null}
          </div>
        </section>
      </AppShell>
    );
  }

  if (isProjectOwner(user)) {
    const userId = user?.id ?? "__no_access__";
    const [documents, assignments] = await Promise.all([
      prisma.financialDocument.findMany({
        where: {
          type: FinancialDocumentType.PROJECT_INVOICE,
          periodStart: { gte: period.startDate, lte: period.endDate },
          project: { ownerUsers: { some: { id: userId } } }
        },
        include: { project: true, lines: { orderBy: { serviceDate: "asc" } } },
        orderBy: { issuedAt: "desc" }
      }),
      prisma.serviceAssignment.findMany({
        where: {
          serviceDate: periodDateWhere(period),
          project: { ownerUsers: { some: { id: userId } } }
        },
        include: { route: true, project: true, vehicle: true },
        orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
      })
    ]);

    return (
      <AppShell active="/transitos/earnings" title="Faturalar" subtitle="Yalnızca Şeflek Tur tarafından kesilmiş proje faturaları görüntülenir.">
        <PeriodFilter searchParams={params} />
        <section className="stack">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} title="Proje Fatura Belgesi" owner={`${document.project?.clientCompany ?? "-"} · ${document.project?.name ?? "-"}`} />
          ))}
          {documents.length === 0 ? (
            <UnsignedServiceReport
              assignments={assignments}
              monthKey={period.month}
              owner={user?.displayName ?? "Proje Servisleri"}
              targetId="unsigned-project-service-report"
              documentLabel="Fatura belgesi"
            />
          ) : null}
        </section>
      </AppShell>
    );
  }

  if (isSubcontractor(user)) {
    const subcontractorId = user?.subcontractorId ?? "__no_access__";
    const [documents, assignments] = await Promise.all([
      prisma.financialDocument.findMany({
        where: {
          type: FinancialDocumentType.SUBCONTRACTOR_EARNING,
          periodStart: { gte: period.startDate, lte: period.endDate },
          subcontractorId
        },
        include: { subcontractor: true, lines: { orderBy: { serviceDate: "asc" } } },
        orderBy: { issuedAt: "desc" }
      }),
      prisma.serviceAssignment.findMany({
        where: {
          serviceDate: periodDateWhere(period),
          vehicle: { subcontractorId }
        },
        include: { route: true, project: true, vehicle: true },
        orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
      })
    ]);

    return (
      <AppShell active="/transitos/earnings" title="Hakedişler" subtitle="Yalnızca Şeflek Tur tarafından kesilmiş hakediş belgeleri görüntülenir.">
        <PeriodFilter searchParams={params} />
        <section className="stack">
          {documents.map((document) => (
            <DocumentCard key={document.id} document={document} title="Taşıyıcı Hakediş Belgesi" owner={document.subcontractor?.companyName ?? "Taşeron"} />
          ))}
          {documents.length === 0 ? (
            <UnsignedServiceReport
              assignments={assignments}
              monthKey={period.month}
              owner={user?.displayName ?? "Taşeron Servisleri"}
              targetId="unsigned-subcontractor-service-report"
            />
          ) : null}
        </section>
      </AppShell>
    );
  }

  return (
    <AppShell active="/transitos/earnings" title="Hakedişler" subtitle="Aylık hakediş ve fatura belgeleri.">
      <section className="card muted">Bu panel için görüntüleme yetkiniz bulunmuyor.</section>
    </AppShell>
  );
}

function DocumentCard({ document, title, owner }: { document: any; title: string; owner: string }) {
  const targetId = `issued-document-${document.id}`;
  return (
    <details className="card earning-report">
      <summary>{owner} · {document.monthKey} <span className="badge green">{formatTRY(Number(document.netAmount))}</span></summary>
      <div className="grid section">
        <article className="card metric"><span className="muted">Brüt</span><strong>{formatTRY(Number(document.grossAmount))}</strong></article>
        <article className="card metric"><span className="muted">Gider</span><strong>{formatTRY(Number(document.expenseAmount))}</strong></article>
        <article className="card metric"><span className="muted">Net</span><strong>{formatTRY(Number(document.netAmount))}</strong></article>
        <article className="card metric"><span className="muted">Kesim Tarihi</span><strong>{document.issuedAt.toLocaleDateString("tr-TR")}</strong></article>
        <PrintReportButton targetId={targetId} label="PDF / Yazdır" />
      </div>
      <FinancialDocumentReport document={document} title={title} owner={owner} targetId={targetId} />
    </details>
  );
}

function PeriodOptionField({ currentMonth, label, hint }: { currentMonth: string; label: string; hint: string }) {
  const [year, month] = currentMonth.split("-").map(Number);
  const options = Array.from({ length: 18 }, (_, index) => {
    const date = new Date(year, month - 10 + index, 1);
    const value = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    return {
      value,
      label: date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" })
    };
  });

  return (
    <Field label={label} hint={hint}>
      <select name="monthKey" defaultValue={currentMonth}>
        {options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
      </select>
    </Field>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone: "green" | "blue" | "yellow" | "red" }) {
  return (
    <article className="card metric">
      <span className="muted">{title}</span>
      <strong>{value}</strong>
      <small className={`badge ${tone === "red" ? "red" : tone}`}>Hakediş</small>
    </article>
  );
}
