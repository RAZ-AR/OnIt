"use client";

import React from "react";
import { AVATAR_STYLES, type AvatarKey } from "../data/demo-data";

export function AvatarCircle({
  who,
  size = "md",
  className = "",
}: {
  who: AvatarKey;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}) {
  const s = AVATAR_STYLES[who];
  const dims =
    size === "xs"
      ? "w-5 h-5 text-[9px]"
      : size === "sm"
        ? "w-7 h-7 text-[10px]"
        : size === "lg"
          ? "w-10 h-10 text-xs"
          : "w-8 h-8 text-[11px]";

  return (
    <span
      className={`inline-flex items-center justify-center rounded-full font-bold tracking-tight shrink-0 ring-2 select-none ${dims} ${className}`}
      style={{
        backgroundColor: s.bg,
        color: s.fg,
        boxShadow: "0 2px 6px rgba(15,23,42,0.12)",
      }}
      aria-label={who}
    >
      {s.initials}
    </span>
  );
}
