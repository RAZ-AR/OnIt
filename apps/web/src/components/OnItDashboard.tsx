"use client";

import React, { useState } from "react";
import {
  OnItDispatcher,
  redactPii,
  RuleBasedTriageProvider,
  type LeadSession,
} from "@onit/core";
import {
  BarChart3,
  Calendar,
  Compass,
  FileSpreadsheet,
  Home,
  Plus,
  Sparkles,
} from "lucide-react";
import { useOnItStore } from "../context/OnItStore";
import type { DemoJob, NavTab } from "../data/demo-data";
import { AnalyticsHitlView } from "./AnalyticsHitlView";
import { CenterBento } from "./CenterBento";
import { NewOrderSheet } from "./NewOrderSheet";
import { RightRail } from "./RightRail";
import { SidebarColumn, type ChatBubble } from "./SidebarColumn";
import {
  GeoRoutesSubView,
  JobControlModal,
  PriceMatrixSubView,
  SimulatorSubView,
} from "./SubViews";

const INITIAL_CHAT: ChatBubble[] = [
  {
    id: "m1",
    sender: "client",
    kind: "voice",
    text: "Օդորակիչից ջուր է կաթում ու չի սառեցնում",
    duration: "0:14",
  },
  {
    id: "m2",
    sender: "onit",
    kind: "voice",
    text: "Заправка фреоном + дренаж · 18–22k AMD",
    duration: "0:08",
  },
  {
    id: "m3",
    sender: "onit",
    kind: "text",
    text: "18 000 – 22 000 AMD · Окна завтра в 11:30 и 15:30. Бронируем?",
  },
];

