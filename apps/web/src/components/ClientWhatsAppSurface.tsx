"use client";

import React, { useState } from "react";
import {
  Camera,
  CheckCheck,
  Mic,
  Play,
  RotateCcw,
  Send,
  Smartphone,
  Sparkles,
} from "lucide-react";
import { useOnItStore } from "../context/OnItStore";

const SCENARIOS = [
  {
    id: "s1",
    badge: "📷 Фото + Текст (RU)",
    title: "Кондиционер течёт и не холодит",
    desc: "Мгновенная смета 18–22k AMD + 2 окна маршрута",
    payload: {
      kind: "photo" as const,
      caption: "Фото: обмерзание трубки и течь дренажа",
      text: "Кондиционер течёт и плохо холодит, доступ с балкона есть, 2 этаж. Тел +374 91 555-222",
    },
  },
  {
    id: "s2",
    badge: "❓ 2-шаговый диалог",
    title: "Неполная заявка → 2 вопроса",
    desc: "Сначала OnIt уточнит этаж и доступ к наружному блоку",
    payload: {
      kind: "text" as const,
      text: "Нужна полная профилактика кондиционера, сколько будет стоить?",
    },
  },
  {
    id: "s3",
    badge: "💬 Ответ на уточнение",
    title: "Ответить: «3 этаж, доступ с балкона»",
    desc: "Завершает 2-шаговую квалификацию и выдаёт смету",
    payload: {
      kind: "text" as const,
      text: "3 этаж, доступ с балкона есть",
    },
  },
  {
    id: "s4",
    badge: "🎙️ Голосовое (HY → RU)",
    title: "Армянское голосовое 0:14",
    desc: "Groq Whisper распознаёт речь, ТЗ мастеру уходит на русском",
    payload: {
      kind: "voice" as const,
      duration: "0:14",
      langBadge: "HY → RU",
      text: "Срочно сегодня нужна заправка фреоном, 5 этаж, наружный блок под глухим окном без балкона",
    },
  },
  {
    id: "s5",
    badge: "🚨 HITL Эскалация",
    title: "Нестандартная поломка (вне прайса)",
    desc: "Пауза автоответа + пуш мастеру в Telegram Mini App",
    payload: {
      kind: "photo" as const,
      caption: "Фото: потемневшая плата инвертора",
      text: "Пошёл запах гари из наружного блока промышленного чиллера, выбивает автомат",
    },
  },
];

