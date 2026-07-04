"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton() {
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.replace("/login");
  }

  return (
    <button className="ghost compact-button" disabled={pending} type="button" onClick={logout}>
      <LogOut size={16} />
      {pending ? "Çıkılıyor" : "Çıkış"}
    </button>
  );
}
