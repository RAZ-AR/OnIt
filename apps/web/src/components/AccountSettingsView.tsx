"use client";

import React, { useState } from "react";
import type { Currency } from "@onit/core";
import {
  ArrowLeft,
  Bot,
  Building2,
  Calendar,
  Check,
  Clock,
  Globe,
  MapPin,
  MessageCircle,
  ShieldCheck,
  SlidersHorizontal,
  Smartphone,
  Sparkles,
  User,
  Wallet,
} from "lucide-react";
import {
  useOnItStore,
  type DaySchedule,
  type WorkspaceSettings,
} from "../context/OnItStore";
import { AvatarCircle } from "./Avatars";

const LANG_OPTIONS: Array<{
  code: "ru" | "hy" | "en" | "es";
  label: string;
  native: string;
}> = [
  { code: "ru", label: "RU", native: "Русский" },
  { code: "hy", label: "HY", native: "Հայերեն" },
  { code: "en", label: "EN", native: "English" },
  { code: "es", label: "ES", native: "Español" },
];

const CITY_PRESETS: Array<{
  city: WorkspaceSettings["city"];
  label: string;
  tz: string;
  currency: Currency;
}> = [
  { city: "Yerevan", label: "Ереван", tz: "Asia/Yerevan (UTC+4)", currency: "AMD" },
  { city: "Valencia", label: "Валенсия (ЕС)", tz: "Europe/Madrid (UTC+1)", currency: "EUR" },
  { city: "Tallinn", label: "Таллин (ЕС)", tz: "Europe/Tallinn (UTC+2)", currency: "EUR" },
];

const ALL_ZONES = [
  "Kentron",
  "Arabkir",
  "Avan",
  "Erebuni",
  "Davtashen",
  "Nor Nork",
  "Malatia",
];

function buildGreetingPreview(s: WorkspaceSettings): string {
  if (s.assistantTone === "concise") {
    return `OnIt · ${s.companyName}. Пришлите фото поломки — посчитаю смету и предложу 2 окна мастера.`;
  }
  if (s.assistantTone === "professional") {
    return `Здравствуйте! Вас приветствует цифровой диспетчер ${s.companyName}. Прикрепите фото или голосовое описание неисправности для расчёта стоимости.`;
  }
  return `Привет! Это OnIt, цифровой ассистент ${s.companyName}. Уже смотрю ваше фото — посчитаю смету и подберу ближайшее окно мастера за 30 секунд.`;
}