export function ClientWhatsAppSurface() {
  const {
    clientChat,
    sendClientMessage,
    bookClientSlot,
    resetClientSession,
    setSurface,
  } = useOnItStore();
  const [draft, setDraft] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void sendClientMessage({ text });
  };

  return (
    <div className="w-full max-w-[1380px] rounded-[34px] bg-white/55 backdrop-blur-2xl border border-white/80 shadow-[0_32px_90px_rgba(15,23,42,0.12)] p-4 sm:p-6 grid grid-cols-1 lg:grid-cols-[410px_1fr] gap-6 items-center">
      {/* Realistic Mobile WhatsApp Client Phone Frame */}
      <div className="flex justify-center">
        <div className="w-full max-w-[396px] h-[760px] rounded-[42px] border-[8px] border-[#111214] bg-[#ECEAE4] shadow-[0_32px_90px_rgba(17,18,20,0.34)] flex flex-col overflow-hidden">
          {/* WhatsApp Header */}
          <div className="bg-[#111214] text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-[#D1F366] text-[#111214] font-extrabold text-[12px] flex items-center justify-center">
                On
              </div>
              <div className="leading-tight">
                <div className="text-[13.5px] font-bold">CoolAir Yerevan · OnIt</div>
                <div className="text-[10.5px] text-[#85E6DC]">
                  online · AI replies in &lt;30s
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={resetClientSession}
              title="Сбросить диалог"
              aria-label="Reset conversation"
              className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Messages Feed */}
          <div className="flex-1 overflow-y-auto thin-scroll p-3.5 space-y-2.5">
            {clientChat.map((m) => {
              const isClient = m.sender === "client";
              return (
                <div
                  key={m.id}
                  className={`flex flex-col ${
                    isClient ? "items-end" : "items-start"
                  }`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-[12.5px] leading-snug shadow-xs space-y-1.5 ${
                      isClient
                        ? "bg-[#D1F366] text-[#111214] rounded-br-sm"
                        : "bg-white text-[#111214] rounded-bl-sm"
                    }`}
                  >
                    {m.kind === "photo" && (
                      <div className="rounded-xl bg-[#111214] text-white p-2.5 text-[11px] flex items-center gap-2">
                        <Camera className="w-4 h-4 text-[#D1F366] shrink-0" />
                        <span>{m.caption ?? "Фото дефекта"}</span>
                      </div>
                    )}

                    {m.kind === "voice" && (
                      <div className="flex items-center gap-2 py-0.5">
                        <span className="w-7 h-7 rounded-full bg-[#111214] text-white flex items-center justify-center shrink-0">
                          <Play className="w-3 h-3 fill-white ml-0.5" />
                        </span>
                        <div className="flex items-center gap-[2px] h-5">
                          {[6, 12, 8, 16, 10, 14, 7, 15, 9, 13, 6, 11, 8, 14].map(
                            (h, i) => (
                              <span
                                key={i}
                                className="w-[2.5px] rounded-full bg-[#111214]"
                                style={{ height: `${h}px` }}
                              />
                            )
                          )}
                        </div>
                        <span className="text-[10px] font-bold tabular-nums">
                          {m.duration ?? "0:14"}
                        </span>
                        {m.langBadge && (
                          <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-[#111214] text-[#D1F366]">
                            {m.langBadge}
                          </span>
                        )}
                      </div>
                    )}

                    <div>{m.text}</div>

                    <div className="flex items-center justify-end gap-1 text-[9.5px] opacity-60">
                      <span>{m.time}</span>
                      {isClient && <CheckCheck className="w-3 h-3" />}
                    </div>
                  </div>

                  {/* Interactive WhatsApp Cloud API Quick-Reply Slot Buttons */}
                  {m.quickSlots && m.quickSlots.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 mt-1.5">
                      {m.quickSlots.map((slot) => (
                        <button
                          key={slot}
                          type="button"
                          onClick={() => bookClientSlot(slot)}
                          className="px-3 py-1.5 rounded-full bg-[#111214] text-[#D1F366] text-[11px] font-bold cursor-pointer hover:opacity-90 shadow-xs"
                        >
                          📅 {slot}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* WhatsApp Input */}
          <form
            onSubmit={handleSubmit}
            className="bg-white p-2.5 border-t border-black/[0.08] flex items-center gap-2 shrink-0"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Напишите заявку как клиент..."
              aria-label="Client WhatsApp message"
              className="flex-1 min-w-0 rounded-full bg-[#F3F5F7] px-3.5 py-2 text-[12.5px] outline-none"
            />
            <button
              type="submit"
              aria-label="Send WhatsApp message"
              className="w-9 h-9 rounded-full bg-[#111214] text-[#D1F366] flex items-center justify-center cursor-pointer shrink-0"
            >
              {draft.trim() ? (
                <Send className="w-4 h-4" />
              ) : (
                <Mic className="w-4 h-4" />
              )}
            </button>
          </form>
        </div>
      </div>

      {/* Scenario Launcher Panel */}
      <div className="space-y-4">
        <div className="rounded-[28px] bg-white/95 p-6 border border-white shadow-xs space-y-2">
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#85E6DC] text-[#111214] text-[11px] font-extrabold">
            <Sparkles className="w-3.5 h-3.5" /> Interactive WhatsApp Cloud API Flow
          </span>
          <h2 className="text-[24px] font-extrabold tracking-tight">
            Кликабельные сценарии входящей заявки
          </h2>
          <p className="text-[13px] text-[#525860]">
            Нажмите на любой сценарий ниже — сообщение уйдёт в реальный{" "}
            <code className="font-mono text-[12px] bg-[#F3F5F7] px-1.5 py-0.5 rounded">
              OnItDispatcher
            </code>
            , а созданная заявка мгновенно появится в <strong>Telegram Mini App</strong> и на <strong>Web Dashboard</strong>.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {SCENARIOS.map((sc) => (
            <button
              key={sc.id}
              type="button"
              onClick={() => void sendClientMessage(sc.payload)}
              className="text-left rounded-[22px] bg-white/95 hover:bg-[#D1F366] border border-white p-4 transition-colors cursor-pointer space-y-1.5 shadow-xs"
            >
              <span className="inline-block text-[10.5px] font-extrabold px-2.5 py-0.5 rounded-full bg-[#111214] text-white">
                {sc.badge}
              </span>
              <div className="text-[13.5px] font-extrabold">{sc.title}</div>
              <div className="text-[11.5px] text-[#525860] leading-snug">
                {sc.desc}
              </div>
            </button>
          ))}
        </div>

        <div className="rounded-[24px] bg-[#111214] text-white p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="text-[12.5px]">
            После отправки заявки переключитесь на сторону мастера, чтобы принять или скорректировать её:
          </div>
          <button
            type="button"
            onClick={() => setSurface("tma")}
            className="px-4 py-2 rounded-full bg-[#D1F366] text-[#111214] text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <Smartphone className="w-4 h-4" /> Открыть Telegram Mini App
          </button>
        </div>
      </div>
    </div>
  );
}
