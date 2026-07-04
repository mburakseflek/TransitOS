"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react";
import { parsePeriod, type PeriodSearchParams } from "@/lib/period";

const monthNames = [
  "Ocak",
  "Şubat",
  "Mart",
  "Nisan",
  "Mayıs",
  "Haziran",
  "Temmuz",
  "Ağustos",
  "Eylül",
  "Ekim",
  "Kasım",
  "Aralık"
];

const rangeOptions = [
  { value: "1", label: "1 Ay" },
  { value: "3", label: "3 Ay" },
  { value: "6", label: "6 Ay" },
  { value: "12", label: "1 Yıl" }
];

export function PeriodFilter({
  searchParams,
  hidden = {}
}: {
  searchParams?: PeriodSearchParams | null;
  hidden?: Record<string, string | undefined | null>;
}) {
  const period = parsePeriod(searchParams);
  const hiddenEntries = Object.entries(hidden).filter(([, value]) => Boolean(value));
  const initialYear = Number(period.month.slice(0, 4));
  const initialMonth = Number(period.month.slice(5, 7)) - 1;
  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [selectedMonthIndex, setSelectedMonthIndex] = useState(initialMonth);
  const [selectedRange, setSelectedRange] = useState(String(period.range));
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [popoverPosition, setPopoverPosition] = useState({ left: 16, top: 80 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);

  const selectedMonthValue = useMemo(
    () => `${selectedYear}-${String(selectedMonthIndex + 1).padStart(2, "0")}`,
    [selectedMonthIndex, selectedYear]
  );
  const selectedLabel = `${monthNames[selectedMonthIndex]} ${selectedYear}`;
  const displayLabel = useMemo(() => {
    const range = Number(selectedRange);
    if (range === 1) return selectedLabel;
    const start = new Date(selectedYear, selectedMonthIndex - range + 1, 1);
    const startLabel = `${monthNames[start.getMonth()]} ${start.getFullYear()}`;
    return `${startLabel} - ${selectedLabel}`;
  }, [selectedLabel, selectedMonthIndex, selectedRange, selectedYear]);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;

    function updatePosition() {
      const trigger = triggerRef.current;
      if (!trigger) return;
      const rect = trigger.getBoundingClientRect();
      const width = Math.min(340, window.innerWidth - 24);
      const estimatedHeight = 330;
      const left = Math.min(Math.max(12, rect.left), window.innerWidth - width - 12);
      const below = rect.bottom + 8;
      const top = below + estimatedHeight <= window.innerHeight
        ? below
        : Math.max(12, rect.top - estimatedHeight - 8);
      setPopoverPosition({ left, top });
    }

    function handlePointerDown(event: PointerEvent) {
      const node = event.target as Node;
      if (triggerRef.current?.contains(node) || popoverRef.current?.contains(node)) return;
      setOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
      }
    }

    updatePosition();
    window.addEventListener("resize", updatePosition);
    window.addEventListener("scroll", updatePosition, true);
    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("resize", updatePosition);
      window.removeEventListener("scroll", updatePosition, true);
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  const popover = open ? (
    <div
      ref={popoverRef}
      className="period-popover"
      role="dialog"
      aria-label="Rapor dönemini seçin"
      style={{ left: popoverPosition.left, top: popoverPosition.top }}
    >
      <div className="period-year-row">
        <button type="button" onClick={() => setSelectedYear((year) => year - 1)} aria-label="Önceki yıl">
          <ChevronLeft size={18} />
        </button>
        <strong>{selectedYear}</strong>
        <button type="button" onClick={() => setSelectedYear((year) => year + 1)} aria-label="Sonraki yıl">
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="period-month-grid" aria-label="Aylar">
        {monthNames.map((name, index) => (
          <button
            key={name}
            className={index === selectedMonthIndex ? "selected" : ""}
            type="button"
            aria-pressed={index === selectedMonthIndex}
            onClick={() => setSelectedMonthIndex(index)}
          >
            {name}
          </button>
        ))}
      </div>
      <div className="period-range-group" aria-label="Rapor kapsamı">
        <span>Kapsam</span>
        <div>
          {rangeOptions.map((option) => (
            <button
              key={option.value}
              className={selectedRange === option.value ? "selected" : ""}
              type="button"
              aria-pressed={selectedRange === option.value}
              onClick={() => setSelectedRange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      <button className="primary period-apply-button" type="button" onClick={() => setOpen(false)}>
        Dönemi kullan
      </button>
    </div>
  ) : null;

  return (
    <form className="period-filter" method="get">
      {hiddenEntries.map(([key, value]) => (
        <input key={key} type="hidden" name={key} value={value ?? ""} />
      ))}
      <input type="hidden" name="month" value={selectedMonthValue} />
      <input type="hidden" name="range" value={selectedRange} />
      <div className="period-picker-field">
        <span>Dönem</span>
        <button
          ref={triggerRef}
          className="period-picker-trigger"
          type="button"
          aria-haspopup="dialog"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          <CalendarDays size={17} />
          <span>{displayLabel}</span>
        </button>
      </div>
      <button className="primary compact-button period-submit-button" type="submit">
        Raporu göster
      </button>
      {mounted && popover ? createPortal(popover, document.body) : null}
    </form>
  );
}
