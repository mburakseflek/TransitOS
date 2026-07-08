"use client";

import { useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Star } from "lucide-react";
import { submitVehicleSurvey } from "@/app/actions";
import { notifyOperationStart } from "@/app/components/GlobalOperationOverlay";

type SurveyLine = {
  id: string;
  label: string;
};

type RatingKey =
  | "courtesyRating"
  | "safetyRating"
  | "cleanlinessRating"
  | "comfortRating"
  | "punctualityRating"
  | "trustRating"
  | "satisfactionRating"
  | "recommendationRating";

const ratingQuestions: { key: RatingKey; label: string }[] = [
  { key: "courtesyRating", label: "Şoförün nezaket ve iletişimi" },
  { key: "safetyRating", label: "Şoförün sürüş güvenliği" },
  { key: "cleanlinessRating", label: "Aracın temizlik durumu" },
  { key: "comfortRating", label: "Aracın konforu" },
  { key: "punctualityRating", label: "Servisin zamanında gelmesi" },
  { key: "trustRating", label: "Yolculuk boyunca kendinizi güvende hissettiniz mi?" },
  { key: "satisfactionRating", label: "Genel memnuniyetiniz" }
];

const recommendationOptions = [
  { value: 1, label: "Kesinlikle Hayır" },
  { value: 2, label: "Hayır" },
  { value: 3, label: "Kararsızım" },
  { value: 4, label: "Evet" },
  { value: 5, label: "Kesinlikle Evet" }
];

const favoriteTopics = [
  "Dakiklik",
  "Güvenli sürüş",
  "Temizlik",
  "Konfor",
  "Şoförün ilgisi",
  "Araç kalitesi",
  "Diğer"
];

function localDateKey() {
  const now = new Date();
  return [
    now.getFullYear(),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0")
  ].join("-");
}

