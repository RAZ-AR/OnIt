"use client";

import React, { useState } from "react";
import {
  BarChart3,
  Calendar,
  Compass,
  FileSpreadsheet,
  Home,
  MessageCircle,
  Mic,
  Paperclip,
  Play,
  Send,
  Settings,
  Sparkles,
  Users,
} from "lucide-react";
import { useOnItStore } from "../context/OnItStore";
import type { NavTab } from "../data/demo-data";
import { getUiStrings } from "../i18n/ui-strings";
import { AvatarCircle } from "./Avatars";

export interface ChatBubble {
  id: string;
  sender: "client" | "onit";
  kind: "voice" | "text";
  text: string;
  duration?: string;
  langBadge?: string;
}

interface SidebarColumnProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  chatMessages: ChatBubble[];
  unreadCount: number;
  onSendChat: (text: string) => void;
  isBusy: boolean;
}

const NAV_ITEMS: Array<{
  id: NavTab | "team";
  key: "today" | "calendar" | "simulator" | "menu" | "routes" | "analytics" | "teamHitl";
  icon: React.ComponentType<{ className?: string }>;
  target: NavTab;
}> = [
  { id: "dispatch", key: "today", icon: Home, target: "dispatch" },
  { id: "calendar", key: "calendar", icon: Calendar, target: "calendar" },
  { id: "simulator", key: "simulator", icon: Sparkles, target: "simulator" },
  { id: "pricing", key: "menu", icon: FileSpreadsheet, target: "pricing" },
  { id: "routes", key: "routes", icon: Compass, target: "routes" },
  { id: "analytics", key: "analytics", icon: BarChart3, target: "analytics" },
  { id: "team", key: "teamHitl", icon: Users, target: "analytics" },
];

const QUICK_SAMPLE_PROMPTS = [
  "Кондиционер течёт и плохо холодит, доступ с балкона есть, 2 этаж",
  "Нужна полная профилактика на 5 этаже, срочно сегодня, доступ с балкона",
  "Запах гари из наружного блока, сгорела плата?",
];

