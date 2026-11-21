"use client";

import React, { useState } from "react";
import { Camera, Eye, EyeOff } from "lucide-react";
import type { DefectPhotoKind } from "../data/demo-data";

const PHOTO_META: Record<
  DefectPhotoKind,
  {
    title: string;
    aiBoxLabel: string;
    aiConfidence: string;
    palette: { bg: string; accent: string; box: string };
  }
> = {
  frost_pipe: {
    title: "Обмерзание медной магистрали",
    aiBoxLabel: "FROST / LOW FREON · 92%",
    aiConfidence: "0.92",
    palette: { bg: "#1D262D", accent: "#9BDDF2", box: "#E5BC73" },
  },
  drain_leak: {
    title: "Перелив поддона и течь дренажа",
    aiBoxLabel: "WATER DRIP / DRAIN · 88%",
    aiConfidence: "0.88",
    palette: { bg: "#202A2B", accent: "#8FD4CE", box: "#A7CCC9" },
  },
  coil_dirt: {
    title: "Загрязнение теплообменника",
    aiBoxLabel: "DUST BUILDUP · 96%",
    aiConfidence: "0.96",
    palette: { bg: "#24222B", accent: "#C9C1E0", box: "#BEB7D4" },
  },
  pcb_burn: {
    title: "Потемнение платы инвертора",
    aiBoxLabel: "THERMAL BURN · HITL 55%",
    aiConfidence: "0.55",
    palette: { bg: "#2B1E21", accent: "#F2A59B", box: "#FF6B4A" },
  },
};

export function DefectPhotoCard({
  kind = "frost_pipe",
  compact = false,
}: {
  kind?: DefectPhotoKind;
  compact?: boolean;
}) {
  const [showOverlay, setShowOverlay] = useState(true);
  const meta = PHOTO_META[kind];

  return (
    <div
      className={`relative overflow-hidden select-none ${
        compact
          ? "w-14 h-14 rounded-2xl shrink-0 border border-black/15"
          : "w-full h-[176px] rounded-[22px] border border-black/10"
      }`}
      style={{ backgroundColor: meta.palette.bg }}
    >
      {/* Technical photo illustration */}
      <svg
        viewBox="0 0 320 176"
        className="w-full h-full object-cover"
        preserveAspectRatio="xMidYMid slice"
      >
        <defs>
          <radialGradient id={`g-${kind}`} cx="50%" cy="45%" r="60%">
            <stop offset="0%" stopColor={meta.palette.accent} stopOpacity="0.32" />
            <stop offset="100%" stopColor={meta.palette.bg} stopOpacity="0" />
          </radialGradient>
        </defs>
        <rect width="320" height="176" fill={meta.palette.bg} />
        <rect width="320" height="176" fill={`url(#g-${kind})`} />

        {kind === "frost_pipe" && (
          <>
            <rect x="28" y="34" width="264" height="72" rx="14" fill="#2E3A44" stroke="rgba(255,255,255,0.14)" />
            <line x1="48" y1="78" x2="272" y2="78" stroke="rgba(255,255,255,0.18)" strokeWidth="3" />
            <path d="M 85 106 L 85 148 Q 85 158 98 158 L 228 158" fill="none" stroke="#C87D55" strokeWidth="10" strokeLinecap="round" />
            <path d="M 85 112 L 85 148 Q 85 158 98 158 L 168 158" fill="none" stroke="#E6F8FF" strokeWidth="14" strokeLinecap="round" opacity="0.88" />
            <circle cx="102" cy="146" r="5" fill="#FFFFFF" opacity="0.9" />
            <circle cx="136" cy="158" r="6" fill="#D5F3FF" opacity="0.85" />
          </>
        )}

        {kind === "drain_leak" && (
          <>
            <rect x="34" y="24" width="252" height="76" rx="14" fill="#323F40" stroke="rgba(255,255,255,0.15)" />
            <rect x="52" y="80" width="216" height="10" rx="5" fill="#182021" />
            <path d="M 118 92 Q 112 114 118 122 Q 124 114 118 92 Z" fill="#8FD4CE" />
            <path d="M 164 96 Q 158 124 164 134 Q 170 124 164 96 Z" fill="#BCECE8" />
            <path d="M 206 94 Q 202 110 206 116 Q 210 110 206 94 Z" fill="#8FD4CE" opacity="0.8" />
            <ellipse cx="164" cy="152" rx="56" ry="9" fill="#8FD4CE" opacity="0.28" />
          </>
        )}

        {kind === "coil_dirt" && (
          <>
            <rect x="36" y="24" width="248" height="128" rx="12" fill="#33303D" stroke="rgba(255,255,255,0.14)" />
            {Array.from({ length: 16 }, (_, i) => (
              <line
                key={i}
                x1={52 + i * 14}
                y1="34"
                x2={52 + i * 14}
                y2="142"
                stroke="rgba(255,255,255,0.16)"
                strokeWidth="2"
              />
            ))}
            <ellipse cx="154" cy="86" rx="68" ry="34" fill="#595268" opacity="0.72" />
            <ellipse cx="190" cy="102" rx="42" ry="22" fill="#464053" opacity="0.82" />
          </>
        )}

        {kind === "pcb_burn" && (
          <>
            <rect x="46" y="22" width="228" height="132" rx="10" fill="#1F3A32" stroke="rgba(255,255,255,0.16)" />
            <rect x="74" y="42" width="44" height="36" rx="4" fill="#14181A" />
            <rect x="136" y="46" width="56" height="44" rx="5" fill="#1B1E21" />
            <circle cx="228" cy="64" r="18" fill="#181C1F" stroke="rgba(255,255,255,0.2)" />
            <circle cx="164" cy="68" r="28" fill="#FF5722" opacity="0.42" />
            <circle cx="164" cy="68" r="12" fill="#140C0A" opacity="0.85" />
            <line x1="74" y1="112" x2="246" y2="112" stroke="#4D8A76" strokeWidth="2.5" strokeDasharray="6 4" />
          </>
        )}

        {/* Vision AI Detection Bounding Box */}
        {showOverlay && !compact && (
          <g>
            <rect
              x="76"
              y="40"
              width="168"
              height="104"
              rx="10"
              fill="none"
              stroke={meta.palette.box}
              strokeWidth="2"
              strokeDasharray="6 4"
            />
            <rect x="76" y="24" width="168" height="18" rx="6" fill={meta.palette.box} />
            <text
              x="84"
              y="36"
              fill="#111214"
              fontSize="9.5"
              fontWeight="800"
              fontFamily="monospace"
            >
              {meta.aiBoxLabel}
            </text>
          </g>
        )}
      </svg>

      {compact ? (
        <span className="absolute bottom-1 right-1 w-4 h-4 rounded-full bg-black/75 text-white flex items-center justify-center">
          <Camera className="w-2.5 h-2.5" />
        </span>
      ) : (
        <div className="absolute bottom-2.5 inset-x-2.5 flex items-center justify-between gap-2">
          <span className="px-2.5 py-1 rounded-full bg-black/70 backdrop-blur-md text-white text-[10.5px] font-semibold truncate">
            📷 {meta.title}
          </span>
          <button
            type="button"
            onClick={() => setShowOverlay((v) => !v)}
            className="px-2.5 py-1 rounded-full bg-white/90 text-[#141517] text-[10px] font-bold inline-flex items-center gap-1 cursor-pointer shrink-0"
          >
            {showOverlay ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
            AI Box
          </button>
        </div>
      )}
    </div>
  );
}
