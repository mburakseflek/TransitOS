"use client";

import { useMemo, useRef, useState } from "react";

const dayNames = ["Pzt", "Sal", "Çar", "Per", "Cum", "Cmt", "Paz"];
const monthNames = ["Ocak", "Şubat", "Mart", "Nisan", "Mayıs", "Haziran", "Temmuz", "Ağustos", "Eylül", "Ekim", "Kasım", "Aralık"];

export function MonthCalendarSelector({
  name,
  mode = "multiple",
  defaultDate,
  defaultMonth
}: {
  name: string;
  mode?: "single" | "multiple";
  defaultDate?: string;
  defaultMonth?: string;
}) {
  const todayValue = localDateValue(new Date());
  const initialMonth = defaultDate?.slice(0, 7) || defaultMonth || todayValue.slice(0, 7);
  const [month, setMonth] = useState(initialMonth);
  const [selected, setSelected] = useState<string[]>(defaultDate ? [defaultDate] : mode === "single" ? [todayValue] : []);
  const [dragState, setDragState] = useState<{ start: string; active: boolean; pointerType: string } | null>(null);
  const holdTimerRef = useRef<number | null>(null);

  const days = useMemo(() => buildMonthDays(month), [month]);
  const inMonthDays = days.filter((day) => day.inMonth).map((day) => day.value);
  const selectedSet = new Set(selected);
  const monthLabel = monthTitle(month);

  function clearHoldTimer() {
    if (holdTimerRef.current) {
      window.clearTimeout(holdTimerRef.current);
      holdTimerRef.current = null;
    }
  }

  function toggleDay(value: string) {
    if (mode === "single") {
      setSelected([value]);
      return;
    }
    setSelected((current) => current.includes(value) ? current.filter((item) => item !== value) : [...current, value].sort());
  }

  function rangeValues(fromValue: string, toValue: string) {
    const availableDays = days.filter((day) => day.inMonth).map((day) => day.value);
    const startIndex = availableDays.indexOf(fromValue);
    const endIndex = availableDays.indexOf(toValue);
    if (startIndex < 0 || endIndex < 0) return [];
    const [from, until] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    return availableDays.slice(from, until + 1);
  }

  function selectRange(to: string, start = dragState?.start) {
    if (!start || mode === "single") return;
    const values = rangeValues(start, to);
    if (!values.length) return;
    setSelected((current) => Array.from(new Set([...current, ...values])).sort());
  }

  function shiftMonth(offset: number) {
    const [year, monthIndex] = month.split("-").map(Number);
    const next = new Date(year, monthIndex - 1 + offset, 1);
    const nextMonth = `${next.getFullYear()}-${String(next.getMonth() + 1).padStart(2, "0")}`;
    setMonth(nextMonth);
    setSelected(mode === "single" ? [] : []);
    setDragState(null);
  }

  function handlePointerDown(event: React.PointerEvent<HTMLButtonElement>, value: string) {
    if (mode === "single") {
      toggleDay(value);
      return;
    }

    event.currentTarget.setPointerCapture(event.pointerId);
    setDragState({ start: value, active: false, pointerType: event.pointerType });

    if (event.pointerType === "touch") {
      clearHoldTimer();
      holdTimerRef.current = window.setTimeout(() => {
        setDragState((current) => current?.start === value ? { ...current, active: true } : current);
        setSelected((current) => Array.from(new Set([...current, value])).sort());
      }, 320);
    }
  }

  function handlePointerMove(event: React.PointerEvent<HTMLDivElement>) {
    if (!dragState || mode === "single") return;
    if (dragState.pointerType !== "touch" && event.buttons !== 1) return;

    const target = document.elementFromPoint(event.clientX, event.clientY) as HTMLElement | null;
    const value = target?.closest<HTMLElement>("[data-calendar-day='true']")?.dataset.date;
    if (!value || !inMonthDays.includes(value)) return;
    if (dragState.pointerType === "touch" && !dragState.active) return;

    if (value !== dragState.start || dragState.active) {
      clearHoldTimer();
      setDragState((current) => current ? { ...current, active: true } : current);
      selectRange(value, dragState.start);
    }
  }

  function handlePointerUp(value?: string) {
    if (mode === "multiple" && dragState && !dragState.active && value) {
      toggleDay(value);
    }
    clearHoldTimer();
    setDragState(null);
  }

  return (
    <div className="calendar-picker" onPointerCancel={() => handlePointerUp()} onPointerLeave={() => handlePointerUp()} onPointerMove={handlePointerMove} onPointerUp={() => handlePointerUp()}>
      <div className="calendar-toolbar">
        <div className="calendar-month-control" aria-label="Ay seçimi">
          <button type="button" onClick={() => shiftMonth(-1)} aria-label="Önceki ay">‹</button>
          <strong>{monthLabel}</strong>
          <button type="button" onClick={() => shiftMonth(1)} aria-label="Sonraki ay">›</button>
        </div>
        {mode === "multiple" ? (
          <div className="calendar-toolbar-actions">
            <button className="ghost compact-button" type="button" onClick={() => setSelected(inMonthDays)}>
              Tüm Günleri Seç
            </button>
            <button className="ghost compact-button" type="button" onClick={() => setSelected([])}>
              Temizle
            </button>
          </div>
        ) : null}
        <span className="badge">{selected.length ? `${selected.length} gün seçili` : "Gün seçilmedi"}</span>
      </div>
      <div className="calendar-grid">
        {dayNames.map((day) => <strong className="calendar-head" key={day}>{day}</strong>)}
        {days.map((day) => (
          <button
            className={[
              "calendar-day",
              day.inMonth ? "" : "muted-day",
              selectedSet.has(day.value) ? "selected" : ""
            ].join(" ")}
            disabled={!day.inMonth}
            key={day.value}
            type="button"
            data-calendar-day="true"
            data-date={day.value}
            onPointerDown={(event) => handlePointerDown(event, day.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleDay(day.value);
              }
            }}
            onPointerUp={(event) => {
              event.stopPropagation();
              handlePointerUp(day.value);
            }}
          >
            <span>{day.label}</span>
          </button>
        ))}
      </div>
      {selected.map((value) => <input key={value} name={name} type="hidden" value={value} />)}
    </div>
  );
}

function buildMonthDays(month: string) {
  const [year, monthIndex] = month.split("-").map(Number);
  const first = new Date(year, monthIndex - 1, 1);
  const startOffset = (first.getDay() + 6) % 7;
  const start = new Date(first);
  start.setDate(first.getDate() - startOffset);

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(start);
    date.setDate(start.getDate() + index);
    const value = [
      date.getFullYear(),
      String(date.getMonth() + 1).padStart(2, "0"),
      String(date.getDate()).padStart(2, "0")
    ].join("-");
    return {
      value,
      label: date.getDate(),
      inMonth: date.getMonth() === monthIndex - 1
    };
  });
}

function localDateValue(date: Date) {
  return [
    date.getFullYear(),
    String(date.getMonth() + 1).padStart(2, "0"),
    String(date.getDate()).padStart(2, "0")
  ].join("-");
}

function monthTitle(value: string) {
  const [year, monthIndex] = value.split("-").map(Number);
  return `${monthNames[monthIndex - 1]} ${year}`;
}
