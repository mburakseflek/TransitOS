"use client";

export function PrintReportButton({
  targetId,
  label = "PDF / Yazdır"
}: {
  targetId: string;
  label?: string;
}) {
  function printReport() {
    const target = document.getElementById(targetId);
    if (!target) return;

    const printWindow = window.open("", "_blank", "width=900,height=1100");
    if (!printWindow) {
      window.print();
      return;
    }

    printWindow.document.write(`
      <!doctype html>
      <html>
        <head>
          <title>SeflekTur TransitOS Rapor</title>
          <style>
            @page { size: A4; margin: 10mm; }
            * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            body {
              margin: 0;
              color: #111827;
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
              background: #ffffff;
            }
            .print-document {
              width: 100%;
              min-height: 100vh;
              background: #fff;
            }
            .invoice-paper,
            .transitos-report {
              width: 100%;
              max-width: none;
              margin: 0;
              padding: 0 !important;
              color: #111827 !important;
              background: #ffffff !important;
              border: 0 !important;
              border-radius: 0;
              box-shadow: none;
              overflow: visible;
            }
            .report-page {
              position: relative;
              padding: 0;
              min-height: auto;
              background: #ffffff;
            }
            .report-top,
            .report-brand {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto;
              gap: 16px;
              align-items: start;
              border-bottom: 4px solid #1392d3;
              padding-bottom: 12px;
              margin-bottom: 18px;
            }
            .report-top h1,
            .report-brand h1,
            h1 {
              margin: 0;
              color: #111827;
              font-size: 24px;
              line-height: 1.08;
              letter-spacing: 0;
            }
            .report-top h1 span { color: #d71920; font-weight: 950; }
            .report-top p,
            .report-brand p {
              margin: 5px 0 0;
              color: #374151;
              font-size: 12px;
              font-weight: 850;
            }
            .report-top small {
              display: block;
              color: #6b7280;
              font-size: 9px;
              font-weight: 750;
            }
            .report-top aside {
              display: grid;
              gap: 5px;
              justify-items: end;
              text-align: right;
            }
            .report-top img,
            .report-brand img {
              width: 132px;
              height: auto;
              padding: 8px;
              border-radius: 8px;
              background: #111827;
            }
            .report-owner {
              margin: 20px 0 10px;
              color: #111827;
              font-size: 20px;
              line-height: 1.15;
            }
            h2 { margin: 18px 0 9px; color: #111827; font-size: 14px; }
            p { margin: 3px 0; }
            .muted { color: #6b7280; }
            .report-metrics,
            .summary-grid {
              display: grid;
              grid-template-columns: repeat(4, minmax(0, 1fr));
              gap: 10px;
              margin: 14px 0 22px;
            }
            .report-metric,
            .summary-card {
              min-height: 58px;
              border: 1px solid #e5e7eb;
              border-radius: 10px;
              padding: 10px 11px;
              background: #f8fafc;
            }
            .report-metric span,
            .summary-card span {
              display: block;
              color: #6b7280;
              font-size: 8.5px;
              font-weight: 900;
              letter-spacing: .06em;
              text-transform: uppercase;
            }
            .report-metric strong,
            .summary-card strong {
              display: block;
              margin-top: 6px;
              color: #111827;
              font-size: 15px;
              line-height: 1.1;
            }
            .report-metric.blue { border-color: #bfdbfe; background: #eff6ff; }
            .report-metric.orange { border-color: #fed7aa; background: #fff7ed; }
            .report-metric.green { border-color: #bbf7d0; background: #f0fdf4; }
            .route-report-map {
              width: 100%;
              min-height: 300px;
              margin: 12px 0;
              overflow: hidden;
              border: 1px solid #d1d5db;
              border-radius: 12px;
              background: #eef2f7;
            }
            .route-report-map img {
              display: block;
              width: 100%;
              min-height: 300px;
              object-fit: cover;
            }
            .report-group {
              margin: 11px 0 15px;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .report-group-head {
              display: grid;
              grid-template-columns: minmax(0, 1fr) auto auto;
              gap: 12px;
              align-items: center;
              border-radius: 9px;
              padding: 10px 12px;
              background: #edf7ff;
              color: #0f172a;
              font-size: 11px;
            }
            .report-group-head strong {
              overflow: hidden;
              font-size: 12px;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .report-group-head span {
              color: #1f6aa5;
              font-weight: 850;
            }
            .report-group-head b {
              color: #111827;
              font-size: 12px;
            }
            .report-service-row {
              padding: 9px 5px 10px;
              border-bottom: 1px solid #eef2f7;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .report-service-grid {
              display: grid;
              grid-template-columns: minmax(0, 1fr) 48px 84px 90px;
              gap: 8px;
              align-items: center;
              color: #111827;
              font-size: 9.5px;
              font-weight: 850;
            }
            .report-service-grid strong {
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }
            .report-service-grid span { text-align: right; }
            .day-ticks {
              display: grid;
              grid-template-columns: repeat(31, minmax(0, 1fr));
              gap: 2px;
              margin-top: 7px;
            }
            .day-box {
              display: grid;
              place-items: center;
              min-width: 0;
              height: 24px;
              border: 1px solid #dbe2ea;
              border-radius: 4px;
              background: #fbfdff;
            }
            .day-box b {
              min-height: 9px;
              color: transparent;
              font-size: 8px;
              line-height: 1;
            }
            .day-box small {
              color: #64748b;
              font-size: 6px;
              line-height: 1;
            }
            .day-box.done b { color: #16a34a; }
            .day-box.overtime b { color: #dc2626; }
            .day-box.night b { color: #7c3aed; }
            .day-box.oneoff b { color: #94a3b8; }
            .day-box.disabled { opacity: .28; }
            .expense-card-list {
              display: grid;
              gap: 8px;
            }
            .service-legend {
              display: grid;
              grid-template-columns: repeat(4, 1fr);
              gap: 6px;
              margin: 5px 0 10px;
              padding: 8px 10px;
              border: 1px solid #e5eaf0;
              border-radius: 9px;
              background: #f8fafc;
              color: #334155;
              font-size: 8.5px;
              font-weight: 850;
            }
            .legend-dot {
              display: inline-grid;
              place-items: center;
              width: 14px;
              height: 14px;
              margin-right: 4px;
              border-radius: 999px;
              background: #fff;
            }
            .legend-dot.done { color: #16a34a; }
            .legend-dot.overtime { color: #dc2626; }
            .legend-dot.night { color: #7c3aed; }
            .legend-dot.oneoff { color: #64748b; }
            .one-off-line-list {
              display: grid;
              gap: 5px;
              margin-top: 7px;
            }
            .one-off-line-list span {
              padding: 7px 8px;
              border: 1px solid #e5eaf0;
              border-radius: 8px;
              background: #f8fafc;
              color: #475569;
              font-size: 8.5px;
              font-weight: 850;
            }
            .expense-card {
              display: grid;
              grid-template-columns: 1.15fr .7fr minmax(0, 1fr) auto;
              gap: 10px;
              align-items: center;
              border: 1px solid #edeff3;
              border-radius: 10px;
              padding: 10px 12px;
              background: #f8fafc;
              break-inside: avoid;
              page-break-inside: avoid;
            }
            .expense-card strong,
            .expense-card span,
            .expense-card time {
              display: block;
              min-width: 0;
              overflow-wrap: anywhere;
            }
            .expense-card strong { font-size: 10px; }
            .expense-card time,
            .expense-card span {
              color: #64748b;
              font-size: 9px;
              font-weight: 750;
            }
            .expense-card b {
              color: #ea580c;
              font-size: 12px;
              white-space: nowrap;
            }
            .review-document {
              display: grid;
              gap: 12px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              page-break-inside: auto;
              font-size: 9.5px;
            }
            tr { page-break-inside: avoid; page-break-after: auto; }
            th, td {
              border: 1px solid #d1d5db;
              padding: 5px 6px;
              vertical-align: top;
              text-align: left;
            }
            th {
              background: #f3f4f6;
              font-weight: 800;
            }
            .footer {
              display: flex;
              justify-content: center;
              gap: 18px;
              margin-top: 18px;
              padding-top: 8px;
              border-top: 1px solid #d1d5db;
              color: #6b7280;
              font-size: 10px;
              text-align: center;
            }
            .report-footer {
              display: flex;
              justify-content: center;
              gap: 18px;
              margin-top: 24px;
              padding-top: 10px;
              border-top: 1px solid #dbe2ea;
              color: #64748b;
              font-size: 9px;
              font-weight: 750;
              text-align: center;
            }
            .no-print { display: none !important; }
          </style>
        </head>
        <body>
          <div class="print-document">${target.innerHTML}</div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    const images = Array.from(printWindow.document.images);
    const waitForImages = Promise.all(images.map((image) => {
      if (image.complete) return Promise.resolve();
      return new Promise<void>((resolve) => {
        image.onload = () => resolve();
        image.onerror = () => resolve();
      });
    }));
    Promise.race([
      waitForImages,
      new Promise((resolve) => setTimeout(resolve, 5000))
    ]).then(() => {
      printWindow.print();
      setTimeout(() => printWindow.close(), 500);
    });
  }

  return (
    <button className="ghost compact-button no-print" type="button" onClick={printReport}>
      {label}
    </button>
  );
}
