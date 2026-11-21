"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import {
  buildClientReviewRequest,
  OnItDispatcher,
  redactPii,
  RuleBasedTriageProvider,
  YEREVAN_HVAC_MATRIX,
  type Currency,
  type LeadSession,
  type PriceMatrix,
  type SupportedLanguage,
} from "@onit/core";
import { INITIAL_JOBS, type DemoJob } from "../data/demo-data";

export type SurfaceMode = "web" | "tma" | "client" | "landing";

export interface ClientChatEntry {
  id: string;
  sender: "client" | "onit";
  kind: "text" | "voice" | "photo";
  text: string;
  caption?: string;
  duration?: string;
  langBadge?: string;
  time: string;
  quickSlots?: string[];
  redactedInfo?: string;
}

export interface HitlLogEntry {
  id: string;
  leadId: string;
  summary: string;
  action: "accepted" | "adjusted" | "takeover" | "completed";
  priceLabel: string;
  timestamp: string;
}

export interface DaySchedule {
  day: "Пн" | "Вт" | "Ср" | "Чт" | "Пт" | "Сб" | "Вс";
  enabled: boolean;
  start: string;
  end: string;
}

export interface WorkspaceSettings {
  companyName: string;
  masterName: string;
  masterPhone: string;
  city: "Yerevan" | "Valencia" | "Tallinn";
  timezone: string;
  masterLanguage: "ru" | "hy" | "en" | "es";
  clientLanguages: Array<"ru" | "hy" | "en" | "es">;
  autoDetectVoiceLang: boolean;
  assistantTone: "friendly" | "professional" | "concise";
  afterHoursAutoReply: boolean;
  bufferMinutes: number;
  maxJobsPerDay: number;
  maxTravelMinutes: number;
  serviceZones: string[];
  workingDays: DaySchedule[];
  reminder2h: boolean;
  review1h: boolean;
  gdprPiiMasking: boolean;
  llmRegion: "pilot_free" | "eu_vertex";
  integrations: {
    whatsapp: boolean;
    telegram: boolean;
    googleCalendar: boolean;
    osrm: boolean;
  };
}

export const DEFAULT_WORKSPACE_SETTINGS: WorkspaceSettings = {
  companyName: "CoolAir Yerevan",
  masterName: "Aram Petrosyan",
  masterPhone: "+374 91 200-450",
  city: "Yerevan",
  timezone: "Asia/Yerevan (UTC+4)",
  masterLanguage: "ru",
  clientLanguages: ["hy", "ru", "en", "es"],
  autoDetectVoiceLang: true,
  assistantTone: "friendly",
  afterHoursAutoReply: true,
  bufferMinutes: 15,
  maxJobsPerDay: 6,
  maxTravelMinutes: 25,
  serviceZones: ["Kentron", "Arabkir", "Avan"],
  workingDays: [
    { day: "Пн", enabled: true, start: "09:00", end: "19:00" },
    { day: "Вт", enabled: true, start: "09:00", end: "19:00" },
    { day: "Ср", enabled: true, start: "09:00", end: "19:00" },
    { day: "Чт", enabled: true, start: "09:00", end: "19:00" },
    { day: "Пт", enabled: true, start: "09:00", end: "19:00" },
    { day: "Сб", enabled: true, start: "10:00", end: "17:00" },
    { day: "Вс", enabled: false, start: "10:00", end: "16:00" },
  ],
  reminder2h: true,
  review1h: true,
  gdprPiiMasking: true,
  llmRegion: "pilot_free",
  integrations: {
    whatsapp: true,
    telegram: true,
    googleCalendar: true,
    osrm: true,
  },
};

interface OnItStoreValue {
  surface: SurfaceMode;
  setSurface: (s: SurfaceMode) => void;
  matrix: PriceMatrix;
  setMatrix: (m: PriceMatrix) => void;
  settings: WorkspaceSettings;
  updateSettings: (patch: Partial<WorkspaceSettings>) => void;
  updateCurrency: (currency: Currency) => void;
  updateCalloutPolicy: (patch: Partial<PriceMatrix["callout"]>) => void;
  jobs: DemoJob[];
  addJob: (job: DemoJob) => void;
  acceptJob: (jobId: string) => void;
  takeoverJob: (jobId: string) => void;
  completeJob: (jobId: string) => void;
  adjustJobQuote: (jobId: string, priceMin: number, priceMax: number, note: string) => void;
  sendMasterReply: (jobId: string, text: string) => void;
  updateConfidenceThreshold: (threshold: number) => void;
  clientChat: ClientChatEntry[];
  sendClientMessage: (params: {
    text: string;
    kind?: "text" | "voice" | "photo";
    duration?: string;
    langBadge?: string;
    caption?: string;
  }) => Promise<void>;
  bookClientSlot: (slotTime: string) => void;
  resetClientSession: () => void;
  hitlLogs: HitlLogEntry[];
  piiRedactedCount: number;
  recordPiiRedaction: (count: number) => void;
  toast: string | null;
  notify: (msg: string) => void;
}

