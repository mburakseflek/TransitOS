import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

const definitions = {
  projects: async () => (await prisma.project.findMany({ include: { projectCompany: true }, orderBy: { name: "asc" } })).map((x) => ({
    Proje: x.name, "Proje şirketi": x.projectCompany?.name ?? x.clientCompany, Personel: x.personnelCount, Durum: x.status
  })),
  vehicles: async () => (await prisma.vehicle.findMany({ include: { subcontractor: true }, orderBy: { plateNumber: "asc" } })).map((x) => ({
    Plaka: x.plateNumber, "Filo no": x.fleetNumber, Marka: x.make ?? "", Model: x.model ?? "", Sahip: x.subcontractor?.companyName ?? "Şeflek Tur", "Filo takibi": x.fleetTrackingEnabled ? "Evet" : "Hayır", Durum: x.status
  })),
  subcontractors: async () => (await prisma.subcontractor.findMany({ orderBy: { companyName: "asc" } })).map((x) => ({
    Şirket: x.companyName, Yetkili: x.authorizedPerson, Telefon: x.phone, Eposta: x.email ?? "", "Vergi no": x.taxNumber ?? "", IBAN: x.iban ?? "", Durum: x.status
  })),
  expenses: async () => (await prisma.expense.findMany({ include: { subcontractor: true, vehicle: true }, orderBy: { expenseDate: "desc" } })).map((x) => ({
    Tarih: isoDate(x.expenseDate), Taşeron: x.subcontractor.companyName, Araç: x.vehicle?.plateNumber ?? "", Kategori: x.category, Tutar: Number(x.amount), Not: x.notes ?? ""
  })),
  maintenance: async () => (await prisma.vehicleMaintenance.findMany({ include: { vehicle: true }, orderBy: { serviceDate: "desc" } })).map((x) => ({
    Tarih: isoDate(x.serviceDate), Araç: x.vehicle.plateNumber, Servis: x.serviceProvider, Kilometre: x.odometerKm, İşlemler: x.workPerformed, Parçalar: x.replacedParts ?? "", Tutar: Number(x.amount), Not: x.notes ?? ""
  })),
  documents: async () => (await prisma.financialDocument.findMany({ include: { subcontractor: true, projectCompany: true }, orderBy: { issuedAt: "desc" } })).map((x) => ({
    Dönem: x.monthKey, Tür: x.type, Muhatap: x.projectCompany?.name ?? x.subcontractor?.companyName ?? "", Brüt: Number(x.grossAmount), Gider: Number(x.expenseAmount), Net: Number(x.netAmount), Tarih: isoDate(x.issuedAt)
  }))
} satisfies Record<string, () => Promise<Record<string, unknown>[]>>;

export async function GET(request: NextRequest) {
  const token = (await cookies()).get("transitos_session")?.value;
  const user = token ? await readSessionToken(token).catch(() => null) : null;
  if (user?.role !== "MANAGER") return NextResponse.json({ error: "Yetkisiz işlem" }, { status: 403 });

  const dataset = request.nextUrl.searchParams.get("dataset") ?? "projects";
  const load = definitions[dataset as keyof typeof definitions];
  if (!load) return NextResponse.json({ error: "Geçersiz dışa aktarma seçimi" }, { status: 400 });
  const rows = await load();
  const csv = toCsv(rows);
  return new NextResponse(`\uFEFF${csv}`, {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": `attachment; filename="transitos-${dataset}-${isoDate(new Date())}.csv"`,
      "cache-control": "no-store"
    }
  });
}

function isoDate(value: Date) { return value.toISOString().slice(0, 10); }
function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "Kayıt bulunamadı";
  const headers = Object.keys(rows[0]);
  const cell = (value: unknown) => `"${String(value ?? "").replaceAll('"', '""')}"`;
  return [headers.map(cell).join(";"), ...rows.map((row) => headers.map((key) => cell(row[key])).join(";"))].join("\n");
}
