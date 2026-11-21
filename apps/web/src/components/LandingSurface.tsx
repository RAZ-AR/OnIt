"use client";

import React, { useState } from "react";
import {
  ArrowRight,
  ArrowUpRight,
  Bot,
  Calculator,
  CheckCircle2,
  Cpu,
  Globe,
  MapPin,
  MessageSquare,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";
import { useOnItStore } from "../context/OnItStore";

const FIVE_MODULES = [
  {
    num: "01",
    title: "Multimodal Defect Triage",
    desc: "Gemini 2.5 Flash разбирает фото/видео поломки в строгий JSON параметров сложности — ноль галлюцинаций по ценам.",
    icon: Cpu,
    accent: "bg-white",
  },
  {
    num: "02",
    title: "Deterministic Quote Engine",
    desc: "Расчёт сметы выполняет детерминированный код по прайсу компании: база, коэффициенты этажа/доступа и минимальный выезд.",
    icon: Calculator,
    accent: "bg-[#D1F366]",
  },
  {
    num: "03",
    title: "Geo-Aware Route Optimizer",
    desc: "OSRM + Google Calendar подбирают 2 окна с минимальным пробегом между адресами, чтобы мастер не терял часы в пробках.",
    icon: MapPin,
    accent: "bg-white",
  },
  {
    num: "04",
    title: "Polyglot Voice Bridge",
    desc: "Groq Whisper-large-v3: клиент наговаривает на HY / RU / EN / ES, а мастер получает структурированное ТЗ на родном языке.",
    icon: Globe,
    accent: "bg-[#85E6DC]",
  },
  {
    num: "05",
    title: "HITL Active Learning",
    desc: "При confidence < 0.8 автоответ встаёт на паузу, мастер правит смету в Telegram Mini App и обучает базу компании.",
    icon: Bot,
    accent: "bg-[#111214] text-white",
  },
];

export function LandingSurface() {
  const { setSurface } = useOnItStore();
  const [missedPerDay, setMissedPerDay] = useState(4);
  const [avgTicket, setAvgTicket] = useState(20000);
  const [currency, setCurrency] = useState<"AMD" | "EUR">("AMD");

  const convertedPerMonth = Math.round(missedPerDay * 24 * 0.45);
  const savedRevenue = convertedPerMonth * avgTicket;

  const switchCurrency = (next: "AMD" | "EUR") => {
    setCurrency(next);
    setAvgTicket(next === "AMD" ? 20000 : 85);
  };

  return (
    <div className="w-full max-w-[1380px] rounded-[34px] bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_32px_90px_rgba(15,23,42,0.12)] p-4 sm:p-6 lg:p-8 space-y-6">
      {/* Top Navbar */}
      <header className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-[11px] bg-[#111214] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 16 16" fill="none">
              <path d="M3 11.5L7.5 3.5H10.5L6 11.5H3Z" fill="#D1F366" />
              <circle cx="11.5" cy="10.5" r="2.2" fill="#FFFFFF" />
            </svg>
          </div>
          <div>
            <div className="text-[17px] font-extrabold tracking-tight leading-none">
              OnIt
            </div>
            <div className="text-[10.5px] text-[#6B7280] font-medium">
              onit.ai · im-onit.com
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <span className="px-3 py-1.5 rounded-full bg-white text-[11px] font-bold border border-black/[0.06]">
            $0 Pilot · Yerevan → EU / ENISA
          </span>
          <button
            type="button"
            onClick={() => setSurface("tma")}
            className="px-3.5 py-2 rounded-full bg-[#D1F366] text-[#111214] text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer hover:brightness-95"
          >
            <Smartphone className="w-3.5 h-3.5" /> Telegram Mini App
          </button>
          <button
            type="button"
            onClick={() => setSurface("web")}
            className="px-4 py-2 rounded-full bg-[#111214] text-white text-[12px] font-bold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90"
          >
            Open Web Dispatch <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </header>

      {/* Hero Bento */}
      <section className="grid grid-cols-1 lg:grid-cols-[1.25fr_0.95fr] gap-5 items-stretch">
        <div className="rounded-[28px] bg-white/95 p-6 sm:p-8 border border-white shadow-[0_12px_34px_rgba(15,23,42,0.05)] flex flex-col justify-between gap-6">
          <div className="space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#D1F366] text-[#111214] text-[11px] font-extrabold">
              <Zap className="w-3.5 h-3.5 fill-current" /> Vertical AI Agent for Field Service
            </span>
            <h1 className="text-[32px] sm:text-[42px] font-extrabold tracking-[-0.04em] leading-[1.05] text-[#111214]">
              While you&apos;re on the job,{" "}
              <span className="inline-block bg-[#D1F366] px-2.5 rounded-2xl">
                OnIt
              </span>{" "}
              handles the rest.
            </h1>
            <p className="text-[14.5px] text-[#525860] leading-relaxed max-w-[560px]">
              Автономный мультимодальный AI-диспетчер превращает пропущенные сообщения в WhatsApp, голосовые и фото поломок в точную смету и гео-оптимизированную бронь в Google Calendar за{" "}
              <strong className="text-[#111214]">30 секунд</strong>.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              type="button"
              onClick={() => setSurface("client")}
              className="px-5 py-3 rounded-full bg-[#111214] text-white text-[13px] font-bold inline-flex items-center gap-2 cursor-pointer hover:opacity-90 shadow-md"
            >
              <MessageSquare className="w-4 h-4 text-[#D1F366]" />
              Протестировать как клиент (WhatsApp)
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => setSurface("tma")}
              className="px-5 py-3 rounded-full bg-[#85E6DC] text-[#111214] text-[13px] font-extrabold inline-flex items-center gap-2 cursor-pointer hover:brightness-95"
            >
              <Smartphone className="w-4 h-4" />
              Открыть Telegram Mini App мастера
            </button>
          </div>
        </div>

        {/* Interactive ROI Calculator Card (Dark Obsidian + Lime) */}
        <div className="rounded-[28px] bg-[#111214] text-white p-6 flex flex-col justify-between gap-5 shadow-[0_20px_50px_rgba(17,18,20,0.25)]">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-[11px] font-bold uppercase tracking-wider text-[#D1F366]">
                ROI Калькулятор мастера
              </div>
              <h2 className="text-[20px] font-extrabold tracking-tight mt-0.5">
                Сколько теряется на пропущенных заявках?
              </h2>
            </div>
            <div className="flex rounded-full bg-white/10 p-0.5">
              {(["AMD", "EUR"] as const).map((cur) => (
                <button
                  key={cur}
                  type="button"
                  onClick={() => switchCurrency(cur)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                    currency === cur
                      ? "bg-[#D1F366] text-[#111214]"
                      : "text-white/70"
                  }`}
                >
                  {cur}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="block space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-white/75">Пропущенных обращений в день</span>
                <span className="font-extrabold text-[#D1F366] tabular-nums">
                  {missedPerDay} / день
                </span>
              </div>
              <input
                type="range"
                min={1}
                max={15}
                value={missedPerDay}
                onChange={(e) => setMissedPerDay(Number(e.target.value))}
                className="w-full accent-[#D1F366] cursor-pointer"
              />
            </label>

            <label className="block space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="text-white/75">Средний чек выезда</span>
                <span className="font-extrabold text-[#85E6DC] tabular-nums">
                  {avgTicket.toLocaleString("ru-RU")} {currency}
                </span>
              </div>
              <input
                type="range"
                min={currency === "AMD" ? 8000 : 40}
                max={currency === "AMD" ? 60000 : 250}
                step={currency === "AMD" ? 2000 : 5}
                value={avgTicket}
                onChange={(e) => setAvgTicket(Number(e.target.value))}
                className="w-full accent-[#85E6DC] cursor-pointer"
              />
            </label>
          </div>

          <div className="rounded-[22px] bg-white text-[#111214] p-4 flex items-center justify-between gap-3">
            <div>
              <div className="text-[11px] font-semibold text-[#6B7280]">
                Доп. выручка с OnIt / мес (~45% конверсия)
              </div>
              <div className="text-[26px] font-extrabold tracking-tight tabular-nums leading-tight mt-0.5">
                +{savedRevenue.toLocaleString("ru-RU")} {currency}
              </div>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#D1F366] text-[11px] font-extrabold shrink-0">
              +{convertedPerMonth} заказов
            </span>
          </div>
        </div>
      </section>

      {/* 5 Engineering Innovations Grid */}
      <section className="space-y-3">
        <div className="flex items-center justify-between flex-wrap gap-2 px-1">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#111214]" />
            <h2 className="text-[18px] font-extrabold tracking-tight">
              5 технологических модулей IP (защита перед ENISA / Startup Estonia)
            </h2>
          </div>
          <span className="text-[11.5px] font-semibold text-[#525860] inline-flex items-center gap-1">
            <ShieldCheck className="w-4 h-4 text-[#111214]" /> GDPR PII Redaction built-in
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {FIVE_MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <div
                key={m.num}
                className={`rounded-[24px] p-4 border border-black/[0.06] flex flex-col justify-between gap-3 ${m.accent}`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-mono font-bold opacity-60">
                    {m.num}
                  </span>
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-[13.5px] font-extrabold leading-snug">
                    {m.title}
                  </div>
                  <p className="text-[11.5px] opacity-80 leading-relaxed mt-1.5">
                    {m.desc}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {/* 3-Step Flow Strip */}
      <section className="rounded-[26px] bg-white/90 border border-white p-4 grid grid-cols-1 md:grid-cols-3 gap-3 text-[12px]">
        {[
          {
            step: "1. Клиент пишет в WhatsApp",
            desc: "Фото, видео или голос на HY/RU/EN/ES → OnIt распознаёт дефект и считает точную смету.",
            cta: "Открыть WhatsApp демо",
            target: "client" as const,
          },
          {
            step: "2. Мастер жмёт 1 кнопку в Telegram",
            desc: "В Telegram Mini App прилетает карточка с картой, сметой и кнопками Принять / Править / Перехватить.",
            cta: "Открыть Mini App",
            target: "tma" as const,
          },
          {
            step: "3. Владелец видит всё в Web Hub",
            desc: "Сквозная аналитика, календарь бригады, прайс-матрица и база Active Learning.",
            cta: "Открыть Web Dashboard",
            target: "web" as const,
          },
        ].map((item) => (
          <button
            key={item.step}
            type="button"
            onClick={() => setSurface(item.target)}
            className="text-left rounded-[20px] bg-[#F7F8FA] hover:bg-[#D1F366] transition-colors p-4 flex flex-col justify-between gap-2.5 cursor-pointer"
          >
            <div>
              <div className="font-extrabold text-[13.5px] flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 shrink-0" /> {item.step}
              </div>
              <p className="text-[#525860] mt-1 leading-relaxed">{item.desc}</p>
            </div>
            <span className="text-[11.5px] font-extrabold inline-flex items-center gap-1">
              {item.cta} <ArrowRight className="w-3.5 h-3.5" />
            </span>
          </button>
        ))}
      </section>
    </div>
  );
}
