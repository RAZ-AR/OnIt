"use client";

import React, { useState } from "react";
import {
  ArrowDown,
  ArrowUp,
  ArrowUpRight,
  Bell,
  CalendarDays,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Cloud,
  Compass,
  Globe,
  LayoutGrid,
  MapPin,
  MessageSquare,
  Mic,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Star,
  TrendingUp,
  Users,
  Wallet,
  Zap,
} from "lucide-react";
import {
  MONTHLY_STATS,
  type DemoJob,
  type NavTab,
} from "../data/demo-data";
import { AvatarCircle } from "./Avatars";

interface CenterBentoProps {
  jobs: DemoJob[];
  servicesCount: number;
  autoQuotedCount: number;
  hitlCount: number;
  hitlLearnedCount: number;
  piiRedactedCount: number;
  onSelectJob: (job: DemoJob) => void;
  onQuickAcceptHitl: (jobId: string) => void;
  onQuickPriceHitl: (jobId: string) => void;
  onOpenMiniApp: () => void;
  onOpenImportPrice: () => void;
  onNavigate: (tab: NavTab) => void;
}

const TIMELINE_DAYS = [
  { d: "M", n: "3" },
  { d: "T", n: "4" },
  { d: "W", n: "5", active: true },
  { d: "T", n: "6" },
  { d: "F", n: "7" },
  { d: "S", n: "8" },
  { d: "S", n: "9" },
  { d: "M", n: "10" },
  { d: "T", n: "11" },
  { d: "W", n: "12" },
];

const LANGUAGES_SPLIT = [
  { code: "HY", label: "Армянский", pct: 46, color: "bg-[#D1F366]" },
  { code: "RU", label: "Русский", pct: 38, color: "bg-[#111214]" },
  { code: "EN", label: "English", pct: 10, color: "bg-[#85E6DC]" },
  { code: "ES", label: "Español", pct: 6, color: "bg-[#0052FF]" },
];

const FORMATS_SPLIT = [
  { label: "Голос", pct: 41, icon: Mic },
  { label: "Фото", pct: 34, icon: Camera },
  { label: "Текст", pct: 25, icon: MessageSquare },
];

const YEREVAN_GEO_STATS = [
  { district: "Kentron", pct: 44, count: 18, eta: "6 мин" },
  { district: "Arabkir", pct: 28, count: 11, eta: "9 мин" },
  { district: "Avan", pct: 16, count: 7, eta: "13 мин" },
  { district: "Erebuni", pct: 12, count: 5, eta: "14 мин" },
];

