import { cookies } from "next/headers";
import { FinancialDocumentType } from "@prisma/client";
import { PencilLine } from "lucide-react";
import { AppShell, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { AddCashDisclosure } from "@/app/components/RegistryInterfaceKit";
import {
  FinancialDocumentReport,
  MonthlyExpenseReviewCards,
  MonthlyServiceReviewCards
} from "@/app/components/FinancialDocumentView";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { PrintReportButton } from "@/app/components/PrintReportButton";
import {
  cancelProjectInvoiceDocument,
  cancelSubcontractorEarningDocument,
  issueProjectInvoiceDocument,
  issueSubcontractorEarningDocument
} from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/format";
import { parsePeriod, periodDateWhere } from "@/lib/period";
import { isManager, isServiceSupervisor } from "@/lib/permissions";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; range?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canManageFinance = isManager(user);
  const canIssueSubcontractor = isManager(user) || isServiceSupervisor(user);
  const endOfCurrentDay = new Date();
  endOfCurrentDay.setHours(23, 59, 59, 999);
  const completedUntil = new Date(Math.min(period.endDate.getTime(), endOfCurrentDay.getTime()));

  if (!canManageFinance && !canIssueSubcontractor) {
    return (
      <AppShell active="/transitos/finance" title="Finans" subtitle="Gelir, gider, fatura ve hakediş belgeleri.">
        <section className="card muted">Bu panel için yetkiniz bulunmuyor.</section>
      </AppShell>
    );
  }

  const [projectCompanies, subcontractors] = await Promise.all([
    canManageFinance ? prisma.projectCompany.findMany({
      include: {
        financialDocuments: {
          where: { type: FinancialDocumentType.PROJECT_INVOICE, monthKey: period.month },
          include: { lines: { orderBy: { serviceDate: "asc" } }, createdBy: true }
        },
        projects: {
          include: {
            assignments: {
              where: { serviceDate: { gte: period.startDate, lte: completedUntil } },
              include: { route: true, vehicle: true, project: true },
              orderBy: [{ serviceDate: "asc" }, { serviceTime: "asc" }]
            }
          },
          orderBy: { name: "asc" }
        }
      },
      orderBy: { name: "asc" }
    }) : Promise.resolve([]),
    prisma.subcontractor.findMany({
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
    })
  ]);

  const issuedIncome = projectCompanies.reduce((sum, company) => sum + company.financialDocuments.reduce((total, document) => total + Number(document.netAmount), 0), 0);
  const pendingIncome = projectCompanies.reduce((sum, company) => {
    if (company.financialDocuments.length) return sum;
    return sum + company.projects.flatMap((project) => project.assignments).reduce((total, item) => total + Number(item.clientPricePerService) * item.serviceCount, 0);
  }, 0);
  const issuedExpense = subcontractors.reduce((sum, subcontractor) => sum + Number(subcontractor.financialDocuments[0]?.netAmount ?? 0), 0);
  const pendingExpense = subcontractors.reduce((sum, subcontractor) => {
    if (subcontractor.financialDocuments.length) return sum;
    const assignments = subcontractor.vehicles.flatMap((vehicle) => vehicle.assignments);
    const gross = assignments.reduce((total, item) => total + Number(item.pricePerService) * item.serviceCount, 0);
    const expenses = subcontractor.expenses.reduce((total, item) => total + Number(item.amount), 0);
    return sum + gross - expenses;
  }, 0);

  return (
    <AppShell active="/transitos/finance" title="Finans" subtitle="Şirket gelirleri, taşıyıcı giderleri, kesilen faturalar ve hakediş belgeleri.">
      <PeriodFilter searchParams={params} />

      <section className="grid">
        {canManageFinance ? <Metric title="Kesilmiş Gelir" value={formatTRY(issuedIncome)} tone="green" /> : null}
        {canManageFinance ? <Metric title="Kesilmeyi Bekleyen Gelir" value={formatTRY(pendingIncome)} tone="blue" /> : null}
        <Metric title="Kesilmiş Taşıyıcı Gideri" value={formatTRY(issuedExpense)} tone="yellow" />
        <Metric title="Kesilmeyi Bekleyen Gider" value={formatTRY(pendingExpense)} tone="gray" />
        {canManageFinance ? <Metric title="Kesilmiş Net Durum" value={formatTRY(issuedIncome - issuedExpense)} tone="green" /> : null}
      </section>

      <section className="section stack">
        <AddCashDisclosure
          title="Dönem finans özeti"
          amount={formatTRY((issuedIncome + pendingIncome) - (issuedExpense + pendingExpense))}
          description="Kesilmiş ve bekleyen gelir/giderler birlikte okunur."
          tone={((issuedIncome + pendingIncome) - (issuedExpense + pendingExpense)) >= 0 ? "green" : "red"}
        >
          <span>Gelir toplamı: {formatTRY(issuedIncome + pendingIncome)}</span>
          <span>Taşıyıcı gider toplamı: {formatTRY(issuedExpense + pendingExpense)}</span>
        </AddCashDisclosure>
      </section>

      {canManageFinance ? (
        <section className="card section">
          <div className="record-head">
            <div>
              <h2 style={{ marginTop: 0 }}>Proje Şirketi Faturaları</h2>
              <p className="muted">Faturalar proje şirketine kesilir; proje adı hizmet ayrıntısı olarak gösterilir.</p>
            </div>
            <span className="badge blue">{projectCompanies.length} şirket</span>
          </div>
          <div className="stack section">
            {projectCompanies.map((company) => {
              const assignments = company.projects.flatMap((project) => project.assignments);
              const documents = company.financialDocuments;
              const draftTotal = assignments.reduce((sum, item) => sum + Number(item.clientPricePerService) * item.serviceCount, 0);
              return (
                <article className="card status-card" key={company.id}>
                  <div className="record-head">
                    <div>
                      <h3 style={{ margin: 0 }}>{company.name}</h3>
                      <p className="muted">{company.projects.length} proje · {assignments.length} tamamlanan servis</p>
                      <div className="chip-row">{company.projects.map((project) => <span className="badge gray" key={project.id}>{project.name}</span>)}</div>
                      <div className="chip-row">
                        {documents.length ? <span className="badge green">Kesildi · {formatTRY(documents.reduce((sum, document) => sum + Number(document.netAmount), 0))}</span> : <span className="badge yellow">Bekliyor · {formatTRY(draftTotal)}</span>}
                      </div>
                    </div>
                    {documents.length ? (
                      <div className="finance-document-actions">
                        {documents.map((document) => <div className="finance-document-actions" key={document.id}>
                          <PrintReportButton targetId={`project-document-${document.id}`} label="PDF / Yazdır" />
                          <ModalAction label={<PencilLine size={17} aria-hidden="true" />} ariaLabel={`${company.name} faturasını iptal et`} buttonClassName="danger icon-button" title={`${company.name} faturası iptal edilsin mi?`} tone="danger">
                            <form className="stack" action={cancelProjectInvoiceDocument}>
                              <input type="hidden" name="documentId" value={document.id} /><input type="hidden" name="_returnTo" value={`/transitos/finance?month=${period.month}&range=${period.range}`} />
                              <div className="confirm-panel danger-soft"><strong>Bu fatura iptal edilecek.</strong><p>Servis kayıtları silinmez; şirket faturası yeniden oluşturulabilir.</p></div>
                              <div className="actions"><SubmitButton>İptal et</SubmitButton></div>
                            </form>
                          </ModalAction>
                        </div>)}
                      </div>
                    ) : (
                      <ModalAction label="Toplu Fatura Oluştur" title={`${company.name} Toplu Faturası`}>
                        <form className="stack" action={issueProjectInvoiceDocument}>
                          <input type="hidden" name="projectCompanyId" value={company.id} />
                          <input type="hidden" name="_returnTo" value={`/transitos/finance?month=${period.month}&range=${period.range}`} />
                          <PeriodOptionField currentMonth={period.month} label="Kesim dönemi" hint="Fatura hangi ay için oluşturulacak?" />
                          <details className="document-preview-toggle">
                            <summary>Önizle</summary>
                            <MonthlyServiceReviewCards assignments={assignments} mode="client" monthKey={period.month} />
                          </details>
                          <label className="field-row">
                            <span><strong>Not</strong><small>Fatura iç notu.</small></span>
                            <textarea name="notes" rows={3} />
                          </label>
                          <div className="actions"><SubmitButton>✓ Faturayı Kes</SubmitButton></div>
                        </form>
                      </ModalAction>
                    )}
                  </div>
                  {documents.map((document) => <FinancialDocumentReport key={document.id} document={document} title={`${company.name} Toplu Faturası`} owner={`${company.projects.length} proje`} targetId={`project-document-${document.id}`} />)}
                </article>
              );
            })}
            {projectCompanies.length === 0 ? <p className="muted">Faturalandırılacak proje şirketi yok.</p> : null}
          </div>
        </section>
      ) : null}

      <section className="card section">
        <div className="record-head">
          <div>
            <h2 style={{ marginTop: 0 }}>Taşıyıcı Hakedişleri</h2>
            <p className="muted">Taşeronlar yalnızca burada kesilen aylık hakediş belgelerini görüntüler.</p>
          </div>
          <span className="badge yellow">{subcontractors.length} taşeron</span>
        </div>
        <div className="stack section">
          {subcontractors.map((subcontractor) => {
            const document = subcontractor.financialDocuments[0] ?? null;
            const assignments = subcontractor.vehicles.flatMap((vehicle) => vehicle.assignments);
            const gross = assignments.reduce((sum, item) => sum + Number(item.pricePerService) * item.serviceCount, 0);
            const expenses = subcontractor.expenses.reduce((sum, item) => sum + Number(item.amount), 0);
            const net = gross - expenses;
            return (
              <article className="card status-card" key={subcontractor.id}>
                <div className="record-head">
                  <div>
                    <h3 style={{ margin: 0 }}>{subcontractor.companyName}</h3>
                    <p className="muted">{assignments.length} tamamlanan servis · {subcontractor.expenses.length} gider</p>
                    <div className="chip-row">
                      {document ? <span className="badge green">Kesildi · {formatTRY(Number(document.netAmount))}</span> : <span className="badge yellow">Bekliyor · {formatTRY(net)}</span>}
                      <span className="badge gray">Brüt {formatTRY(gross)}</span>
                      <span className="badge red">Gider {formatTRY(expenses)}</span>
                    </div>
                  </div>
                  {document ? (
                    <div className="finance-document-actions">
                      <PrintReportButton targetId={`subcontractor-document-${document.id}`} label="PDF / Yazdır" />
                      {canIssueSubcontractor ? (
                        <ModalAction
                          label={<PencilLine size={17} aria-hidden="true" />}
                          ariaLabel={`${subcontractor.companyName} hakedişini iptal et ve düzenle`}
                          buttonClassName="danger icon-button"
                          title={`${subcontractor.companyName} hakedişi iptal edilsin mi?`}
                          tone="danger"
                        >
                          <form className="stack" action={cancelSubcontractorEarningDocument}>
                            <input type="hidden" name="documentId" value={document.id} />
                            <input type="hidden" name="_returnTo" value={`/transitos/finance?month=${period.month}&range=${period.range}`} />
                            <div className="confirm-panel danger-soft">
                              <strong>Bu hakediş iptal edilecek.</strong>
                              <p>Servis ve gider kayıtları silinmez. İşleri düzenledikten sonra aynı ay için yeniden hakediş oluşturabilirsiniz.</p>
                            </div>
                            <div className="actions"><SubmitButton>İptal et ve düzenlemeye aç</SubmitButton></div>
                          </form>
                        </ModalAction>
                      ) : null}
                    </div>
                  ) : canIssueSubcontractor ? (
                    <ModalAction label="Hakediş Oluştur" title={`${subcontractor.companyName} Hakedişi`}>
                      <form className="stack" action={issueSubcontractorEarningDocument}>
                        <input type="hidden" name="subcontractorId" value={subcontractor.id} />
                        <input type="hidden" name="_returnTo" value={`/transitos/finance?month=${period.month}&range=${period.range}`} />
                        <PeriodOptionField currentMonth={period.month} label="Kesim dönemi" hint="Hakediş hangi ay için oluşturulacak?" />
                        <details className="document-preview-toggle">
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
                  ) : null}
                </div>
                {document ? (
                  <FinancialDocumentReport
                    document={document}
                    title="Taşıyıcı Hakediş Belgesi"
                    owner={subcontractor.companyName}
                    targetId={`subcontractor-document-${document.id}`}
                  />
                ) : null}
              </article>
            );
          })}
          {subcontractors.length === 0 ? <p className="muted">Hakediş oluşturulacak taşeron yok.</p> : null}
        </div>
      </section>
    </AppShell>
  );
}

function PeriodOptionField({ currentMonth, label, hint }: { currentMonth: string; label: string; hint: string }) {
  return (
    <Field label={label} hint={hint}>
      <input name="monthKey" type="month" defaultValue={currentMonth} required />
    </Field>
  );
}

function Metric({ title, value, tone }: { title: string; value: string; tone: "green" | "blue" | "yellow" | "gray" }) {
  return (
    <article className="card metric">
      <span className="muted">{title}</span>
      <strong>{value}</strong>
      <small className={`badge ${tone}`}>Finans</small>
    </article>
  );
}