function formatDisplayDate(value: string) {
  return new Date(`${value}T12:00:00`).toLocaleDateString("tr-TR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  });
}

function formatPhoneInput(value: string) {
  const digits = value.replace(/\D/g, "").replace(/^90/, "").slice(0, 10);
  const parts = [
    digits.slice(0, 3),
    digits.slice(3, 6),
    digits.slice(6, 8),
    digits.slice(8, 10)
  ];
  if (!parts[0]) return "";
  return `+90 (${parts[0]}${parts[0].length === 3 ? ")" : ""}${parts[1] ? ` ${parts[1]}` : ""}${parts[2] ? ` ${parts[2]}` : ""}${parts[3] ? ` ${parts[3]}` : ""}`;
}

function sentStatusMessage(status?: string) {
  if (status === "thanks") {
    return {
      tone: "success",
      title: "Anketiniz alındı",
      text: "Değerlendirmeniz operasyon raporlarına eklendi. Teşekkür ederiz."
    };
  }
  if (status === "already") {
    return {
      tone: "info",
      title: "Bugünkü anket zaten gönderilmiş",
      text: "Aynı cihazdan bu araç için bugün yalnızca bir anket alınır."
    };
  }
  if (status === "low-score") {
    return {
      tone: "warning",
      title: "Açıklama gerekli",
      text: "Düşük puan verdiğinizde kısa bir açıklama eklemeniz gerekir."
    };
  }
  if (status === "missing") {
    return {
      tone: "warning",
      title: "Eksik bilgi var",
      text: "Lütfen zorunlu alanları ve yıldız puanlarını tamamlayın."
    };
  }
  return null;
}

export function VehicleSurveyForm({
  vehicleId,
  vehicleName,
  plateNumber,
  driverName,
  driverPhone,
  lines,
  sent
}: {
  vehicleId: string;
  vehicleName: string;
  plateNumber: string;
  driverName?: string | null;
  driverPhone?: string | null;
  lines: SurveyLine[];
  sent?: string;
}) {
  const [deviceKey, setDeviceKey] = useState("");
  const [journeyDate] = useState(localDateKey);
  const [selectedLineId, setSelectedLineId] = useState(lines[0]?.id ?? "");
  const [ratings, setRatings] = useState<Partial<Record<RatingKey, number>>>({});
  const [phone, setPhone] = useState("");
  const [lowScoreExplanation, setLowScoreExplanation] = useState("");
  const [clientError, setClientError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const status = sentStatusMessage(sent);

  useEffect(() => {
    try {
      const storageKey = "transitos-survey-device-key";
      const existing = window.localStorage.getItem(storageKey);
      const next = existing || window.crypto.randomUUID();
      window.localStorage.setItem(storageKey, next);
      setDeviceKey(next);
    } catch {
      setDeviceKey(`session-${Date.now()}-${Math.random().toString(36).slice(2)}`);
    }
  }, []);

  const ratingValues = useMemo(() => Object.values(ratings).filter((value): value is number => typeof value === "number"), [ratings]);
  const hasLowScore = ratingValues.some((value) => value <= 2);
  const averageRating = ratingValues.length
    ? ratingValues.reduce((sum, value) => sum + value, 0) / ratingValues.length
    : 0;
  const selectedLine = lines.find((line) => line.id === selectedLineId);
  const formComplete = Boolean(deviceKey && selectedLineId && Object.keys(ratings).length === 8);
  const successLocked = sent === "thanks" || sent === "already";

  function setRating(key: RatingKey, value: number) {
    setRatings((current) => ({ ...current, [key]: value }));
    setClientError("");
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (submitting) {
      event.preventDefault();
      return;
    }
    const missingQuestion = [...ratingQuestions, { key: "recommendationRating" as RatingKey, label: "Şeflek Tur'u tavsiye eder misiniz?" }]
      .find((question) => !ratings[question.key]);

    if (!deviceKey || !selectedLineId || missingQuestion) {
      event.preventDefault();
      setClientError(missingQuestion ? `${missingQuestion.label} puanını seçin.` : "Lütfen servis hattını seçin.");
      return;
    }

    if (hasLowScore && lowScoreExplanation.trim().length < 8) {
      event.preventDefault();
      setClientError("Düşük puan için en az birkaç kelimelik açıklama yazın.");
      return;
    }

    if (!event.currentTarget.reportValidity()) {
      event.preventDefault();
      return;
    }

    setSubmitting(true);
    notifyOperationStart("Anket kaydediliyor");
  }

  return (
    <section className="survey-form-card">
      {status ? (
        <div className={`survey-status survey-status-${status.tone}`}>
          {status.tone === "success" ? <CheckCircle2 size={22} /> : <AlertCircle size={22} />}
          <div>
            <strong>{status.title}</strong>
            <span>{status.text}</span>
          </div>
        </div>
      ) : null}

      {successLocked ? null : (
        <form className="survey-form" action={submitVehicleSurvey} onSubmit={handleSubmit}>
          <input type="hidden" name="vehicleId" value={vehicleId} />
          <input type="hidden" name="journeyDate" value={journeyDate} />
          <input type="hidden" name="deviceKey" value={deviceKey} />
          <input type="hidden" name="serviceLineLabel" value={selectedLine?.label ?? ""} />
          {Object.entries(ratings).map(([key, value]) => (
            <input key={key} type="hidden" name={key} value={value} />
          ))}

          <div className="survey-section">
            <span className="survey-kicker">Kişisel Bilgiler</span>
            <label>
              <strong>Ad Soyad</strong>
              <input name="passengerName" autoComplete="name" required placeholder="Adınız ve soyadınız" />
            </label>
            <label>
              <strong>Telefon Numarası</strong>
              <input
                name="passengerPhone"
                type="tel"
                inputMode="tel"
                autoComplete="tel"
                value={phone}
                onChange={(event) => setPhone(formatPhoneInput(event.target.value))}
                required
                placeholder="+90 (5xx) xxx xx xx"
              />
            </label>
            <label>
              <strong>E-posta Adresi</strong>
              <input name="passengerEmail" type="email" autoComplete="email" placeholder="İsteğe bağlı" />
            </label>
          </div>

          <div className="survey-section survey-info-grid">
            <span className="survey-kicker">Araç Bilgileri</span>
            <label className="survey-full">
              <strong>Kullandığınız Servis Hattı</strong>
              <select name="routeId" value={selectedLineId} onChange={(event) => setSelectedLineId(event.target.value)} required>
                {lines.length ? null : <option value="">Bu araca bağlı servis hattı bulunamadı</option>}
                {lines.map((line) => <option key={line.id} value={line.id}>{line.label}</option>)}
              </select>
            </label>
            <div className="survey-readonly">
              <span>Yolculuk Tarihi</span>
              <strong>{formatDisplayDate(journeyDate)}</strong>
            </div>
            <div className="survey-readonly">
              <span>Yolculuk Yaptığınız Araç</span>
              <strong>{vehicleName} · {plateNumber}</strong>
            </div>
            <div className="survey-readonly survey-full">
              <span>Şoför</span>
              <strong>{driverName || "Tanımlı şoför yok"}</strong>
              {driverPhone ? <small>{driverPhone}</small> : null}
            </div>
          </div>

          <div className="survey-section">
            <div className="survey-section-head">
              <span className="survey-kicker">Hizmet Değerlendirmesi</span>
              <strong>{averageRating ? `${averageRating.toFixed(1)} / 5` : "Puan bekleniyor"}</strong>
            </div>
            {ratingQuestions.map((question) => (
              <StarRating
                key={question.key}
                label={question.label}
                value={ratings[question.key] ?? 0}
                onChange={(value) => setRating(question.key, value)}
              />
            ))}
            <div className="survey-rating-row survey-recommend-row">
              <strong>Şeflek Tur'u tavsiye eder misiniz?</strong>
              <div className="survey-recommend-options">
                {recommendationOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    className={ratings.recommendationRating === option.value ? "selected" : ""}
                    onClick={() => setRating("recommendationRating", option.value)}
                    aria-pressed={ratings.recommendationRating === option.value}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="survey-section">
            <span className="survey-kicker">Öne Çıkan Konu</span>
            <div className="survey-checkbox-grid">
              {favoriteTopics.map((topic) => (
                <label key={topic} className="survey-checkbox">
                  <input type="checkbox" name="favoriteTopics" value={topic} />
                  <span>{topic}</span>
                </label>
              ))}
            </div>
            <label>
              <strong>Öneri ve Şikâyetleriniz</strong>
              <textarea name="comments" rows={4} placeholder="İsteğe bağlı notunuzu yazabilirsiniz." />
            </label>
            {hasLowScore ? (
              <label className="survey-low-score">
                <strong>Düşük puan açıklaması</strong>
                <textarea
                  name="lowScoreExplanation"
                  rows={4}
                  value={lowScoreExplanation}
                  onChange={(event) => setLowScoreExplanation(event.target.value)}
                  required
                  placeholder="Düşük puanınızın nedenini kısaca paylaşın."
                />
              </label>
            ) : (
              <input type="hidden" name="lowScoreExplanation" value="" />
            )}
          </div>

          {clientError ? <div className="survey-client-error" role="alert">{clientError}</div> : null}
          <button className="survey-submit" type="submit" disabled={!formComplete || submitting || !lines.length}>
            {submitting ? "Gönderiliyor..." : "Anketi Gönder"}
          </button>
        </form>
      )}
    </section>
  );
}

function StarRating({
  label,
  value,
  onChange
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="survey-rating-row">
      <strong>{label}</strong>
      <div className="survey-stars" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((score) => (
          <button
            key={score}
            type="button"
            className={score <= value ? "selected" : ""}
            onClick={() => onChange(score)}
            aria-label={`${score} yıldız`}
            aria-pressed={score === value}
          >
            <Star size={24} fill="currentColor" />
          </button>
        ))}
      </div>
    </div>
  );
}
