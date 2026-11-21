"use client";

import React, { useMemo, useState } from "react";
import {
  buildNavigatorUrls,
  EQUIPMENT_MODELS,
  getEquipmentById,
  parseTextPriceListDeterministic,
  YEREVAN_STREETS,
} from "@onit/core";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Calendar,
  Camera,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  Flag,
  GitBranch,
  Home,
  MapPin,
  MessageCircle,
  Mic,
  Navigation,
  Pause,
  Phone,
  Play,
  Plus,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useOnItStore } from "../context/OnItStore";
import {
  CALENDAR_DAYS_PREVIEW,
  CARD_TONE_STYLES,
  type CardTone,
  type DemoJob,
} from "../data/demo-data";
import { AccountSettingsView } from "./AccountSettingsView";
import { AvatarCircle } from "./Avatars";
import { DefectPhotoCard } from "./DefectPhotoCard";
import { NewOrderSheet } from "./NewOrderSheet";

type TmaTab = "today" | "calendar" | "flows" | "pricing";
type DetailTab = "overview" | "chat" | "quote" | "route";

function toneForJob(job: DemoJob): CardTone {
  if (job.cardTone) return job.cardTone;
  if (job.status === "hitl") return "rose";
  if (job.status === "booked") return "ochre";
  if (job.status === "quoted") return "teal";
  return "slate";
}

