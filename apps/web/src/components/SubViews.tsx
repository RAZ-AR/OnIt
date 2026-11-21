"use client";

import React, { useEffect, useState } from "react";
import {
  buildNavigatorUrls,
  findOptimalRouteSlots,
  formatSlotTime,
  getEquipmentById,
  HaversineRoutingProvider,
  OnItDispatcher,
  parseTextPriceListDeterministic,
  redactPii,
  RuleBasedTriageProvider,
  type LeadSession,
  type PriceMatrix,
  type QuoteResult,
  type RouteSlot,
} from "@onit/core";
import { DefectPhotoCard } from "./DefectPhotoCard";
import {
  ArrowLeft,
  CheckCircle2,
  Compass,
  ExternalLink,
  FileSpreadsheet,
  MapPin,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";
import { YEREVAN_DISTRICTS, type DemoJob } from "../data/demo-data";

const DEFAULT_PRICE_TEXT = `# Прайс-лист CoolAir Yerevan
1. Заправка кондиционера фреоном | 12 000 - 15 000 AMD | 45 мин
2. Чистка дренажной системы | 6 000 - 7 000 AMD | 30 мин
3. Полная профилактика сплит-системы | 15 000 - 18 000 AMD | 60 мин
4. Диагностика кондиционера: 5 000 AMD (30 мин)`;

export function SimulatorSubView({
  matrix,
  onBack,
  onAddJob,
}: {
  matrix: PriceMatrix;
  onBack: () => void;
  onAddJob: (job: DemoJob) => void;
}) {
  const [inputText, setInputText] = useState(
    "Привет! Кондиционер течёт и плохо холодит, доступ с балкона есть, 2 этаж. Телефон +374 91 555-222, код домофона 4589#"
  );
  const [outcome, setOutcome] = useState<{
    redacted: string;
    redactedCount: number;
    state: string;
    clientReply: string | null;
    masterNotification: string | null;
    quote?: QuoteResult;
    hitlEscalated: boolean;
  } | null>(null);

  const runSimulation = async (textOverride?: string) => {
    const text = (textOverride ?? inputText).trim();
    if (!text) return;
    const pii = redactPii(text);
    const dispatcher = new OnItDispatcher(new RuleBasedTriageProvider());
    const session: LeadSession = {
      leadId: `sim_${Date.now().toString().slice(-4)}`,
      companyId: matrix.companyId,
      companyName: "CoolAir Yerevan",
      state: "new",
      clientName: "Web Demo Client",
      collectedAttributes: {},
      transcriptHistory: [],
    };
    const res = await dispatcher.handleTurn(session, matrix, { texts: [text] });
    setOutcome({
      redacted: pii.redacted,
      redactedCount: pii.redactedCount,
      state: res.session.state,
      clientReply: res.clientReply,
      masterNotification: res.masterNotification,
      quote: res.quote,
      hitlEscalated: res.hitlEscalated,
    });

    if (res.quote?.status === "ready") {
      onAddJob({
        id: session.leadId,
        title: res.quote.lineItems[0]?.name.slice(0, 22) ?? "New AI Quote",
        subtitle: `${res.quote.estimatedMinutes}m · ${res.quote.totalMin}–${res.quote.totalMax} ${res.quote.currency}`,
        district: "Kentron",
        address: "Ереван (Web Demo)",
        clientName: "Demo Client",
        clientPhone: "+374 91 000-000",
        technician: "Aram",
        avatarKey: "ani",
        status: "quoted",
        confidence: Math.round(res.quote.confidence * 100),
        priceRange: `${res.quote.totalMin.toLocaleString("ru-RU")} – ${res.quote.totalMax.toLocaleString("ru-RU")} ${res.quote.currency}`,
        durationMin: res.quote.estimatedMinutes,
        slotTime: "11:30",
        startCol: 2.2,
        spanCols: 4.1,
        location: { lat: 40.1811, lng: 44.5136 },
        defectSummary: pii.redacted,
      });
    }
  };

  useEffect(() => {
    void runSimulation();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const presets = [
    {
      label: "Фреон + Дренаж (RU)",
      text: "Кондиционер течёт и плохо холодит, доступ с балкона есть, 2 этаж. Звоните +374 91 555-222",
    },
    {
      label: "Не хватает данных (1–2 вопроса)",
      text: "Нужна полная профилактика кондиционера, сколько будет стоить?",
    },
    {
      label: "Срочно + 5 этаж + нет доступа",
      text: "Срочно сегодня нужна заправка фреоном, 5 этаж, наружный блок под глухим окном без балкона",
    },
    {
      label: "HITL Эскалация (Вне прайса)",
      text: "Пошёл запах гари из промышленного чиллера на крыше, выбивает автомат",
    },
  ];

  return (
    <main className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onBack}
            className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center cursor-pointer hover:bg-[#F3F5F7]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <h1 className="text-[22px] font-extrabold tracking-tight">
              30-Second AI Dispatch Simulator
            </h1>
            <p className="text-[12px] text-[#6B7280]">
              Реальное ядро @onit/core: PII Redactor → Triage → Deterministic Quote Engine
            </p>
          </div>
        </div>
      </div>

      {/* Presets */}
      <div className="flex flex-wrap gap-2">
        {presets.map((p) => (
          <button
            key={p.label}
            type="button"
            onClick={() => {
              setInputText(p.text);
              void runSimulation(p.text);
            }}
            className="px-3 py-1.5 rounded-full bg-white border border-black/10 hover:bg-[#D1F366] text-[11.5px] font-semibold transition-colors cursor-pointer"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Input Card */}
      <div className="rounded-[26px] bg-white p-4 shadow-xs border border-white space-y-3">
        <textarea
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          rows={3}
          className="w-full rounded-2xl bg-[#F6F7F9] p-3 text-[13px] outline-none border border-black/[0.06] focus:border-black/30 resize-none"
          placeholder="Напишите заявку клиента..."
        />
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <span className="text-[11px] text-[#6B7280] flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-[#111214]" />
            Телефоны, email и коды домофона маскируются до отправки в LLM
          </span>
          <button
            type="button"
            onClick={() => void runSimulation()}
            className="px-4 py-2 rounded-full bg-[#111214] text-white text-[12px] font-bold inline-flex items-center gap-1.5 hover:opacity-90 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-[#D1F366]" />
            Рассчитать за 30 сек
          </button>
        </div>
      </div>

      {/* Results Bento */}
      {outcome && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="rounded-[26px] bg-[#D1F366] p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-extrabold">
                Ответ клиенту (WhatsApp / TG)
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#111214] text-white text-[10px] font-bold uppercase">
                {outcome.state}
              </span>
            </div>
            <div className="rounded-2xl bg-white/90 p-3 text-[12.5px] leading-relaxed text-[#111214]">
              {outcome.clientReply ?? "Автоответ на паузе (HITL)"}
            </div>
            <div className="rounded-2xl bg-black/[0.06] p-2.5 text-[11px]">
              <span className="font-bold">GDPR Redacted ({outcome.redactedCount}): </span>
              {outcome.redacted}
            </div>
          </div>

          <div className="rounded-[26px] bg-[#111214] text-white p-4 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-[13px] font-extrabold">
                Deterministic Quote & Master Brief
              </span>
              <span className="px-2.5 py-0.5 rounded-full bg-[#85E6DC] text-[#111214] text-[10px] font-bold">
                0 LLM Math
              </span>
            </div>
            {outcome.masterNotification && (
              <pre className="whitespace-pre-wrap text-[11.5px] font-sans bg-white/10 rounded-2xl p-3 leading-relaxed">
                {outcome.masterNotification}
              </pre>
            )}
            {outcome.quote?.status === "ready" && (
              <div className="text-[11px] text-white/75 space-y-1">
                {outcome.quote.lineItems.map((li) => (
                  <div key={li.code} className="flex justify-between">
                    <span>{li.name}</span>
                    <span className="font-bold text-[#D1F366] tabular-nums">
                      {li.totalMin}–{li.totalMax} {outcome.quote?.status === "ready" ? outcome.quote.currency : ""}
                    </span>
                  </div>
                ))}
                {outcome.quote.appliedModifiers.map((m) => (
                  <div key={m.code} className="flex justify-between text-[#85E6DC]">
                    <span>+ {m.label}</span>
                    <span className="tabular-nums">
                      +{m.deltaMin}..{m.deltaMax}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </main>
  );
}

export function PriceMatrixSubView({
  matrix,
  onApplyMatrix,
  onBack,
}: {
  matrix: PriceMatrix;
  onApplyMatrix: (next: PriceMatrix) => void;
  onBack: () => void;
}) {
  const [rawText, setRawText] = useState(DEFAULT_PRICE_TEXT);
  const [error, setError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);

  const handleParse = () => {
    try {
      const parsed = parseTextPriceListDeterministic(rawText, {
        companyId: matrix.companyId,
        defaultCategory: "hvac",
      });
      onApplyMatrix(parsed);
      setError(null);
      setSavedBanner(true);
      setTimeout(() => setSavedBanner(false), 2500);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Parse error");
    }
  };

  return (
    <main className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-2.5 px-1">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">
            5-Minute Onboarding · Price Parser
          </h1>
          <p className="text-[12px] text-[#6B7280]">
            Вставьте прайс в свободном тексте или CSV → валидная JSON-матрица для Quote Engine
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="rounded-[26px] bg-white p-4 border border-white shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-bold flex items-center gap-1.5">
              <FileSpreadsheet className="w-4 h-4" /> Исходный прайс-лист
            </span>
            {savedBanner && (
              <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#D1F366]">
                Применено!
              </span>
            )}
          </div>
          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            rows={7}
            className="w-full rounded-2xl bg-[#F6F7F9] p-3 text-[12px] font-mono outline-none border border-black/[0.06]"
          />
          {error && <div className="text-[11.5px] text-red-600">{error}</div>}
          <button
            type="button"
            onClick={handleParse}
            className="w-full py-2.5 rounded-full bg-[#111214] text-white text-[12.5px] font-bold cursor-pointer hover:opacity-90"
          >
            Конвертировать в PriceMatrix JSON
          </button>
        </div>

        <div className="rounded-[26px] bg-[#D1F366] p-4 space-y-2.5">
          <div className="flex items-center justify-between">
            <span className="text-[13.5px] font-extrabold">
              Активная матрица ({matrix.services.length} услуг)
            </span>
            <span className="px-2.5 py-0.5 rounded-full bg-[#111214] text-white text-[10.5px] font-bold">
              {matrix.currency}
            </span>
          </div>
          <div className="space-y-2 max-h-[260px] overflow-y-auto thin-scroll pr-1">
            {matrix.services.map((s) => (
              <div
                key={s.code}
                className="rounded-2xl bg-white/95 px-3 py-2.5 flex items-center justify-between gap-2 text-[12px]"
              >
                <div className="min-w-0">
                  <div className="font-bold truncate">{s.name}</div>
                  <div className="text-[10px] text-[#6B7280] font-mono">
                    {s.code} · {s.estimatedMinutes} мин
                  </div>
                </div>
                <span className="font-extrabold tabular-nums shrink-0">
                  {s.priceMin === s.priceMax
                    ? `${s.priceMin}`
                    : `${s.priceMin}–${s.priceMax}`}{" "}
                  {matrix.currency}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}

export function GeoRoutesSubView({ onBack }: { onBack: () => void }) {
  const [district, setDistrict] = useState(YEREVAN_DISTRICTS[0]!);
  const [slots, setSlots] = useState<RouteSlot[]>([]);

  useEffect(() => {
    void (async () => {
      const next = await findOptimalRouteSlots(
        {
          technicianId: "tech-1",
          homeBase: { lat: 40.1352, lng: 44.5191 },
          targetLocation: district.point,
          jobDurationMinutes: 60,
          workingWindow: {
            dateIso: "2026-05-10",
            startHour: 9,
            endHour: 19,
            tzOffsetMinutes: 240,
          },
          existingBookings: [
            {
              id: "b1",
              technicianId: "tech-1",
              startIso: "2026-05-10T06:00:00.000Z",
              endIso: "2026-05-10T07:00:00.000Z",
              location: { lat: 40.1811, lng: 44.5136 },
            },
            {
              id: "b2",
              technicianId: "tech-1",
              startIso: "2026-05-10T11:00:00.000Z",
              endIso: "2026-05-10T12:00:00.000Z",
              location: { lat: 40.2144, lng: 44.5681 },
            },
          ],
          maxResults: 2,
        },
        new HaversineRoutingProvider()
      );
      setSlots(next);
    })();
  }, [district]);

  return (
    <main className="flex flex-col gap-4 min-w-0">
      <div className="flex items-center gap-2.5 px-1">
        <button
          type="button"
          onClick={onBack}
          className="w-9 h-9 rounded-full bg-white border border-black/10 flex items-center justify-center cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <div>
          <h1 className="text-[22px] font-extrabold tracking-tight">
            Geo-Aware Route Optimizer (OSRM)
          </h1>
          <p className="text-[12px] text-[#6B7280]">
            Выберите район новой заявки в Ереване — движок подберёт 2 окна с минимальным объездом
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
        {YEREVAN_DISTRICTS.map((d) => {
          const active = d.name === district.name;
          return (
            <button
              key={d.name}
              type="button"
              onClick={() => setDistrict(d)}
              className={`p-3 rounded-[20px] text-left transition-all cursor-pointer border ${
                active
                  ? "bg-[#111214] text-white border-[#111214]"
                  : "bg-white text-[#111214] border-white hover:bg-[#D1F366]"
              }`}
            >
              <MapPin className="w-4 h-4 mb-1.5" />
              <div className="text-[12px] font-bold leading-tight">{d.label}</div>
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {slots.map((s, idx) => (
          <div
            key={s.startIso}
            className={`rounded-[26px] p-5 flex items-center justify-between ${
              idx === 0 ? "bg-[#D1F366] text-[#111214]" : "bg-[#111214] text-white"
            }`}
          >
            <div>
              <div className="text-[11px] font-bold uppercase opacity-70">
                Оптимальное окно #{idx + 1}
              </div>
              <div className="text-[28px] font-extrabold tabular-nums mt-1">
                {formatSlotTime(s.startIso, 240)} – {formatSlotTime(s.endIso, 240)}
              </div>
              <div className="text-[12px] mt-1 opacity-80">
                Время в пути от прошлого заказа: ~{s.travelMinutesFromPrev} мин
              </div>
            </div>
            <Compass className="w-8 h-8 opacity-75" />
          </div>
        ))}
      </div>
    </main>
  );
}

export function JobControlModal({
  job,
  onClose,
  onAction,
}: {
  job: DemoJob;
  onClose: () => void;
  onAction: (jobId: string, action: "accept" | "takeover" | "complete" | "price40k") => void;
}) {
  const nav = buildNavigatorUrls(job.location);
  const equip = getEquipmentById(job.equipmentModelId);
  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-[490px] max-h-[90vh] overflow-y-auto thin-scroll rounded-[32px] bg-[#F7F7F4] p-5 shadow-2xl space-y-4 border border-black/10">
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10.5px] font-bold uppercase px-2.5 py-0.5 rounded-full bg-[#E5BC73] text-[#1E1A14]">
              Карточка заказа · #{job.id}
            </span>
            <h3 className="tma-display text-[20px] font-extrabold mt-1.5 leading-tight">
              {job.title}
            </h3>
            <p className="text-[12px] text-black/60">
              {job.clientName} · {job.clientPhone} · {job.slotTime} ({job.district})
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close job modal"
            className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center cursor-pointer shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* High-res Technical Defect Photo with AI Box */}
        <DefectPhotoCard kind={job.photoKind ?? "frost_pipe"} />

        {/* Embedded Equipment Model Specification */}
        {equip && (
          <div className="rounded-[22px] bg-white p-3.5 border border-black/[0.06] space-y-1.5 text-[12px]">
            <div className="flex items-center justify-between gap-2">
              <span className="font-extrabold">
                {equip.brand} {equip.model} ({equip.capacityLabel})
              </span>
              <span className="tma-mono text-[10px] font-bold px-2 py-0.5 rounded-full bg-[#E7E8E3]">
                {equip.refrigerant ?? "HVAC"}
              </span>
            </div>
            <div className="text-black/70">
              <strong>Инструмент:</strong> {equip.requiredTools.join(", ")}
            </div>
            <div className="flex flex-wrap gap-1 pt-0.5">
              {equip.commonParts.map((p) => (
                <span
                  key={p}
                  className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#F4F5F1] text-black/75"
                >
                  {p}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="rounded-[22px] bg-white p-3.5 border border-black/[0.06] text-[12.5px] space-y-1.5">
          <div>
            <span className="font-bold">Адрес:</span> {job.address} ({job.district}) ·{" "}
            {job.floorLabel ?? "2 этаж"}
          </div>
          <div>
            <span className="font-bold">Дефект ({job.voiceLangBadge ?? "RU"}):</span>{" "}
            {job.defectSummary}
          </div>
          <div className="flex items-center justify-between pt-2 border-t border-black/[0.06]">
            <span className="tma-display text-[16px] font-extrabold">
              {job.priceRange}
            </span>
            <span className="tma-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#141517] text-[#E5BC73]">
              AI {job.confidence}%
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <a
            href={nav.googleMaps}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 rounded-full bg-white border border-black/15 text-[11.5px] font-bold flex items-center justify-center gap-1 hover:bg-[#F2F3EE]"
          >
            Google Maps <ExternalLink className="w-3 h-3" />
          </a>
          <a
            href={nav.yandexMaps}
            target="_blank"
            rel="noreferrer"
            className="py-2.5 rounded-full bg-white border border-black/15 text-[11.5px] font-bold flex items-center justify-center gap-1 hover:bg-[#F2F3EE]"
          >
            Yandex Maps <ExternalLink className="w-3 h-3" />
          </a>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={() => {
              onAction(job.id, "accept");
              onClose();
            }}
            className="py-2.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[12px] font-extrabold flex items-center justify-center gap-1.5 cursor-pointer hover:brightness-95"
          >
            <CheckCircle2 className="w-4 h-4" /> Принять заказ
          </button>
          <button
            type="button"
            onClick={() => {
              onAction(job.id, job.status === "hitl" ? "price40k" : "complete");
              onClose();
            }}
            className="py-2.5 rounded-full bg-[#A7CCC9] text-[#122423] text-[12px] font-extrabold cursor-pointer hover:brightness-95"
          >
            {job.status === "hitl" ? "⚡ Оценить 40k AMD" : "🏁 Закрыть → Отзыв"}
          </button>
        </div>

        <button
          type="button"
          onClick={() => {
            onAction(job.id, "takeover");
            onClose();
          }}
          className="w-full py-2.5 rounded-full bg-[#141517] text-white text-[12px] font-bold cursor-pointer hover:opacity-90"
        >
          🛑 Перехватить чат WhatsApp (пауза AI)
        </button>
      </div>
    </div>
  );
}