const OnItStoreContext = createContext<OnItStoreValue | null>(null);

function nowHm(): string {
  const d = new Date();
  return `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

const INITIAL_CLIENT_CHAT: ClientChatEntry[] = [
  {
    id: "w1",
    sender: "onit",
    kind: "text",
    text: "Привет! Это OnIt, цифровой ассистент CoolAir Yerevan. Пришлите фото поломки, голосовое или опишите задачу — посчитаю смету и подберу окно мастера за 30 секунд.",
    time: "11:02",
  },
];

const INITIAL_HITL: HitlLogEntry[] = [
  {
    id: "h1",
    leadId: "lead_104",
    summary: "Заправка фреоном + чистка дренажа · 2 этаж с балкона",
    action: "accepted",
    priceLabel: "18 000 – 22 000 AMD",
    timestamp: "10:42",
  },
  {
    id: "h2",
    leadId: "lead_107",
    summary: "Запах гари из инверторного блока (confidence 0.55)",
    action: "takeover",
    priceLabel: "Ожидает оценку мастера",
    timestamp: "11:15",
  },
];

export function OnItStoreProvider({
  initialSurface = "web",
  children,
}: {
  initialSurface?: SurfaceMode;
  children: React.ReactNode;
}) {
  const [surface, setSurface] = useState<SurfaceMode>(initialSurface);
  const [matrix, setMatrix] = useState<PriceMatrix>(YEREVAN_HVAC_MATRIX);
  const [settings, setSettings] = useState<WorkspaceSettings>(DEFAULT_WORKSPACE_SETTINGS);
  const [jobs, setJobs] = useState<DemoJob[]>(INITIAL_JOBS);
  const [clientChat, setClientChat] = useState<ClientChatEntry[]>(INITIAL_CLIENT_CHAT);
  const [hitlLogs, setHitlLogs] = useState<HitlLogEntry[]>(INITIAL_HITL);
  const [piiRedactedCount, setPiiRedactedCount] = useState(170);
  const [toast, setToast] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<LeadSession>({
    leadId: "wa_live_1",
    companyId: YEREVAN_HVAC_MATRIX.companyId,
    companyName: DEFAULT_WORKSPACE_SETTINGS.companyName,
    state: "new",
    clientName: "Ani (WhatsApp)",
    collectedAttributes: {},
    transcriptHistory: [],
  });

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem("onit_workspace_settings_v1");
      if (saved) {
        const parsed = JSON.parse(saved) as Partial<WorkspaceSettings>;
        setSettings((prev) => ({ ...prev, ...parsed }));
      }
    } catch {
      // Ignore storage errors in sandboxed/private contexts
    }
  }, []);

  const updateSettings = (patch: Partial<WorkspaceSettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch };
      try {
        window.localStorage.setItem("onit_workspace_settings_v1", JSON.stringify(next));
      } catch {
        // Ignore storage errors
      }
      if (patch.companyName && patch.companyName !== prev.companyName) {
        setActiveSession((s) => ({ ...s, companyName: patch.companyName! }));
      }
      return next;
    });
  };

  const updateCurrency = (currency: Currency) => {
    setMatrix((prev) => ({
      ...prev,
      currency,
      roundingStep: currency === "AMD" ? 500 : 5,
    }));
  };

  const updateCalloutPolicy = (patch: Partial<PriceMatrix["callout"]>) => {
    setMatrix((prev) => ({
      ...prev,
      callout: { ...prev.callout, ...patch },
    }));
  };

  const notify = (msg: string) => {
    setToast(msg);
    setTimeout(() => {
      setToast((prev) => (prev === msg ? null : prev));
    }, 3200);
  };

  const addJob = (job: DemoJob) => {
    setJobs((prev) => [job, ...prev]);
  };

  const acceptJob = (jobId: string) => {
    const target = jobs.find((j) => j.id === jobId);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: "booked", highlighted: true } : j
      )
    );
    if (target) {
      setHitlLogs((prev) => [
        {
          id: `h_${Date.now()}`,
          leadId: jobId,
          summary: target.defectSummary,
          action: "accepted",
          priceLabel: target.priceRange,
          timestamp: nowHm(),
        },
        ...prev,
      ]);
      notify(`Заказ #${jobId} принят мастером и закреплён в календаре`);
    }
  };

  const takeoverJob = (jobId: string) => {
    const target = jobs.find((j) => j.id === jobId);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, status: "hitl", highlighted: false } : j
      )
    );
    if (target) {
      setHitlLogs((prev) => [
        {
          id: `h_${Date.now()}`,
          leadId: jobId,
          summary: target.defectSummary,
          action: "takeover",
          priceLabel: "Чат перехвачен",
          timestamp: nowHm(),
        },
        ...prev,
      ]);
      notify(`Автоответ OnIt на паузе — чат #${jobId} перехвачен мастером`);
    }
  };

  const completeJob = (jobId: string) => {
    const target = jobs.find((j) => j.id === jobId);
    if (!target) return;
    const review = buildClientReviewRequest("CoolAir Yerevan", "ru");
    setClientChat((prev) => [
      ...prev,
      {
        id: `rev_${Date.now()}`,
        sender: "onit",
        kind: "text",
        text: review,
        time: nowHm(),
      },
    ]);
    setHitlLogs((prev) => [
      {
        id: `h_${Date.now()}`,
        leadId: jobId,
        summary: `Визит закрыт: ${target.address}`,
        action: "completed",
        priceLabel: target.priceRange,
        timestamp: nowHm(),
      },
      ...prev,
    ]);
    notify(`Заказ #${jobId} закрыт — клиенту отправлен запрос отзыва в WhatsApp`);
  };

  const adjustJobQuote = (
    jobId: string,
    priceMin: number,
    priceMax: number,
    note: string
  ) => {
    const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
    const range =
      priceMin === priceMax
        ? `${fmt(priceMin)} ${matrix.currency}`
        : `${fmt(priceMin)} – ${fmt(priceMax)} ${matrix.currency}`;

    const target = jobs.find((j) => j.id === jobId);
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId
          ? {
              ...j,
              status: "quoted",
              priceRange: range,
              subtitle: `${j.durationMin}m · ${range}`,
              confidence: 100,
            }
          : j
      )
    );

    setClientChat((prev) => [
      ...prev,
      {
        id: `ov_${Date.now()}`,
        sender: "onit",
        kind: "text",
        text: `Старший мастер CoolAir Yerevan оценил задачу: ${range}. ${note || "Готовы закрепить удобное время визита?"}`,
        time: nowHm(),
        quickSlots: ["Завтра 11:30", "Пятница 10:00"],
      },
    ]);

    setHitlLogs((prev) => [
      {
        id: `h_${Date.now()}`,
        leadId: jobId,
        summary: `Правка мастера (Active Learning): ${target?.defectSummary ?? jobId}`,
        action: "adjusted",
        priceLabel: range,
        timestamp: nowHm(),
      },
      ...prev,
    ]);
    notify(`Смета #${jobId} обновлена (${range}) и отправлена клиенту в WhatsApp`);
  };

  const recordPiiRedaction = (count: number) => {
    if (count > 0) setPiiRedactedCount((n) => n + count);
  };

  const sendClientMessage: OnItStoreValue["sendClientMessage"] = async ({
    text,
    kind = "text",
    duration,
    langBadge,
    caption,
  }) => {
    const pii = redactPii(text);
    if (pii.redactedCount > 0) {
      setPiiRedactedCount((n) => n + pii.redactedCount);
    }
    const time = nowHm();
    setClientChat((prev) => [
      ...prev,
      {
        id: `c_${Date.now()}`,
        sender: "client",
        kind,
        text,
        duration,
        langBadge,
        caption,
        time,
      },
    ]);

    const dispatcher = new OnItDispatcher(new RuleBasedTriageProvider());
    const outcome = await dispatcher.handleTurn(activeSession, matrix, {
      texts: [text],
    });
    setActiveSession(outcome.session);

    const quickSlots =
      outcome.quote?.status === "ready" ? ["Завтра 11:30", "Завтра 15:30"] : undefined;

    if (outcome.clientReply) {
      setClientChat((prev) => [
        ...prev,
        {
          id: `a_${Date.now() + 1}`,
          sender: "onit",
          kind: "text",
          text: outcome.clientReply!,
          time: nowHm(),
          quickSlots,
        },
      ]);
    }

    if (outcome.quote?.status === "ready") {
      const q = outcome.quote;
      const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
      const range =
        q.totalMin === q.totalMax
          ? `${fmt(q.totalMin)} ${q.currency}`
          : `${fmt(q.totalMin)} – ${fmt(q.totalMax)} ${q.currency}`;

      const newJob: DemoJob = {
        id: `wa_${Date.now().toString().slice(-3)}`,
        title: q.lineItems[0]?.name.slice(0, 22) ?? "WhatsApp Quote",
        subtitle: `${q.estimatedMinutes}m · ${Math.round(q.totalMin / 1000)}k–${Math.round(q.totalMax / 1000)}k ${q.currency}`,
        district: "Kentron",
        address: "ул. Туманяна 18 (WhatsApp)",
        clientName: "Ani (WhatsApp)",
        clientPhone: "+374 91 555-222",
        technician: "Aram",
        avatarKey: "ani",
        status: "quoted",
        confidence: Math.round(q.confidence * 100),
        priceRange: range,
        durationMin: q.estimatedMinutes,
        slotTime: "11:30",
        startCol: 2.8,
        spanCols: 4.1,
        location: { lat: 40.1815, lng: 44.5142 },
        defectSummary: text,
      };
      setJobs((prev) => [newJob, ...prev]);
      notify(`Новая заявка #${newJob.id} (${range}) попала в Web и Telegram Mini App`);
    } else if (outcome.hitlEscalated) {
      const hitlJob: DemoJob = {
        id: `hitl_${Date.now().toString().slice(-3)}`,
        title: "HITL Escalation",
        subtitle: "Paused · Master check",
        district: "Kentron",
        address: "Ереван (WhatsApp)",
        clientName: "Ani (WhatsApp)",
        clientPhone: "+374 91 555-222",
        technician: "Hayk",
        avatarKey: "hayk",
        status: "hitl",
        confidence: Math.round((outcome.quote?.confidence ?? 0.5) * 100),
        priceRange: "Ожидает мастера",
        durationMin: 60,
        slotTime: "HITL",
        startCol: 1.5,
        spanCols: 4.2,
        location: { lat: 40.182, lng: 44.515 },
        defectSummary: text,
      };
      setJobs((prev) => [hitlJob, ...prev]);
      notify(`Эскалация #${hitlJob.id} отправлена мастеру в Telegram Mini App!`);
    }
  };

  const bookClientSlot = (slotTime: string) => {
    setClientChat((prev) => [
      ...prev,
      {
        id: `slot_c_${Date.now()}`,
        sender: "client",
        kind: "text",
        text: `Закрепите время: ${slotTime}`,
        time: nowHm(),
      },
      {
        id: `slot_a_${Date.now() + 1}`,
        sender: "onit",
        kind: "text",
        text: `Готово! Визит мастера закреплён на ${slotTime} (Google Calendar обновлён). Напомним за 2 часа до приезда.`,
        time: nowHm(),
      },
    ]);
    setJobs((prev) =>
      prev.map((j, idx) =>
        idx === 0 ? { ...j, status: "booked", slotTime, highlighted: true } : j
      )
    );
    notify(`Слот ${slotTime} забронирован клиентом — календарь обновлён!`);
  };

  const sendMasterReply = (jobId: string, text: string) => {
    const cleaned = text.trim();
    if (!cleaned) return;
    setClientChat((prev) => [
      ...prev,
      {
        id: `m_reply_${Date.now()}`,
        sender: "onit",
        kind: "text",
        text: cleaned,
        time: nowHm(),
      },
    ]);
    setHitlLogs((prev) => [
      {
        id: `h_${Date.now()}`,
        leadId: jobId,
        summary: `Ответ мастера в Live Chat: ${cleaned}`,
        action: "adjusted",
        priceLabel: "Отправлено в WhatsApp",
        timestamp: nowHm(),
      },
      ...prev,
    ]);
    notify(`Сообщение по #${jobId} отправлено клиенту в WhatsApp`);
  };

  const updateConfidenceThreshold = (threshold: number) => {
    setMatrix((prev) => ({
      ...prev,
      confidenceThreshold: Number(threshold.toFixed(2)),
    }));
  };

  const resetClientSession = () => {
    setClientChat(INITIAL_CLIENT_CHAT);
    setActiveSession({
      leadId: `wa_live_${Date.now().toString().slice(-3)}`,
      companyId: matrix.companyId,
      companyName: "CoolAir Yerevan",
      state: "new",
      clientName: "Ani (WhatsApp)",
      collectedAttributes: {},
      transcriptHistory: [],
    });
    notify("Диалог клиента сброшен для нового сценария");
  };

  return (
    <OnItStoreContext.Provider
      value={{
        surface,
        setSurface,
        matrix,
        setMatrix,
        settings,
        updateSettings,
        updateCurrency,
        updateCalloutPolicy,
        jobs,
        addJob,
        acceptJob,
        takeoverJob,
        completeJob,
        adjustJobQuote,
        sendMasterReply,
        updateConfidenceThreshold,
        clientChat,
        sendClientMessage,
        bookClientSlot,
        resetClientSession,
        hitlLogs,
        piiRedactedCount,
        recordPiiRedaction,
        toast,
        notify,
      }}
    >
      {children}
    </OnItStoreContext.Provider>
  );
}

export function useOnItStore(): OnItStoreValue {
  const ctx = useContext(OnItStoreContext);
  if (!ctx) throw new Error("useOnItStore must be used inside OnItStoreProvider");
  return ctx;
}

export function getLangLabel(lang: SupportedLanguage): string {
  return lang.toUpperCase();
}