export function TelegramMiniAppSurface({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const {
    jobs,
    addJob,
    matrix,
    setMatrix,
    acceptJob,
    takeoverJob,
    completeJob,
    adjustJobQuote,
    sendMasterReply,
    updateConfidenceThreshold,
    hitlLogs,
    setSurface,
    notify,
  } = useOnItStore();

  const [tab, setTab] = useState<TmaTab>("today");
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("overview");
  const [masterDraft, setMasterDraft] = useState("");
  const [localReplies, setLocalReplies] = useState<
    Record<string, Array<{ id: string; text: string; time: string }>>
  >({});

  // Sheets
  const [newOrderSlot, setNewOrderSlot] = useState<string | null>(null);
  const [quoteSheetJob, setQuoteSheetJob] = useState<DemoJob | null>(null);
  const [adjMin, setAdjMin] = useState(38000);
  const [adjMax, setAdjMax] = useState(42000);
  const [adjNote, setAdjNote] = useState("Сможем приехать в пятницу утром.");
  const [voiceRecording, setVoiceRecording] = useState(false);

  const [accountSubTab, setAccountSubTab] = useState<"settings" | "price">("settings");
  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [priceDraft, setPriceDraft] = useState(
    "Заправка фреоном | 12000-15000 AMD | 45 мин\nЧистка дренажа | 6000-7000 AMD | 30 мин\nПолная профилактика | 15000-18000 AMD | 60 мин\nДиагностика: 5000 AMD"
  );

  // Flow toggles
  const [flowWaEnabled, setFlowWaEnabled] = useState(true);
  const [flowReminderEnabled, setFlowReminderEnabled] = useState(true);
  const [flowReviewEnabled, setFlowReviewEnabled] = useState(true);
  const [zones, setZones] = useState<string[]>(["Kentron", "Arabkir", "Avan"]);

  const openJob = useMemo(
    () => jobs.find((j) => j.id === openJobId) ?? null,
    [jobs, openJobId]
  );

  const openEquipment = useMemo(
    () => getEquipmentById(openJob?.equipmentModelId),
    [openJob?.equipmentModelId]
  );

  const hitlPending = jobs.filter((j) => j.status === "hitl").length;
  const bookedCount = jobs.filter((j) => j.status === "booked").length;
  const urgentHitl = jobs.find((j) => j.status === "hitl") ?? null;
  const todayRevenueK = 62 + Math.max(0, jobs.length - 4) * 18;

  const openQuoteSheet = (job: DemoJob) => {
    setQuoteSheetJob(job);
    setAdjMin(job.status === "hitl" ? 40000 : 18000);
    setAdjMax(job.status === "hitl" ? 40000 : 22000);
    setAdjNote("Сможем приехать в удобное окно.");
  };

  const handleVoiceSimulate = () => {
    setVoiceRecording(true);
    setTimeout(() => {
      setVoiceRecording(false);
      setAdjMin(40000);
      setAdjMax(40000);
      setAdjNote("Сможем приехать в пятницу в 10:00, замена платы с гарантией.");
      notify("Groq Whisper распознал голос мастера и оформил ответ клиенту");
    }, 550);
  };

  const handleSendDirectReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!openJob || !masterDraft.trim()) return;
    const text = masterDraft.trim();
    setMasterDraft("");
    const now = new Date();
    const hm = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
    setLocalReplies((prev) => ({
      ...prev,
      [openJob.id]: [...(prev[openJob.id] ?? []), { id: `r_${Date.now()}`, text, time: hm }],
    }));
    sendMasterReply(openJob.id, text);
  };

  const handleSaveMobilePrice = () => {
    try {
      const parsed = parseTextPriceListDeterministic(priceDraft, {
        companyId: matrix.companyId,
        defaultCategory: "hvac",
      });
      setMatrix(parsed);
      setPriceSheetOpen(false);
      notify(`Прайс обновлён (${parsed.services.length} услуг)`);
    } catch {
      notify("Проверьте формат строк: Услуга | Цена");
    }
  };

  const toggleZone = (z: string) => {
    setZones((prev) =>
      prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]
    );
  };

  const phoneBody = (
    <div
      className={`tma-shell relative bg-[#E7E8E3] text-[#141517] flex flex-col overflow-hidden ${
        standalone
          ? "min-h-screen w-full max-w-[460px] mx-auto"
          : "w-full max-w-[404px] h-[812px] rounded-[46px] border-[8px] border-[#141517] shadow-[0_34px_96px_rgba(20,21,23,0.34)]"
      }`}
    >
      {/* Top Bar: Either Detail Window Header OR Editorial Today/Calendar Pills */}
      {openJob ? (
        <div className="bg-[#E7E8E3] px-4 pt-3.5 pb-3 flex items-center justify-between gap-2 shrink-0">
          <button
            type="button"
            onClick={() => {
              setOpenJobId(null);
              setDetailTab("overview");
            }}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white text-[#141517] text-[12px] font-bold shadow-2xs cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" /> Назад
          </button>

          <div className="text-center min-w-0">
            <div className="tma-display text-[14px] font-extrabold leading-tight truncate">
              {openJob.clientName}
            </div>
            <div className="tma-mono text-[10px] text-black/55 truncate">
              #{openJob.id} · {openJob.district}
            </div>
          </div>

          <a
            href={`tel:${openJob.clientPhone.replace(/[^\d+]/g, "")}`}
            aria-label="Call client"
            className="w-9 h-9 rounded-full bg-[#141517] text-white flex items-center justify-center shrink-0"
          >
            <Phone className="w-4 h-4" />
          </a>
        </div>
      ) : (
        <div className="bg-[#E7E8E3] px-4 pt-4 pb-2 flex items-center justify-between gap-2 shrink-0">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTab("today")}
              className={`px-4 py-2 rounded-full text-[12.5px] font-bold transition-all cursor-pointer ${
                tab === "today"
                  ? "bg-[#141517] text-white shadow-xs"
                  : "border border-black/20 text-[#141517] hover:bg-black/5"
              }`}
            >
              Сегодня
            </button>
            <button
              type="button"
              onClick={() => setTab("calendar")}
              className={`px-4 py-2 rounded-full text-[12.5px] font-bold transition-all cursor-pointer ${
                tab === "calendar"
                  ? "bg-[#141517] text-white shadow-xs"
                  : "border border-black/20 text-[#141517] hover:bg-black/5"
              }`}
            >
              Календарь
            </button>
          </div>

          <button
            type="button"
            onClick={() => setNewOrderSlot("16:30")}
            aria-label="Create new order"
            className="w-10 h-10 rounded-full bg-black/[0.08] hover:bg-black/[0.14] text-[#141517] flex items-center justify-center transition-colors cursor-pointer"
          >
            <Plus className="w-5 h-5" />
          </button>
        </div>
      )}

      {/* MAIN CONTENT */}
      {openJob ? (
        <div className="flex-1 flex flex-col min-h-0 rounded-t-[34px] bg-white overflow-hidden">
          {/* Colored Status Header Banner */}
          <div
            className="px-4 pt-4 pb-3 shrink-0"
            style={{
              backgroundColor: CARD_TONE_STYLES[toneForJob(openJob)].bg,
              color: CARD_TONE_STYLES[toneForJob(openJob)].ink,
            }}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0">
                <div className="tma-display text-[20px] font-extrabold leading-[1.12] tracking-tight">
                  {openJob.title}
                </div>
                <div className="text-[12px] opacity-75 mt-1">
                  {openEquipment
                    ? `${openEquipment.brand} ${openEquipment.model} · ${openEquipment.capacityLabel} · ${openEquipment.refrigerant ?? ""}`
                    : openJob.address}
                </div>
              </div>
              <span
                className="tma-mono px-2.5 py-1 rounded-full text-[10.5px] font-bold shrink-0"
                style={{
                  backgroundColor: CARD_TONE_STYLES[toneForJob(openJob)].pillBg,
                  color: "#FFFFFF",
                }}
              >
                {openJob.status === "hitl"
                  ? `HITL ${openJob.confidence}%`
                  : `AI ${openJob.confidence}%`}
              </span>
            </div>

            {/* 4 Segmented Detail Tabs */}
            <div className="grid grid-cols-4 gap-1 p-1 rounded-full bg-black/10 mt-3.5">
              {(
                [
                  { id: "overview", label: "Фото" },
                  { id: "chat", label: "Чат" },
                  { id: "quote", label: "Смета" },
                  { id: "route", label: "Карта" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetailTab(t.id)}
                  className={`py-1.5 rounded-full text-[11px] font-bold transition-all cursor-pointer ${
                    detailTab === t.id
                      ? "bg-[#141517] text-white"
                      : "text-[#141517]/80 hover:text-[#141517]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Scrollable Detail Content */}
          <div className="flex-1 overflow-y-auto thin-scroll p-4 space-y-3.5">
            {detailTab === "overview" && (
              <>
                <DefectPhotoCard kind={openJob.photoKind ?? "frost_pipe"} />

                {/* Voice Transcript Pill */}
                <div className="rounded-[20px] bg-[#F4F5F1] p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="w-7 h-7 rounded-full bg-[#141517] text-[#E5BC73] flex items-center justify-center shrink-0">
                      <Play className="w-3 h-3 fill-current ml-0.5" />
                    </span>
                    <div className="flex items-center gap-[2px] h-4 flex-1">
                      {[6, 12, 8, 15, 10, 14, 7, 13, 9, 15, 7, 11, 8, 13, 6].map((h, i) => (
                        <span
                          key={i}
                          className="w-[2px] rounded-full bg-[#141517]/75"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>
                    <span className="tma-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#141517] text-white">
                      {openJob.voiceLangBadge ?? "HY → RU"} · {openJob.voiceDuration ?? "0:14"}
                    </span>
                  </div>
                  <p className="text-[12.5px] leading-snug text-[#27292C]">
                    {openJob.defectSummary}
                  </p>
                </div>

                {/* Embedded Equipment Model Spec Card */}
                {openEquipment && (
                  <div className="rounded-[20px] border border-black/[0.08] p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-black/50 flex items-center gap-1">
                        <Wrench className="w-3.5 h-3.5" /> Справочник модели
                      </span>
                      <span className="tma-mono text-[10.5px] font-bold px-2 py-0.5 rounded-full bg-[#E7E8E3]">
                        {openEquipment.refrigerant ?? "HVAC"} · {openEquipment.inverter ? "Inverter" : "On/Off"}
                      </span>
                    </div>
                    <div className="tma-display text-[15px] font-extrabold">
                      {openEquipment.brand} {openEquipment.model} ({openEquipment.capacityLabel})
                    </div>
                    <div className="text-[11.5px] text-black/70">
                      <strong className="text-[#141517]">Взять с собой:</strong>{" "}
                      {openEquipment.requiredTools.join(", ")}
                    </div>
                    <div className="flex flex-wrap gap-1 pt-0.5">
                      {openEquipment.commonParts.map((part) => (
                        <span
                          key={part}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F5F1] text-black/75"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Quick Primary Actions */}
                <div className="grid grid-cols-2 gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => acceptJob(openJob.id)}
                    className="py-3 rounded-full bg-[#141517] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <CheckCircle2 className="w-4 h-4 text-[#E5BC73]" /> Принять заказ
                  </button>
                  <button
                    type="button"
                    onClick={() => openQuoteSheet(openJob)}
                    className="py-3 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[12px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <Mic className="w-4 h-4" /> Править / Голос
                  </button>
                  <button
                    type="button"
                    onClick={() => takeoverJob(openJob.id)}
                    className="py-2.5 rounded-full bg-[#F4F5F1] text-[#141517] text-[11.5px] font-bold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Pause className="w-3.5 h-3.5" /> Перехватить чат
                  </button>
                  <button
                    type="button"
                    onClick={() => completeJob(openJob.id)}
                    className="py-2.5 rounded-full bg-[#A7CCC9] text-[#122423] text-[11.5px] font-extrabold flex items-center justify-center gap-1 cursor-pointer"
                  >
                    <Flag className="w-3.5 h-3.5" /> Закрыть → Отзыв
                  </button>
                </div>
              </>
            )}

            {detailTab === "chat" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-[#F4F5F1] p-3 text-[12.5px] space-y-1.5">
                  <div className="text-[10px] font-bold text-black/50">
                    {openJob.clientName} · {openJob.channel === "telegram" ? "Telegram" : "WhatsApp"}
                  </div>
                  <p>{openJob.defectSummary}</p>
                </div>

                <div className="rounded-2xl bg-[#141517] text-white p-3 text-[12.5px] space-y-1 ml-6">
                  <div className="flex justify-between text-[10px] text-[#E5BC73] font-bold">
                    <span>OnIt AI Assistant</span>
                    <span className="tma-mono">24.5s</span>
                  </div>
                  <p>
                    {openJob.status === "hitl"
                      ? "Передал фото старшему мастеру для точной оценки, вернёмся с ответом в течение 10 минут."
                      : `Смета по прайсу: ${openJob.priceRange} (~${openJob.durationMin} мин). Окно в районе ${openJob.district} — ${openJob.slotTime}.`}
                  </p>
                </div>

                {(localReplies[openJob.id] ?? []).map((r) => (
                  <div
                    key={r.id}
                    className="rounded-2xl bg-[#E5BC73] text-[#1E1A14] p-3 text-[12.5px] ml-8 space-y-0.5"
                  >
                    <div className="flex justify-between text-[10px] font-bold opacity-70">
                      <span>Вы (Мастер)</span>
                      <span className="tma-mono">{r.time}</span>
                    </div>
                    <p>{r.text}</p>
                  </div>
                ))}
              </div>
            )}

            {detailTab === "quote" && (
              <div className="space-y-3">
                <div className="rounded-[24px] bg-[#F4F5F1] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase text-black/50">
                      Deterministic Quote
                    </span>
                    <span className="tma-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#141517] text-[#E5BC73]">
                      0 LLM Math
                    </span>
                  </div>
                  <div className="tma-display text-[28px] font-black leading-none">
                    {openJob.priceRange}
                  </div>
                  <div className="border-t border-dashed border-black/15 pt-2.5 space-y-1.5 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-black/60">Работы</span>
                      <span className="font-bold">{openJob.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Длительность</span>
                      <span className="tma-mono font-bold">~{openJob.durationMin} мин</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Доступ / Этаж</span>
                      <span className="font-semibold">{openJob.floorLabel ?? "2 этаж"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-black/60">Защита PII до LLM</span>
                      <span className="font-bold text-[#1F5753] inline-flex items-center gap-1">
                        <ShieldCheck className="w-3.5 h-3.5" /> 100%
                      </span>
                    </div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => openQuoteSheet(openJob)}
                  className="w-full py-3 rounded-full bg-[#141517] text-white text-[12.5px] font-bold cursor-pointer"
                >
                  ✏️ Изменить цену или наговорить голосом
                </button>
              </div>
            )}

            {detailTab === "route" && (
              <div className="space-y-3">
                <div className="rounded-[24px] bg-[#F4F5F1] p-4 space-y-2.5">
                  <div className="text-[11px] font-bold uppercase text-black/50">
                    Адрес объекта · Ереван
                  </div>
                  <div className="tma-display text-[19px] font-extrabold leading-tight">
                    {openJob.address}
                  </div>
                  <div className="text-[12px] text-black/65">
                    Район {openJob.district} · OSRM ~{openJob.etaMinutes ?? 7} мин от предыдущего заказа · {openJob.floorLabel ?? "2 этаж"}
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <a
                      href={buildNavigatorUrls(openJob.location).googleMaps}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-full bg-[#141517] text-white text-[11.5px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#E5BC73]" /> Google Maps
                    </a>
                    <a
                      href={buildNavigatorUrls(openJob.location).yandexMaps}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-full bg-white border border-black/15 text-[#141517] text-[11.5px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5" /> Yandex Maps
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>

          {detailTab === "chat" && (
            <form
              onSubmit={handleSendDirectReply}
              className="bg-white border-t border-black/[0.08] p-3 flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={() => openQuoteSheet(openJob)}
                aria-label="Voice quote adjustment"
                className="w-9 h-9 rounded-full bg-[#F4F5F1] text-[#141517] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                value={masterDraft}
                onChange={(e) => setMasterDraft(e.target.value)}
                placeholder="Написать клиенту в WhatsApp..."
                aria-label="Master reply"
                className="flex-1 min-w-0 rounded-full bg-[#F4F5F1] px-3.5 py-2 text-[12px] outline-none"
              />
              <button
                type="submit"
                aria-label="Send reply"
                className="w-9 h-9 rounded-full bg-[#141517] text-[#E5BC73] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto thin-scroll flex flex-col">
          {/* SCREEN 1: TODAY (Editorial Split Hero + White Sheet + Oversized Tactile Cards) */}
          {tab === "today" && (
            <>
              {/* Editorial Split Hero (matches sajon.co 13.12 DEC geometry) */}
              <div className="px-5 pt-2 pb-5 grid grid-cols-[1.12fr_1px_1fr] gap-3.5 items-center shrink-0">
                <div>
                  <div className="text-[12px] font-medium text-black/55">
                    Вторник · {jobs.length} заказа
                  </div>
                  <div className="tma-display text-[44px] font-bold tracking-[-0.04em] leading-[0.95] mt-1">
                    14.04
                  </div>
                  <div className="tma-display text-[32px] font-medium tracking-[-0.03em] leading-none mt-1 text-black/80">
                    {todayRevenueK}k ֏
                  </div>
                </div>

                <div className="h-[88px] bg-black/15" />

                <div className="space-y-3 pl-1">
                  <div>
                    <div className="tma-display text-[17px] font-extrabold tabular-nums leading-tight">
                      1.45M ֏
                    </div>
                    <div className="text-[10.5px] text-black/55">
                      Апрель · +38%
                    </div>
                  </div>
                  <div>
                    <div className="tma-display text-[17px] font-extrabold tabular-nums leading-tight">
                      11:30
                    </div>
                    <div className="text-[10.5px] text-black/55">
                      Kentron · 6 мин
                    </div>
                  </div>
                </div>
              </div>

              {/* Crisp Pure White Rounded Sheet holding BIG tactile order cards */}
              <div className="flex-1 rounded-t-[34px] bg-white px-4 pt-5 pb-24 space-y-3.5 shadow-[0_-6px_28px_rgba(20,21,23,0.04)]">
                <div className="flex items-center justify-between gap-2 px-0.5">
                  <span className="tma-display text-[15px] font-extrabold">
                    Заказы сегодня
                  </span>
                  {urgentHitl ? (
                    <button
                      type="button"
                      onClick={() => {
                        setOpenJobId(urgentHitl.id);
                        setDetailTab("overview");
                      }}
                      className="px-3 py-1.5 rounded-full bg-[#F4F5F1] hover:bg-[#CCA2A9]/40 text-[11px] font-bold text-[#141517] cursor-pointer transition-colors"
                    >
                      ⚡ Что делать: {hitlPending} HITL
                    </button>
                  ) : (
                    <span className="px-3 py-1 rounded-full bg-[#F4F5F1] text-[11px] font-semibold text-black/60">
                      ✓ {bookedCount} в графике
                    </span>
                  )}
                </div>

                {/* OVERSIZED COLOR-CODED ORDER CARDS */}
                <div className="space-y-3">
                  {jobs.map((job) => {
                    const tone = CARD_TONE_STYLES[toneForJob(job)];
                    const equip = getEquipmentById(job.equipmentModelId);
                    return (
                      <button
                        key={job.id}
                        type="button"
                        onClick={() => {
                          setOpenJobId(job.id);
                          setDetailTab("overview");
                        }}
                        style={{ backgroundColor: tone.bg, color: tone.ink }}
                        className="w-full text-left rounded-[28px] p-5 space-y-4 transition-transform active:scale-[0.985] cursor-pointer shadow-[0_8px_22px_rgba(20,21,23,0.06)]"
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0 space-y-1.5">
                            <div className="tma-display text-[20px] font-extrabold leading-[1.12] tracking-[-0.02em]">
                              {job.title}
                            </div>
                            <div
                              className="text-[11.5px] font-semibold truncate"
                              style={{ color: tone.muted }}
                            >
                              {equip
                                ? `${equip.brand} ${equip.model} · ${equip.refrigerant ?? equip.capacityLabel}`
                                : job.address}
                            </div>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <DefectPhotoCard
                              kind={job.photoKind ?? "frost_pipe"}
                              compact
                            />
                            <AvatarCircle who={job.avatarKey} size="sm" />
                          </div>
                        </div>

                        {/* Boarding-pass bottom row */}
                        <div className="flex items-center justify-between gap-2 pt-1">
                          <div>
                            <div className="tma-display text-[15px] font-extrabold tabular-nums leading-tight">
                              {job.slotTime}
                            </div>
                            <div
                              className="text-[10.5px] font-medium"
                              style={{ color: tone.muted }}
                            >
                              {job.district} · {job.etaMinutes ?? 7}м
                            </div>
                          </div>

                          <span
                            className="tma-mono px-3.5 py-2 rounded-full text-[11px] font-bold shrink-0"
                            style={{
                              backgroundColor: tone.pillBg,
                              color: tone.pillText,
                            }}
                          >
                            {job.priceRange}
                          </span>

                          <div className="text-right">
                            <div className="tma-display text-[15px] font-extrabold tabular-nums leading-tight">
                              {job.endTime ?? `${job.durationMin}м`}
                            </div>
                            <div
                              className="text-[10.5px] font-medium"
                              style={{ color: tone.muted }}
                            >
                              {job.status === "hitl"
                                ? "Нужен мастер"
                                : `AI ${job.confidence}%`}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}

          {/* SCREEN 2: CALENDAR (exact right-phone sajon.co day-cards + hourly slots!) */}
          {tab === "calendar" && (
            <div className="flex-1 rounded-t-[34px] bg-white px-4 pt-4 pb-24 space-y-3.5 mt-2">
              {/* Month Strip */}
              <div className="flex items-center justify-between px-3 py-1">
                <span className="tma-display text-[18px] font-semibold text-black/25">
                  МАР
                </span>
                <div className="flex items-center gap-3">
                  <ChevronLeft className="w-4 h-4 text-black/45" />
                  <span className="tma-display text-[20px] font-extrabold tracking-tight">
                    АПР
                  </span>
                  <ChevronRight className="w-4 h-4 text-black/45" />
                </div>
                <span className="tma-display text-[18px] font-semibold text-black/25">
                  МАЙ
                </span>
              </div>

              {/* Stacked Colored Day Cards with Vertical Hourly Slots */}
              <div className="space-y-3">
                {CALENDAR_DAYS_PREVIEW.map((day) => {
                  const tone = CARD_TONE_STYLES[day.tone];
                  return (
                    <div
                      key={day.dayNum}
                      style={{ backgroundColor: tone.bg, color: tone.ink }}
                      className="rounded-[26px] p-4 grid grid-cols-[96px_1fr] gap-3 items-stretch"
                    >
                      <div className="flex flex-col justify-center">
                        <div className="text-[11px] font-medium opacity-70">
                          {day.dayName}
                        </div>
                        <div className="tma-display text-[34px] font-bold leading-none mt-0.5">
                          {day.dayNum}
                        </div>
                        <div className="tma-display text-[22px] font-medium leading-none mt-0.5 opacity-85">
                          {day.monthShort}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        {day.slots.map((sl) => (
                          <div
                            key={sl.hour}
                            className="border-l border-black/15 pl-2 flex flex-col justify-between gap-2 min-h-[82px]"
                          >
                            <span className="tma-mono text-[10px] font-bold opacity-65">
                              {sl.hour}
                            </span>

                            {sl.label ? (
                              <button
                                type="button"
                                onClick={() => {
                                  const match = jobs.find((j) => j.id === sl.jobId) ?? jobs[0];
                                  if (match) {
                                    setOpenJobId(match.id);
                                    setDetailTab("overview");
                                  }
                                }}
                                style={{
                                  backgroundColor: tone.pillBg,
                                  color: tone.pillText,
                                }}
                                className="px-2 py-1.5 rounded-xl text-[9.5px] font-bold leading-tight text-left cursor-pointer hover:opacity-90 max-w-full break-words"
                              >
                                {sl.label}
                              </button>
                            ) : (
                              <div className="text-[9.5px] opacity-45">Свободно</div>
                            )}

                            <button
                              type="button"
                              onClick={() => setNewOrderSlot(sl.hour)}
                              aria-label={`Add job at ${sl.hour}`}
                              className="w-5 h-5 rounded-full border border-black/25 flex items-center justify-center hover:bg-black/10 cursor-pointer"
                            >
                              <Plus className="w-3 h-3" />
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

          {/* SCREEN 3: AI FLOWS */}
          {tab === "flows" && (
            <div className="flex-1 rounded-t-[34px] bg-white px-4 pt-5 pb-24 space-y-3 mt-2">
              <div className="rounded-[24px] bg-[#141517] text-white p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="tma-mono text-[10px] uppercase text-[#E5BC73] font-bold">
                    OnIt AI Automation
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/12 text-[#A7CCC9] font-bold">
                    ● Live
                  </span>
                </div>
                <div className="tma-display text-[19px] font-extrabold">
                  WhatsApp → Vision → Quote
                </div>
              </div>

              <div className="rounded-[22px] bg-[#F4F5F1] p-3.5 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="w-4 h-4" />
                  <div>
                    <div className="text-[12.5px] font-extrabold">1. Триггер WhatsApp / TG</div>
                    <div className="text-[11px] text-black/55">Debouncer 10s · PII Redactor ON</div>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setFlowWaEnabled((v) => !v)}
                  aria-label="Toggle WhatsApp automation"
                  className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer ${
                    flowWaEnabled ? "bg-[#141517]" : "bg-black/20"
                  }`}
                >
                  <span
                    className={`block w-5 h-5 rounded-full transition-transform ${
                      flowWaEnabled
                        ? "translate-x-4 bg-[#E5BC73]"
                        : "translate-x-0 bg-white"
                    }`}
                  />
                </button>
              </div>

              <div className="rounded-[22px] bg-[#CCA2A9]/35 p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-extrabold flex items-center gap-1.5">
                    <SlidersHorizontal className="w-4 h-4" /> 2. HITL Confidence Gate
                  </span>
                  <span className="tma-mono text-[13px] font-black">
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
                  aria-label="HITL threshold"
                  className="w-full accent-[#141517] cursor-pointer"
                />
              </div>

              <div className="rounded-[22px] bg-[#F4F5F1] p-3.5 space-y-2">
                <div className="text-[12.5px] font-extrabold flex items-center gap-1.5">
                  <Clock className="w-4 h-4" /> 3. Авто-напоминания и отзывы
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setFlowReminderEnabled((v) => !v)}
                    className={`py-2 rounded-full text-[11px] font-bold cursor-pointer ${
                      flowReminderEnabled ? "bg-[#141517] text-white" : "bg-white text-black/60"
                    }`}
                  >
                    {flowReminderEnabled ? "✓ " : ""}За 2ч до визита
                  </button>
                  <button
                    type="button"
                    onClick={() => setFlowReviewEnabled((v) => !v)}
                    className={`py-2 rounded-full text-[11px] font-bold cursor-pointer ${
                      flowReviewEnabled ? "bg-[#A7CCC9] text-[#122423]" : "bg-white text-black/60"
                    }`}
                  >
                    {flowReviewEnabled ? "✓ " : ""}Отзыв через 1ч
                  </button>
                </div>
              </div>

              <div className="rounded-[22px] bg-[#F4F5F1] p-3.5 space-y-2">
                <div className="text-[12px] font-extrabold">
                  Active Learning ({hitlLogs.length})
                </div>
                {hitlLogs.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    className="rounded-xl bg-white px-3 py-2 flex justify-between gap-2 text-[11px]"
                  >
                    <span className="truncate">{l.summary}</span>
                    <span className="tma-mono font-bold shrink-0">{l.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 4: ACCOUNT SETTINGS & PRICE MATRIX */}
          {tab === "pricing" && (
            <div className="flex-1 rounded-t-[34px] bg-white px-4 pt-4 pb-24 space-y-3.5 mt-2">
              <div className="grid grid-cols-2 gap-1 p-1 rounded-full bg-[#F4F5F1]">
                <button
                  type="button"
                  onClick={() => setAccountSubTab("settings")}
                  className={`py-2 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                    accountSubTab === "settings"
                      ? "bg-[#141517] text-white"
                      : "text-black/65"
                  }`}
                >
                  Кабинет и график
                </button>
                <button
                  type="button"
                  onClick={() => setAccountSubTab("price")}
                  className={`py-2 rounded-full text-[11.5px] font-bold transition-all cursor-pointer ${
                    accountSubTab === "price"
                      ? "bg-[#141517] text-white"
                      : "text-black/65"
                  }`}
                >
                  Прайс и справочники
                </button>
              </div>

              {accountSubTab === "settings" ? (
                <AccountSettingsView compact />
              ) : (
                <>
              <div className="grid grid-cols-2 gap-2.5">
                <div className="rounded-[22px] bg-[#E5BC73] p-3.5 text-[#1E1A14]">
                  <div className="text-[10.5px] font-bold opacity-70">Справочник моделей</div>
                  <div className="tma-display text-[22px] font-black mt-0.5">
                    {EQUIPMENT_MODELS.length} шт
                  </div>
                  <div className="text-[10.5px] opacity-75">LG, Daikin, Midea, Gree…</div>
                </div>
                <div className="rounded-[22px] bg-[#A7CCC9] p-3.5 text-[#122423]">
                  <div className="text-[10.5px] font-bold opacity-70">Улицы Еревана</div>
                  <div className="tma-display text-[22px] font-black mt-0.5">
                    {YEREVAN_STREETS.length} ул.
                  </div>
                  <div className="text-[10.5px] opacity-75">HY / RU / EN + GPS</div>
                </div>
              </div>

              <div className="rounded-[22px] bg-[#F4F5F1] p-3.5 space-y-2">
                <div className="text-[12px] font-extrabold">Зоны выезда</div>
                <div className="flex flex-wrap gap-1.5">
                  {["Kentron", "Arabkir", "Avan", "Erebuni", "Davtashen"].map((z) => {
                    const active = zones.includes(z);
                    return (
                      <button
                        key={z}
                        type="button"
                        onClick={() => toggleZone(z)}
                        className={`px-3 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                          active ? "bg-[#141517] text-white" : "bg-white text-black/65"
                        }`}
                      >
                        {active ? "✓ " : ""}
                        {z}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-[22px] bg-[#F4F5F1] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[12.5px] font-extrabold">
                    Прайс-матрица ({matrix.services.length})
                  </span>
                  <button
                    type="button"
                    onClick={() => setPriceSheetOpen(true)}
                    className="px-3 py-1 rounded-full bg-[#141517] text-[#E5BC73] text-[11px] font-bold cursor-pointer"
                  >
                    + Импорт
                  </button>
                </div>
                {matrix.services.map((s) => (
                  <div
                    key={s.code}
                    className="rounded-xl bg-white px-3 py-2 flex items-center justify-between gap-2 text-[11.5px]"
                  >
                    <span className="font-bold truncate">{s.name}</span>
                    <span className="tma-mono font-bold shrink-0">
                      {s.priceMin === s.priceMax ? s.priceMin : `${s.priceMin}–${s.priceMax}`}{" "}
                      {matrix.currency}
                    </span>
                  </div>
                ))}
              </div>
                </>
              )}
            </div>
          )}
        </div>
      )}

      {/* FLOATING iOS ISLAND DOCK */}
      {!openJob && (
        <div className="absolute bottom-4 inset-x-0 z-20 flex justify-center px-4 pointer-events-none">
          <nav
            aria-label="Telegram Mini App Dock"
            className="pointer-events-auto rounded-full bg-[#141517]/94 backdrop-blur-2xl px-2 py-2 flex items-center gap-1 shadow-[0_18px_40px_rgba(20,21,23,0.34)] border border-white/12"
          >
            {(
              [
                { id: "today", label: "Сегодня", icon: Home, dot: false },
                { id: "calendar", label: "Календарь", icon: Calendar, dot: false },
                { id: "flows", label: "AI Флоу", icon: GitBranch, dot: hitlPending > 0 },
                { id: "pricing", label: "Кабинет", icon: Wallet, dot: false },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative h-10 rounded-full flex items-center justify-center gap-1.5 text-[11.5px] font-bold transition-all cursor-pointer ${
                    active
                      ? "bg-white text-[#141517] px-4 shadow-sm"
                      : "w-10 text-white/70 hover:text-white hover:bg-white/10"
                  }`}
                  aria-label={item.label}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  {active && <span>{item.label}</span>}
                  {item.dot && !active && (
                    <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#E5BC73]" />
                  )}
                </button>
              );
            })}
          </nav>
        </div>
      )}

      {/* BOTTOM SHEET: Quote & Voice Escalation */}
      {quoteSheetJob && (
        <div className="absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px] flex items-end">
          <div className="w-full rounded-t-[30px] bg-white p-4 pb-5 space-y-3 shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-black/15 mx-auto" />
            <div className="flex items-start justify-between">
              <div>
                <div className="tma-display text-[16px] font-extrabold">
                  Смета / Голос · #{quoteSheetJob.id}
                </div>
                <div className="text-[11px] text-black/55">
                  OnIt оформит вежливое сообщение клиенту в WhatsApp
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuoteSheetJob(null)}
                aria-label="Close quote sheet"
                className="w-7 h-7 rounded-full bg-[#F4F5F1] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleVoiceSimulate}
              className={`w-full py-2.5 px-3 rounded-full text-[11.5px] font-bold flex items-center justify-center gap-1.5 cursor-pointer ${
                voiceRecording ? "bg-[#CCA2A9] text-[#231417]" : "bg-[#141517] text-white"
              }`}
            >
              <Mic className="w-3.5 h-3.5 text-[#E5BC73]" />
              {voiceRecording ? "Расшифровка Groq Whisper..." : "Наговорить: «40 000 AMD, пятница 10:00»"}
            </button>

            <div className="grid grid-cols-2 gap-2">
              <input
                type="number"
                value={adjMin}
                onChange={(e) => setAdjMin(Number(e.target.value))}
                aria-label="Min price"
                className="tma-mono rounded-xl bg-[#F4F5F1] px-3 py-2 text-[13px] font-bold outline-none"
              />
              <input
                type="number"
                value={adjMax}
                onChange={(e) => setAdjMax(Number(e.target.value))}
                aria-label="Max price"
                className="tma-mono rounded-xl bg-[#F4F5F1] px-3 py-2 text-[13px] font-bold outline-none"
              />
            </div>

            <input
              value={adjNote}
              onChange={(e) => setAdjNote(e.target.value)}
              aria-label="Client comment"
              className="w-full rounded-xl bg-[#F4F5F1] px-3 py-2 text-[12px] outline-none"
            />

            <button
              type="button"
              onClick={() => {
                adjustJobQuote(quoteSheetJob.id, adjMin, adjMax, adjNote);
                setQuoteSheetJob(null);
              }}
              className="w-full py-3 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[12.5px] font-extrabold cursor-pointer"
            >
              Отправить клиенту + обучить AI
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET: Price Parser */}
      {priceSheetOpen && (
        <div className="absolute inset-0 z-30 bg-black/45 backdrop-blur-[2px] flex items-end">
          <div className="w-full rounded-t-[30px] bg-white p-4 pb-5 space-y-3 shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-black/15 mx-auto" />
            <div className="flex items-center justify-between">
              <span className="tma-display text-[16px] font-extrabold">
                Импорт прайса за 5 мин
              </span>
              <button
                type="button"
                onClick={() => setPriceSheetOpen(false)}
                aria-label="Close price sheet"
                className="w-7 h-7 rounded-full bg-[#F4F5F1] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <textarea
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              rows={5}
              aria-label="Raw price text"
              className="tma-mono w-full rounded-2xl bg-[#F4F5F1] p-3 text-[11px] outline-none"
            />
            <button
              type="button"
              onClick={handleSaveMobilePrice}
              className="w-full py-3 rounded-full bg-[#141517] text-[#E5BC73] text-[12.5px] font-extrabold cursor-pointer"
            >
              Сохранить PriceMatrix JSON
            </button>
          </div>
        </div>
      )}

      {/* NEW ORDER SHEET (Streets + Equipment Models Catalogs) */}
      {newOrderSlot && (
        <NewOrderSheet
          matrix={matrix}
          defaultSlot={newOrderSlot}
          onClose={() => setNewOrderSlot(null)}
          onCreate={(job) => {
            addJob(job);
            notify(`Заказ «${job.title}» (${job.address}) добавлен в график`);
          }}
        />
      )}
    </div>
  );

  if (standalone) {
    return <div className="min-h-screen bg-[#E7E8E3]">{phoneBody}</div>;
  }

  return (
    <div className="w-full max-w-[1380px] rounded-[34px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_32px_90px_rgba(20,21,23,0.10)] p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-center">
      <div className="flex justify-center">{phoneBody}</div>

      <div className="tma-shell space-y-4">
        <div className="rounded-[28px] bg-white p-6 border border-black/[0.06] space-y-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[11px] font-extrabold">
              Warm Editorial iOS Design
            </span>
            <span className="tma-mono text-[11px] px-2.5 py-1 rounded-full bg-[#F4F5F1] text-black/65 font-semibold">
              {EQUIPMENT_MODELS.length} моделей · {YEREVAN_STREETS.length} улиц Еревана
            </span>
          </div>

          <h2 className="tma-display text-[26px] font-black tracking-tight leading-[1.1]">
            Крупные тактильные карточки, фото дефектов и iOS Island Dock
          </h2>

          <p className="text-[13.5px] text-black/65 leading-relaxed">
            Кликните по любой большой карточке заказа — откроется карточка с <strong>фото поломки (и AI-рамкой Vision)</strong>, спецификацией модели из встроенного справочника (хладагент, инструмент, запчасти), голосовым плеером, сметой и картой. Кнопка <strong>«+»</strong> создаёт новый заказ по базе улиц Еревана и моделей приборов.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {[
              {
                title: "1. Открыть карточку с фото",
                desc: "Фото дефекта + AI Box + справочник LG DualCool S12EQ + голос HY→RU.",
                action: () => {
                  setOpenJobId(jobs[0]?.id ?? null);
                  setDetailTab("overview");
                },
              },
              {
                title: "2. Календарь по дням",
                desc: "Цветные карточки дней с почасовыми колонками и кнопками + на свободных слотах.",
                action: () => {
                  setOpenJobId(null);
                  setTab("calendar");
                },
              },
              {
                title: "3. Создать заказ из справочника",
                desc: "Поиск по 17 улицам Еревана (RU/HY/EN) и 6 моделям кондиционеров с авто-сметой.",
                action: () => setNewOrderSlot("16:30"),
              },
              {
                title: "4. Перейти в Web Dispatch",
                desc: "Та же тёплая палитра, крупные карточки и iOS Island Dock на десктопе.",
                action: () => setSurface("web"),
              },
            ].map((card) => (
              <button
                key={card.title}
                type="button"
                onClick={card.action}
                className="text-left rounded-[22px] bg-[#F4F5F1] hover:bg-[#E5BC73]/35 p-3.5 transition-colors cursor-pointer space-y-1"
              >
                <div className="tma-display text-[13px] font-extrabold">
                  {card.title}
                </div>
                <div className="text-[11.5px] text-black/60 leading-snug">
                  {card.desc}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] bg-[#141517] text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="tma-mono text-[10px] uppercase text-[#E5BC73] font-bold">
              Live Telegram Mini App Route
            </div>
            <div className="tma-mono text-[14px] font-bold mt-0.5">/tma</div>
          </div>
          <div className="flex gap-2">
            <a
              href="/tma"
              className="px-4 py-2 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[12px] font-extrabold inline-flex items-center gap-1"
            >
              Открыть /tma <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setSurface("client")}
              className="px-4 py-2 rounded-full bg-white/12 hover:bg-white/20 text-white text-[12px] font-bold cursor-pointer"
            >
              Client WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
