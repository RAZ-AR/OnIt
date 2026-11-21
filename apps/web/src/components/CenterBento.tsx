"use client";

import React, { useState } from "react";
import {
  EQUIPMENT_MODELS,
  getEquipmentById,
  YEREVAN_STREETS,
} from "@onit/core";
import {
  ArrowUpRight,
  Camera,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Compass,
  Globe,
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
  Wrench,
  Zap,
} from "lucide-react";
import {
  CALENDAR_DAYS_PREVIEW,
  CARD_TONE_STYLES,
  type CardTone,
  type DemoJob,
  type NavTab,
} from "../data/demo-data";
import { AvatarCircle } from "./Avatars";
import { DefectPhotoCard } from "./DefectPhotoCard";

interface CenterBentoProps {
  jobs: DemoJob[];
  viewMode: "today" | "calendar";
  onChangeViewMode: (m: "today" | "calendar") => void;
  servicesCount: number;
  autoQuotedCount: number;
  hitlCount: number;
  hitlLearnedCount: number;
  piiRedactedCount: number;
  onSelectJob: (job: DemoJob) => void;
  onQuickAcceptHitl: (jobId: string) => void;
  onQuickPriceHitl: (jobId: string) => void;
  onOpenNewOrder: (slot?: string) => void;
  onOpenMiniApp: () => void;
  onOpenImportPrice: () => void;
  onNavigate: (tab: NavTab) => void;
}

const LANGUAGES_SPLIT = [
  { code: "HY", pct: 46, color: "bg-[#E5BC73]" },
  { code: "RU", pct: 38, color: "bg-[#141517]" },
  { code: "EN", pct: 10, color: "bg-[#A7CCC9]" },
  { code: "ES", pct: 6, color: "bg-[#BEB7D4]" },
];

const FORMATS_SPLIT = [
  { label: "Голос", pct: 41, icon: Mic },
  { label: "Фото", pct: 34, icon: Camera },
  { label: "Текст", pct: 25, icon: MessageSquare },
];

const YEREVAN_GEO_STATS = [
  { district: "Kentron", pct: 44, count: 18, eta: "6 мин", bar: "bg-[#141517]" },
  { district: "Arabkir", pct: 28, count: 11, eta: "9 мин", bar: "bg-[#E5BC73]" },
  { district: "Avan", pct: 16, count: 7, eta: "13 мин", bar: "bg-[#BEB7D4]" },
  { district: "Erebuni", pct: 12, count: 5, eta: "14 мин", bar: "bg-[#A7CCC9]" },
];

function toneForJob(job: DemoJob): CardTone {
  if (job.cardTone) return job.cardTone;
  if (job.status === "hitl") return "rose";
  if (job.status === "booked") return "ochre";
  if (job.status === "quoted") return "teal";
  return "slate";
}

