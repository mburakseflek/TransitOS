"use client";

import { useState } from "react";

function formatMoneyInput(value: string | number) {
  const raw = String(value ?? "").replace(/\./g, "").replace(/[^\d,]/g, "");
  const [integer = "", ...decimalParts] = raw.split(",");
  const grouped = (integer.replace(/^0+(?=\d)/, "") || "0").replace(/\B(?=(\d{3})+(?!\d))/g, ".");
  return decimalParts.length ? `${grouped},${decimalParts.join("").slice(0, 2)}` : grouped;
}

function initialMoney(value: string | number) {
  const numeric = Number(value);
  return Number.isFinite(numeric)
    ? new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(numeric)
    : "0,00";
}

export function MoneyInput({ name, label, defaultValue = 0, required = false }: {
  name: string;
  label: string;
  defaultValue?: string | number;
  required?: boolean;
}) {
  const [value, setValue] = useState(() => initialMoney(defaultValue));
  return (
    <label className="floating-input">
      <input
        name={name}
        type="text"
        inputMode="decimal"
        autoComplete="off"
        value={value}
        required={required}
        onChange={(event) => setValue(formatMoneyInput(event.target.value))}
        onBlur={() => {
          const [integer, decimal = ""] = value.split(",");
          setValue(`${integer || "0"},${decimal.padEnd(2, "0").slice(0, 2)}`);
        }}
      />
      <span>{label}</span>
    </label>
  );
}
