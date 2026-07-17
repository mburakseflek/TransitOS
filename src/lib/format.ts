export function formatTRY(value: number) {
  return new Intl.NumberFormat("tr-TR", {
    style: "currency",
    currency: "TRY",
    maximumFractionDigits: 0
  }).format(value);
}

export function monthKey(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

export function normalizePhoneDigitsTR(input?: string | null) {
  let digits = String(input ?? "").replace(/\D/g, "");
  if (digits.startsWith("0090")) digits = digits.slice(4);
  if (digits.startsWith("90")) digits = digits.slice(2);
  if (digits.startsWith("0")) digits = digits.slice(1);
  return digits.slice(0, 10);
}

export function formatPhoneTR(input?: string | null) {
  const digits = normalizePhoneDigitsTR(input);
  if (!digits) return "";
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 8);
  const fourth = digits.slice(8, 10);
  return `+90${first ? ` (${first}` : ""}${first.length === 3 ? ")" : ""}${second ? ` ${second}` : ""}${third ? ` ${third}` : ""}${fourth ? ` ${fourth}` : ""}`;
}

export function phoneHrefTR(input?: string | null) {
  const digits = normalizePhoneDigitsTR(input);
  return digits ? `tel:+90${digits}` : "tel:+90";
}