export function OnItDashboard() {
  const {
    matrix,
    setMatrix,
    jobs,
    addJob,
    acceptJob,
    takeoverJob,
    completeJob,
    adjustJobQuote,
    setSurface,
    hitlLogs,
    piiRedactedCount,
    recordPiiRedaction,
    notify,
  } = useOnItStore();

  const [activeTab, setActiveTab] = useState<NavTab>("dispatch");
  const [viewMode, setViewMode] = useState<"today" | "calendar">("today");
  const [selectedJob, setSelectedJob] = useState<DemoJob | null>(null);
  const [newOrderSlot, setNewOrderSlot] = useState<string | null>(null);
  const [autoPilot, setAutoPilot] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatBubble[]>(INITIAL_CHAT);
  const [unreadCount, setUnreadCount] = useState(46);
  const [isBusy, setIsBusy] = useState(false);

  const handleSelectNav = (tab: NavTab) => {
    if (tab === "calendar") {
      setActiveTab("dispatch");
      setViewMode("calendar");
      return;
    }
    if (tab === "dispatch") {
      setActiveTab("dispatch");
      setViewMode("today");
      return;
    }
    setActiveTab(tab);
  };

  const handleSendChat = async (text: string) => {
    const pii = redactPii(text);
    recordPiiRedaction(pii.redactedCount);
    const clientId = `c_${Date.now()}`;
    setChatMessages((prev) => [
      ...prev.slice(-6),
      { id: clientId, sender: "client", kind: "text", text },
    ]);
    setIsBusy(true);

    const dispatcher = new OnItDispatcher(new RuleBasedTriageProvider());
    const session: LeadSession = {
      leadId: `chat_${Date.now().toString().slice(-4)}`,
      companyId: matrix.companyId,
      companyName: "CoolAir Yerevan",
      state: "new",
      collectedAttributes: {},
      transcriptHistory: [],
    };

    const res = await dispatcher.handleTurn(session, matrix, { texts: [text] });
    setIsBusy(false);
    setUnreadCount((n) => n + 1);

    setChatMessages((prev) => [
      ...prev.slice(-6),
      {
        id: `a_${Date.now()}`,
        sender: "onit",
        kind: "text",
        text: res.clientReply ?? "Передал мастеру в Telegram Control Center.",
      },
    ]);

    if (res.quote?.status === "ready") {
      const q = res.quote;
      addJob({
        id: session.leadId,
        title: q.lineItems[0]?.name.slice(0, 24) ?? "AI Quote",
        subtitle: `${q.estimatedMinutes}m · ${Math.round(q.totalMin / 1000)}k–${Math.round(q.totalMax / 1000)}k ${q.currency}`,
        district: "Kentron",
        address: "ул. Туманяна 18 · WhatsApp",
        clientName: "Новый клиент",
        clientPhone: "+374 91 ***-***",
        technician: "Aram",
        avatarKey: "ani",
        status: "quoted",
        confidence: Math.round(q.confidence * 100),
        priceRange: `${q.totalMin.toLocaleString("ru-RU")} – ${q.totalMax.toLocaleString("ru-RU")} ${q.currency}`,
        durationMin: q.estimatedMinutes,
        slotTime: "15:30",
        endTime: "16:45",
        etaMinutes: 6,
        startCol: 3.0,
        spanCols: 4.0,
        location: { lat: 40.1811, lng: 44.5136 },
        defectSummary: text,
        equipmentModelId: "lg_dualcool_s12eq",
        photoKind: "frost_pipe",
        cardTone: "ochre",
        channel: "whatsapp",
        voiceLangBadge: "RU",
      });
      notify(`Новая заявка #${session.leadId} синхронизирована с Telegram Mini App`);
    }
  };

  const handleJobAction = (
    jobId: string,
    action: "accept" | "takeover" | "complete" | "price40k"
  ) => {
    if (action === "accept") {
      acceptJob(jobId);
    } else if (action === "takeover") {
      takeoverJob(jobId);
    } else if (action === "complete") {
      completeJob(jobId);
    } else {
      adjustJobQuote(jobId, 40000, 40000, "Сможем приехать в пятницу утром.");
    }
  };

  const autoQuotedCount = jobs.filter((j) => j.status !== "hitl").length + 42;
  const hitlCount = jobs.filter((j) => j.status === "hitl").length;

  const islandItems: Array<{
    id: NavTab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: "dispatch", label: "Сегодня", icon: Home },
    { id: "calendar", label: "Календарь", icon: Calendar },
    { id: "simulator", label: "AI Чат", icon: Sparkles },
    { id: "routes", label: "Маршрут", icon: Compass },
    { id: "pricing", label: "Прайс", icon: FileSpreadsheet },
    { id: "analytics", label: "HITL", icon: BarChart3 },
  ];

  const activeIslandId: NavTab =
    activeTab === "dispatch" && viewMode === "calendar" ? "calendar" : activeTab;

  return (
    <>
      <div className="w-full max-w-[1380px] rounded-[34px] bg-white/60 backdrop-blur-2xl border border-white/80 shadow-[0_32px_90px_rgba(20,21,23,0.10)] p-3.5 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-[216px_1fr_308px] gap-4 items-stretch">
        <SidebarColumn
          activeTab={activeIslandId}
          onSelectTab={handleSelectNav}
          chatMessages={chatMessages}
          unreadCount={unreadCount}
          onSendChat={(t) => void handleSendChat(t)}
          isBusy={isBusy}
        />

        {activeTab === "dispatch" ? (
          <CenterBento
            jobs={jobs}
            viewMode={viewMode}
            onChangeViewMode={setViewMode}
            servicesCount={matrix.services.length}
            autoQuotedCount={autoQuotedCount}
            hitlCount={hitlCount}
            hitlLearnedCount={hitlLogs.length}
            piiRedactedCount={piiRedactedCount}
            onSelectJob={setSelectedJob}
            onQuickAcceptHitl={acceptJob}
            onQuickPriceHitl={(jobId) =>
              adjustJobQuote(
                jobId,
                40000,
                40000,
                "Сможем приехать в пятницу утром."
              )
            }
            onOpenNewOrder={(slot) => setNewOrderSlot(slot ?? "16:30")}
            onOpenMiniApp={() => setSurface("tma")}
            onOpenImportPrice={() => setActiveTab("pricing")}
            onNavigate={handleSelectNav}
          />
        ) : activeTab === "simulator" ? (
          <SimulatorSubView
            matrix={matrix}
            onBack={() => setActiveTab("dispatch")}
            onAddJob={addJob}
          />
        ) : activeTab === "pricing" ? (
          <PriceMatrixSubView
            matrix={matrix}
            onApplyMatrix={setMatrix}
            onBack={() => setActiveTab("dispatch")}
          />
        ) : activeTab === "routes" ? (
          <GeoRoutesSubView onBack={() => setActiveTab("dispatch")} />
        ) : (
          <AnalyticsHitlView onBack={() => setActiveTab("dispatch")} />
        )}

        <RightRail
          autoPilot={autoPilot}
          onToggleAutoPilot={() => setAutoPilot((v) => !v)}
          onNavigate={handleSelectNav}
        />
      </div>

      {/* FLOATING iOS ISLAND DOCK FOR WEB */}
      <div className="fixed bottom-4 inset-x-0 z-40 flex justify-center px-4 pointer-events-none">
        <nav
          aria-label="OnIt iOS Island Dock"
          className="pointer-events-auto rounded-full bg-[#141517]/94 backdrop-blur-2xl px-2 py-2 flex items-center gap-1 shadow-[0_20px_48px_rgba(20,21,23,0.34)] border border-white/12"
        >
          {islandItems.map((item) => {
            const Icon = item.icon;
            const active = activeIslandId === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelectNav(item.id)}
                className={`relative h-10 rounded-full flex items-center justify-center gap-1.5 text-[12px] font-bold transition-all cursor-pointer ${
                  active
                    ? "bg-white text-[#141517] px-4 shadow-sm"
                    : "w-10 sm:w-auto sm:px-3 text-white/75 hover:text-white hover:bg-white/10"
                }`}
                aria-label={item.label}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className={active ? "inline" : "hidden sm:inline"}>
                  {item.label}
                </span>
                {item.id === "analytics" && hitlCount > 0 && !active && (
                  <span className="w-2 h-2 rounded-full bg-[#E5BC73]" />
                )}
              </button>
            );
          })}

          <div className="w-px h-5 bg-white/15 mx-0.5" />

          <button
            type="button"
            onClick={() => setNewOrderSlot("16:30")}
            aria-label="Create new order"
            className="w-10 h-10 rounded-full bg-[#E5BC73] text-[#1E1A14] flex items-center justify-center hover:brightness-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[2.5]" />
          </button>
        </nav>
      </div>

      {selectedJob && (
        <JobControlModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAction={handleJobAction}
        />
      )}

      {newOrderSlot && (
        <NewOrderSheet
          matrix={matrix}
          defaultSlot={newOrderSlot}
          onClose={() => setNewOrderSlot(null)}
          onCreate={(job) => {
            addJob(job);
            notify(`Заказ «${job.title}» (${job.address}) добавлен`);
          }}
        />
      )}
    </>
  );
}