export function CenterBento({
  jobs,
  servicesCount,
  autoQuotedCount,
  hitlCount,
  hitlLearnedCount,
  piiRedactedCount,
  onSelectJob,
  onQuickAcceptHitl,
  onQuickPriceHitl,
  onOpenMiniApp,
  onOpenImportPrice,
  onNavigate,
}: CenterBentoProps) {
  const [period, setPeriod] = useState<"7d" | "30d">("30d");

  const bookedCount = jobs.filter((j) => j.status === "booked").length;
  const quotedCount = jobs.filter((j) => j.status === "quoted").length;
  const urgentHitl = jobs.find((j) => j.status === "hitl") ?? null;

  const mult = period === "30d" ? 1 : 0.27;
  const revenueAmd = Math.round((1420000 + bookedCount * 18000) * mult);
  const savedLeads = Math.max(4, Math.round(19 * mult));
  const savedAmd = Math.round(380000 * mult);

  const funnelStages = [
    { label: "Входящие", count: Math.round(48 * (period === "30d" ? 3.2 : 1)), pct: 100, bar: "bg-[#111214] text-white" },
    { label: "AI Triage", count: Math.round(41 * (period === "30d" ? 3.2 : 1)), pct: 85, bar: "bg-[#2C3038] text-white" },
    { label: "Смета выдана", count: Math.round(37 * (period === "30d" ? 3.2 : 1)), pct: 77, bar: "bg-[#85E6DC] text-[#111214]" },
    { label: "Бронь слота", count: Math.round(29 * (period === "30d" ? 3.2 : 1)), pct: 60, bar: "bg-[#D1F366] text-[#111214]" },
    { label: "Визит закрыт", count: Math.round(26 * (period === "30d" ? 3.2 : 1)), pct: 54, bar: "bg-[#00C48C] text-white" },
  ];

  const phoneRedactions = Math.round(piiRedactedCount * 0.75);
  const codeRedactions = piiRedactedCount - phoneRedactions;

  return (
    <main className="flex flex-col gap-3.5 min-w-0">
      {/* Top Header */}
      <header className="flex flex-wrap items-center justify-between gap-2.5 px-1 pt-0.5">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-[23px] sm:text-[25px] font-extrabold tracking-[-0.03em] text-[#111214] leading-tight">
              Your Field Dispatch
            </h1>
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 border border-black/[0.06] text-[10px] font-bold text-[#047857]">
              <ShieldCheck className="w-3 h-3 text-[#0052FF]" /> GDPR 100%
            </span>
          </div>
          <p className="text-[12px] text-[#6B7280] mt-0.5">
            Autonomous multimodal AI dispatcher · Yerevan → EU
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {/* Period Switcher */}
          <div className="h-9 p-0.5 rounded-full bg-white/95 border border-white shadow-xs flex items-center">
            {(
              [
                { id: "7d", label: "7д" },
                { id: "30d", label: "30д" },
              ] as const
            ).map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setPeriod(p.id)}
                className={`px-2.5 h-8 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                  period === p.id
                    ? "bg-[#111214] text-white"
                    : "text-[#6B7280] hover:text-[#111214]"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => onNavigate("simulator")}
            className="relative w-9 h-9 rounded-full bg-white/95 border border-white shadow-xs flex items-center justify-center text-[#111214] hover:scale-105 transition-transform cursor-pointer"
            title="Live AI alerts"
            aria-label="Live AI alerts"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-[#D1F366] text-[#111214] text-[9px] font-extrabold flex items-center justify-center border border-white">
              {Math.max(1, hitlCount + 5)}
            </span>
          </button>

          <div className="h-9 px-3 rounded-full bg-white/95 border border-white shadow-xs flex items-center gap-1.5">
            <Cloud className="w-3.5 h-3.5 text-[#111214]" />
            <span className="text-[11px] font-bold text-[#111214] tabular-nums">
              23 °C · Yerevan
            </span>
          </div>
        </div>
      </header>

      {/* NEW ROW 0: Executive Top KPI Strip (4 high-signal business & IP cards) */}
      <section className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        <div className="rounded-[22px] bg-white/95 border border-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10.5px] font-semibold text-[#6B7280] inline-flex items-center gap-1">
              <Wallet className="w-3 h-3 text-[#111214]" /> Выручка
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#D1F366] text-[#111214] text-[9.5px] font-extrabold tabular-nums">
              +38%
            </span>
          </div>
          <div className="text-[17px] font-extrabold tracking-tight tabular-nums leading-none">
            {revenueAmd.toLocaleString("ru-RU").replace(/,/g, " ")}{" "}
            <span className="text-[11px] font-bold text-[#6B7280]">AMD</span>
          </div>
          <div className="text-[10px] text-[#6B7280] truncate">
            {bookedCount + 27} броней · чек 21k AMD
          </div>
        </div>

        <div className="rounded-[22px] bg-white/95 border border-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10.5px] font-semibold text-[#6B7280] inline-flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#0052FF]" /> Спасённые лиды
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#85E6DC] text-[#111214] text-[9.5px] font-extrabold tabular-nums">
              +{Math.round(savedAmd / 1000)}k ֏
            </span>
          </div>
          <div className="text-[17px] font-extrabold tracking-tight tabular-nums leading-none">
            {savedLeads} заявок
          </div>
          <div className="text-[10px] text-[#6B7280] truncate">
            Вне смены / пока на объекте
          </div>
        </div>

        <div className="rounded-[22px] bg-white/95 border border-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-1.5">
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10.5px] font-semibold text-[#6B7280] inline-flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#111214]" /> Точность сметы
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#111214] text-[#D1F366] text-[9.5px] font-extrabold">
              0 галлюц.
            </span>
          </div>
          <div className="text-[17px] font-extrabold tracking-tight tabular-nums leading-none">
            ±8.4%{" "}
            <span className="text-[10.5px] font-semibold text-[#047857]">AI vs Факт</span>
          </div>
          <div className="text-[10px] text-[#6B7280] truncate">
            Active Learning: +{hitlLearnedCount + 12} кейсов
          </div>
        </div>

        <button
          type="button"
          onClick={() => onNavigate("routes")}
          className="text-left rounded-[22px] bg-white/95 hover:bg-[#D1F366]/60 border border-white p-3.5 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-1.5 transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between gap-1">
            <span className="text-[10.5px] font-semibold text-[#6B7280] inline-flex items-center gap-1">
              <Compass className="w-3 h-3 text-[#111214]" /> Экономия OSRM
            </span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#F3F5F7] text-[#111214] text-[9.5px] font-extrabold tabular-nums">
              −14.2 км
            </span>
          </div>
          <div className="text-[17px] font-extrabold tracking-tight tabular-nums leading-none">
            −48 мин/д
          </div>
          <div className="text-[10px] text-[#6B7280] truncate">
            На мастера · Ереван OSRM
          </div>
        </button>
      </section>

      {/* NEW ROW 0.5: Urgent 1-Click HITL Escalation Strip */}
      {urgentHitl ? (
        <section className="rounded-[22px] bg-[#111214] text-white px-4 py-3 flex flex-wrap items-center justify-between gap-3 shadow-[0_12px_28px_rgba(17,18,20,0.18)]">
          <div className="flex items-center gap-2.5 min-w-0">
            <span className="w-8 h-8 rounded-full bg-[#FF4D1C] text-white flex items-center justify-center shrink-0">
              <ShieldAlert className="w-4 h-4" />
            </span>
            <div className="min-w-0 leading-tight">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-[12.5px] font-extrabold truncate">
                  HITL Пауза: {urgentHitl.title} · {urgentHitl.clientName}
                </span>
                <span className="px-2 py-0.5 rounded-full bg-[#FF4D1C]/20 text-[#FF8A65] text-[10px] font-bold tabular-nums">
                  confidence {urgentHitl.confidence}% &lt; 80%
                </span>
              </div>
              <p className="text-[11px] text-white/65 truncate mt-0.5">
                {urgentHitl.defectSummary}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap shrink-0">
            <button
              type="button"
              onClick={() => onQuickPriceHitl(urgentHitl.id)}
              className="px-3 py-1.5 rounded-full bg-[#D1F366] text-[#111214] text-[11px] font-extrabold hover:brightness-95 cursor-pointer"
            >
              ⚡ Оценить 40k AMD
            </button>
            <button
              type="button"
              onClick={() => onQuickAcceptHitl(urgentHitl.id)}
              className="px-3 py-1.5 rounded-full bg-white/12 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
            >
              ✅ Принять
            </button>
            <button
              type="button"
              onClick={onOpenMiniApp}
              className="px-3 py-1.5 rounded-full bg-[#0052FF] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer hover:opacity-90"
            >
              <Smartphone className="w-3 h-3" /> Mini App
            </button>
          </div>
        </section>
      ) : (
        <section className="rounded-[20px] bg-[#E7FBF4] border border-[#00C48C]/30 px-4 py-2.5 flex items-center justify-between gap-2 text-[12px] text-[#047857]">
          <span className="font-bold inline-flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4" /> Все срочные HITL-эскалации разобраны — OnIt AI работает на автопилоте
          </span>
          <button
            type="button"
            onClick={onOpenMiniApp}
            className="text-[11px] font-extrabold underline cursor-pointer"
          >
            Telegram Mini App ↗
          </button>
        </section>
      )}

      {/* Row 1: 3 Signature Bento Cards */}
      <section className="grid grid-cols-1 md:grid-cols-[1.02fr_1fr_0.94fr] gap-3.5 items-center">
        {/* 1. Tilted White Quotes Card */}
        <div
          onClick={() => onNavigate("simulator")}
          className="bg-white rounded-[26px] p-4 shadow-[0_14px_34px_rgba(15,23,42,0.08)] border border-white transform -rotate-2 hover:rotate-0 transition-transform duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-6 h-6 rounded-lg bg-[#111214] text-[#D1F366] flex items-center justify-center">
                <Sparkles className="w-3.5 h-3.5" />
              </span>
              <span className="text-[14px] font-bold tracking-tight">
                AI Quotes
              </span>
            </div>
            <span className="w-7 h-7 rounded-full border border-black/15 flex items-center justify-center text-[#111214]">
              <ArrowUpRight className="w-3.5 h-3.5" />
            </span>
          </div>

          <div className="mt-3 mb-2 flex items-baseline gap-1.5">
            <span className="text-[28px] font-extrabold tracking-[-0.04em] tabular-nums leading-none">
              24,5 s
            </span>
            <span className="text-[11px] font-medium text-[#8C9197]">
              avg reply
            </span>
          </div>

          <div className="h-2.5 w-full rounded-full bg-[#F1F3F5] overflow-hidden p-[1px]">
            <div
              className="h-full rounded-full bg-gradient-to-r from-[#D1F366] via-[#B4EE8D] to-[#7BE3D9] transition-all duration-500"
              style={{ width: "84%" }}
            />
          </div>

          <div className="mt-2.5 flex items-center justify-between text-[10.5px] font-medium text-[#525860]">
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#D1F366]" />
              Auto ({autoQuotedCount})
            </span>
            <span className="inline-flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-[#85E6DC]" />
              HITL ({hitlCount})
            </span>
          </div>
        </div>

        {/* 2. Acid Lime Core Crew Card with Live Master Statuses */}
        <div
          onClick={() => onNavigate("routes")}
          className="bg-[#D1F366] rounded-[26px] p-4 shadow-[0_12px_28px_rgba(209,243,102,0.32)] cursor-pointer hover:brightness-[0.99] transition-all"
        >
          <div className="flex items-start justify-between gap-2">
            <div className="flex items-start gap-2.5">
              <span className="w-7 h-7 rounded-full bg-white flex items-center justify-center shrink-0 mt-0.5">
                <Users className="w-3.5 h-3.5 text-[#111214]" />
              </span>
              <div className="leading-tight">
                <div className="text-[14px] font-extrabold tracking-tight text-[#111214]">
                  Field Crew
                </div>
                <div className="text-[11px] text-[#3F4A1E] font-medium">
                  12 Masters · {servicesCount} Services
                </div>
              </div>
            </div>
            <span className="w-7 h-7 rounded-full bg-[#111214] text-white text-[10px] font-bold flex items-center justify-center shrink-0">
              +8
            </span>
          </div>

          <div className="mt-3 flex flex-wrap gap-1 text-[9.5px] font-bold text-[#111214]">
            <span className="px-2 py-0.5 rounded-full bg-white/85">● Aram: на объекте</span>
            <span className="px-2 py-0.5 rounded-full bg-white/85">🚗 Davit: 6м</span>
            <span className="px-2 py-0.5 rounded-full bg-[#111214] text-[#D1F366]">Hayk: окно 15:30</span>
          </div>

          <div className="mt-2.5 flex items-center justify-between">
            <div className="flex -space-x-2">
              <AvatarCircle who="aram" size="sm" />
              <AvatarCircle who="davit" size="sm" />
              <AvatarCircle who="hayk" size="sm" />
              <AvatarCircle who="suren" size="sm" />
            </div>
            <span className="text-[10.5px] font-extrabold text-[#2E3614]">
              OSRM Synced
            </span>
          </div>
        </div>

        {/* 3. Dashed Circle Import Price List Card */}
        <div className="relative flex items-center justify-center py-1.5">
          <div className="absolute -top-1 z-10 px-2.5 py-1 rounded-full bg-[#111214] text-white text-[9.5px] font-medium shadow-md flex items-center gap-1 whitespace-nowrap">
            <span className="w-3 h-3 rounded-full bg-white/15 text-[8px] flex items-center justify-center font-bold">
              !
            </span>
            5-min Price Matrix parser
          </div>

          <button
            type="button"
            onClick={onOpenImportPrice}
            className="w-[148px] h-[148px] rounded-full border border-dashed border-black/30 hover:border-black/65 hover:bg-white/45 transition-all flex flex-col items-center justify-center gap-1.5 cursor-pointer group"
          >
            <span className="w-7 h-7 rounded-full bg-white shadow-xs flex items-center justify-center text-[#111214]">
              <LayoutGrid className="w-3.5 h-3.5" />
            </span>
            <span className="text-[12px] font-semibold text-[#111214] text-center leading-tight px-3">
              Import Price List
            </span>
            <span className="w-8 h-8 rounded-full bg-[#D1F366] text-[#111214] flex items-center justify-center group-hover:scale-110 transition-transform shadow-xs">
              <Plus className="w-4 h-4 stroke-[2.5]" />
            </span>
          </button>
        </div>
      </section>

      {/* Row 2: Obsidian Analytics Chart + 5-Stage Conversion Funnel */}
      <section className="rounded-[28px] bg-[#111214] text-white p-4 grid grid-cols-1 xl:grid-cols-[1.12fr_1fr] gap-4 items-stretch shadow-[0_18px_40px_rgba(17,18,20,0.22)]">
        {/* Left: Vertical Pill Bars + Mint/Lime Curve + Quick Deltas */}
        <div className="flex flex-col justify-between gap-3">
          <div className="relative flex flex-col justify-end pt-2 px-1 min-h-[138px]">
            <svg
              viewBox="0 0 320 120"
              className="absolute inset-x-1 top-2 h-[104px] w-[calc(100%-8px)] pointer-events-none z-10 overflow-hidden"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="onitCurveGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#85E6DC" />
                  <stop offset="45%" stopColor="#94EBAC" />
                  <stop offset="100%" stopColor="#D1F366" />
                </linearGradient>
              </defs>
              <path
                d="M 10 92 C 42 86, 52 58, 76 62 C 102 66, 114 90, 146 72 C 178 54, 198 34, 232 24 C 258 17, 276 58, 310 74"
                fill="none"
                stroke="url(#onitCurveGrad)"
                strokeWidth="4"
                strokeLinecap="round"
              />
            </svg>

            <div className="grid grid-cols-7 gap-2 items-end h-[112px]">
              {MONTHLY_STATS.map((bar) => (
                <div
                  key={bar.month}
                  className="flex flex-col items-center justify-end h-full gap-1"
                >
                  <div className="w-full max-w-[24px] h-[90px] flex items-end justify-center">
                    {bar.dashed ? (
                      <div className="w-full h-full rounded-full border border-dashed border-white/30 flex items-end p-[2px]">
                        <div
                          className="w-full rounded-full bg-white"
                          style={{ height: `${bar.height}%` }}
                        />
                      </div>
                    ) : (
                      <div
                        className="w-full rounded-full bg-white transition-all duration-500"
                        style={{ height: `${bar.height}%` }}
                      />
                    )}
                  </div>
                  <span className="text-[10px] text-white/55 font-medium">
                    {bar.month}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="rounded-2xl bg-white/[0.08] px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                <ArrowDown className="w-3.5 h-3.5 text-[#85E6DC]" />
                <span>Пропуски</span>
              </div>
              <span className="text-[12px] font-extrabold text-[#85E6DC] tabular-nums">
                −74%
              </span>
            </div>
            <div className="rounded-2xl bg-white/[0.08] px-3 py-2 flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-[11px] text-white/80">
                <ArrowUp className="w-3.5 h-3.5 text-[#D1F366]" />
                <span>Брони</span>
              </div>
              <span className="text-[12px] font-extrabold text-[#D1F366] tabular-nums">
                +38%
              </span>
            </div>
          </div>
        </div>

        {/* Right: Crisp White 5-Stage Conversion Funnel Card */}
        <div className="rounded-[22px] bg-white text-[#111214] p-4 flex flex-col justify-between gap-2.5">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-[#111214]" />
              <span className="text-[13px] font-extrabold tracking-tight">
                Воронка конверсии
              </span>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-[#D1F366] text-[#111214] text-[10px] font-extrabold tabular-nums">
              54% в закрытие
            </span>
          </div>

          <div className="space-y-1.5">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="space-y-0.5">
                <div className="flex items-center justify-between text-[10.5px]">
                  <span className="font-semibold text-[#374151]">{stage.label}</span>
                  <span className="font-bold tabular-nums text-[#111214]">
                    {stage.count}{" "}
                    <span className="text-[#8C9197] font-medium">({stage.pct}%)</span>
                  </span>
                </div>
                <div className="h-3.5 w-full rounded-full bg-[#F3F5F7] overflow-hidden p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stage.bar}`}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Row 3: Wide Geo Schedule & Route Timeline Card */}
      <section className="rounded-[28px] bg-white/95 p-4 shadow-[0_10px_34px_rgba(15,23,42,0.05)] border border-white">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-4 h-4 text-[#111214]" />
            <span className="text-[15px] font-extrabold tracking-tight">
              Geo Schedule
            </span>
          </div>

          <div className="flex items-center gap-2 text-[12px] font-semibold text-[#111214]">
            <ChevronLeft className="w-3.5 h-3.5 text-[#8C9197]" />
            <span>April 2026</span>
            <ChevronRight className="w-3.5 h-3.5 text-[#8C9197]" />
          </div>

          <div className="flex items-center gap-2">
            <div className="hidden sm:flex -space-x-1.5 items-center">
              <AvatarCircle who="aram" size="sm" />
              <AvatarCircle who="davit" size="sm" />
              <AvatarCircle who="hayk" size="sm" />
              <span className="w-7 h-7 rounded-full bg-[#111214] text-white text-[10px] font-bold flex items-center justify-center ring-2 ring-white">
                +9
              </span>
            </div>
            <button
              type="button"
              onClick={() => onNavigate("simulator")}
              className="inline-flex items-center gap-1.5 pl-3 pr-1.5 py-1 rounded-full border border-black/15 bg-white hover:bg-[#F7F8FA] text-[11.5px] font-semibold cursor-pointer transition-colors"
            >
              Add
              <span className="w-5 h-5 rounded-full bg-[#D1F366] flex items-center justify-center">
                <Plus className="w-3 h-3 text-[#111214]" />
              </span>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-[172px_1fr] gap-3.5">
          <div className="flex flex-col gap-3">
            <button
              type="button"
              onClick={() => onNavigate("routes")}
              className="rounded-[20px] bg-[#F6F7F9] hover:bg-[#EFF1F4] transition-colors p-3.5 text-left flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="text-[13px] font-bold leading-snug">
                {jobs.length + 11} Upcoming
                <span className="block font-semibold text-[#525860]">Jobs</span>
              </div>
              <span className="w-7 h-7 rounded-full border border-black/15 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-3.5 h-3.5" />
              </span>
            </button>

            <div className="rounded-[22px] bg-[#D1F366] p-3.5 flex-1 flex flex-col justify-between gap-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-1.5">
                  <LayoutGrid className="w-3.5 h-3.5 text-[#111214]" />
                  <span className="text-[13px] font-extrabold tracking-tight">
                    Process
                  </span>
                </div>
                <span className="w-6 h-6 rounded-full border border-black/20 flex items-center justify-center">
                  <ArrowUpRight className="w-3 h-3" />
                </span>
              </div>

              <div className="space-y-2">
                {[
                  { label: `In Triage (${hitlCount})`, pct: "54%" },
                  { label: `Quoted (${quotedCount + 2})`, pct: "72%" },
                  { label: `Booked (${bookedCount + 4})`, pct: "64%" },
                ].map((row) => (
                  <div
                    key={row.label}
                    className="h-7 rounded-full border border-dashed border-black/35 p-[2px] flex items-center"
                  >
                    <div
                      className="h-full rounded-full bg-[#111214] text-white text-[10px] font-semibold px-2.5 flex items-center truncate"
                      style={{ width: row.pct }}
                    >
                      {row.label}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center justify-between text-[10px] font-semibold text-[#2E3614]">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#111214]" />
                  Done
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full border border-dashed border-black/60" />
                  In Progress
                </span>
              </div>
            </div>
          </div>

          <div className="schedule-dots rounded-[22px] border border-black/[0.05] p-3 relative overflow-x-auto">
            <div className="grid grid-cols-10 gap-1 mb-3.5 min-w-[420px]">
              {TIMELINE_DAYS.map((day) => (
                <div
                  key={day.n}
                  className="flex flex-col items-center justify-center"
                >
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10.5px] font-bold tracking-tight ${
                      day.active
                        ? "bg-[#85E6DC] text-[#111214]"
                        : "text-[#8C9197]"
                    }`}
                  >
                    {day.d}
                    {day.n}
                  </span>
                </div>
              ))}
            </div>

            <div
              className="pointer-events-none absolute top-10 bottom-3 w-[1.5px] bg-[#85E6DC]"
              style={{ left: "25%" }}
            />

            <div className="space-y-2 relative z-10 min-w-[420px]">
              {jobs.slice(0, 4).map((job) => {
                const leftPct = (job.startCol / 10) * 100;
                const widthPct = Math.min(100 - leftPct, (job.spanCols / 10) * 100);
                return (
                  <div key={job.id} className="relative h-[44px]">
                    <button
                      type="button"
                      onClick={() => onSelectJob(job)}
                      style={{
                        left: `${leftPct}%`,
                        width: `${widthPct}%`,
                      }}
                      className={`absolute top-0 h-[42px] rounded-full px-2 flex items-center justify-between gap-2 transition-all cursor-pointer border text-left ${
                        job.highlighted
                          ? "bg-[#85E6DC] border-[#6EDAD0] text-[#111214] shadow-[0_8px_18px_rgba(133,230,220,0.38)]"
                          : "bg-white/95 border-black/[0.08] text-[#111214] shadow-[0_6px_16px_rgba(15,23,42,0.06)] hover:border-black/25"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <AvatarCircle who={job.avatarKey} size="sm" />
                        <div className="min-w-0 leading-tight">
                          <div className="text-[11.5px] font-bold truncate">
                            {job.title}
                          </div>
                          <div className="text-[9.5px] opacity-70 truncate">
                            {job.subtitle}
                          </div>
                        </div>
                      </div>

                      {job.highlighted ? (
                        <span className="w-6 h-6 rounded-full bg-[#D1F366] text-[#111214] flex items-center justify-center shrink-0">
                          <Check className="w-3.5 h-3.5 stroke-[2.6]" />
                        </span>
                      ) : (
                        <span
                          className={`w-7 h-7 rounded-full text-[9px] font-bold flex items-center justify-center shrink-0 tabular-nums ${
                            job.status === "hitl"
                              ? "bg-[#D1F366] text-[#111214]"
                              : "bg-[#111214] text-white"
                          }`}
                        >
                          {job.confidence}%
                        </span>
                      )}
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* NEW ROW 4: 3-Card Intelligence Bento (Polyglot/Formats · Yerevan Geo · CSAT & GDPR) */}
      <section className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
        {/* Card A: Polyglot Languages (HY/RU/EN/ES) & Input Formats */}
        <div className="rounded-[26px] bg-white/95 border border-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-3">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold inline-flex items-center gap-1.5">
              <Globe className="w-4 h-4 text-[#111214]" /> Polyglot & Форматы
            </span>
            <span className="text-[10px] font-bold text-[#6B7280]">Whisper v3</span>
          </div>

          {/* Stacked Language Bar */}
          <div className="space-y-2">
            <div className="h-3 w-full rounded-full overflow-hidden flex gap-[2px]">
              {LANGUAGES_SPLIT.map((l) => (
                <div
                  key={l.code}
                  className={`h-full ${l.color}`}
                  style={{ width: `${l.pct}%` }}
                  title={`${l.label}: ${l.pct}%`}
                />
              ))}
            </div>
            <div className="grid grid-cols-2 gap-1.5 text-[10.5px]">
              {LANGUAGES_SPLIT.map((l) => (
                <div key={l.code} className="flex items-center justify-between gap-1">
                  <span className="inline-flex items-center gap-1.5 text-[#525860] font-medium">
                    <span className={`w-2 h-2 rounded-full ${l.color}`} />
                    {l.code}
                  </span>
                  <span className="font-bold tabular-nums">{l.pct}%</span>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-1.5 pt-2 border-t border-black/[0.06]">
            {FORMATS_SPLIT.map((f) => {
              const Icon = f.icon;
              return (
                <div
                  key={f.label}
                  className="rounded-xl bg-[#F6F7F9] py-1.5 px-2 text-center"
                >
                  <Icon className="w-3 h-3 mx-auto text-[#111214]" />
                  <div className="text-[11px] font-extrabold tabular-nums mt-0.5">
                    {f.pct}%
                  </div>
                  <div className="text-[9.5px] text-[#6B7280]">{f.label}</div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card B: Yerevan Districts Breakdown */}
        <div
          onClick={() => onNavigate("routes")}
          className="rounded-[26px] bg-white/95 hover:bg-white border border-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-3 cursor-pointer transition-all"
        >
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-extrabold inline-flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#111214]" /> Районы Еревана
            </span>
            <span className="w-6 h-6 rounded-full border border-black/15 flex items-center justify-center">
              <ArrowUpRight className="w-3 h-3" />
            </span>
          </div>

          <div className="space-y-2.5">
            {YEREVAN_GEO_STATS.map((d) => (
              <div key={d.district} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-bold text-[#111214]">{d.district}</span>
                  <span className="text-[#6B7280] tabular-nums">
                    <strong className="text-[#111214]">{d.count}</strong> · {d.eta}
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-[#F3F5F7] overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      d.district === "Kentron"
                        ? "bg-[#111214]"
                        : d.district === "Arabkir"
                          ? "bg-[#85E6DC]"
                          : "bg-[#D1F366]"
                    }`}
                    style={{ width: `${d.pct * 1.9}%` }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="text-[10.5px] text-[#6B7280] flex items-center justify-between pt-1 border-t border-black/[0.06]">
            <span>Ср. переезд между точками</span>
            <span className="font-extrabold text-[#111214] tabular-nums">8.5 мин</span>
          </div>
        </div>

        {/* Card C: CSAT Reviews & Live GDPR PII Shield */}
        <div className="rounded-[26px] bg-white/95 border border-white p-4 shadow-[0_8px_24px_rgba(15,23,42,0.04)] flex flex-col justify-between gap-3">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-extrabold inline-flex items-center gap-1.5">
                <Star className="w-4 h-4 fill-[#111214] text-[#111214]" /> CSAT Отзывы
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#D1F366] text-[#111214] text-[11px] font-extrabold tabular-nums">
                4.9 ★
              </span>
            </div>

            <div className="rounded-2xl bg-[#F6F7F9] p-2.5 text-[11px] leading-snug text-[#374151]">
              «Мастер приехал ровно в 11:30, смета совпала до драма — очень удобно!»
              <div className="text-[10px] font-bold text-[#6B7280] mt-1">
                Ани С. · Kentron · 34 оценки (авто-пуш через 1ч)
              </div>
            </div>
          </div>

          {/* Live GDPR PII Redaction Shield */}
          <div className="rounded-2xl bg-[#111214] text-white p-3 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-extrabold text-[#D1F366] inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" /> GDPR PII Shield
              </span>
              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-white/12 text-[#85E6DC] tabular-nums">
                {piiRedactedCount} скрыто
              </span>
            </div>
            <div className="text-[10px] text-white/75 flex items-center justify-between tabular-nums">
              <span>{phoneRedactions} телефонов · {codeRedactions} кодов</span>
              <span className="text-[#D1F366] font-bold">до LLM</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
