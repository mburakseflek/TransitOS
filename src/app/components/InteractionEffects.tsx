"use client";

import { useEffect } from "react";

function readText(target: EventTarget | null) {
  if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
    return target.value;
  }
  if (target instanceof HTMLElement && target.isContentEditable) {
    return target.innerText;
  }
  return "";
}

function markVanish(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return;
  target.classList.remove("vanish-input-erasing");
  window.requestAnimationFrame(() => {
    target.classList.add("vanish-input-erasing");
    window.setTimeout(() => target.classList.remove("vanish-input-erasing"), 360);
  });
}

export function InteractionEffects() {
  useEffect(() => {
    const valueLengths = new WeakMap<EventTarget, number>();

    function handleBeforeInput(event: Event) {
      const inputEvent = event as InputEvent;
      const type = inputEvent.inputType ?? "";
      if (!type.startsWith("delete")) return;
      if (readText(event.target).length > 0) {
        markVanish(event.target);
      }
    }

    function handleInput(event: Event) {
      const text = readText(event.target);
      const previousLength = valueLengths.get(event.target as EventTarget) ?? text.length;
      if (text.length < previousLength) {
        markVanish(event.target);
      }
      valueLengths.set(event.target as EventTarget, text.length);
    }

    document.addEventListener("beforeinput", handleBeforeInput, true);
    document.addEventListener("input", handleInput, true);

    return () => {
      document.removeEventListener("beforeinput", handleBeforeInput, true);
      document.removeEventListener("input", handleInput, true);
    };
  }, []);

  return null;
}
