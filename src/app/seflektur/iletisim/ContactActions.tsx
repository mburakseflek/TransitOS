"use client";

import { Mail, MapPin, Phone } from "lucide-react";
import type { CorporateLocale } from "@/lib/corporate-routes";

function cleanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return digits ? `+90${digits}` : phone;
}

export function ContactActions({
  locale = "tr",
  copy = {},
  phone,
  email,
  address
}: {
  locale?: CorporateLocale;
  copy?: Record<string,string>;
  phone: string;
  email: string;
  address: string;
}) {
  function confirmAndOpen(message: string, url: string) {
    if (window.confirm(locale === "tr" ? message : `${copy["Devam edilsin mi?"] || "Continue?"}\n${url}`)) {
      window.location.href = url;
    }
  }

  return (
    <section className="contact-grid">
      <button
        type="button"
        className="contact-card hover-card"
        onClick={() => confirmAndOpen(`${phone} numarası aranacak. Devam edilsin mi?`, `tel:${cleanPhone(phone)}`)}
      >
        <Phone size={26} />
        <span>{copy["Telefon"] || "Telefon"}</span>
        <strong>{phone}</strong>
      </button>

      <button
        type="button"
        className="contact-card hover-card"
        onClick={() => confirmAndOpen(`${email} adresine e-posta oluşturulsun mu?`, `mailto:${email}`)}
      >
        <Mail size={26} />
        <span>{copy["E-posta"] || "E-posta"}</span>
        <strong>{email}</strong>
      </button>

      <button
        type="button"
        className="contact-card hover-card"
        onClick={() => confirmAndOpen(`Adres için yol tarifi açılsın mı?\n${address}`, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)}
      >
        <MapPin size={26} />
        <span>{copy["Adres"] || "Adres"}</span>
        <strong>{address}</strong>
      </button>
    </section>
  );
}
