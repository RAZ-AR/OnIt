"use client";

import React, { useState } from "react";
import {
  OnItDispatcher,
  redactPii,
  RuleBasedTriageProvider,
  type LeadSession,
} from "@onit/core";
import { useOnItStore } from "../context/OnItStore";
import type { DemoJob, NavTab } from "../data/demo-data";
import { AnalyticsHitlView } from "./AnalyticsHitlView";
import { CenterBento } from "./CenterBento";
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
    adjustJobQuote,
    setSurface,
    hitlLogs,
    piiRedactedCount,
    recordPiiRedaction,
    notify,
  } = useOnItStore();

  const [activeTab, setActiveTab] = useState<NavTab>("dispatch");
  const [selectedJob, setSelectedJob] = useState<DemoJob | null>(null);
  const [autoPilot, setAutoPilot] = useState(true);
  const [chatMessages, setChatMessages] = useState<ChatBubble[]>(INITIAL_CHAT);
  const [unreadCount, setUnreadCount] = useState(46);
  const [isBusy, setIsBusy] = useState(false);

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
        title: q.lineItems[0]?.name.slice(0, 20) ?? "AI Quote",
        subtitle: `${q.estimatedMinutes}m · ${Math.round(q.totalMin / 1000)}k–${Math.round(q.totalMax / 1000)}k ${q.currency}`,
        district: "Kentron",
        address: "Ереван · WhatsApp",
        clientName: "Новый клиент",
        clientPhone: "+374 91 ***-***",
        technician: "Aram",
        avatarKey: "ani",
        status: "quoted",
        confidence: Math.round(q.confidence * 100),
        priceRange: `${q.totalMin.toLocaleString("ru-RU")} – ${q.totalMax.toLocaleString("ru-RU")} ${q.currency}`,
        durationMin: q.estimatedMinutes,
        slotTime: "15:30",
        startCol: 3.0,
        spanCols: 4.0,
        location: { lat: 40.1811, lng: 44.5136 },
        defectSummary: text,
      });
      notify(`Новая заявка #${session.leadId} синхронизирована с Telegram Mini App`);
    }
  };

  const handleJobAction = (jobId: string, action: "accept" | "takeover") => {
    if (action === "accept") {
      acceptJob(jobId);
    } else {
      takeoverJob(jobId);
    }
  };

  const autoQuotedCount = jobs.filter((j) => j.status !== "hitl").length + 42;
  const hitlCount = jobs.filter((j) => j.status === "hitl").length;

  return (
    <>
      {/* Main Frosted Translucent Glass Frame (matches reference shell) */}
      <div className="w-full max-w-[1380px] rounded-[34px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_32px_90px_rgba(15,23,42,0.12)] p-3.5 sm:p-4 lg:p-5 grid grid-cols-1 lg:grid-cols-[216px_1fr_308px] gap-4 items-stretch">
        <SidebarColumn
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          chatMessages={chatMessages}
          unreadCount={unreadCount}
          onSendChat={(t) => void handleSendChat(t)}
          isBusy={isBusy}
        />

        {activeTab === "dispatch" ? (
          <CenterBento
            jobs={jobs}
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
            onOpenMiniApp={() => setSurface("tma")}
            onOpenImportPrice={() => setActiveTab("pricing")}
            onNavigate={setActiveTab}
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
          onNavigate={setActiveTab}
        />
      </div>

      {selectedJob && (
        <JobControlModal
          job={selectedJob}
          onClose={() => setSelectedJob(null)}
          onAction={handleJobAction}
        />
      )}
    </>
  );
}
