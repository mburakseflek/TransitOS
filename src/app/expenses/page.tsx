import { cookies } from "next/headers";
import { AppShell, DeleteButton, Field, ModalAction, SubmitButton } from "@/app/components/AppShell";
import { ExpenseReport } from "@/app/components/FinancialDocumentView";
import { ExpenseVehiclePicker } from "@/app/components/ExpenseVehiclePicker";
import { AddCashDisclosure, FloatingInput } from "@/app/components/RegistryInterfaceKit";
import { PeriodFilter } from "@/app/components/PeriodFilter";
import { PrintReportButton } from "@/app/components/PrintReportButton";
import { createExpense, deleteExpense, updateExpense } from "@/app/actions";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { formatTRY } from "@/lib/format";
import { parsePeriod, periodDateWhere } from "@/lib/period";
import { isManager } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const categories = [
  ["ADVANCE", "Avans"],
  ["FUEL", "Yakıt"],
  ["COMPANY_PROCESSING_FEE", "Şirket işlem ücreti"],
  ["SEAT_INSURANCE", "Koltuk sigortası"],
  ["FINE", "Ceza"],
  ["TAXI_FEE", "Taksi ücreti"],
  ["OTHER", "Diğer"]
] as const;

export default async function ExpensesPage({
  searchParams
}: {
  searchParams?: Promise<{ month?: string; range?: string; subcontractor?: string }>;
}) {
  const params = await searchParams;
  const period = parsePeriod(params);
  const selectedSubcontractorId = params?.subcontractor ?? "";
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canView = isManager(user);
  const [expenses, subcontractors, vehicles] = canView ? await Promise.all([
    prisma.expense.findMany({
      where: {
        expenseDate: periodDateWhere(period),
        ...(selectedSubcontractorId ? { subcontractorId: selectedSubcontractorId } : {})
      },
      include: { subcontractor: true, vehicle: true },
      orderBy: { expenseDate: "desc" }
    }),
    prisma.subcontractor.findMany({ orderBy: { companyName: "asc" } }),
    prisma.vehicle.findMany({ orderBy: { fleetNumber: "asc" } })
  ]) : [[], [], []];
  const expenseTotal = expenses.reduce((sum, item) => sum + Number(item.amount), 0);
  return (
    <AppShell active="/transitos/expenses" title="Giderler" subtitle="Avans, yakıt, sigorta, ceza ve diğer kesintiler aylık hakedişten düşer.">
      {!canView ? <section className="card muted">Bu panel yalnız yönetici yetkisiyle görüntülenir.</section> : null}
      {canView ? (
      <>
      <PeriodFilter searchParams={params} hidden={{ subcontractor: selectedSubcontractorId }} />
      <form className="period-filter" method="get">
        <input type="hidden" name="month" value={period.month} />
        <input type="hidden" name="range" value={period.range} />
        <label>
          <span>Taşeron Filtresi</span>
          <select name="subcontractor" defaultValue={selectedSubcontractorId}>
            <option value="">Tüm taşeronlar</option>
            {subcontractors.map((subcontractor) => <option key={subcontractor.id} value={subcontractor.id}>{subcontractor.companyName}</option>)}
          </select>
        </label>
        <button className="ghost compact-button" type="submit">Filtrele</button>
      </form>
      <div className="toolbar" style={{ marginBottom: 16 }}>
        <ModalAction label="Gider Ekle" title="Gider Ekle">
          <form className="stack" action={createExpense}>
            <ExpenseFields subcontractors={subcontractors} vehicles={vehicles} />
            <div className="actions"><SubmitButton>✓ Gider Ekle</SubmitButton></div>
          </form>
        </ModalAction>
        <PrintReportButton targetId="expense-report" label="Gider PDF / Yazdır" />
      </div>

      <AddCashDisclosure
        title="Filtrelenen gider toplamı"
        amount={formatTRY(expenseTotal)}
        description={`${expenses.length} gider kaydı bu rapora dahil.`}
        tone="red"
      >
        <span>Seçili dönem: {period.label}</span>
        <span>Filtre: {selectedSubcontractorId ? "Seçili taşeron" : "Tüm taşeronlar"}</span>
      </AddCashDisclosure>

      <section className="card">
        <h2 style={{ marginTop: 0 }}>Gider Listesi</h2>
        <table className="table">
          <thead><tr><th>Tarih</th><th>Taşeron</th><th>Araç</th><th>Kategori</th><th>Tutar</th><th></th></tr></thead>
          <tbody>
            {expenses.map((expense) => (
              <tr key={expense.id}>
                <td>{expense.expenseDate.toLocaleDateString("tr-TR")}</td>
                <td>{expense.subcontractor.companyName}</td>
                <td>{expense.vehicle?.fleetNumber ?? "Genel"}</td>
                <td>{categoryTitle(expense.category)}</td>
                <td>{formatTRY(Number(expense.amount))}</td>
                <td>
                  <ModalAction label="..." title="Gider İşlemleri">
                    <div className="stack">
                      <form className="stack" action={updateExpense}>
                        <input type="hidden" name="id" value={expense.id} />
                        <ExpenseFields expense={expense} subcontractors={subcontractors} vehicles={vehicles} />
                        <div className="actions"><SubmitButton>✓ Güncelle</SubmitButton></div>
                      </form>
                      <form className="stack" action={deleteExpense}>
                        <input type="hidden" name="id" value={expense.id} />
                        <p>Bu gider kaydı hakedişten kaldırılacak.</p>
                        <div className="actions"><DeleteButton>Sil</DeleteButton></div>
                      </form>
                    </div>
                  </ModalAction>
                </td>
              </tr>
            ))}
            {expenses.length === 0 ? <tr><td colSpan={6}>Henüz gider yok.</td></tr> : null}
          </tbody>
        </table>
      </section>

      <ExpenseReport expenses={expenses} periodLabel={period.label} targetId="expense-report" />
      </>
      ) : null}
    </AppShell>
  );
}

function ExpenseFields({
  expense,
  subcontractors,
  vehicles
}: {
  expense?: any;
  subcontractors: { id: string; companyName: string }[];
  vehicles: { id: string; subcontractorId: string | null; fleetNumber: string; plateNumber: string }[];
}) {
  return (
    <>
      <ExpenseVehiclePicker subcontractors={subcontractors} vehicles={vehicles} defaultSubcontractorId={expense?.subcontractorId} defaultVehicleId={expense?.vehicleId} />
      <Field label="Kategori" hint="Gider türü.">
        <select name="category" defaultValue={expense?.category ?? "ADVANCE"}>{categories.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select>
      </Field>
      <Field label="Tarih" hint="Giderin ait olduğu ay."><input name="expenseDate" type="date" defaultValue={dateInputValue(expense?.expenseDate)} required /></Field>
      <Field label="Tutar" hint="Türk Lirası."><FloatingInput name="amount" label="₺ Gider tutarı" defaultValue={expense ? Number(expense.amount) : 0} inputMode="decimal" /></Field>
      <Field label="Açıklama" hint="Fiş, işlem veya not bilgisi."><textarea name="notes" defaultValue={expense?.notes ?? ""} rows={3} /></Field>
    </>
  );
}

function dateInputValue(date?: Date) {
  if (!date) return undefined;
  return date.toISOString().slice(0, 10);
}

function categoryTitle(value: string) {
  return categories.find(([key]) => key === value)?.[1] ?? value;
}
