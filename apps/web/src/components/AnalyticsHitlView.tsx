"use client";

import React from "react";
import { ArrowLeft, Bot, CheckCircle2, ShieldCheck, Zap } from "lucide-react";
import { useOnItStore } from "../context/OnItStore";

export function AnalyticsHitlView({ onBack }: { onBack: () => void }) {
  const { jobs, hitlLogs, setSurface } = useOnItStore();
  const booked = jobs.filter((j) => j.status === "booked").length;
  const hitl = jobs.filter((j) => j.status === "hitl").length;

  return (
    <main className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            aria-label="Back to Dispatch"
            className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">
              Analytics & HITL Active Learning
            </h1>
            <p className="text-[12px] text-[#6B7280]">
              Метрики пилота в Ереване и база дообучения на правках мастеров
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setSurface("tma")}
          className="px-3.5 py-2 rounded-full bg-[#D1F366] text-[#111214] text-[11.5px] font-extrabold cursor-pointer"
        >
          Открыть Mini App
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Медиана ответа", value: "24,5 с", bg: "bg-white" },
          { label: "Авто-квалификация", value: "82%", bg: "bg-[#D1F366]" },
          { label: "Принято в работу", value: String(booked), bg: "bg-[#85E6DC]" },
          { label: "HITL эскалации", value: String(hitl), bg: "bg-[#111214] text-white" },
        ].map((k) => (
          <div
            key={k.label}
            className={`rounded-[22px] p-4 border border-black/[0.06] ${k.bg}`}
          >
            <div className="text-[11px] font-semibold opacity-70">{k.label}</div>
            <div className="text-[24px] font-extrabold tabular-nums mt-1">
              {k.value}
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-[26px] bg-white p-4 border border-white shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-[14px] font-extrabold flex items-center gap-1.5">
            <Bot className="w-4 h-4" /> База решений мастеров ({hitlLogs.length})
          </span>
          <span className="text-[11px] font-semibold text-[#525860] inline-flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Company-local · Zero PII
          </span>
        </div>

        <div className="space-y-2">
          {hitlLogs.map((item) => (
            <div
              key={item.id}
              className="rounded-2xl bg-[#F6F7F9] px-3.5 py-2.5 flex items-center justify-between gap-3 text-[12px]"
            >
              <div className="min-w-0">
                <div className="font-bold flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#111214] shrink-0" />
                  <span className="truncate">{item.summary}</span>
                </div>
                <div className="text-[10.5px] text-[#6B7280] mt-0.5">
                  #{item.leadId} · {item.action} · {item.timestamp}
                </div>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-[#D1F366] text-[#111214] text-[11px] font-extrabold shrink-0">
                {item.priceLabel}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-[24px] bg-[#111214] text-white p-4 flex items-center justify-between gap-3 text-[12px]">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-[#D1F366] shrink-0" />
          <span>Инфраструктура пилота: $0/мес (Oracle Always Free + Cloudflare Pages + Free API)</span>
        </div>
        <span className="px-2.5 py-1 rounded-full bg-white/10 text-[#85E6DC] font-bold shrink-0">
          ENISA Ready
        </span>
      </div>
    </main>
  );
}
