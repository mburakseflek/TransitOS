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

export function formatPhoneTR(input: string) {
  const digits = input.replace(/\D/g, "").replace(/^90/, "").slice(0, 10);
  const first = digits.slice(0, 3);
  const second = digits.slice(3, 6);
  const third = digits.slice(6, 8);
  const fourth = digits.slice(8, 10);
  return `+90${first ? ` (${first}` : ""}${first.length === 3 ? ")" : ""}${second ? ` ${second}` : ""}${third ? ` ${third}` : ""}${fourth ? ` ${fourth}` : ""}`;
}
