import { cookies } from "next/headers";
import { AppShell } from "@/app/components/AppShell";
import { PrintButton } from "@/app/components/PrintButton";
import { readSessionToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { canEditOperations } from "@/lib/permissions";

export const dynamic = "force-dynamic";

const surveyQuestions = [
  ["courtesyRating", "Şoförün nezaket ve iletişimi"],
  ["safetyRating", "Şoförün sürüş güvenliği"],
  ["cleanlinessRating", "Aracın temizlik durumu"],
  ["comfortRating", "Aracın konforu"],
  ["punctualityRating", "Servisin zamanında gelmesi"],
  ["trustRating", "Yolculuk boyunca kendinizi güvende hissettiniz mi?"],
  ["satisfactionRating", "Genel memnuniyetiniz"],
  ["recommendationRating", "Şeflek Tur'u tavsiye eder misiniz?"]
] as const;

export default async function SurveysPage() {
  const sessionCookie = (await cookies()).get("transitos_session")?.value;
  const user = sessionCookie ? await readSessionToken(sessionCookie).catch(() => null) : null;
  const canView = canEditOperations(user);

  const responses = canView
    ? await prisma.vehicleSurveyResponse.findMany({
        orderBy: [{ createdAt: "desc" }],
        take: 160
      })
    : [];

  const average = responses.length
    ? responses.reduce((sum, item) => sum + Number(item.averageRating), 0) / responses.length
    : 0;
  const lowScoreCount = responses.filter((item) => Number(item.averageRating) < 3).length;

  return (
    <AppShell active="/transitos/surveys" title="Anketler" subtitle="Araç QR anketleri ve hizmet memnuniyeti raporları.">
      {!canView ? (
        <section className="card muted">
          Bu panel yalnızca yönetici ve servis sorumlusu profilleri için açıktır.
        </section>
      ) : (
        <div className="survey-admin-stack">
          <section className="survey-admin-metrics">
            <article className="summary-card">
              <span>Toplam anket</span>
              <strong>{responses.length}</strong>
            </article>
            <article className="summary-card">
              <span>Genel ortalama</span>
              <strong>{average ? `${average.toFixed(1)} / 5` : "-"}</strong>
            </article>
            <article className="summary-card">
              <span>Dikkat isteyen</span>
              <strong>{lowScoreCount}</strong>
            </article>
          </section>

          <section className="survey-report-list">
            {responses.map((response) => {
              const score = Number(response.averageRating);
              const topics = normalizeTopics(response.favoriteTopics);
              return (
                <details className={`survey-report-card ${scoreClass(score)}`} key={response.id}>
                  <summary>
                    <div className="survey-report-summary">
                      <div>
                        <span className="survey-kicker">Anket özeti</span>
                        <h2>{response.vehicleFleetNumber} · {response.vehiclePlateNumber}</h2>
                        <p>{response.driverName ?? "Şoför tanımlı değil"} · {response.serviceLineLabel}</p>
                      </div>
                      <div className="survey-score-pill">
                        <strong>{score.toFixed(1)}</strong>
                        <span>/ 5</span>
                      </div>
                    </div>
                    <div className="survey-report-meta">
                      <span>{response.journeyDate.toLocaleDateString("tr-TR")}</span>
                      <span>{response.createdAt.toLocaleString("tr-TR", { dateStyle: "medium", timeStyle: "short" })}</span>
                      <span>{response.passengerName}</span>
                    </div>
                  </summary>

                  <div className="survey-report-sheet">
                    <div className="survey-sheet-head">
                      <div>
                        <img src="/brand/seflek-logo-navy.png" alt="Şeflek Tur" />
                        <strong>Yolcu Memnuniyet Anketi</strong>
                        <span>TransitOS tarafından hazırlanmıştır</span>
                      </div>
                      <PrintButton label="PDF / Yazdır" />
                    </div>

                    <div className="survey-answer-grid">
                      <InfoBlock label="Yolcu" value={response.passengerName} detail={response.passengerPhone} />
                      <InfoBlock label="E-posta" value={response.passengerEmail ?? "-"} />
                      <InfoBlock label="Araç" value={`${response.vehicleFleetNumber} · ${response.vehiclePlateNumber}`} />
                      <InfoBlock label="Şoför" value={response.driverName ?? "-"} detail={response.driverPhone ?? undefined} />
                      <InfoBlock label="Servis hattı" value={response.serviceLineLabel} wide />
                      <InfoBlock label="Yolculuk tarihi" value={response.journeyDate.toLocaleDateString("tr-TR")} />
                    </div>

                    <div className="survey-question-table">
                      {surveyQuestions.map(([key, label]) => (
                        <div key={key} className="survey-question-line">
                          <span>{label}</span>
                          <strong>{response[key]} / 5</strong>
                        </div>
                      ))}
                    </div>

                    <div className="survey-answer-grid">
                      <InfoBlock label="Öne çıkan konu" value={topics.length ? topics.join(", ") : "-"} wide />
                      <InfoBlock label="Öneri ve şikayet" value={response.comments ?? "-"} wide />
                      {response.lowScoreExplanation ? (
                        <InfoBlock label="Düşük puan açıklaması" value={response.lowScoreExplanation} wide />
                      ) : null}
                    </div>
                  </div>
                </details>
              );
            })}
            {responses.length === 0 ? (
              <section className="card muted">Henüz araç anketi gönderilmemiş.</section>
            ) : null}
          </section>
        </div>
      )}
    </AppShell>
  );
}

function scoreClass(score: number) {
  if (score < 3) return "score-bad";
  if (score < 4.2) return "score-mid";
  return "score-good";
}

function normalizeTopics(value: unknown) {
  return Array.isArray(value) ? value.map(String).filter(Boolean) : [];
}

function InfoBlock({
  label,
  value,
  detail,
  wide = false
}: {
  label: string;
  value: string;
  detail?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "survey-info-block wide" : "survey-info-block"}>
      <span>{label}</span>
      <strong>{value}</strong>
      {detail ? <small>{detail}</small> : null}
    </div>
  );
}
