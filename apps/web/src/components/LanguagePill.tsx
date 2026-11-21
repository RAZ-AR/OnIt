"use client";

import React from "react";
import { Globe } from "lucide-react";
import { useOnItStore } from "../context/OnItStore";
import type { UiLang } from "../i18n/ui-strings";

const LANGS: UiLang[] = ["ru", "hy", "en", "es"];

export function LanguagePill({ compact = false }: { compact?: boolean }) {
  const { settings, updateSettings, notify } = useOnItStore();
  const current = settings.masterLanguage;

  if (compact) {
    const cycle = () => {
      const idx = LANGS.indexOf(current);
      const next = LANGS[(idx + 1) % LANGS.length]!;
      updateSettings({ masterLanguage: next });
      notify(`Язык интерфейса: ${next.toUpperCase()}`);
    };

    return (
      <button
        type="button"
        onClick={cycle}
        aria-label="Switch interface language"
        title="Сменить язык (RU / HY / EN / ES)"
        className="h-10 px-3 rounded-full bg-white/85 hover:bg-white border border-black/10 text-[#141517] text-[11.5px] font-extrabold inline-flex items-center gap-1 cursor-pointer transition-colors shrink-0"
      >
        <Globe className="w-3.5 h-3.5 text-black/60" />
        <span className="tma-mono uppercase">{current}</span>
      </button>
    );
  }

  return (
    <div
      role="group"
      aria-label="Interface language switcher"
      className="inline-flex items-center gap-0.5 p-1 rounded-full bg-white/85 backdrop-blur-xl border border-white shadow-[0_6px_18px_rgba(20,21,23,0.06)]"
    >
      <Globe className="w-3.5 h-3.5 text-black/50 ml-2 mr-1 shrink-0" />
      {LANGS.map((code) => {
        const active = current === code;
        return (
          <button
            key={code}
            type="button"
            onClick={() => updateSettings({ masterLanguage: code })}
            className={`tma-mono px-2.5 py-1 rounded-full text-[11px] font-extrabold uppercase transition-all cursor-pointer ${
              active
                ? "bg-[#141517] text-[#E5BC73] shadow-2xs"
                : "text-black/55 hover:text-[#141517] hover:bg-black/5"
            }`}
          >
            {code}
          </button>
        );
      })}
    </div>
  );
}
