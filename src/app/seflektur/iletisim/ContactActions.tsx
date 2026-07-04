"use client";

import { Mail, MapPin, Phone } from "lucide-react";

function cleanPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  if (digits.startsWith("90")) return `+${digits}`;
  if (digits.startsWith("0")) return `+9${digits}`;
  return digits ? `+90${digits}` : phone;
}

export function ContactActions({
  phone,
  email,
  address
}: {
  phone: string;
  email: string;
  address: string;
}) {
  function confirmAndOpen(message: string, url: string) {
    if (window.confirm(message)) {
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
        <span>Telefon</span>
        <strong>{phone}</strong>
      </button>

      <button
        type="button"
        className="contact-card hover-card"
        onClick={() => confirmAndOpen(`${email} adresine e-posta oluşturulsun mu?`, `mailto:${email}`)}
      >
        <Mail size={26} />
        <span>E-posta</span>
        <strong>{email}</strong>
      </button>

      <button
        type="button"
        className="contact-card hover-card"
        onClick={() => confirmAndOpen(`Adres için yol tarifi açılsın mı?\n${address}`, `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`)}
      >
        <MapPin size={26} />
        <span>Adres</span>
        <strong>{address}</strong>
      </button>
    </section>
  );
}
