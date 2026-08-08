"use client";

import { useState } from "react";
import { LogOut } from "lucide-react";

export function LogoutButton({ className = "ghost compact-button" }: { className?: string }) {
  const [pending, setPending] = useState(false);

  async function logout() {
    if (pending) return;
    setPending(true);
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => null);
    window.location.replace("/login");
  }

  return (
    <button className={className} disabled={pending} type="button" onClick={logout} aria-label="TransitOS oturumunu kapat">
      <LogOut size={16} />
      {pending ? "Çıkılıyor" : "Çıkış"}
    </button>
  );
}
