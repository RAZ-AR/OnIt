"use client";

import React, { useEffect, useState } from "react";
import {
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  Clock,
  MoreVertical,
  Pause,
  Pencil,
  Play,
  Square,
  Zap,
} from "lucide-react";
import {
  TECHNICIAN_CALENDAR,
  VOICE_CLIPS,
  type NavTab,
} from "../data/demo-data";
import { AvatarCircle } from "./Avatars";

interface RightRailProps {
  autoPilot: boolean;
  onToggleAutoPilot: () => void;
  onNavigate: (tab: NavTab) => void;
}

const WAVE_BARS = [
  10, 18, 8, 24, 14, 30, 12, 20, 34, 15, 10, 26, 18, 9, 28, 36, 16, 12, 22, 32,
  14, 10, 24, 38, 18, 12, 26, 14, 20, 30, 11, 22, 16, 9, 24, 15, 19, 10, 14, 8,
];

const TECH_FILTERS = ["All", "Aram", "Davit", "Hayk", "Suren"] as const;
const WEEKDAYS = ["M", "T", "W", "T", "F", "S", "S"];

function formatTimer(totalSec: number): string {
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  return [h, m, s].map((v) => String(v).padStart(2, "0")).join(":");
}

export function RightRail({
  autoPilot,
  onToggleAutoPilot,
  onNavigate,
}: RightRailProps) {
  const [voiceIdx, setVoiceIdx] = useState(0);
  const [voicePlaying, setVoicePlaying] = useState(false);
  const [selectedTech, setSelectedTech] = useState<string>("All");
  const [selectedDay, setSelectedDay] = useState<number>(14);
  const [seconds, setSeconds] = useState(7 * 3600 + 40 * 60 + 15);
  const [timerRunning, setTimerRunning] = useState(true);

  useEffect(() => {
    if (!timerRunning) return;
    const id = setInterval(() => setSeconds((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [timerRunning]);

  const activeClip = VOICE_CLIPS[voiceIdx % VOICE_CLIPS.length]!;
  const activeDays = TECHNICIAN_CALENDAR[selectedTech] ?? TECHNICIAN_CALENDAR.All!;

  const handlePlayVoice = () => {
    if (voicePlaying) {
      setVoiceIdx((i) => (i + 1) % VOICE_CLIPS.length);
    } else {
      setVoicePlaying(true);
    }
  };

  return (
    <aside className="flex flex-col gap-4 min-w-0">
      {/* Top Utility Row: Mode Switch + Next Visit Countdown Pill */}
      <div className="flex items-center justify-between gap-2.5 pt-0.5">
        <button
          type="button"
          onClick={onToggleAutoPilot}
          title={autoPilot ? "Auto-Dispatch ON" : "HITL Safe Mode"}
          className="w-12 h-7 rounded-full bg-[#111214] p-1 flex items-center cursor-pointer transition-all shrink-0"
          aria-label="Toggle AI Auto-Pilot"
        >
          <span
            className={`w-5 h-5 rounded-full transition-transform duration-200 ${
              autoPilot
                ? "translate-x-5 bg-[#D1F366]"
                : "translate-x-0 bg-white"
            }`}
          />
        </button>

        <div className="flex-1 min-w-0 h-10 rounded-full bg-white/95 border border-white shadow-xs px-2.5 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <AvatarCircle who="aram" size="xs" />
            <div className="leading-tight min-w-0">
              <div className="text-[11px] font-bold text-[#111214] truncate">
                11:30AM
              </div>
              <div className="text-[9px] text-[#8C9197] truncate">
                Next Visit · Kentron
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <span className="text-[10.5px] font-bold tabular-nums text-[#111214]">
              -00:42:15
            </span>
            <MoreVertical className="w-3.5 h-3.5 text-[#8C9197]" />
          </div>
        </div>
      </div>

      {/* Card 1: White Voice Triage Card (matches Team Insights) */}
      <div className="rounded-[26px] bg-white/95 p-4 shadow-[0_10px_30px_rgba(15,23,42,0.05)] border border-white flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Zap className="w-4 h-4 fill-[#111214] text-[#111214]" />
            <span className="text-[14.5px] font-extrabold tracking-tight">
              Voice Triage
            </span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("simulator")}
            className="text-[11px] font-medium text-[#6B7280] hover:text-[#111214] inline-flex items-center gap-0.5 cursor-pointer"
          >
            View all <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        {/* Dense Audio Waveform */}
        <div className="relative h-12 flex items-center justify-between gap-[2px] px-1">
          {WAVE_BARS.map((h, i) => {
            const isLit = voicePlaying && i < 24;
            return (
              <span
                key={i}
                className={`w-[2.5px] rounded-full transition-all duration-300 ${
                  isLit ? "bg-[#111214]" : "bg-[#111214]/75"
                }`}
                style={{
                  height: `${voicePlaying ? Math.max(8, (h + (i % 5) * 3) % 40) : h}px`,
                }}
              />
            );
          })}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 flex justify-around pointer-events-none px-6">
            <AvatarCircle who="ani" size="xs" />
            <AvatarCircle who="elena" size="xs" />
          </div>
        </div>

        {/* Live Bilingual Whisper Transcript Preview */}
        <div className="rounded-2xl bg-[#F6F7F9] px-3 py-2 text-[10.5px] leading-snug space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="font-bold text-[#111214]">{activeClip.client}</span>
            <span className="px-1.5 py-0.5 rounded-full bg-[#D1F366] text-[#111214] text-[9px] font-extrabold">
              {activeClip.langBadge}
            </span>
          </div>
          <div className="text-[#525860] truncate">{activeClip.original}</div>
          <div className="font-semibold text-[#111214] truncate">
            → {activeClip.masterBrief}
          </div>
        </div>

        <div className="flex items-center justify-between pt-0.5">
          <div className="flex items-center gap-2">
            <div className="flex -space-x-2">
              <AvatarCircle who="ani" size="md" />
              <AvatarCircle who="aram" size="md" />
            </div>
            <span className="text-[10.5px] text-[#8C9197] font-medium">
              Groq Whisper v3
            </span>
          </div>

          <button
            type="button"
            onClick={handlePlayVoice}
            title="Следующее голосовое сообщение"
            className="w-10 h-10 rounded-full bg-[#111214] text-white flex items-center justify-center hover:scale-105 transition-transform cursor-pointer shadow-md"
            aria-label="Play voice triage sample"
          >
            <Play className="w-4 h-4 fill-white ml-0.5" />
          </button>
        </div>
      </div>

      {/* Card 2: Warm Ochre Dispatch History Calendar */}
      <div className="rounded-[26px] bg-[#E5BC73] p-4 shadow-[0_12px_28px_rgba(107,76,27,0.16)] flex flex-col gap-3">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-1.5">
              <Zap className="w-4 h-4 fill-[#141517] text-[#141517]" />
              <span className="text-[15px] font-extrabold tracking-tight text-[#1E1A14]">
                History
              </span>
            </div>
            <div className="text-[11px] font-medium text-[#5A441F]">
              Booked Working Days
            </div>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("routes")}
            aria-label="Open Geo Routes"
            className="w-7 h-7 rounded-full border border-black/20 flex items-center justify-center text-[#1E1A14] hover:bg-black/5 cursor-pointer"
          >
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Technician Filter Pills */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {TECH_FILTERS.map((name) => {
            const active = selectedTech === name;
            return (
              <button
                key={name}
                type="button"
                onClick={() => setSelectedTech(name)}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-semibold transition-all cursor-pointer ${
                  active
                    ? "bg-[#141517] text-white"
                    : "border border-black/30 text-[#1E1A14] hover:bg-black/5"
                }`}
              >
                {name}
              </button>
            );
          })}
        </div>

        {/* Circular Calendar Grid */}
        <div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold text-[#5A441F] mb-1.5">
            {WEEKDAYS.map((w, i) => (
              <span key={i}>{w}</span>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {[0, 1, 2, 3, 4].map((empty) => (
              <span
                key={`e-${empty}`}
                className="w-8 h-8 mx-auto rounded-full border border-dashed border-black/30"
              />
            ))}

            {Array.from({ length: 30 }, (_, idx) => {
              const day = idx + 1;
              const isBooked = activeDays.includes(day);
              const isPicked = selectedDay === day;
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => setSelectedDay(day)}
                  className={`w-8 h-8 mx-auto rounded-full text-[11px] font-bold tabular-nums flex items-center justify-center transition-all cursor-pointer ${
                    isBooked
                      ? "bg-[#141517] text-white shadow-xs"
                      : "bg-[#F4DFB4] text-[#1E1A14] hover:bg-[#EED297]"
                  } ${isPicked ? "ring-2 ring-white ring-offset-1 ring-offset-[#E5BC73]" : ""}`}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Month Footer */}
        <div className="flex items-center justify-between pt-1">
          <span className="w-7 h-7 rounded-full border border-black/30 flex items-center justify-center text-[#111214]">
            <ChevronLeft className="w-3.5 h-3.5" />
          </span>
          <span className="text-[12.5px] font-bold text-[#111214]">
            April 2026
          </span>
          <span className="w-7 h-7 rounded-full border border-black/30 flex items-center justify-center text-[#111214]">
            <ChevronRight className="w-3.5 h-3.5" />
          </span>
        </div>
      </div>

      {/* Card 3: Jet-Black Liquid Silk Time Tracker */}
      <div className="rounded-[28px] bg-[#111214] text-white p-4 relative overflow-hidden shadow-[0_18px_40px_rgba(17,18,20,0.28)] min-h-[118px] flex flex-col justify-between">
        {/* Flowing dark silk ribbons SVG matching reference */}
        <svg
          viewBox="0 0 320 130"
          className="absolute inset-0 w-full h-full pointer-events-none opacity-45"
          preserveAspectRatio="none"
        >
          <defs>
            <linearGradient id="silk1" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.22" />
              <stop offset="50%" stopColor="#6B7280" stopOpacity="0.06" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M 160 0 C 205 22, 195 72, 255 106 C 285 122, 305 112, 318 128 L 318 0 Z"
            fill="url(#silk1)"
          />
          <path
            d="M 110 126 C 165 82, 225 62, 308 18"
            fill="none"
            stroke="rgba(255,255,255,0.16)"
            strokeWidth="16"
            strokeLinecap="round"
          />
        </svg>

        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <Clock className="w-4 h-4 text-white" />
            <span className="text-[13px] font-bold">Time Tracker</span>
          </div>
          <button
            type="button"
            onClick={() => onNavigate("analytics")}
            aria-label="Edit SLA Tracker"
            className="w-7 h-7 rounded-full border border-white/25 flex items-center justify-center text-white/80 hover:text-white cursor-pointer"
          >
            <Pencil className="w-3 h-3" />
          </button>
        </div>

        <div className="relative z-10 flex items-end justify-between gap-2 pt-3">
          <div className="text-[28px] font-extrabold tracking-[-0.03em] tabular-nums leading-none">
            {formatTimer(seconds)}
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setTimerRunning((r) => !r)}
              className="w-9 h-9 rounded-full bg-white text-[#111214] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              aria-label={timerRunning ? "Pause timer" : "Resume timer"}
            >
              {timerRunning ? (
                <Pause className="w-3.5 h-3.5 fill-current" />
              ) : (
                <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                setTimerRunning(false);
                setSeconds(0);
              }}
              className="w-9 h-9 rounded-full bg-white text-[#111214] flex items-center justify-center hover:scale-105 transition-transform cursor-pointer"
              aria-label="Reset timer"
            >
              <Square className="w-3 h-3 fill-current" />
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
