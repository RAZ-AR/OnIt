"use client";

import React, { useMemo, useState } from "react";
import {
  buildNavigatorUrls,
  parseTextPriceListDeterministic,
} from "@onit/core";
import {
  ArrowLeft,
  ArrowUpRight,
  Bot,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  Clock,
  Compass,
  FileSpreadsheet,
  Flag,
  GitBranch,
  Inbox,
  MapPin,
  MessageCircle,
  Mic,
  Navigation,
  Pause,
  Phone,
  Play,
  Plus,
  Search,
  Send,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Wrench,
  X,
  Zap,
} from "lucide-react";
import { useOnItStore } from "../context/OnItStore";
import type { DemoJob } from "../data/demo-data";
import { AvatarCircle } from "./Avatars";

type TmaTab = "inbox" | "flows" | "route" | "pricing";
type DetailTab = "chat" | "quote" | "object";

export function TelegramMiniAppSurface({
  standalone = false,
}: {
  standalone?: boolean;
}) {
  const {
    jobs,
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

  const [tab, setTab] = useState<TmaTab>("inbox");
  const [filter, setFilter] = useState<"all" | "hitl" | "quoted" | "booked">("all");
  const [search, setSearch] = useState("");
  const [openJobId, setOpenJobId] = useState<string | null>(null);
  const [detailTab, setDetailTab] = useState<DetailTab>("chat");
  const [masterDraft, setMasterDraft] = useState("");
  const [localReplies, setLocalReplies] = useState<
    Record<string, Array<{ id: string; text: string; time: string }>>
  >({});

  // Bottom sheets (Manychat-style modal windows)
  const [quoteSheetJob, setQuoteSheetJob] = useState<DemoJob | null>(null);
  const [adjMin, setAdjMin] = useState(38000);
  const [adjMax, setAdjMax] = useState(42000);
  const [adjNote, setAdjNote] = useState("Сможем приехать в пятницу утром.");
  const [voiceRecording, setVoiceRecording] = useState(false);

  const [priceSheetOpen, setPriceSheetOpen] = useState(false);
  const [priceImportMode, setPriceImportMode] = useState<"text" | "photo" | "voice">("text");
  const [priceDraft, setPriceDraft] = useState(
    "Заправка фреоном | 12000-15000 AMD | 45 мин\nЧистка дренажа | 6000-7000 AMD | 30 мин\nПолная профилактика | 15000-18000 AMD | 60 мин\nДиагностика: 5000 AMD"
  );

  // Automation flow toggles
  const [flowWaEnabled, setFlowWaEnabled] = useState(true);
  const [flowReminderEnabled, setFlowReminderEnabled] = useState(true);
  const [flowReviewEnabled, setFlowReviewEnabled] = useState(true);
  const [zones, setZones] = useState<string[]>(["Kentron", "Arabkir", "Avan"]);

  const openJob = useMemo(
    () => jobs.find((j) => j.id === openJobId) ?? null,
    [jobs, openJobId]
  );

  const hitlPending = jobs.filter((j) => j.status === "hitl").length;
  const bookedCount = jobs.filter((j) => j.status === "booked").length;

  const filteredJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (filter !== "all" && j.status !== filter) return false;
      if (!q) return true;
      return (
        j.title.toLowerCase().includes(q) ||
        j.clientName.toLowerCase().includes(q) ||
        j.district.toLowerCase().includes(q) ||
        j.defectSummary.toLowerCase().includes(q)
      );
    });
  }, [jobs, filter, search]);

  const openQuoteSheet = (job: DemoJob) => {
    setQuoteSheetJob(job);
    setAdjMin(job.status === "hitl" ? 38000 : 18000);
    setAdjMax(job.status === "hitl" ? 42000 : 22000);
    setAdjNote("Сможем приехать в удобное для вас окно.");
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
      notify(`Прайс синхронизирован (${parsed.services.length} услуг, ${parsed.currency})`);
    } catch {
      notify("Проверьте формат строк: Услуга | Цена");
    }
  };

  const toggleZone = (z: string) => {
    setZones((prev) =>
      prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]
    );
  };

  const statusPill = (job: DemoJob) => {
    if (job.status === "hitl") {
      return {
        label: `HITL · ${job.confidence}%`,
        cls: "bg-[#FFF0EB] text-[#E03E00] border border-[#FF5722]/25",
        dot: "bg-[#FF4D1C]",
      };
    }
    if (job.status === "booked") {
      return {
        label: "В графике",
        cls: "bg-[#E7FBF4] text-[#047857] border border-[#00C48C]/30",
        dot: "bg-[#00C48C]",
      };
    }
    return {
      label: `AI · ${job.confidence}%`,
      cls: "bg-[#EEF3FF] text-[#0042DA] border border-[#0052FF]/20",
      dot: "bg-[#0052FF]",
    };
  };

  const phoneBody = (
    <div
      className={`tma-shell relative bg-[#F4F5F7] text-[#0A0B0D] flex flex-col overflow-hidden ${
        standalone
          ? "min-h-screen w-full max-w-[460px] mx-auto"
          : "w-full max-w-[404px] h-[790px] rounded-[44px] border-[8px] border-[#0A0B0D] shadow-[0_34px_96px_rgba(10,11,13,0.34)]"
      }`}
    >
      {/* Telegram Top Native Chrome */}
      <div className="bg-white border-b border-black/[0.07] px-4 pt-3 pb-2.5 shrink-0">
        {openJob ? (
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              onClick={() => {
                setOpenJobId(null);
                setDetailTab("chat");
              }}
              className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[#0052FF] hover:opacity-80 cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" /> Инбокс
            </button>

            <div className="text-center min-w-0">
              <div className="tma-display text-[14px] font-extrabold leading-tight truncate">
                {openJob.clientName}
              </div>
              <div className="tma-mono text-[10px] text-[#6B7280] truncate">
                #{openJob.id} · {openJob.district}
              </div>
            </div>

            <a
              href={`tel:${openJob.clientPhone.replace(/[^\d+]/g, "")}`}
              aria-label="Call client"
              className="w-8 h-8 rounded-full bg-[#F4F5F7] hover:bg-[#E7EAF0] flex items-center justify-center text-[#0A0B0D]"
            >
              <Phone className="w-3.5 h-3.5" />
            </a>
          </div>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 rounded-[10px] bg-[#0A0B0D] flex items-center justify-center shrink-0">
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 11.5L7.5 3.5H10.5L6 11.5H3Z" fill="#C8FF00" />
                  <circle cx="11.5" cy="10.5" r="2.2" fill="#FFFFFF" />
                </svg>
              </div>
              <div className="min-w-0 leading-tight">
                <div className="flex items-center gap-1.5">
                  <span className="tma-display text-[15px] font-extrabold tracking-tight">
                    OnIt
                  </span>
                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-[#E7FBF4] text-[#047857] text-[9.5px] font-bold">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#00C48C]" />
                    AI Live
                  </span>
                </div>
                <div className="text-[10.5px] text-[#6B7280] truncate">
                  @OnItControlBot · CoolAir Yerevan
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPriceSheetOpen(true)}
                aria-label="Import price list"
                className="w-8 h-8 rounded-full bg-[#EEF3FF] text-[#0052FF] flex items-center justify-center hover:bg-[#DCE7FF] cursor-pointer"
              >
                <Plus className="w-4 h-4 stroke-[2.4]" />
              </button>
              {!standalone && (
                <button
                  type="button"
                  onClick={() => setSurface("web")}
                  className="text-[11px] font-semibold text-[#525860] hover:text-[#0A0B0D] px-2.5 py-1 rounded-full bg-[#F4F5F7] cursor-pointer"
                >
                  Web
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* BODY: Either Slide-In Lead Detail Window OR Active Bottom Tab */}
      {openJob ? (
        <div className="flex-1 flex flex-col min-h-0 bg-[#F4F5F7]">
          {/* Manychat Live Automation Status Strip */}
          <div
            className={`px-3.5 py-2.5 border-b flex items-center justify-between gap-2 shrink-0 ${
              openJob.status === "hitl"
                ? "bg-[#FFF3EE] border-[#FF5722]/20"
                : "bg-[#EEF3FF] border-[#0052FF]/15"
            }`}
          >
            <div className="flex items-center gap-2 min-w-0">
              <span
                className={`w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ${
                  openJob.status === "hitl"
                    ? "bg-[#FF4D1C] text-white"
                    : "bg-[#0052FF] text-white"
                }`}
              >
                {openJob.status === "hitl" ? (
                  <Pause className="w-3 h-3" />
                ) : (
                  <Zap className="w-3 h-3 fill-current" />
                )}
              </span>
              <div className="min-w-0 leading-tight">
                <div className="text-[11.5px] font-bold truncate">
                  {openJob.status === "hitl"
                    ? "Автоответ на паузе · ждёт мастера"
                    : `OnIt AI активен · уверенность ${openJob.confidence}%`}
                </div>
                <div className="text-[10px] text-[#525860] truncate">
                  {openJob.priceRange} · слот {openJob.slotTime}
                </div>
              </div>
            </div>

            {openJob.status === "hitl" ? (
              <button
                type="button"
                onClick={() => openQuoteSheet(openJob)}
                className="px-2.5 py-1.5 rounded-lg bg-[#0A0B0D] text-[#C8FF00] text-[10.5px] font-bold shrink-0 cursor-pointer"
              >
                Оценить
              </button>
            ) : (
              <button
                type="button"
                onClick={() => takeoverJob(openJob.id)}
                className="px-2.5 py-1.5 rounded-lg bg-white border border-black/10 text-[#0A0B0D] text-[10.5px] font-bold shrink-0 cursor-pointer hover:bg-[#F4F5F7]"
              >
                Перехватить
              </button>
            )}
          </div>

          {/* Segmented Window Tabs: Диалог | Смета AI | Объект */}
          <div className="px-3.5 pt-2.5 pb-2 bg-white border-b border-black/[0.06] shrink-0">
            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F4F5F7]">
              {(
                [
                  { id: "chat", label: "Диалог" },
                  { id: "quote", label: "Смета AI" },
                  { id: "object", label: "Объект" },
                ] as const
              ).map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setDetailTab(t.id)}
                  className={`py-1.5 rounded-lg text-[11.5px] font-bold transition-all cursor-pointer ${
                    detailTab === t.id
                      ? "bg-white text-[#0A0B0D] shadow-xs"
                      : "text-[#6B7280] hover:text-[#0A0B0D]"
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Detail Window Body */}
          <div className="flex-1 overflow-y-auto thin-scroll p-3.5 space-y-3">
            {detailTab === "chat" && (
              <>
                <div className="text-center">
                  <span className="tma-mono text-[10px] px-2.5 py-0.5 rounded-full bg-black/[0.05] text-[#6B7280]">
                    WhatsApp Cloud API · Сегодня
                  </span>
                </div>

                {/* Client Voice + Photo Card */}
                <div className="flex items-end gap-2">
                  <AvatarCircle who={openJob.avatarKey} size="xs" />
                  <div className="max-w-[85%] rounded-2xl rounded-bl-sm bg-white border border-black/[0.07] p-3 space-y-2 shadow-2xs">
                    <div className="rounded-xl bg-[#0A0B0D] text-white px-2.5 py-2 flex items-center gap-2 text-[11px]">
                      <Camera className="w-3.5 h-3.5 text-[#C8FF00] shrink-0" />
                      <span className="truncate">Фото дефекта · Vision Triage OK</span>
                    </div>

                    <div className="flex items-center gap-2 px-2 py-1.5 rounded-xl bg-[#F4F5F7]">
                      <span className="w-6 h-6 rounded-full bg-[#0052FF] text-white flex items-center justify-center shrink-0">
                        <Play className="w-2.5 h-2.5 fill-white ml-0.5" />
                      </span>
                      <div className="flex items-center gap-[2px] h-4 flex-1">
                        {[5, 11, 7, 14, 9, 13, 6, 12, 8, 14, 6, 10, 7].map((h, i) => (
                          <span
                            key={i}
                            className="w-[2px] rounded-full bg-[#0A0B0D]/70"
                            style={{ height: `${h}px` }}
                          />
                        ))}
                      </div>
                      <span className="tma-mono text-[9.5px] font-bold text-[#7C3AED] bg-[#F3E8FF] px-1.5 py-0.5 rounded">
                        HY→RU
                      </span>
                    </div>

                    <p className="text-[12.5px] leading-snug text-[#1F2937]">
                      {openJob.defectSummary}
                    </p>
                  </div>
                </div>

                {/* OnIt AI Response Bubble */}
                <div className="flex justify-end">
                  <div className="max-w-[86%] rounded-2xl rounded-br-sm bg-[#0052FF] text-white p-3 space-y-1.5 shadow-xs">
                    <div className="flex items-center justify-between gap-2 text-[10px] text-white/75">
                      <span className="font-bold inline-flex items-center gap-1">
                        <Bot className="w-3 h-3" /> OnIt AI Dispatcher
                      </span>
                      <span className="tma-mono">24.5s</span>
                    </div>
                    <p className="text-[12.5px] leading-snug">
                      {openJob.status === "hitl"
                        ? "Передал фото старшему инженеру для точного расчёта, вернёмся с ответом в течение 10 минут."
                        : `Смета по прайсу: ${openJob.priceRange} (~${openJob.durationMin} мин). Ближайшее окно мастера в районе ${openJob.district} — ${openJob.slotTime}.`}
                    </p>
                  </div>
                </div>

                {/* Master Direct Replies */}
                {(localReplies[openJob.id] ?? []).map((r) => (
                  <div key={r.id} className="flex justify-end">
                    <div className="max-w-[84%] rounded-2xl rounded-br-sm bg-[#0A0B0D] text-white p-3 space-y-1">
                      <div className="flex items-center justify-between text-[9.5px] text-[#C8FF00]">
                        <span className="font-bold">Мастер Aram</span>
                        <span className="tma-mono">{r.time}</span>
                      </div>
                      <p className="text-[12.5px] leading-snug">{r.text}</p>
                    </div>
                  </div>
                ))}
              </>
            )}

            {detailTab === "quote" && (
              <div className="space-y-3">
                {/* Deterministic Quote Receipt Card */}
                <div className="rounded-2xl bg-white border border-black/[0.08] p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                      Deterministic Quote
                    </span>
                    <span className="tma-mono text-[10.5px] font-bold px-2 py-0.5 rounded-md bg-[#E7FBF4] text-[#047857]">
                      0 LLM Math
                    </span>
                  </div>

                  <div>
                    <div className="tma-display text-[26px] font-black tracking-tight leading-none">
                      {openJob.priceRange}
                    </div>
                    <div className="text-[11.5px] text-[#6B7280] mt-1">
                      Оценка времени: ~{openJob.durationMin} мин · Порог AI ≥{" "}
                      {Math.round(matrix.confidenceThreshold * 100)}%
                    </div>
                  </div>

                  <div className="border-t border-dashed border-black/15 pt-3 space-y-2 text-[12px]">
                    <div className="flex justify-between">
                      <span className="text-[#525860]">Базовая работа</span>
                      <span className="font-bold">{openJob.title}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#525860]">Уверенность Vision</span>
                      <span className="tma-mono font-bold">{openJob.confidence}%</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[#525860]">Выезд мастера</span>
                      <span className="font-semibold text-[#047857]">0 AMD (при заказе)</span>
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4F5F7] text-[10.5px] font-semibold">
                      <ShieldCheck className="w-3 h-3 text-[#0052FF]" /> PII Masked
                    </span>
                    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-[#F4F5F7] text-[10.5px] font-semibold">
                      <Wrench className="w-3 h-3 text-[#0A0B0D]" /> Манометр · R410A
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => openQuoteSheet(openJob)}
                    className="py-3 rounded-xl bg-[#0A0B0D] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
                  >
                    <Mic className="w-3.5 h-3.5 text-[#C8FF00]" />
                    Править / Голос
                  </button>
                  <button
                    type="button"
                    onClick={() => acceptJob(openJob.id)}
                    className="py-3 rounded-xl bg-[#0052FF] text-white text-[12px] font-bold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
                  >
                    <Check className="w-4 h-4" /> Подтвердить
                  </button>
                </div>
              </div>
            )}

            {detailTab === "object" && (
              <div className="space-y-3">
                <div className="rounded-2xl bg-white border border-black/[0.08] p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="text-[11px] font-bold uppercase tracking-wider text-[#6B7280]">
                        Адрес и маршрут OSRM
                      </div>
                      <div className="tma-display text-[17px] font-extrabold mt-0.5">
                        {openJob.address}
                      </div>
                      <div className="text-[12px] text-[#525860]">
                        Район {openJob.district} · Ереван
                      </div>
                    </div>
                    <span className="tma-mono px-2.5 py-1 rounded-lg bg-[#EEF3FF] text-[#0052FF] text-[11px] font-bold shrink-0">
                      ~6 мин
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-[11.5px]">
                    <div className="rounded-xl bg-[#F4F5F7] p-2.5">
                      <div className="text-[#6B7280] text-[10px]">Клиент</div>
                      <div className="font-bold mt-0.5">{openJob.clientName}</div>
                      <div className="tma-mono text-[10.5px] text-[#525860]">
                        {openJob.clientPhone}
                      </div>
                    </div>
                    <div className="rounded-xl bg-[#F4F5F7] p-2.5">
                      <div className="text-[#6B7280] text-[10px]">Слот визита</div>
                      <div className="font-bold mt-0.5">{openJob.slotTime}</div>
                      <div className="text-[10.5px] text-[#047857] font-semibold">
                        Google Calendar
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <a
                      href={buildNavigatorUrls(openJob.location).googleMaps}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#F4F5F7] text-[11.5px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <Navigation className="w-3.5 h-3.5 text-[#0052FF]" /> Google Maps
                    </a>
                    <a
                      href={buildNavigatorUrls(openJob.location).yandexMaps}
                      target="_blank"
                      rel="noreferrer"
                      className="py-2.5 rounded-xl border border-black/10 bg-white hover:bg-[#F4F5F7] text-[11.5px] font-bold flex items-center justify-center gap-1.5"
                    >
                      <MapPin className="w-3.5 h-3.5 text-[#FF4D1C]" /> Yandex Maps
                    </a>
                  </div>
                </div>

                {openJob.status === "booked" ? (
                  <button
                    type="button"
                    onClick={() => completeJob(openJob.id)}
                    className="w-full py-3 rounded-xl bg-[#00C48C] text-white text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                  >
                    <Flag className="w-4 h-4" /> Завершить визит → Запросить отзыв
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => acceptJob(openJob.id)}
                    className="w-full py-3 rounded-xl bg-[#0052FF] text-white text-[12.5px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-95"
                  >
                    <CheckCircle2 className="w-4 h-4" /> Принять заказ в расписание
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Sticky Live Chat Composer (Manychat Bottom Action Dock) */}
          {detailTab === "chat" && (
            <form
              onSubmit={handleSendDirectReply}
              className="bg-white border-t border-black/[0.08] p-2.5 flex items-center gap-2 shrink-0"
            >
              <button
                type="button"
                onClick={() => openQuoteSheet(openJob)}
                title="Голосовой ответ / Править смету"
                aria-label="Open voice quote sheet"
                className="w-9 h-9 rounded-xl bg-[#F4F5F7] hover:bg-[#E7EAF0] text-[#0A0B0D] flex items-center justify-center shrink-0 cursor-pointer"
              >
                <Mic className="w-4 h-4" />
              </button>
              <input
                value={masterDraft}
                onChange={(e) => setMasterDraft(e.target.value)}
                placeholder="Ответить клиенту в WhatsApp..."
                aria-label="Master reply to WhatsApp"
                className="flex-1 min-w-0 rounded-xl bg-[#F4F5F7] px-3 py-2 text-[12.5px] outline-none focus:ring-2 focus:ring-[#0052FF]/25"
              />
              <button
                type="submit"
                aria-label="Send reply"
                className="w-9 h-9 rounded-xl bg-[#0052FF] text-white flex items-center justify-center shrink-0 cursor-pointer hover:opacity-90"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          )}
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto thin-scroll p-3.5 space-y-3">
          {/* SCREEN 1: INBOX (Manychat Live Chat List) */}
          {tab === "inbox" && (
            <>
              {/* Compact Executive KPI Strip */}
              <div className="grid grid-cols-3 gap-2">
                <div className="rounded-2xl bg-white border border-black/[0.07] p-2.5">
                  <div className="text-[10px] font-semibold text-[#6B7280]">
                    Выручка дня
                  </div>
                  <div className="tma-display text-[16px] font-black mt-0.5 leading-tight">
                    62k ֏
                  </div>
                  <div className="tma-mono text-[9.5px] font-bold text-[#047857] mt-0.5">
                    {bookedCount} броней
                  </div>
                </div>

                <div className="rounded-2xl bg-white border border-black/[0.07] p-2.5">
                  <div className="text-[10px] font-semibold text-[#6B7280]">
                    Ответ AI
                  </div>
                  <div className="tma-display text-[16px] font-black mt-0.5 leading-tight">
                    24.5s
                  </div>
                  <div className="tma-mono text-[9.5px] font-bold text-[#0052FF] mt-0.5">
                    86% авто
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setFilter(filter === "hitl" ? "all" : "hitl")}
                  className={`rounded-2xl p-2.5 text-left border transition-all cursor-pointer ${
                    hitlPending > 0
                      ? "bg-[#FFF2EC] border-[#FF5722]/30"
                      : "bg-white border-black/[0.07]"
                  }`}
                >
                  <div className="text-[10px] font-semibold text-[#C2410C]">
                    Ждут мастера
                  </div>
                  <div className="tma-display text-[16px] font-black text-[#0A0B0D] mt-0.5 leading-tight">
                    {hitlPending} HITL
                  </div>
                  <div className="tma-mono text-[9.5px] font-bold text-[#E03E00] mt-0.5">
                    Нажми ›
                  </div>
                </button>
              </div>

              {/* Search + Manychat Filter Pills */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 rounded-xl bg-white border border-black/[0.08] px-3 py-2">
                  <Search className="w-3.5 h-3.5 text-[#8C9197] shrink-0" />
                  <input
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Поиск по клиенту, району, дефекту..."
                    aria-label="Search leads"
                    className="w-full min-w-0 bg-transparent text-[12px] outline-none placeholder:text-[#9CA3AF]"
                  />
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5">
                  {(
                    [
                      { id: "all", label: `Все (${jobs.length})` },
                      { id: "hitl", label: `Нужен мастер (${hitlPending})` },
                      { id: "quoted", label: "Оценены" },
                      { id: "booked", label: "В графике" },
                    ] as const
                  ).map((chip) => {
                    const active = filter === chip.id;
                    return (
                      <button
                        key={chip.id}
                        type="button"
                        onClick={() => setFilter(chip.id)}
                        className={`px-3 py-1.5 rounded-full text-[11px] font-bold shrink-0 transition-all cursor-pointer ${
                          active
                            ? "bg-[#0A0B0D] text-white"
                            : "bg-white text-[#525860] border border-black/[0.08] hover:border-black/20"
                        }`}
                      >
                        {chip.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Manychat Scannable Live Inbox Window */}
              <div className="rounded-2xl bg-white border border-black/[0.08] overflow-hidden divide-y divide-black/[0.06]">
                {filteredJobs.map((job) => {
                  const pill = statusPill(job);
                  return (
                    <button
                      key={job.id}
                      type="button"
                      onClick={() => {
                        setOpenJobId(job.id);
                        setDetailTab("chat");
                      }}
                      className="w-full p-3.5 text-left hover:bg-[#F8F9FB] active:bg-[#F1F3F6] transition-colors flex items-start gap-3 cursor-pointer"
                    >
                      <div className="relative shrink-0 mt-0.5">
                        <AvatarCircle who={job.avatarKey} size="md" />
                        <span
                          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full ring-2 ring-white ${pill.dot}`}
                        />
                      </div>

                      <div className="flex-1 min-w-0 space-y-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="tma-display text-[13.5px] font-extrabold truncate">
                            {job.clientName} · {job.title}
                          </span>
                          <span className="tma-mono text-[10px] text-[#6B7280] shrink-0">
                            {job.slotTime}
                          </span>
                        </div>

                        <p className="text-[11.5px] text-[#525860] line-clamp-1">
                          {job.defectSummary}
                        </p>

                        <div className="flex items-center justify-between gap-2 pt-0.5">
                          <span
                            className={`tma-mono text-[10px] font-bold px-2 py-0.5 rounded-md ${pill.cls}`}
                          >
                            {pill.label}
                          </span>
                          <div className="flex items-center gap-1 text-[11.5px] font-extrabold text-[#0A0B0D]">
                            <span className="tma-mono">{job.priceRange}</span>
                            <ChevronRight className="w-3.5 h-3.5 text-[#9CA3AF]" />
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {/* SCREEN 2: FLOWS (Manychat Visual Automation Node Inspector) */}
          {tab === "flows" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#0A0B0D] text-white p-4 space-y-1">
                <div className="flex items-center justify-between">
                  <span className="tma-mono text-[10px] uppercase tracking-wider text-[#C8FF00] font-bold">
                    OnIt Automation Flow
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/10 text-[#00C48C] font-bold">
                    ● Active
                  </span>
                </div>
                <div className="tma-display text-[18px] font-extrabold">
                  WhatsApp → Quote → Calendar
                </div>
                <p className="text-[11.5px] text-white/70">
                  Управляйте триггерами, порогом HITL и авто-отзывами в один тап.
                </p>
              </div>

              {/* Connected Flow Nodes */}
              <div className="space-y-0">
                {/* Node 1 */}
                <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-[#EEF3FF] text-[#0052FF] flex items-center justify-center shrink-0">
                      <MessageCircle className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="tma-display text-[13px] font-extrabold">
                        1. Trigger: WhatsApp / TG
                      </div>
                      <div className="text-[11px] text-[#6B7280] truncate">
                        Debouncer 10s · 46 чатов/нед
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setFlowWaEnabled((v) => !v)}
                    aria-label="Toggle WhatsApp trigger"
                    className={`w-10 h-6 rounded-full p-0.5 transition-colors cursor-pointer shrink-0 ${
                      flowWaEnabled ? "bg-[#0052FF]" : "bg-[#D1D5DB]"
                    }`}
                  >
                    <span
                      className={`block w-5 h-5 rounded-full bg-white transition-transform ${
                        flowWaEnabled ? "translate-x-4" : "translate-x-0"
                      }`}
                    />
                  </button>
                </div>

                <div className="h-4 flex justify-center">
                  <span className="w-[1.5px] h-full border-l border-dashed border-[#0052FF]/50" />
                </div>

                {/* Node 2 */}
                <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-8 h-8 rounded-xl bg-[#F3E8FF] text-[#7C3AED] flex items-center justify-center shrink-0">
                      <Sparkles className="w-4 h-4" />
                    </span>
                    <div className="min-w-0">
                      <div className="tma-display text-[13px] font-extrabold">
                        2. Vision + Polyglot Voice
                      </div>
                      <div className="text-[11px] text-[#6B7280] truncate">
                        Gemini 2.5 + Whisper (HY/RU/EN/ES)
                      </div>
                    </div>
                  </div>
                  <span className="tma-mono text-[10px] font-bold px-2 py-0.5 rounded-md bg-[#E7FBF4] text-[#047857]">
                    PII ON
                  </span>
                </div>

                <div className="h-4 flex justify-center">
                  <span className="w-[1.5px] h-full border-l border-dashed border-[#0052FF]/50" />
                </div>

                {/* Node 3: Interactive Confidence Gate */}
                <div className="rounded-2xl bg-white border border-[#FF5722]/30 p-3.5 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <span className="w-8 h-8 rounded-xl bg-[#FFF0EB] text-[#E03E00] flex items-center justify-center shrink-0">
                        <SlidersHorizontal className="w-4 h-4" />
                      </span>
                      <div>
                        <div className="tma-display text-[13px] font-extrabold">
                          3. HITL Confidence Gate
                        </div>
                        <div className="text-[11px] text-[#6B7280]">
                          Ниже порога → пауза и пуш мастеру
                        </div>
                      </div>
                    </div>
                    <span className="tma-mono text-[13px] font-black text-[#0052FF]">
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
                    aria-label="Confidence threshold"
                    className="w-full accent-[#0052FF] cursor-pointer"
                  />
                </div>

                <div className="h-4 flex justify-center">
                  <span className="w-[1.5px] h-full border-l border-dashed border-[#0052FF]/50" />
                </div>

                {/* Node 4 */}
                <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 space-y-2.5">
                  <div className="flex items-center gap-2.5">
                    <span className="w-8 h-8 rounded-xl bg-[#E7FBF4] text-[#047857] flex items-center justify-center shrink-0">
                      <Clock className="w-4 h-4" />
                    </span>
                    <div>
                      <div className="tma-display text-[13px] font-extrabold">
                        4. Напоминания и отзывы
                      </div>
                      <div className="text-[11px] text-[#6B7280]">
                        Авто-цепочка после брони слота
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 pt-0.5">
                    <button
                      type="button"
                      onClick={() => setFlowReminderEnabled((v) => !v)}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border text-left cursor-pointer ${
                        flowReminderEnabled
                          ? "bg-[#EEF3FF] border-[#0052FF]/25 text-[#0042DA]"
                          : "bg-[#F4F5F7] border-transparent text-[#6B7280]"
                      }`}
                    >
                      {flowReminderEnabled ? "✓ " : ""}Напомнить за 2ч
                    </button>
                    <button
                      type="button"
                      onClick={() => setFlowReviewEnabled((v) => !v)}
                      className={`py-2 px-2.5 rounded-xl text-[11px] font-bold border text-left cursor-pointer ${
                        flowReviewEnabled
                          ? "bg-[#E7FBF4] border-[#00C48C]/30 text-[#047857]"
                          : "bg-[#F4F5F7] border-transparent text-[#6B7280]"
                      }`}
                    >
                      {flowReviewEnabled ? "✓ " : ""}Отзыв через 1ч
                    </button>
                  </div>
                </div>
              </div>

              {/* Active Learning Feed Preview */}
              <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="tma-display text-[12.5px] font-extrabold">
                    Active Learning ({hitlLogs.length})
                  </span>
                  <span className="tma-mono text-[10px] text-[#6B7280]">PocketBase</span>
                </div>
                {hitlLogs.slice(0, 3).map((l) => (
                  <div
                    key={l.id}
                    className="rounded-xl bg-[#F4F5F7] px-2.5 py-2 flex items-center justify-between gap-2 text-[11px]"
                  >
                    <span className="truncate font-medium">{l.summary}</span>
                    <span className="tma-mono text-[10px] font-bold text-[#0052FF] shrink-0">
                      {l.action}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCREEN 3: ROUTE (Geo-Optimized Day Timeline) */}
          {tab === "route" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-[#0052FF] text-white p-4 flex items-center justify-between gap-3">
                <div>
                  <div className="tma-mono text-[10px] uppercase text-white/75">
                    OSRM Route Optimizer · Ереван
                  </div>
                  <div className="tma-display text-[20px] font-extrabold mt-0.5">
                    −48 мин в пути сегодня
                  </div>
                  <div className="text-[11.5px] text-white/80 mt-0.5">
                    Kentron → Arabkir → Avan · 14.2 км
                  </div>
                </div>
                <Compass className="w-8 h-8 text-[#C8FF00] shrink-0" />
              </div>

              <div className="space-y-2">
                {jobs.map((job, idx) => {
                  const nav = buildNavigatorUrls(job.location);
                  return (
                    <div key={job.id} className="space-y-1.5">
                      {idx > 0 && (
                        <div className="flex items-center gap-2 pl-4">
                          <span className="w-[1.5px] h-4 border-l border-dashed border-black/25" />
                          <span className="tma-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-white border border-black/[0.07] text-[#525860]">
                            🚗 {6 + idx * 4} мин пути · OSRM
                          </span>
                        </div>
                      )}
                      <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 flex items-center justify-between gap-2.5">
                        <button
                          type="button"
                          onClick={() => {
                            setOpenJobId(job.id);
                            setDetailTab("object");
                          }}
                          className="flex items-center gap-3 min-w-0 text-left flex-1 cursor-pointer"
                        >
                          <span className="tma-mono w-8 h-8 rounded-xl bg-[#0A0B0D] text-[#C8FF00] text-[12px] font-bold flex items-center justify-center shrink-0">
                            {idx + 1}
                          </span>
                          <div className="min-w-0">
                            <div className="tma-display text-[13px] font-extrabold truncate">
                              {job.slotTime} · {job.title}
                            </div>
                            <div className="text-[11px] text-[#6B7280] truncate">
                              {job.address} ({job.district})
                            </div>
                          </div>
                        </button>
                        <a
                          href={nav.googleMaps}
                          target="_blank"
                          rel="noreferrer"
                          aria-label="Open route in Google Maps"
                          className="w-8 h-8 rounded-xl bg-[#EEF3FF] text-[#0052FF] flex items-center justify-center shrink-0 hover:bg-[#DCE7FF]"
                        >
                          <ArrowUpRight className="w-4 h-4" />
                        </a>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* SCREEN 4: PRICING & CHANNELS (5-Min Setup) */}
          {tab === "pricing" && (
            <div className="space-y-3">
              <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 space-y-2.5">
                <div className="tma-display text-[13px] font-extrabold">
                  Подключённые каналы
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div className="rounded-xl bg-[#E7FBF4] px-3 py-2 font-bold text-[#047857]">
                    ● WhatsApp Cloud
                  </div>
                  <div className="rounded-xl bg-[#EEF3FF] px-3 py-2 font-bold text-[#0042DA]">
                    ● Google Calendar
                  </div>
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 space-y-2">
                <div className="tma-display text-[13px] font-extrabold">
                  Зоны выезда · Ереван
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {["Kentron", "Arabkir", "Avan", "Erebuni", "Davtashen"].map((z) => {
                    const active = zones.includes(z);
                    return (
                      <button
                        key={z}
                        type="button"
                        onClick={() => toggleZone(z)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold cursor-pointer transition-colors ${
                          active
                            ? "bg-[#0A0B0D] text-white"
                            : "bg-[#F4F5F7] text-[#525860]"
                        }`}
                      >
                        {active ? "✓ " : ""}
                        {z}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="rounded-2xl bg-white border border-black/[0.08] p-3.5 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="tma-display text-[13px] font-extrabold">
                    Прайс-матрица ({matrix.services.length})
                  </div>
                  <button
                    type="button"
                    onClick={() => setPriceSheetOpen(true)}
                    className="px-2.5 py-1 rounded-lg bg-[#0052FF] text-white text-[11px] font-bold inline-flex items-center gap-1 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" /> Импорт
                  </button>
                </div>

                <div className="divide-y divide-black/[0.06]">
                  {matrix.services.map((s) => (
                    <div
                      key={s.code}
                      className="py-2 flex items-center justify-between gap-2 text-[12px]"
                    >
                      <div className="min-w-0">
                        <div className="font-bold truncate">{s.name}</div>
                        <div className="tma-mono text-[10px] text-[#6B7280]">
                          {s.estimatedMinutes} мин · {s.code}
                        </div>
                      </div>
                      <span className="tma-mono font-bold shrink-0">
                        {s.priceMin === s.priceMax
                          ? s.priceMin
                          : `${s.priceMin}–${s.priceMax}`}{" "}
                        {matrix.currency}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Bottom Tab Bar (Hidden inside Detail Window like native Telegram / Manychat app) */}
      {!openJob && (
        <nav className="bg-white border-t border-black/[0.08] px-2 py-2 grid grid-cols-4 gap-1 shrink-0">
          {(
            [
              { id: "inbox", label: "Инбокс", icon: Inbox, badge: hitlPending },
              { id: "flows", label: "Флоу", icon: GitBranch, badge: 0 },
              { id: "route", label: "Маршрут", icon: Compass, badge: 0 },
              { id: "pricing", label: "Прайс", icon: FileSpreadsheet, badge: 0 },
            ] as const
          ).map((item) => {
            const Icon = item.icon;
            const active = tab === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setTab(item.id)}
                className={`relative py-1.5 rounded-xl flex flex-col items-center gap-0.5 text-[10px] font-bold cursor-pointer transition-colors ${
                  active
                    ? "text-[#0052FF] bg-[#EEF3FF]"
                    : "text-[#6B7280] hover:text-[#0A0B0D]"
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{item.label}</span>
                {item.badge > 0 && (
                  <span className="absolute top-1 right-4 w-4 h-4 rounded-full bg-[#FF4D1C] text-white text-[9px] font-extrabold flex items-center justify-center">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      )}

      {/* BOTTOM SHEET A: Quote Adjustment & Voice Escalation */}
      {quoteSheetJob && (
        <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px] flex items-end">
          <div className="w-full rounded-t-[26px] bg-white p-4 pb-5 space-y-3.5 shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-black/15 mx-auto" />
            <div className="flex items-start justify-between gap-2">
              <div>
                <div className="tma-display text-[16px] font-extrabold">
                  Корректировка сметы · #{quoteSheetJob.id}
                </div>
                <div className="text-[11.5px] text-[#6B7280]">
                  Наговорите голосом или укажите вилку — OnIt красиво оформит ответ в WhatsApp
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuoteSheetJob(null)}
                aria-label="Close quote sheet"
                className="w-7 h-7 rounded-full bg-[#F4F5F7] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <button
              type="button"
              onClick={handleVoiceSimulate}
              className={`w-full py-2.5 px-3 rounded-xl text-[12px] font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors ${
                voiceRecording
                  ? "bg-[#FF4D1C] text-white"
                  : "bg-[#0A0B0D] text-white hover:opacity-90"
              }`}
            >
              <Mic className="w-4 h-4 text-[#C8FF00]" />
              {voiceRecording
                ? "Расшифровываем Groq Whisper..."
                : "🎙️ Наговорить: «Скажи ему 40 тыс, в пятницу в 10:00»"}
            </button>

            <div className="flex gap-1.5">
              {[15000, 22000, 35000, 40000].map((v) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setAdjMin(v);
                    setAdjMax(v);
                  }}
                  className="tma-mono flex-1 py-1.5 rounded-lg bg-[#F4F5F7] hover:bg-[#EEF3FF] text-[11px] font-bold cursor-pointer"
                >
                  {v / 1000}k
                </button>
              ))}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <label className="block">
                <span className="text-[10px] font-bold text-[#6B7280]">От ({matrix.currency})</span>
                <input
                  type="number"
                  value={adjMin}
                  onChange={(e) => setAdjMin(Number(e.target.value))}
                  className="tma-mono mt-0.5 w-full rounded-xl bg-[#F4F5F7] px-3 py-2 text-[13px] font-bold outline-none"
                />
              </label>
              <label className="block">
                <span className="text-[10px] font-bold text-[#6B7280]">До ({matrix.currency})</span>
                <input
                  type="number"
                  value={adjMax}
                  onChange={(e) => setAdjMax(Number(e.target.value))}
                  className="tma-mono mt-0.5 w-full rounded-xl bg-[#F4F5F7] px-3 py-2 text-[13px] font-bold outline-none"
                />
              </label>
            </div>

            <input
              value={adjNote}
              onChange={(e) => setAdjNote(e.target.value)}
              aria-label="Note for client"
              className="w-full rounded-xl bg-[#F4F5F7] px-3 py-2 text-[12px] outline-none"
              placeholder="Комментарий клиенту..."
            />

            <button
              type="button"
              onClick={() => {
                adjustJobQuote(quoteSheetJob.id, adjMin, adjMax, adjNote);
                setQuoteSheetJob(null);
              }}
              className="w-full py-3 rounded-xl bg-[#0052FF] text-white text-[12.5px] font-extrabold cursor-pointer hover:opacity-95"
            >
              Отправить клиенту в WhatsApp + обучить AI
            </button>
          </div>
        </div>
      )}

      {/* BOTTOM SHEET B: 5-Minute Price Import */}
      {priceSheetOpen && (
        <div className="absolute inset-0 z-30 bg-black/40 backdrop-blur-[2px] flex items-end">
          <div className="w-full rounded-t-[26px] bg-white p-4 pb-5 space-y-3 shadow-2xl">
            <div className="w-10 h-1 rounded-full bg-black/15 mx-auto" />
            <div className="flex items-center justify-between">
              <div className="tma-display text-[16px] font-extrabold">
                Импорт прайса за 5 минут
              </div>
              <button
                type="button"
                onClick={() => setPriceSheetOpen(false)}
                aria-label="Close price sheet"
                className="w-7 h-7 rounded-full bg-[#F4F5F7] flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-[#F4F5F7]">
              {(
                [
                  { id: "text", label: "Текст / CSV" },
                  { id: "photo", label: "Фото прайса" },
                  { id: "voice", label: "Голосом" },
                ] as const
              ).map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPriceImportMode(m.id)}
                  className={`py-1.5 rounded-lg text-[11px] font-bold cursor-pointer ${
                    priceImportMode === m.id
                      ? "bg-white text-[#0A0B0D] shadow-xs"
                      : "text-[#6B7280]"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>

            {priceImportMode !== "text" && (
              <div className="rounded-xl bg-[#EEF3FF] p-3 text-[11.5px] text-[#0042DA] font-medium">
                {priceImportMode === "photo"
                  ? "Gemini 2.5 Flash распознал рукописный прайс → проверьте строки перед сохранением:"
                  : "Groq Whisper расшифровал голосовое мастера → проверьте строки:"}
              </div>
            )}

            <textarea
              value={priceDraft}
              onChange={(e) => setPriceDraft(e.target.value)}
              rows={5}
              aria-label="Price matrix raw text"
              className="tma-mono w-full rounded-xl bg-[#F4F5F7] p-3 text-[11px] outline-none"
            />

            <button
              type="button"
              onClick={handleSaveMobilePrice}
              className="w-full py-3 rounded-xl bg-[#0052FF] text-white text-[12.5px] font-extrabold cursor-pointer"
            >
              Конвертировать в PriceMatrix JSON
            </button>
          </div>
        </div>
      )}
    </div>
  );

  if (standalone) {
    return <div className="min-h-screen bg-[#E9EDF0]">{phoneBody}</div>;
  }

  return (
    <div className="w-full max-w-[1380px] rounded-[34px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_32px_90px_rgba(15,23,42,0.12)] p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[420px_1fr] gap-6 items-center">
      <div className="flex justify-center">{phoneBody}</div>

      {/* Editorial Companion Guide (Manychat-inspired typography & architecture notes) */}
      <div className="tma-shell space-y-4">
        <div className="rounded-[28px] bg-white p-6 border border-black/[0.06] shadow-xs space-y-3.5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#0052FF] text-white text-[11px] font-bold">
              <Zap className="w-3.5 h-3.5 fill-current" /> Manychat-Inspired Mobile UX
            </span>
            <span className="tma-mono text-[11px] px-2.5 py-1 rounded-full bg-[#F4F5F7] text-[#525860] font-semibold">
              Onest + Inter + JetBrains Mono
            </span>
          </div>

          <h2 className="tma-display text-[26px] font-black tracking-tight leading-[1.1] text-[#0A0B0D]">
            Современный Telegram Mini App с живыми окнами и Automation Flow
          </h2>

          <p className="text-[13.5px] text-[#525860] leading-relaxed">
            Кликните по любой заявке в <strong>Инбоксе</strong> — откроется нативное окно диалога с 3 вкладками (<strong>Диалог</strong>, <strong>Смета AI</strong>, <strong>Объект</strong>), баннером автопилота и выдвижными шторками (Bottom Sheets) для голосовой правки сметы и импорта прайса.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
            {[
              {
                title: "1. Инбокс → Окно чата",
                desc: "Сканируемый список заявок без визуального шума + полноценный Live Chat с перехватом AI.",
                action: () => {
                  setTab("inbox");
                  setOpenJobId(jobs[3]?.id ?? jobs[0]?.id ?? null);
                  setDetailTab("chat");
                },
                cta: "Открыть HITL-диалог →",
              },
              {
                title: "2. Визуальный Флоу",
                desc: "Схема 4 шагов автоматизации с живым ползунком Confidence Gate и тумблерами напоминаний.",
                action: () => {
                  setOpenJobId(null);
                  setTab("flows");
                },
                cta: "Открыть вкладку Флоу →",
              },
              {
                title: "3. Голосовая шторка сметы",
                desc: "Bottom Sheet с 1-тап диктовкой через Groq Whisper и мгновенной отправкой клиенту в WhatsApp.",
                action: () => {
                  if (jobs[3] ?? jobs[0]) openQuoteSheet((jobs[3] ?? jobs[0])!);
                },
                cta: "Открыть шторку сметы →",
              },
              {
                title: "4. OSRM Маршрут + Прайс",
                desc: "Хронология выездов по районам Еревана с расчётом времени в пути и быстрым импортом прайса.",
                action: () => {
                  setOpenJobId(null);
                  setTab("route");
                },
                cta: "Открыть маршрут дня →",
              },
            ].map((item) => (
              <button
                key={item.title}
                type="button"
                onClick={item.action}
                className="text-left rounded-2xl bg-[#F4F5F7] hover:bg-[#EEF3FF] border border-transparent hover:border-[#0052FF]/20 p-3.5 transition-all cursor-pointer space-y-1"
              >
                <div className="tma-display text-[13px] font-extrabold text-[#0A0B0D]">
                  {item.title}
                </div>
                <p className="text-[11.5px] text-[#525860] leading-snug">
                  {item.desc}
                </p>
                <div className="text-[11px] font-bold text-[#0052FF] pt-0.5">
                  {item.cta}
                </div>
              </button>
            ))}
          </div>
        </div>

        <div className="rounded-[24px] bg-[#0A0B0D] text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="tma-mono text-[10px] uppercase text-[#C8FF00] font-bold">
              Standalone Telegram WebApp URL
            </div>
            <div className="tma-mono text-[14px] font-bold mt-0.5">
              http://localhost:3000/tma
            </div>
          </div>
          <div className="flex gap-2">
            <a
              href="/tma"
              className="px-3.5 py-2 rounded-xl bg-[#0052FF] text-white text-[12px] font-bold inline-flex items-center gap-1"
            >
              Открыть /tma <ArrowUpRight className="w-3.5 h-3.5" />
            </a>
            <button
              type="button"
              onClick={() => setSurface("client")}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-[12px] font-bold cursor-pointer"
            >
              Client WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