export function CenterBento({
  jobs,
  viewMode,
  onChangeViewMode,
  servicesCount,
  hitlCount,
  hitlLearnedCount,
  piiRedactedCount,
  onSelectJob,
  onQuickAcceptHitl,
  onQuickPriceHitl,
  onOpenNewOrder,
  onOpenMiniApp,
  onNavigate,
}: CenterBentoProps) {
  const [period, setPeriod] = useState<"7d" | "30d">("30d");

  const bookedCount = jobs.filter((j) => j.status === "booked").length;
  const urgentHitl = jobs.find((j) => j.status === "hitl") ?? null;

  const mult = period === "30d" ? 1 : 0.27;
  const monthRevenueAmd = Math.round((1420000 + bookedCount * 18000) * mult);
  const todayRevenueAmd = 62000 + Math.max(0, jobs.length - 4) * 18000;
  const savedLeads = Math.max(4, Math.round(19 * mult));
  const savedAmd = Math.round(380000 * mult);

  const funnelStages = [
    { label: "Входящие", count: Math.round(48 * (period === "30d" ? 3.2 : 1)), pct: 100, bar: "bg-[#141517]" },
    { label: "AI Triage", count: Math.round(41 * (period === "30d" ? 3.2 : 1)), pct: 85, bar: "bg-[#3C4146]" },
    { label: "Смета выдана", count: Math.round(37 * (period === "30d" ? 3.2 : 1)), pct: 77, bar: "bg-[#BEB7D4]" },
    { label: "Бронь слота", count: Math.round(29 * (period === "30d" ? 3.2 : 1)), pct: 60, bar: "bg-[#E5BC73]" },
    { label: "Визит закрыт", count: Math.round(26 * (period === "30d" ? 3.2 : 1)), pct: 54, bar: "bg-[#A7CCC9]" },
  ];

  const phoneRedactions = Math.round(piiRedactedCount * 0.75);
  const codeRedactions = piiRedactedCount - phoneRedactions;

  return (
    <main className="flex flex-col gap-4 min-w-0">
      {/* EDITORIAL WARM-STONE HERO SHELL (sajon.co geometry adapted for desktop!) */}
      <section className="rounded-[30px] bg-[#E7E8E3] border border-black/[0.06] p-5 space-y-5">
        {/* Top Row: Today / Calendar Pills + Period + New Order */}
        <div className="flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onChangeViewMode("today")}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                viewMode === "today"
                  ? "bg-[#141517] text-white shadow-xs"
                  : "border border-black/20 text-[#141517] hover:bg-black/5"
              }`}
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => onChangeViewMode("calendar")}
              className={`px-5 py-2 rounded-full text-[13px] font-bold transition-all cursor-pointer ${
                viewMode === "calendar"
                  ? "bg-[#141517] text-white shadow-xs"
                  : "border border-black/20 text-[#141517] hover:bg-black/5"
              }`}
            >
              Календарь
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <div className="h-9 p-0.5 rounded-full bg-white/85 border border-black/[0.08] flex items-center">
              {(
                [
                  { id: "7d", label: "7д" },
                  { id: "30d", label: "Месяц" },
                ] as const
              ).map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setPeriod(p.id)}
                  className={`px-3 h-8 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                    period === p.id
                      ? "bg-[#141517] text-white"
                      : "text-black/60 hover:text-[#141517]"
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() => onOpenNewOrder("16:30")}
              className="h-9 px-4 rounded-full bg-[#141517] text-white text-[12px] font-bold inline-flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#E5BC73]" /> Новый заказ
            </button>
          </div>
        </div>

        {/* Giant Editorial Split: Date & Today | Hairline | Monthly Earnings & Next Visit | What To Do Now */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.05fr_1px_1fr_1.15fr] gap-4 items-center">
          <div>
            <div className="text-[12.5px] font-medium text-black/55">
              Вторник · {jobs.length} заказа на сегодня
            </div>
            <div className="flex items-baseline gap-3 mt-1 flex-wrap">
              <h1 className="tma-display text-[46px] font-bold tracking-[-0.04em] leading-[0.95] text-[#141517]">
                14.04
              </h1>
              <span className="tma-display text-[28px] font-semibold tracking-[-0.03em] text-black/75 tabular-nums">
                {todayRevenueAmd.toLocaleString("ru-RU").replace(/,/g, " ")} ֏
              </span>
            </div>
          </div>

          <div className="hidden xl:block h-20 bg-black/15" />

          <div className="grid grid-cols-2 xl:grid-cols-1 gap-3">
            <div>
              <div className="tma-display text-[20px] font-extrabold tabular-nums leading-tight">
                {monthRevenueAmd.toLocaleString("ru-RU").replace(/,/g, " ")} ֏
              </div>
              <div className="text-[11px] text-black/55">
                Заработок ({period === "30d" ? "Апрель" : "7 дней"}) ·{" "}
                <strong className="text-[#1F5753]">+38%</strong>
              </div>
            </div>
            <div>
              <div className="tma-display text-[17px] font-extrabold tabular-nums leading-tight">
                11:30 · Kentron
              </div>
              <div className="text-[11px] text-black/55">
                Ближайший выезд · 6 мин по OSRM
              </div>
            </div>
          </div>

          {/* What To Do Right Now Action Card */}
          {urgentHitl ? (
            <div className="rounded-[24px] bg-[#141517] text-white p-4 space-y-2.5 shadow-md">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10.5px] font-bold uppercase tracking-wider text-[#E5BC73] inline-flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Что делать сейчас
                </span>
                <span className="tma-mono text-[10px] px-2 py-0.5 rounded-full bg-[#CCA2A9]/25 text-[#F2C6CE]">
                  HITL {urgentHitl.confidence}%
                </span>
              </div>
              <div className="text-[13px] font-bold leading-snug">
                Оценить {urgentHitl.title} ({urgentHitl.clientName}, {urgentHitl.district})
              </div>
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  type="button"
                  onClick={() => onQuickPriceHitl(urgentHitl.id)}
                  className="px-3 py-1.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[11px] font-extrabold cursor-pointer hover:brightness-95"
                >
                  ⚡ 40k AMD
                </button>
                <button
                  type="button"
                  onClick={() => onSelectJob(urgentHitl)}
                  className="px-3 py-1.5 rounded-full bg-white/12 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                >
                  📷 Фото
                </button>
                <button
                  type="button"
                  onClick={() => onQuickAcceptHitl(urgentHitl.id)}
                  className="px-3 py-1.5 rounded-full bg-white/12 hover:bg-white/20 text-white text-[11px] font-bold cursor-pointer"
                >
                  ✅ Принять
                </button>
              </div>
            </div>
          ) : (
            <div className="rounded-[24px] bg-[#A7CCC9] text-[#122423] p-4 space-y-2">
              <div className="text-[11px] font-extrabold uppercase inline-flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Что делать сейчас
              </div>
              <div className="text-[13.5px] font-extrabold leading-snug">
                Все заявки оценены! Следующий выезд в 11:30 на ул. Туманяна 15.
              </div>
              <button
                type="button"
                onClick={onOpenMiniApp}
                className="px-3 py-1 rounded-full bg-[#141517] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                <Smartphone className="w-3 h-3" /> Открыть Mini App
              </button>
            </div>
          )}
        </div>

        {/* 4 Compact Telemetry Pills */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 pt-1">
          <div className="rounded-[20px] bg-white/85 px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold text-black/55">Спасённые лиды</div>
              <div className="tma-display text-[16px] font-extrabold tabular-nums">
                {savedLeads} <span className="text-[11px] font-bold text-[#1F5753]">+{Math.round(savedAmd / 1000)}k ֏</span>
              </div>
            </div>
            <Zap className="w-4 h-4 text-[#6B4C1B] shrink-0" />
          </div>

          <div className="rounded-[20px] bg-white/85 px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold text-black/55">Точность AI vs Факт</div>
              <div className="tma-display text-[16px] font-extrabold tabular-nums">
                ±8.4% <span className="text-[10.5px] font-semibold text-black/50">+{hitlLearnedCount + 12} HITL</span>
              </div>
            </div>
            <Sparkles className="w-4 h-4 text-[#473E66] shrink-0" />
          </div>

          <button
            type="button"
            onClick={() => onNavigate("routes")}
            className="text-left rounded-[20px] bg-white/85 hover:bg-white px-3.5 py-2.5 flex items-center justify-between gap-2 cursor-pointer transition-colors"
          >
            <div>
              <div className="text-[10px] font-semibold text-black/55">Экономия OSRM</div>
              <div className="tma-display text-[16px] font-extrabold tabular-nums">
                −48 мин/д <span className="text-[10.5px] font-semibold text-black/50">−14.2 км</span>
              </div>
            </div>
            <Compass className="w-4 h-4 text-[#1F5753] shrink-0" />
          </button>

          <div className="rounded-[20px] bg-[#141517] text-white px-3.5 py-2.5 flex items-center justify-between gap-2">
            <div>
              <div className="text-[10px] font-semibold text-[#E5BC73]">GDPR PII Shield</div>
              <div className="tma-display text-[16px] font-extrabold tabular-nums">
                {piiRedactedCount} <span className="text-[10px] font-normal text-white/65">скрыто до LLM</span>
              </div>
            </div>
            <ShieldCheck className="w-4 h-4 text-[#A7CCC9] shrink-0" />
          </div>
        </div>
      </section>

      {/* MAIN PURE WHITE SHEET: Either LARGE Order Cards OR Calendar Day Cards */}
      <section className="rounded-[32px] bg-white border border-black/[0.05] p-5 shadow-[0_12px_34px_rgba(20,21,23,0.04)] space-y-4">
        {viewMode === "today" ? (
          <>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <h2 className="tma-display text-[18px] font-extrabold tracking-tight">
                  Заказы сегодня ({jobs.length})
                </h2>
                <p className="text-[11.5px] text-black/55">
                  Нажмите на любую карточку — откроется фото дефекта с Vision AI, справочник модели, чат и смета
                </p>
              </div>
              <div className="flex items-center gap-2 text-[11px] font-semibold text-black/60">
                <span className="px-3 py-1 rounded-full bg-[#F4F5F1]">
                  {EQUIPMENT_MODELS.length} моделей · {YEREVAN_STREETS.length} улиц · {servicesCount} услуг
                </span>
              </div>
            </div>

            {/* LARGE TACTILE COLOR-CODED ORDER CARDS */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {jobs.map((job) => {
                const tone = CARD_TONE_STYLES[toneForJob(job)];
                const equip = getEquipmentById(job.equipmentModelId);
                return (
                  <button
                    key={job.id}
                    type="button"
                    onClick={() => onSelectJob(job)}
                    style={{ backgroundColor: tone.bg, color: tone.ink }}
                    className="text-left rounded-[28px] p-5 flex flex-col justify-between gap-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(20,21,23,0.10)] cursor-pointer min-h-[192px]"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 space-y-1.5">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-black/10">
                            {job.channel === "telegram" ? "Telegram" : "WhatsApp"} · {job.voiceLangBadge ?? "RU"}
                          </span>
                          {job.status === "hitl" && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded-full bg-[#141517] text-[#E5BC73]">
                              HITL Пауза
                            </span>
                          )}
                        </div>
                        <div className="tma-display text-[21px] font-extrabold leading-[1.12] tracking-[-0.02em]">
                          {job.title}
                        </div>
                        <div
                          className="text-[12px] font-semibold truncate"
                          style={{ color: tone.muted }}
                        >
                          {equip
                            ? `${equip.brand} ${equip.model} (${equip.refrigerant ?? equip.capacityLabel})`
                            : job.address}
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <DefectPhotoCard
                          kind={job.photoKind ?? "frost_pipe"}
                          compact
                        />
                        <div className="flex items-center gap-1">
                          <AvatarCircle who={job.avatarKey} size="xs" />
                          <span className="text-[10.5px] font-bold">{job.clientName}</span>
                        </div>
                      </div>
                    </div>

                    {/* Boarding-Pass Bottom Bar */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-black/10">
                      <div>
                        <div className="tma-display text-[16px] font-extrabold tabular-nums leading-tight">
                          {job.slotTime}
                        </div>
                        <div
                          className="text-[10.5px] font-semibold"
                          style={{ color: tone.muted }}
                        >
                          {job.district} · {job.etaMinutes ?? 7}м
                        </div>
                      </div>

                      <span
                        className="tma-mono px-3.5 py-2 rounded-full text-[11.5px] font-bold shrink-0"
                        style={{
                          backgroundColor: tone.pillBg,
                          color: tone.pillText,
                        }}
                      >
                        {job.priceRange}
                      </span>

                      <div className="text-right">
                        <div className="tma-display text-[16px] font-extrabold tabular-nums leading-tight">
                          {job.endTime ?? `${job.durationMin}м`}
                        </div>
                        <div
                          className="text-[10.5px] font-semibold"
                          style={{ color: tone.muted }}
                        >
                          AI {job.confidence}%
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          /* CALENDAR DAY CARDS (exact right-screen sajon.co layout!) */
          <div className="space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="tma-display text-[20px] font-semibold text-black/25">
                МАРТ
              </span>
              <div className="flex items-center gap-3">
                <ChevronLeft className="w-4 h-4 text-black/45" />
                <span className="tma-display text-[22px] font-extrabold">
                  АПРЕЛЬ 2026
                </span>
                <ChevronRight className="w-4 h-4 text-black/45" />
              </div>
              <span className="tma-display text-[20px] font-semibold text-black/25">
                МАЙ
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {CALENDAR_DAYS_PREVIEW.map((day) => {
                const tone = CARD_TONE_STYLES[day.tone];
                return (
                  <div
                    key={day.dayNum}
                    style={{ backgroundColor: tone.bg, color: tone.ink }}
                    className="rounded-[28px] p-5 grid grid-cols-[104px_1fr] gap-3 items-stretch"
                  >
                    <div className="flex flex-col justify-center">
                      <div className="text-[12px] font-medium opacity-70">
                        {day.dayName}
                      </div>
                      <div className="tma-display text-[40px] font-bold leading-none mt-1">
                        {day.dayNum}
                      </div>
                      <div className="tma-display text-[24px] font-medium leading-none mt-0.5 opacity-85">
                        {day.monthShort}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2">
                      {day.slots.map((sl) => (
                        <div
                          key={sl.hour}
                          className="border-l border-black/15 pl-2.5 flex flex-col justify-between gap-2 min-h-[96px]"
                        >
                          <span className="tma-mono text-[11px] font-bold opacity-70">
                            {sl.hour}
                          </span>
                          {sl.label ? (
                            <button
                              type="button"
                              onClick={() => {
                                const match = jobs.find((j) => j.id === sl.jobId) ?? jobs[0];
                                if (match) onSelectJob(match);
                              }}
                              style={{
                                backgroundColor: tone.pillBg,
                                color: tone.pillText,
                              }}
                              className="px-2.5 py-1.5 rounded-xl text-[10.5px] font-bold leading-tight text-left cursor-pointer hover:opacity-90"
                            >
                              {sl.label}
                            </button>
                          ) : (
                            <span className="text-[10px] opacity-45">Окно OSRM</span>
                          )}
                          <button
                            type="button"
                            onClick={() => onOpenNewOrder(sl.hour)}
                            aria-label={`Create order at ${sl.hour}`}
                            className="w-6 h-6 rounded-full border border-black/25 flex items-center justify-center hover:bg-black/10 cursor-pointer"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </section>

      {/* BOTTOM INTELLIGENCE BENTO: Funnel + Polyglot + Yerevan Geo + CSAT/GDPR */}
      <section className="grid grid-cols-1 xl:grid-cols-[1.15fr_1fr] gap-4">
        {/* 5-Stage Conversion Funnel */}
        <div className="rounded-[28px] bg-white border border-black/[0.05] p-5 space-y-3">
          <div className="flex items-center justify-between gap-2">
            <span className="tma-display text-[15px] font-extrabold inline-flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4" /> Воронка конверсии
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[10.5px] font-extrabold tabular-nums">
              54% в закрытие
            </span>
          </div>
          <div className="space-y-2">
            {funnelStages.map((stage) => (
              <div key={stage.label} className="space-y-1">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="font-semibold text-black/70">{stage.label}</span>
                  <span className="tma-mono font-bold">
                    {stage.count}{" "}
                    <span className="text-black/45 font-medium">({stage.pct}%)</span>
                  </span>
                </div>
                <div className="h-3 w-full rounded-full bg-[#F2F3EE] overflow-hidden p-[1px]">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${stage.bar}`}
                    style={{ width: `${stage.pct}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right Stack: Polyglot + Districts + CSAT/GDPR */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Polyglot & Formats */}
          <div className="rounded-[26px] bg-white border border-black/[0.05] p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="tma-display text-[13.5px] font-extrabold inline-flex items-center gap-1.5">
                <Globe className="w-4 h-4" /> Языки & Форматы
              </span>
            </div>
            <div className="space-y-2">
              <div className="h-2.5 w-full rounded-full overflow-hidden flex gap-[2px]">
                {LANGUAGES_SPLIT.map((l) => (
                  <div
                    key={l.code}
                    className={`h-full ${l.color}`}
                    style={{ width: `${l.pct}%` }}
                  />
                ))}
              </div>
              <div className="grid grid-cols-2 gap-1 text-[10.5px]">
                {LANGUAGES_SPLIT.map((l) => (
                  <div key={l.code} className="flex items-center justify-between">
                    <span className="inline-flex items-center gap-1 font-medium text-black/65">
                      <span className={`w-2 h-2 rounded-full ${l.color}`} />
                      {l.code}
                    </span>
                    <span className="tma-mono font-bold">{l.pct}%</span>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-3 gap-1 pt-2 border-t border-black/[0.06]">
              {FORMATS_SPLIT.map((f) => {
                const Icon = f.icon;
                return (
                  <div key={f.label} className="rounded-xl bg-[#F4F5F1] py-1.5 text-center">
                    <Icon className="w-3 h-3 mx-auto" />
                    <div className="tma-mono text-[10.5px] font-extrabold mt-0.5">{f.pct}%</div>
                    <div className="text-[9px] text-black/55">{f.label}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Yerevan Districts + CSAT/GDPR */}
          <div className="rounded-[26px] bg-white border border-black/[0.05] p-4 flex flex-col justify-between gap-3">
            <div className="flex items-center justify-between">
              <span className="tma-display text-[13.5px] font-extrabold inline-flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Ереван · CSAT
              </span>
              <span className="px-2 py-0.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[10.5px] font-extrabold">
                4.9 ★
              </span>
            </div>

            <div className="space-y-1.5">
              {YEREVAN_GEO_STATS.map((d) => (
                <div key={d.district} className="flex items-center justify-between text-[11px] gap-2">
                  <span className="font-bold w-16 truncate">{d.district}</span>
                  <div className="flex-1 h-1.5 rounded-full bg-[#F2F3EE] overflow-hidden">
                    <div
                      className={`h-full rounded-full ${d.bar}`}
                      style={{ width: `${d.pct * 2}%` }}
                    />
                  </div>
                  <span className="tma-mono text-[10px] text-black/60 w-10 text-right">
                    {d.eta}
                  </span>
                </div>
              ))}
            </div>

            <div className="rounded-2xl bg-[#141517] text-white px-3 py-2 flex items-center justify-between text-[10px]">
              <span className="font-bold text-[#E5BC73] inline-flex items-center gap-1">
                <Wrench className="w-3 h-3" /> {phoneRedactions} тел · {codeRedactions} кодов
              </span>
              <span className="text-[#A7CCC9] font-bold">GDPR ✓</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