export function AccountSettingsView({
  onBack,
  compact = false,
}: {
  onBack?: () => void;
  compact?: boolean;
}) {
  const {
    settings,
    updateSettings,
    matrix,
    updateCurrency,
    updateCalloutPolicy,
    updateConfidenceThreshold,
    notify,
  } = useOnItStore();

  const [section, setSection] = useState<"profile" | "hours" | "languages" | "ai">("profile");

  const toggleDay = (idx: number) => {
    const next = settings.workingDays.map((d, i) =>
      i === idx ? { ...d, enabled: !d.enabled } : d
    );
    updateSettings({ workingDays: next });
  };

  const updateDayTime = (idx: number, field: "start" | "end", value: string) => {
    const next = settings.workingDays.map((d, i) =>
      i === idx ? { ...d, [field]: value } : d
    );
    updateSettings({ workingDays: next });
  };

  const applyHoursPreset = (preset: "weekdays" | "sixdays" | "daily") => {
    const next: DaySchedule[] = settings.workingDays.map((d, i) => {
      if (preset === "weekdays") {
        return { ...d, enabled: i < 5, start: "09:00", end: "18:00" };
      }
      if (preset === "sixdays") {
        return { ...d, enabled: i < 6, start: i === 5 ? "10:00" : "09:00", end: i === 5 ? "17:00" : "20:00" };
      }
      return { ...d, enabled: true, start: "09:00", end: "21:00" };
    });
    updateSettings({ workingDays: next });
    notify("График работы обновлён и синхронизирован с Google Calendar");
  };

  const toggleClientLang = (code: "ru" | "hy" | "en" | "es") => {
    const has = settings.clientLanguages.includes(code);
    if (has && settings.clientLanguages.length === 1) return;
    const next = has
      ? settings.clientLanguages.filter((c) => c !== code)
      : [...settings.clientLanguages, code];
    updateSettings({ clientLanguages: next });
  };

  const toggleZone = (z: string) => {
    const has = settings.serviceZones.includes(z);
    const next = has
      ? settings.serviceZones.filter((x) => x !== z)
      : [...settings.serviceZones, z];
    updateSettings({ serviceZones: next });
  };

  const activeDaysCount = settings.workingDays.filter((d) => d.enabled).length;

  return (
    <main className="flex flex-col gap-4 min-w-0">
      {/* Warm Stone Editorial Account Header */}
      <section className="rounded-[28px] bg-[#E7E8E3] border border-black/[0.06] p-4 sm:p-5 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to Dispatch"
                className="w-9 h-9 rounded-full bg-white text-[#141517] flex items-center justify-center shadow-2xs cursor-pointer shrink-0 hover:bg-black/5"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <AvatarCircle who="aram" size="lg" />
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="tma-display text-[20px] sm:text-[22px] font-extrabold tracking-tight leading-tight truncate">
                  {settings.masterName}
                </h1>
                <span className="px-2.5 py-0.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[10px] font-extrabold">
                  Owner · Pilot $0
                </span>
              </div>
              <p className="text-[12px] text-black/60 truncate">
                {settings.companyName} · {settings.timezone} · {matrix.currency}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => notify("Все настройки личного кабинета сохранены")}
            className="px-4 py-2 rounded-full bg-[#141517] text-[#E5BC73] text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer hover:opacity-90 shrink-0"
          >
            <Check className="w-3.5 h-3.5" /> Сохранить
          </button>
        </div>

        {/* Quick Summary Strip */}
        <div className={`grid gap-2 ${compact ? "grid-cols-2" : "grid-cols-2 sm:grid-cols-4"}`}>
          <div className="rounded-[18px] bg-white/85 px-3 py-2">
            <div className="text-[10px] font-semibold text-black/55">График</div>
            <div className="tma-display text-[14px] font-extrabold">
              {activeDaysCount} дн/нед
            </div>
          </div>
          <div className="rounded-[18px] bg-white/85 px-3 py-2">
            <div className="text-[10px] font-semibold text-black/55">Языки AI</div>
            <div className="tma-mono text-[13px] font-extrabold uppercase">
              {settings.clientLanguages.join(" · ")}
            </div>
          </div>
          <div className="rounded-[18px] bg-white/85 px-3 py-2">
            <div className="text-[10px] font-semibold text-black/55">Зоны выезда</div>
            <div className="tma-display text-[14px] font-extrabold">
              {settings.serviceZones.length} р-на · ≤{settings.maxTravelMinutes}м
            </div>
          </div>
          <div className="rounded-[18px] bg-[#141517] text-white px-3 py-2">
            <div className="text-[10px] font-semibold text-[#E5BC73]">Порог HITL</div>
            <div className="tma-mono text-[14px] font-extrabold">
              {Math.round(matrix.confidenceThreshold * 100)}% · {settings.llmRegion === "eu_vertex" ? "EU" : "$0"}
            </div>
          </div>
        </div>

        {/* Section Pill Switcher */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
          {(
            [
              { id: "profile", label: "Профиль", icon: User },
              { id: "hours", label: "Время работы", icon: Clock },
              { id: "languages", label: "Языки", icon: Globe },
              { id: "ai", label: "AI, Зоны & GDPR", icon: SlidersHorizontal },
            ] as const
          ).map((t) => {
            const Icon = t.icon;
            const active = section === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setSection(t.id)}
                className={`px-3.5 py-2 rounded-full text-[12px] font-bold inline-flex items-center gap-1.5 shrink-0 transition-all cursor-pointer ${
                  active
                    ? "bg-[#141517] text-white shadow-xs"
                    : "bg-white/80 text-black/70 hover:bg-white hover:text-[#141517]"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {t.label}
              </button>
            );
          })}
        </div>
      </section>

      {/* SECTION 1: PROFILE, CURRENCY & AI PERSONA */}
      {section === "profile" && (
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
          <div className="rounded-[28px] bg-white border border-black/[0.06] p-5 space-y-3.5">
            <div className="tma-display text-[15px] font-extrabold flex items-center gap-1.5">
              <Building2 className="w-4 h-4" /> Профиль бизнеса и мастера
            </div>

            <div className="space-y-2.5 text-[12px]">
              <label className="block space-y-1">
                <span className="font-bold text-black/65">Название компании (видит клиент)</span>
                <input
                  value={settings.companyName}
                  onChange={(e) => updateSettings({ companyName: e.target.value })}
                  className="w-full rounded-2xl bg-[#F4F5F1] px-3.5 py-2.5 font-semibold outline-none focus:ring-2 focus:ring-black/15"
                />
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <label className="block space-y-1">
                  <span className="font-bold text-black/65">Имя мастера</span>
                  <input
                    value={settings.masterName}
                    onChange={(e) => updateSettings({ masterName: e.target.value })}
                    className="w-full rounded-2xl bg-[#F4F5F1] px-3.5 py-2.5 font-semibold outline-none"
                  />
                </label>
                <label className="block space-y-1">
                  <span className="font-bold text-black/65">Рабочий телефон</span>
                  <input
                    value={settings.masterPhone}
                    onChange={(e) => updateSettings({ masterPhone: e.target.value })}
                    className="tma-mono w-full rounded-2xl bg-[#F4F5F1] px-3.5 py-2.5 font-semibold outline-none"
                  />
                </label>
              </div>
            </div>

            {/* City & Timezone */}
            <div className="space-y-1.5 pt-1">
              <div className="text-[11.5px] font-bold text-black/65">Город и часовой пояс</div>
              <div className="flex flex-wrap gap-1.5">
                {CITY_PRESETS.map((c) => {
                  const active = settings.city === c.city;
                  return (
                    <button
                      key={c.city}
                      type="button"
                      onClick={() => {
                        updateSettings({ city: c.city, timezone: c.tz });
                        updateCurrency(c.currency);
                        notify(`Регион переключён на ${c.label} (${c.currency})`);
                      }}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold cursor-pointer transition-colors ${
                        active
                          ? "bg-[#141517] text-white"
                          : "bg-[#F4F5F1] text-black/70 hover:bg-[#E5BC73]/40"
                      }`}
                    >
                      {c.label} · {c.currency}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Currency Picker */}
            <div className="space-y-1.5">
              <div className="text-[11.5px] font-bold text-black/65 flex items-center gap-1">
                <Wallet className="w-3.5 h-3.5" /> Валюта сметчика
              </div>
              <div className="grid grid-cols-4 gap-1.5">
                {(["AMD", "EUR", "USD", "RUB"] as const).map((cur) => (
                  <button
                    key={cur}
                    type="button"
                    onClick={() => updateCurrency(cur)}
                    className={`tma-mono py-2 rounded-xl text-[12px] font-bold cursor-pointer ${
                      matrix.currency === cur
                        ? "bg-[#E5BC73] text-[#1E1A14]"
                        : "bg-[#F4F5F1] text-black/65 hover:bg-black/10"
                    }`}
                  >
                    {cur}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* AI Assistant Persona + Live Preview */}
          <div className="rounded-[28px] bg-white border border-black/[0.06] p-5 flex flex-col justify-between gap-4">
            <div className="space-y-3">
              <div className="tma-display text-[15px] font-extrabold flex items-center gap-1.5">
                <Sparkles className="w-4 h-4" /> Стиль общения AI-диспетчера
              </div>

              <div className="grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "friendly", label: "Дружелюбный" },
                    { id: "professional", label: "Деловой" },
                    { id: "concise", label: "Краткий" },
                  ] as const
                ).map((tone) => (
                  <button
                    key={tone.id}
                    type="button"
                    onClick={() => updateSettings({ assistantTone: tone.id })}
                    className={`py-2.5 px-2 rounded-2xl text-[11.5px] font-bold cursor-pointer transition-all ${
                      settings.assistantTone === tone.id
                        ? "bg-[#141517] text-[#E5BC73]"
                        : "bg-[#F4F5F1] text-black/70 hover:bg-black/10"
                    }`}
                  >
                    {tone.label}
                  </button>
                ))}
              </div>

              {/* Live WhatsApp Greeting Preview */}
              <div className="rounded-[22px] bg-[#E7E8E3] p-4 space-y-2">
                <div className="text-[10.5px] font-bold uppercase tracking-wider text-black/55">
                  Живое превью приветствия в WhatsApp
                </div>
                <div className="rounded-2xl rounded-bl-sm bg-white p-3 text-[12.5px] leading-relaxed shadow-2xs">
                  {buildGreetingPreview(settings)}
                </div>
              </div>
            </div>

            {/* Connected Channels Summary */}
            <div className="space-y-2 pt-2 border-t border-black/[0.06]">
              <div className="text-[11.5px] font-bold text-black/65">Подключённые интеграции</div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                {(
                  [
                    { key: "whatsapp", label: "WhatsApp Cloud", icon: MessageCircle },
                    { key: "telegram", label: "Telegram Mini App", icon: Smartphone },
                    { key: "googleCalendar", label: "Google Calendar", icon: Calendar },
                    { key: "osrm", label: "OSRM Geo", icon: MapPin },
                  ] as const
                ).map((ch) => {
                  const Icon = ch.icon;
                  const on = settings.integrations[ch.key];
                  return (
                    <button
                      key={ch.key}
                      type="button"
                      onClick={() =>
                        updateSettings({
                          integrations: {
                            ...settings.integrations,
                            [ch.key]: !on,
                          },
                        })
                      }
                      className={`p-2.5 rounded-2xl flex items-center justify-between gap-2 font-bold cursor-pointer transition-colors ${
                        on
                          ? "bg-[#A7CCC9]/45 text-[#122423]"
                          : "bg-[#F4F5F1] text-black/45"
                      }`}
                    >
                      <span className="inline-flex items-center gap-1.5 truncate">
                        <Icon className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{ch.label}</span>
                      </span>
                      <span className="text-[10px] shrink-0">{on ? "ON" : "OFF"}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 2: WORKING HOURS, BUFFER & AFTER-HOURS */}
      {section === "hours" && (
        <div className="rounded-[28px] bg-white border border-black/[0.06] p-5 space-y-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <h2 className="tma-display text-[16px] font-extrabold">
                Время работы и слоты календаря
              </h2>
              <p className="text-[12px] text-black/55">
                OnIt предлагает клиентам окна только внутри рабочих часов с учётом времени в пути OSRM
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => applyHoursPreset("weekdays")}
                className="px-3 py-1.5 rounded-full bg-[#F4F5F1] hover:bg-[#E5BC73]/50 text-[11px] font-bold cursor-pointer"
              >
                Пн–Пт 09–18
              </button>
              <button
                type="button"
                onClick={() => applyHoursPreset("sixdays")}
                className="px-3 py-1.5 rounded-full bg-[#F4F5F1] hover:bg-[#E5BC73]/50 text-[11px] font-bold cursor-pointer"
              >
                Пн–Сб 09–20
              </button>
              <button
                type="button"
                onClick={() => applyHoursPreset("daily")}
                className="px-3 py-1.5 rounded-full bg-[#F4F5F1] hover:bg-[#E5BC73]/50 text-[11px] font-bold cursor-pointer"
              >
                Без выходных
              </button>
            </div>
          </div>

          {/* 7-Day Interactive Schedule Matrix */}
          <div className="space-y-2">
            {settings.workingDays.map((row, idx) => (
              <div
                key={row.day}
                className={`rounded-2xl px-3.5 py-2.5 flex flex-wrap items-center justify-between gap-2 transition-colors ${
                  row.enabled ? "bg-[#F4F5F1]" : "bg-[#F9F9F7] opacity-60"
                }`}
              >
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => toggleDay(idx)}
                    aria-label={`Toggle ${row.day}`}
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                      row.enabled ? "bg-[#141517]" : "bg-black/20"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full transition-transform ${
                        row.enabled
                          ? "translate-x-4 bg-[#E5BC73]"
                          : "translate-x-0 bg-white"
                      }`}
                    />
                  </button>
                  <span className="tma-display text-[14px] font-extrabold w-8">
                    {row.day}
                  </span>
                </div>

                {row.enabled ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="time"
                      value={row.start}
                      onChange={(e) => updateDayTime(idx, "start", e.target.value)}
                      aria-label={`${row.day} start time`}
                      className="tma-mono rounded-xl bg-white border border-black/10 px-2.5 py-1.5 text-[12px] font-bold outline-none"
                    />
                    <span className="text-black/40 font-bold">—</span>
                    <input
                      type="time"
                      value={row.end}
                      onChange={(e) => updateDayTime(idx, "end", e.target.value)}
                      aria-label={`${row.day} end time`}
                      className="tma-mono rounded-xl bg-white border border-black/10 px-2.5 py-1.5 text-[12px] font-bold outline-none"
                    />
                  </div>
                ) : (
                  <span className="text-[11.5px] font-semibold text-black/45">
                    Выходной (AI принимает на завтра)
                  </span>
                )}
              </div>
            ))}
          </div>

          {/* Buffer, Max Jobs & Night Mode */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-black/[0.06]">
            <div className="rounded-2xl bg-[#F4F5F1] p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-black/60">Буфер между заказами</div>
              <div className="flex gap-1.5">
                {[10, 15, 30].map((m) => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => updateSettings({ bufferMinutes: m })}
                    className={`tma-mono flex-1 py-1.5 rounded-xl text-[11.5px] font-bold cursor-pointer ${
                      settings.bufferMinutes === m
                        ? "bg-[#141517] text-[#E5BC73]"
                        : "bg-white text-black/70"
                    }`}
                  >
                    {m}м
                  </button>
                ))}
              </div>
            </div>

            <div className="rounded-2xl bg-[#F4F5F1] p-3.5 space-y-2">
              <div className="text-[11px] font-bold text-black/60">Лимит визитов в день</div>
              <div className="flex gap-1.5">
                {[4, 6, 8, 10].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => updateSettings({ maxJobsPerDay: n })}
                    className={`tma-mono flex-1 py-1.5 rounded-xl text-[11.5px] font-bold cursor-pointer ${
                      settings.maxJobsPerDay === n
                        ? "bg-[#141517] text-[#E5BC73]"
                        : "bg-white text-black/70"
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                updateSettings({ afterHoursAutoReply: !settings.afterHoursAutoReply })
              }
              className={`rounded-2xl p-3.5 text-left flex flex-col justify-between gap-1 cursor-pointer transition-colors ${
                settings.afterHoursAutoReply
                  ? "bg-[#E5BC73] text-[#1E1A14]"
                  : "bg-[#F4F5F1] text-black/60"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-extrabold">Ночной режим 24/7</span>
                <span className="tma-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-black/15">
                  {settings.afterHoursAutoReply ? "ON" : "OFF"}
                </span>
              </div>
              <div className="text-[11px] opacity-80 leading-snug">
                Отвечать вне смены и бронировать слоты на следующее утро
              </div>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 3: POLYGLOT LANGUAGES */}
      {section === "languages" && (
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
          <div className="rounded-[28px] bg-white border border-black/[0.06] p-5 space-y-3.5">
            <div>
              <h2 className="tma-display text-[16px] font-extrabold">
                Язык мастера и ТЗ
              </h2>
              <p className="text-[12px] text-black/55 mt-0.5">
                На этом языке OnIt присылает карточки заказов и переводы голосовых в Telegram
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2.5">
              {LANG_OPTIONS.map((l) => {
                const active = settings.masterLanguage === l.code;
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => {
                      updateSettings({ masterLanguage: l.code });
                      notify(`Язык мастера: ${l.native}`);
                    }}
                    className={`p-3.5 rounded-[22px] text-left transition-all cursor-pointer border ${
                      active
                        ? "bg-[#141517] text-white border-[#141517]"
                        : "bg-[#F4F5F1] text-[#141517] border-transparent hover:border-black/20"
                    }`}
                  >
                    <div className="tma-mono text-[11px] font-bold opacity-70">{l.label}</div>
                    <div className="tma-display text-[16px] font-extrabold mt-0.5">
                      {l.native}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-[28px] bg-white border border-black/[0.06] p-5 space-y-3.5">
            <div>
              <h2 className="tma-display text-[16px] font-extrabold">
                Языки общения с клиентами (Polyglot)
              </h2>
              <p className="text-[12px] text-black/55 mt-0.5">
                Клиент пишет или говорит на любом из выбранных языков — ответ уходит на его языке
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {LANG_OPTIONS.map((l) => {
                const active = settings.clientLanguages.includes(l.code);
                return (
                  <button
                    key={l.code}
                    type="button"
                    onClick={() => toggleClientLang(l.code)}
                    className={`p-3 rounded-2xl flex items-center justify-between font-bold text-[12.5px] cursor-pointer transition-colors ${
                      active
                        ? "bg-[#A7CCC9] text-[#122423]"
                        : "bg-[#F4F5F1] text-black/50"
                    }`}
                  >
                    <span>{l.native}</span>
                    <span className="tma-mono text-[10.5px]">
                      {active ? "✓ ON" : "OFF"}
                    </span>
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() =>
                updateSettings({ autoDetectVoiceLang: !settings.autoDetectVoiceLang })
              }
              className="w-full rounded-2xl bg-[#F4F5F1] p-3.5 flex items-center justify-between gap-2 cursor-pointer"
            >
              <div className="text-left">
                <div className="text-[12.5px] font-extrabold">
                  Автоопределение языка голосовых (Groq Whisper v3)
                </div>
                <div className="text-[11px] text-black/55">
                  Мгновенный мост HY / RU / EN / ES → язык мастера
                </div>
              </div>
              <span
                className={`px-3 py-1 rounded-full text-[11px] font-extrabold ${
                  settings.autoDetectVoiceLang
                    ? "bg-[#141517] text-[#E5BC73]"
                    : "bg-black/15 text-black/60"
                }`}
              >
                {settings.autoDetectVoiceLang ? "ВКЛ" : "ВЫКЛ"}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* SECTION 4: ZONES, CALLOUT POLICY, AI & GDPR */}
      {section === "ai" && (
        <div className={`grid gap-4 ${compact ? "grid-cols-1" : "grid-cols-1 xl:grid-cols-2"}`}>
          {/* Zones & Callout Policy */}
          <div className="rounded-[28px] bg-white border border-black/[0.06] p-5 space-y-4">
            <div className="space-y-2">
              <div className="tma-display text-[15px] font-extrabold flex items-center gap-1.5">
                <MapPin className="w-4 h-4" /> Зоны выезда и OSRM лимит
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ALL_ZONES.map((z) => {
                  const active = settings.serviceZones.includes(z);
                  return (
                    <button
                      key={z}
                      type="button"
                      onClick={() => toggleZone(z)}
                      className={`px-3 py-1.5 rounded-full text-[11.5px] font-bold cursor-pointer ${
                        active ? "bg-[#141517] text-white" : "bg-[#F4F5F1] text-black/65"
                      }`}
                    >
                      {active ? "✓ " : ""}
                      {z}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between text-[12px]">
                <span className="font-bold text-black/65">Макс. время переезда OSRM</span>
                <span className="tma-mono font-extrabold">{settings.maxTravelMinutes} мин</span>
              </div>
              <input
                type="range"
                min={10}
                max={45}
                step={5}
                value={settings.maxTravelMinutes}
                onChange={(e) => updateSettings({ maxTravelMinutes: Number(e.target.value) })}
                aria-label="Max travel minutes"
                className="w-full accent-[#141517] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-black/[0.06]">
              <label className="block space-y-1 text-[11.5px]">
                <span className="font-bold text-black/60">
                  Выезд ({matrix.currency})
                </span>
                <input
                  type="number"
                  value={matrix.callout.fee}
                  onChange={(e) =>
                    updateCalloutPolicy({ fee: Math.max(0, Number(e.target.value)) })
                  }
                  className="tma-mono w-full rounded-xl bg-[#F4F5F1] px-3 py-2 font-bold outline-none"
                />
              </label>
              <label className="block space-y-1 text-[11.5px]">
                <span className="font-bold text-black/60">
                  Мин. заказ ({matrix.currency})
                </span>
                <input
                  type="number"
                  value={matrix.callout.minimumOrderTotal}
                  onChange={(e) =>
                    updateCalloutPolicy({
                      minimumOrderTotal: Math.max(0, Number(e.target.value)),
                    })
                  }
                  className="tma-mono w-full rounded-xl bg-[#F4F5F1] px-3 py-2 font-bold outline-none"
                />
              </label>
            </div>

            <button
              type="button"
              onClick={() =>
                updateCalloutPolicy({
                  waivedIfJobBooked: !matrix.callout.waivedIfJobBooked,
                })
              }
              className="w-full rounded-2xl bg-[#F4F5F1] px-3.5 py-2.5 flex items-center justify-between text-[12px] font-bold cursor-pointer"
            >
              <span>Выезд 0 {matrix.currency}, если клиент заказал ремонт</span>
              <span className="tma-mono px-2.5 py-0.5 rounded-full bg-[#141517] text-[#E5BC73] text-[10.5px]">
                {matrix.callout.waivedIfJobBooked ? "ДА" : "НЕТ"}
              </span>
            </button>
          </div>

          {/* HITL Threshold, Automations & GDPR Region */}
          <div className="rounded-[28px] bg-white border border-black/[0.06] p-5 space-y-4">
            <div className="tma-display text-[15px] font-extrabold flex items-center gap-1.5">
              <Bot className="w-4 h-4" /> AI Автопилот и GDPR
            </div>

            <div className="rounded-2xl bg-[#CCA2A9]/30 p-3.5 space-y-2">
              <div className="flex justify-between text-[12px]">
                <span className="font-extrabold">Порог HITL (пауза ниже)</span>
                <span className="tma-mono font-black">
                  {Math.round(matrix.confidenceThreshold * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.65}
                max={0.95}
                step={0.05}
                value={matrix.confidenceThreshold}
                onChange={(e) => updateConfidenceThreshold(Number(e.target.value))}
                aria-label="HITL confidence threshold"
                className="w-full accent-[#141517] cursor-pointer"
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => updateSettings({ reminder2h: !settings.reminder2h })}
                className={`p-3 rounded-2xl text-left text-[11.5px] font-bold cursor-pointer ${
                  settings.reminder2h
                    ? "bg-[#141517] text-white"
                    : "bg-[#F4F5F1] text-black/55"
                }`}
              >
                {settings.reminder2h ? "✓ " : ""}Напоминание за 2ч
              </button>
              <button
                type="button"
                onClick={() => updateSettings({ review1h: !settings.review1h })}
                className={`p-3 rounded-2xl text-left text-[11.5px] font-bold cursor-pointer ${
                  settings.review1h
                    ? "bg-[#A7CCC9] text-[#122423]"
                    : "bg-[#F4F5F1] text-black/55"
                }`}
              >
                {settings.review1h ? "✓ " : ""}Отзыв через 1ч
              </button>
            </div>

            <div className="rounded-2xl bg-[#141517] text-white p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-extrabold text-[#E5BC73] inline-flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" /> GDPR PII Redaction
                </span>
                <button
                  type="button"
                  onClick={() =>
                    updateSettings({ gdprPiiMasking: !settings.gdprPiiMasking })
                  }
                  className={`px-2.5 py-0.5 rounded-full text-[10.5px] font-extrabold cursor-pointer ${
                    settings.gdprPiiMasking
                      ? "bg-[#A7CCC9] text-[#122423]"
                      : "bg-white/15 text-white/70"
                  }`}
                >
                  {settings.gdprPiiMasking ? "100% ON" : "OFF"}
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => updateSettings({ llmRegion: "pilot_free" })}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                    settings.llmRegion === "pilot_free"
                      ? "bg-[#E5BC73] text-[#1E1A14]"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  $0 Pilot (Free Tier)
                </button>
                <button
                  type="button"
                  onClick={() => updateSettings({ llmRegion: "eu_vertex" })}
                  className={`py-2 px-2.5 rounded-xl text-[11px] font-bold cursor-pointer ${
                    settings.llmRegion === "eu_vertex"
                      ? "bg-[#A7CCC9] text-[#122423]"
                      : "bg-white/10 text-white/70"
                  }`}
                >
                  EU Vertex (Zero-Ret.)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
