"use client";

import type { CompanyDetail } from "@/lib/site-content";

function cleanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return digits ? `+90${digits}` : phone;
}

function actionUrl(action: CompanyDetail["action"], value: string) {
  if (action === "phone") return `tel:${cleanPhone(value)}`;
  if (action === "email") return `mailto:${value}`;
  if (action === "map") return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(value)}`;
  return "";
}

function actionMessage(action: CompanyDetail["action"], label: string, value: string) {
  if (action === "phone") return `${value} aranacak. Devam edilsin mi?`;
  if (action === "email") return `${value} adresine e-posta oluşturulsun mu?`;
  if (action === "map") return `${label} için yol tarifi açılsın mı?\n${value}`;
  return "";
}

export function CompanyInfoList({
  phone,
  email,
  address,
  taxOffice,
  taxNumber,
  details = []
}: {
  phone: string;
  email: string;
  address: string;
  taxOffice: string;
  taxNumber: string;
  details?: CompanyDetail[];
}) {
  const baseItems: CompanyDetail[] = [
    { id: "phone", label: "Telefon", value: phone, action: "phone" },
    { id: "email", label: "E-posta", value: email, action: "email" },
    { id: "address", label: "Adres", value: address, action: "map" },
    { id: "tax-office", label: "Vergi Dairesi", value: taxOffice, action: "none" },
    { id: "tax-number", label: "Vergi No", value: taxNumber, action: "none" }
  ];
  const items = [...baseItems, ...details].filter((item) => item.label && item.value);

  function openItem(item: CompanyDetail) {
    const url = actionUrl(item.action, item.value);
    if (!url) return;
    if (window.confirm(actionMessage(item.action, item.label, item.value))) {
      if (item.action === "map") {
        window.open(url, "_blank", "noopener,noreferrer");
      } else {
        window.location.href = url;
      }
    }
  }

  return (
    <div className="company-info-list">
      {items.map((item) => {
        const clickable = item.action !== "none";
        const content = (
          <>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </>
        );
        return clickable ? (
          <button type="button" className="company-info-item clickable" key={item.id} onClick={() => openItem(item)}>
            {content}
          </button>
        ) : (
          <div className="company-info-item" key={item.id}>{content}</div>
        );
      })}
    </div>
  );
}
