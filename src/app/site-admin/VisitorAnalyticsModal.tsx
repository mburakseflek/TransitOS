"use client";

import { useEffect, useMemo, useRef } from "react";
import { BarChart3, X } from "lucide-react";
import type { VisitorAnalytics } from "@/lib/site-analytics";

const numberFormatter = new Intl.NumberFormat("tr-TR");

export function VisitorAnalyticsModal({ analytics }: { analytics: VisitorAnalytics }) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    const handleClose = () => document.documentElement.classList.remove("analytics-modal-open");
    dialog.addEventListener("close", handleClose);
    return () => {
      dialog.removeEventListener("close", handleClose);
      document.documentElement.classList.remove("analytics-modal-open");
    };
  }, []);

  function openDialog() {
    document.documentElement.classList.add("analytics-modal-open");
    dialogRef.current?.showModal();
    window.setTimeout(() => closeButtonRef.current?.focus(), 0);
  }

  function closeDialog() {
    dialogRef.current?.close();
  }

  return (
    <>
      <button className="ghost analytics-open-button" type="button" onClick={openDialog}>
        <BarChart3 aria-hidden="true" size={17} /> Ziyaretçi grafiği
      </button>
      <dialog
        className="visitor-analytics-dialog"
        ref={dialogRef}
        aria-labelledby="visitor-analytics-title"
        aria-describedby="visitor-analytics-description"
        onClick={(event) => {
          if (event.target === event.currentTarget) closeDialog();
        }}
      >
        <section className="visitor-analytics-window">
          <header className="visitor-analytics-head">
            <div>
              <span className="analytics-kicker"><BarChart3 aria-hidden="true" size={16} /> Site ölçümü</span>
              <h2 id="visitor-analytics-title">Günlük ziyaretçiler</h2>
              <p id="visitor-analytics-description">Son 30 günün anonim ziyaretçi toplamları. IP veya cihaz bilgisi saklanmaz.</p>
            </div>
            <button ref={closeButtonRef} className="analytics-close-button" type="button" onClick={closeDialog} aria-label="Ziyaretçi penceresini kapat">
              <X aria-hidden="true" size={21} />
            </button>
          </header>

          <div className="analytics-summary" aria-label="Ziyaretçi özeti">
            <Metric label="Bugün" value={analytics.today} />
            <Metric label="Son 7 gün" value={analytics.last7Days} />
            <Metric label="Son 30 gün" value={analytics.last30Days} />
            <Metric label="En yoğun gün" value={analytics.peak} />
          </div>

          <VisitorLineChart analytics={analytics} />

          <details className="analytics-table-details">
            <summary>Günlük verileri tablo olarak göster</summary>
            <div className="analytics-table-scroll">
              <table>
                <thead><tr><th scope="col">Tarih</th><th scope="col">Ziyaretçi</th></tr></thead>
                <tbody>
                  {[...analytics.points].reverse().map((point) => (
                    <tr key={point.date}><th scope="row">{point.label}</th><td>{numberFormatter.format(point.visitors)}</td></tr>
                  ))}
                </tbody>
              </table>
            </div>
          </details>
        </section>
      </dialog>
    </>
  );
}

function Metric({ label, value }: { label: string; value: number }) {
  return <div><span>{label}</span><strong>{numberFormatter.format(value)}</strong></div>;
}

function VisitorLineChart({ analytics }: { analytics: VisitorAnalytics }) {
  const chart = useMemo(() => {
    const width = 760;
    const height = 260;
    const padding = { top: 22, right: 18, bottom: 38, left: 46 };
    const maxValue = Math.max(analytics.peak, 1);
    const drawableWidth = width - padding.left - padding.right;
    const drawableHeight = height - padding.top - padding.bottom;
    const coordinates = analytics.points.map((point, index) => ({
      ...point,
      x: padding.left + (index / Math.max(analytics.points.length - 1, 1)) * drawableWidth,
      y: padding.top + drawableHeight - (point.visitors / maxValue) * drawableHeight
    }));
    const line = coordinates.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");
    const area = `${line} L ${coordinates.at(-1)?.x ?? padding.left} ${padding.top + drawableHeight} L ${padding.left} ${padding.top + drawableHeight} Z`;
    return { width, height, padding, maxValue, drawableHeight, coordinates, line, area };
  }, [analytics]);

  const hasVisits = analytics.last30Days > 0;

  return (
    <div className="visitor-chart-card">
      <div className="visitor-chart-heading">
        <div><strong>30 günlük eğilim</strong><span>Tekil günlük tarayıcı ziyaretleri</span></div>
        <span className="chart-legend"><i /> Ziyaretçi</span>
      </div>
      {!hasVisits ? <p className="analytics-empty">Henüz ölçülen ziyaret yok. İlk ziyaretler geldikçe grafik otomatik oluşacak.</p> : null}
      <div className="visitor-chart-scroll">
        <svg viewBox={`0 0 ${chart.width} ${chart.height}`} role="img" aria-label={`Son 30 günde toplam ${numberFormatter.format(analytics.last30Days)} anonim ziyaretçi`}>
          <defs>
            <linearGradient id="visitor-chart-fill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1684b8" stopOpacity="0.32" />
              <stop offset="100%" stopColor="#1684b8" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          {[0, 0.5, 1].map((ratio) => {
            const y = chart.padding.top + chart.drawableHeight * ratio;
            const value = Math.round(chart.maxValue * (1 - ratio));
            return <g key={ratio}><line className="chart-grid-line" x1={chart.padding.left} x2={chart.width - chart.padding.right} y1={y} y2={y} /><text className="chart-axis-label" x={chart.padding.left - 10} y={y + 4} textAnchor="end">{value}</text></g>;
          })}
          <path className="chart-area" d={chart.area} />
          <path className="chart-line" d={chart.line} />
          {chart.coordinates.map((point, index) => (
            <g key={point.date}>
              <circle className="chart-point" cx={point.x} cy={point.y} r="4"><title>{`${point.label}: ${numberFormatter.format(point.visitors)} ziyaretçi`}</title></circle>
              {(index === 0 || index === chart.coordinates.length - 1 || index % 7 === 0) ? <text className="chart-axis-label" x={point.x} y={chart.height - 10} textAnchor={index === 0 ? "start" : index === chart.coordinates.length - 1 ? "end" : "middle"}>{point.label}</text> : null}
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
}
