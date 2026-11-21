"use client";

import React from "react";
import {
  Globe,
  LayoutDashboard,
  MessageSquare,
  Smartphone,
} from "lucide-react";
import { useOnItStore, type SurfaceMode } from "../context/OnItStore";
import { ClientWhatsAppSurface } from "./ClientWhatsAppSurface";
import { LandingSurface } from "./LandingSurface";
import { LanguagePill } from "./LanguagePill";
import { OnItDashboard } from "./OnItDashboard";
import { TelegramMiniAppSurface } from "./TelegramMiniAppSurface";

const SURFACES: Array<{
  id: SurfaceMode;
  label: string;
  shortLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { id: "landing", label: "im-onit.com", shortLabel: "Landing", icon: Globe },
  { id: "web", label: "Web Dispatch", shortLabel: "Web", icon: LayoutDashboard },
  { id: "tma", label: "Telegram Mini App", shortLabel: "Mini App", icon: Smartphone },
  { id: "client", label: "Client WhatsApp", shortLabel: "WhatsApp", icon: MessageSquare },
];

export function PrototypeShell() {
  const { surface, setSurface, jobs, toast } = useOnItStore();
  const hitlCount = jobs.filter((j) => j.status === "hitl").length;

  return (
    <div className="onit-canvas-bg min-h-screen w-full py-3 px-3 sm:px-5 lg:py-5 lg:px-7 flex flex-col items-center gap-3.5">
      {/* Top Floating Multi-Surface Prototype Switcher */}
      <div className="w-full max-w-[1380px] flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex items-center gap-1 p-1 rounded-full bg-white/80 backdrop-blur-xl border border-white shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
          {SURFACES.map((item) => {
            const Icon = item.icon;
            const active = surface === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSurface(item.id)}
                className={`px-3.5 py-1.5 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 transition-all cursor-pointer ${
                  active
                    ? "bg-[#111214] text-white shadow-sm"
                    : "text-[#4D5259] hover:text-[#111214] hover:bg-white/70"
                }`}
              >
                <Icon
                  className={`w-3.5 h-3.5 ${active ? "text-[#D1F366]" : ""}`}
                />
                <span className="hidden sm:inline">{item.label}</span>
                <span className="sm:hidden">{item.shortLabel}</span>
                {item.id === "tma" && hitlCount > 0 && (
                  <span className="ml-0.5 px-1.5 py-0.2 rounded-full bg-[#D1F366] text-[#111214] text-[10px] font-extrabold">
                    {hitlCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <LanguagePill />
          <div className="hidden xl:flex items-center gap-2 text-[11px] font-semibold text-[#4D5259] bg-white/75 backdrop-blur-md px-3.5 py-1.5 rounded-full border border-white">
            <span className="w-2 h-2 rounded-full bg-[#22C55E]" />
            Live Sync (@onit/core)
          </div>
        </div>
      </div>

      {/* Active Surface */}
      {surface === "landing" && <LandingSurface />}
      {surface === "web" && <OnItDashboard />}
      {surface === "tma" && <TelegramMiniAppSurface />}
      {surface === "client" && <ClientWhatsAppSurface />}

      {/* Cross-Surface Live Toast */}
      {toast && (
        <div
          role="status"
          className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 px-4 py-2.5 rounded-full bg-[#111214] text-white text-[12px] font-semibold shadow-2xl border border-white/15 flex items-center gap-2 max-w-[92vw]"
        >
          <span className="w-2 h-2 rounded-full bg-[#D1F366] shrink-0" />
          <span className="truncate">{toast}</span>
        </div>
      )}
    </div>
  );
}
