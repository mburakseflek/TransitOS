import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { Activity, CalendarDays, LogIn, PencilLine, Plus, ShieldCheck, Trash2 } from "lucide-react";
import { AppShell } from "@/app/components/AppShell";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditOperations, roleTitle } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const ranges = {
  "7d": { label: "Son 1 hafta", days: 7 },
  "1m": { label: "Son 1 ay", days: 31 },
  "3m": { label: "Son 3 ay", days: 93 },
  "1y": { label: "Son 1 yıl", days: 366 }
} as const;

type RangeKey = keyof typeof ranges;

export default async function HistoryPage({ searchParams }: { searchParams?: Promise<{ range?: string; actor?: string; type?: string }> }) {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  if (!user || !canEditOperations(user)) redirect("/transitos/dashboard");

  const params = await searchParams;
  const range = (params?.range && params.range in ranges ? params.range : "7d") as RangeKey;
  const from = new Date();
  from.setDate(from.getDate() - ranges[range].days);
  from.setHours(0, 0, 0, 0);

  const logs = await prisma.auditLog.findMany({
    where: {
      createdAt: { gte: from },
      ...(params?.actor ? { actorUserId: params.actor } : {}),
      ...(params?.type ? { entityType: params.type } : {})
    },
    orderBy: { createdAt: "desc" },
    take: 1000
  });
  const [actors, entityTypes] = await Promise.all([
    prisma.auditLog.findMany({ where: { actorUserId: { not: null } }, distinct: ["actorUserId"], select: { actorUserId: true, actorName: true }, orderBy: { actorName: "asc" } }),
    prisma.auditLog.findMany({ distinct: ["entityType"], select: { entityType: true }, orderBy: { entityType: "asc" } })
  ]);

  return (
    <AppShell active="/transitos/history" title="Sistem Geçmişi" subtitle="TransitOS içinde kim, ne zaman, hangi işlemi yaptı?">
      <section className="history-overview">
        <div><Activity size={22} /><span><strong>{logs.length}</strong><small>{ranges[range].label} içinde kayıt</small></span></div>
        <div><ShieldCheck size={22} /><span><strong>İzlenebilir</strong><small>İşlem ve giriş kronolojisi</small></span></div>
        <div><CalendarDays size={22} /><span><strong>1 yıl</strong><small>Hızlı arşiv görünümü</small></span></div>
      </section>

      <form className="history-filters" method="get">
        <label><span>Dönem</span><select name="range" defaultValue={range}>{Object.entries(ranges).map(([key, item]) => <option value={key} key={key}>{item.label}</option>)}</select></label>
        <label><span>Kullanıcı</span><select name="actor" defaultValue={params?.actor ?? ""}><option value="">Tüm kullanıcılar</option>{actors.map((actor) => <option value={actor.actorUserId ?? ""} key={actor.actorUserId}>{actor.actorName}</option>)}</select></label>
        <label><span>Kayıt türü</span><select name="type" defaultValue={params?.type ?? ""}><option value="">Tüm işlemler</option>{entityTypes.map(({ entityType }) => <option value={entityType} key={entityType}>{entityTypeLabel(entityType)}</option>)}</select></label>
        <button className="primary" type="submit">Listeyi getir</button>
      </form>

      <section className="history-panel">
        <header><div><h2>Kronoloji</h2><p>En yeni işlem en üstte gösterilir.</p></div><span>{ranges[range].label}</span></header>
        <div className="history-list">
          {logs.map((log) => {
            const Icon = actionIcon(log.action);
            return <article className="history-row" key={log.id}>
              <span className={`history-icon action-${log.action.toLowerCase()}`}><Icon size={18} /></span>
              <div className="history-copy"><strong>{log.summary}</strong><span>{entityTypeLabel(log.entityType)} · {actionLabel(log.action)}</span></div>
              <div className="history-actor"><strong>{log.actorName}</strong><span>{roleTitle(log.actorRole as any)}</span></div>
              <time dateTime={log.createdAt.toISOString()}>{formatDate(log.createdAt)}</time>
            </article>;
          })}
          {logs.length === 0 ? <div className="history-empty"><Activity size={28} /><h3>Bu dönemde kayıt yok</h3><p>Seçili filtrelerde eşleşen bir sistem işlemi bulunamadı.</p></div> : null}
        </div>
      </section>
    </AppShell>
  );
}

function actionIcon(action: string) {
  if (action === "CREATE") return Plus;
  if (action === "UPDATE" || action === "TRANSFER") return PencilLine;
  if (action === "DELETE" || action === "CANCEL") return Trash2;
  if (action === "LOGIN" || action === "LOGOUT") return LogIn;
  return Activity;
}

function actionLabel(action: string) {
  return ({ CREATE: "Eklendi", UPDATE: "Güncellendi", DELETE: "Silindi", ISSUE: "Oluşturuldu", CANCEL: "İptal edildi", TRANSFER: "Aktarıldı", LOGIN: "Giriş yaptı", LOGOUT: "Çıkış yaptı" } as Record<string, string>)[action] ?? action;
}

function entityTypeLabel(type: string) {
  return ({ AUTH: "Oturum", VEHICLE: "Araç", MAINTENANCE: "Bakım", PROJECT: "Proje", PROJECT_COMPANY: "Proje şirketi", USER: "Kullanıcı", SUBCONTRACTOR: "Taşeron", ROUTE: "Güzergâh", ASSIGNMENT: "Servis", ONE_OFF_JOB: "Tek seferlik iş", EXPENSE: "Gider", DRIVER_DOCUMENT: "Sürücü belgesi", SURVEY: "Anket", ROUTE_STOP: "Durak", SUBCONTRACTOR_EARNING: "Hakediş", PROJECT_INVOICE: "Fatura" } as Record<string, string>)[type] ?? type;
}

function formatDate(value: Date) {
  return new Intl.DateTimeFormat("tr-TR", { dateStyle: "medium", timeStyle: "short", timeZone: "Europe/Istanbul" }).format(value);
}