export function SidebarColumn({
  activeTab,
  onSelectTab,
  chatMessages,
  unreadCount,
  onSendChat,
  isBusy,
}: SidebarColumnProps) {
  const { settings } = useOnItStore();
  const t = getUiStrings(settings.masterLanguage);
  const [draft, setDraft] = useState("");
  const [sampleIdx, setSampleIdx] = useState(0);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = draft.trim();
    if (!cleaned) return;
    onSendChat(cleaned);
    setDraft("");
  };

  const handleVoiceDemo = () => {
    const sample = QUICK_SAMPLE_PROMPTS[sampleIdx % QUICK_SAMPLE_PROMPTS.length]!;
    setSampleIdx((i) => i + 1);
    onSendChat(sample);
  };

  return (
    <aside className="rounded-[28px] bg-white/95 p-4 flex flex-col justify-between gap-4 shadow-[0_10px_34px_rgba(15,23,42,0.05)] border border-white">
      {/* Brand + Nav */}
      <div>
        <div className="flex items-center gap-2.5 px-2 pt-1 pb-5">
          <div className="w-8 h-8 rounded-[10px] bg-[#111214] text-white flex items-center justify-center shadow-sm">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path
                d="M3 11.5L7.5 3.5H10.5L6 11.5H3Z"
                fill="#D1F366"
              />
              <circle cx="11.5" cy="10.5" r="2.2" fill="#FFFFFF" />
            </svg>
          </div>
          <div className="leading-none">
            <div className="text-[17px] font-extrabold tracking-tight text-[#111214]">
              OnIt
            </div>
            <div className="text-[10px] font-medium text-[#8C9197] mt-0.5">
              im-onit.com
            </div>
          </div>
        </div>

        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.id === activeTab && item.id === item.target;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => onSelectTab(item.target)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
                  isActive
                    ? "bg-[#111214] text-white shadow-[0_8px_20px_rgba(17,18,20,0.22)]"
                    : "text-[#4D5259] hover:bg-[#F3F5F7] hover:text-[#111214]"
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{t.nav[item.key]}</span>
              </button>
            );
          })}
          <button
            type="button"
            onClick={() => onSelectTab("account")}
            className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-full text-[13px] font-medium transition-all cursor-pointer ${
              activeTab === "account"
                ? "bg-[#111214] text-white shadow-[0_8px_20px_rgba(17,18,20,0.22)]"
                : "text-[#4D5259] hover:bg-[#F3F5F7] hover:text-[#111214]"
            }`}
          >
            <Settings className="w-4 h-4 shrink-0" />
            <span className="truncate">{t.nav.account}</span>
          </button>
        </nav>
      </div>

      {/* Bottom Live WhatsApp / Telegram Chat Widget (matches TaskLab reference) */}
      <div className="rounded-[22px] bg-[#F7F8FA] border border-black/[0.05] p-3 flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <MessageCircle className="w-4 h-4 text-[#111214] fill-[#111214]" />
            <span className="text-[14px] font-bold tracking-tight">Chat</span>
          </div>
          <span className="w-6 h-6 rounded-full bg-[#85E6DC] text-[#111214] text-[10px] font-bold flex items-center justify-center">
            {unreadCount}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="text-[11px] text-[#8C9197]">
            {isBusy ? "OnIt quoting..." : "Ani is typing..."}
          </span>
          <div className="flex -space-x-1.5">
            <AvatarCircle who="ani" size="xs" />
            <AvatarCircle who="aram" size="xs" />
            <AvatarCircle who="davit" size="xs" />
          </div>
        </div>

        {/* Messages */}
        <div className="space-y-2 max-h-[195px] overflow-y-auto thin-scroll pr-0.5">
          {chatMessages.map((msg) => {
            if (msg.kind === "voice") {
              const isLime = msg.sender === "onit";
              return (
                <div
                  key={msg.id}
                  className={`flex items-center gap-1.5 ${
                    isLime ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isLime && <AvatarCircle who="ani" size="xs" />}
                  <div
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold shadow-xs ${
                      isLime
                        ? "bg-[#D1F366] text-[#111214]"
                        : "bg-white text-[#111214] border border-black/[0.06]"
                    }`}
                    title={msg.text}
                  >
                    <Play className="w-2.5 h-2.5 fill-current shrink-0" />
                    <div className="flex items-center gap-[2px] h-3">
                      {[4, 9, 6, 12, 8, 11, 5, 10, 7, 12, 6, 8].map((h, i) => (
                        <span
                          key={i}
                          className="w-[2px] rounded-full bg-[#111214]/80"
                          style={{ height: `${h}px` }}
                        />
                      ))}
                    </div>
                    <span className="text-[9px] tabular-nums ml-0.5">
                      {msg.duration ?? "0:14"}
                    </span>
                  </div>
                  {isLime && <AvatarCircle who="aram" size="xs" />}
                </div>
              );
            }

            return (
              <div
                key={msg.id}
                className={`flex items-end gap-1.5 ${
                  msg.sender === "onit" ? "justify-end" : "justify-start"
                }`}
              >
                <div
                  className={`px-2.5 py-1.5 rounded-2xl text-[10.5px] leading-snug max-w-[156px] ${
                    msg.sender === "onit"
                      ? "bg-[#85E6DC] text-[#111214] font-medium rounded-br-sm"
                      : "bg-white text-[#111214] border border-black/[0.06] rounded-bl-sm"
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })}
        </div>

        {/* Interactive Input */}
        <form
          onSubmit={handleSubmit}
          className="flex items-center gap-1.5 bg-white rounded-full px-2.5 py-1.5 border border-black/[0.08]"
        >
          <button
            type="button"
            onClick={handleVoiceDemo}
            title="Вставить тестовую заявку клиента"
            className="text-[#8C9197] hover:text-[#111214] transition-colors cursor-pointer"
          >
            <Paperclip className="w-3.5 h-3.5" />
          </button>
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            placeholder="Message..."
            aria-label="Send message to OnIt AI"
            className="w-full min-w-0 bg-transparent text-[11px] outline-none placeholder:text-[#9CA3AF]"
          />
          {draft.trim() ? (
            <button
              type="submit"
              className="w-5 h-5 rounded-full bg-[#111214] text-white flex items-center justify-center shrink-0 cursor-pointer"
              aria-label="Send"
            >
              <Send className="w-2.5 h-2.5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleVoiceDemo}
              title="Отправить тестовое голосовое в OnIt"
              className="text-[#111214] hover:text-[#4D5259] transition-colors cursor-pointer shrink-0"
              aria-label="Simulate voice note"
            >
              <Mic className="w-3.5 h-3.5" />
            </button>
          )}
        </form>
      </div>
    </aside>
  );
}
