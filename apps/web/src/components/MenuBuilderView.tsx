"use client";

import React, { useState } from "react";
import {
  parseTextPriceListDeterministic,
  slugifyServiceCode,
  type PriceMatrix,
  type ServiceItem,
} from "@onit/core";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  ChevronUp,
  Clock,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";

const MENU_TEMPLATES: Array<{
  id: string;
  label: string;
  category: string;
  services: ServiceItem[];
}> = [
  {
    id: "hvac",
    label: "❄️ Кондиционеры",
    category: "hvac",
    services: [
      { code: "ac_freon_refill", name: "Заправка фреоном", category: "hvac", unit: "unit", priceMin: 12000, priceMax: 15000, estimatedMinutes: 45, requiredSlots: ["outer_unit_accessible"] },
      { code: "ac_drainage_clean", name: "Чистка дренажа", category: "hvac", unit: "unit", priceMin: 6000, priceMax: 7000, estimatedMinutes: 30, requiredSlots: [] },
      { code: "ac_full_maintenance", name: "Полная профилактика сплит", category: "hvac", unit: "unit", priceMin: 15000, priceMax: 18000, estimatedMinutes: 60, requiredSlots: ["floor", "outer_unit_accessible"] },
      { code: "ac_diagnostics", name: "Диагностика блока", category: "hvac", unit: "job", priceMin: 5000, priceMax: 5000, estimatedMinutes: 30, requiredSlots: [] },
    ],
  },
  {
    id: "plumbing",
    label: "🚰 Сантехника",
    category: "plumbing",
    services: [
      { code: "leak_fix", name: "Устранение протечки трубы", category: "plumbing", unit: "job", priceMin: 10000, priceMax: 15000, estimatedMinutes: 45, requiredSlots: [] },
      { code: "faucet_swap", name: "Замена смесителя", category: "plumbing", unit: "unit", priceMin: 8000, priceMax: 10000, estimatedMinutes: 40, requiredSlots: [] },
      { code: "drain_unclog", name: "Прочистка засора", category: "plumbing", unit: "job", priceMin: 9000, priceMax: 12000, estimatedMinutes: 45, requiredSlots: [] },
      { code: "boiler_service", name: "Чистка бойлера и ТЭНа", category: "plumbing", unit: "unit", priceMin: 14000, priceMax: 18000, estimatedMinutes: 60, requiredSlots: [] },
    ],
  },
  {
    id: "electrical",
    label: "⚡ Электрика",
    category: "electrical",
    services: [
      { code: "socket_install", name: "Установка / замена розетки", category: "electrical", unit: "unit", priceMin: 3500, priceMax: 4500, estimatedMinutes: 25, requiredSlots: [] },
      { code: "breaker_swap", name: "Замена автомата в щитке", category: "electrical", unit: "unit", priceMin: 6000, priceMax: 8000, estimatedMinutes: 30, requiredSlots: [] },
      { code: "chandelier_hang", name: "Установка люстры / светильника", category: "electrical", unit: "unit", priceMin: 8000, priceMax: 12000, estimatedMinutes: 45, requiredSlots: [] },
      { code: "short_diag", name: "Поиск короткого замыкания", category: "electrical", unit: "job", priceMin: 10000, priceMax: 15000, estimatedMinutes: 60, requiredSlots: [] },
    ],
  },
  {
    id: "appliances",
    label: "🧺 Бытовая техника",
    category: "appliances",
    services: [
      { code: "washer_pump", name: "Замена помпы стиральной машины", category: "appliances", unit: "job", priceMin: 14000, priceMax: 18000, estimatedMinutes: 50, requiredSlots: [] },
      { code: "fridge_freon", name: "Заправка холодильника фреоном", category: "appliances", unit: "job", priceMin: 18000, priceMax: 24000, estimatedMinutes: 60, requiredSlots: [] },
      { code: "oven_diag", name: "Диагностика духовки / посудомойки", category: "appliances", unit: "job", priceMin: 6000, priceMax: 6000, estimatedMinutes: 30, requiredSlots: [] },
    ],
  },
];

export function MenuBuilderView({
  matrix,
  onApplyMatrix,
  onBack,
  compact = false,
}: {
  matrix: PriceMatrix;
  onApplyMatrix: (next: PriceMatrix) => void;
  onBack?: () => void;
  compact?: boolean;
}) {
  const [name, setName] = useState("");
  const [priceMin, setPriceMin] = useState("10000");
  const [priceMax, setPriceMax] = useState("14000");
  const [minutes, setMinutes] = useState(45);
  const [showImport, setShowImport] = useState(false);
  const [rawImport, setRawImport] = useState(
    "Заправка фреоном | 12000-15000 AMD | 45 мин\nЧистка дренажа | 6000-7000 AMD | 30 мин"
  );
  const [savedNotice, setSavedNotice] = useState<string | null>(null);

  const flash = (msg: string) => {
    setSavedNotice(msg);
    setTimeout(() => setSavedNotice(null), 2200);
  };

  const handleAddItem = (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = name.trim();
    const minVal = Math.max(0, Number(priceMin) || 0);
    const maxVal = Math.max(minVal, Number(priceMax) || minVal);
    if (!cleaned) return;

    const code = slugifyServiceCode(cleaned, matrix.services.length);
    const nextItem: ServiceItem = {
      code: matrix.services.some((s) => s.code === code)
        ? `${code}_${Date.now().toString().slice(-3)}`
        : code,
      name: cleaned,
      category: matrix.services[0]?.category ?? "general",
      unit: "job",
      priceMin: minVal,
      priceMax: maxVal,
      estimatedMinutes: minutes,
      requiredSlots: [],
    };

    onApplyMatrix({
      ...matrix,
      services: [nextItem, ...matrix.services],
    });
    setName("");
    flash(`Добавлено: ${cleaned}`);
  };

  const handleDeleteItem = (code: string) => {
    if (matrix.services.length <= 1) return;
    onApplyMatrix({
      ...matrix,
      services: matrix.services.filter((s) => s.code !== code),
    });
  };

  const handleApplyTemplate = (tpl: (typeof MENU_TEMPLATES)[number]) => {
    onApplyMatrix({
      ...matrix,
      services: tpl.services,
    });
    flash(`Загружен шаблон: ${tpl.label}`);
  };

  const handleImportText = () => {
    try {
      const parsed = parseTextPriceListDeterministic(rawImport, {
        companyId: matrix.companyId,
        currency: matrix.currency,
      });
      onApplyMatrix({
        ...matrix,
        services: parsed.services,
      });
      setShowImport(false);
      flash(`Импортировано ${parsed.services.length} позиций`);
    } catch {
      flash("Не удалось распознать строки — укажите «Название | Цена»");
    }
  };

  return (
    <main className="flex flex-col gap-4 min-w-0">
      {/* Header */}
      <section className="rounded-[28px] bg-[#E7E8E3] border border-black/[0.06] p-4 sm:p-5 space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            {onBack && (
              <button
                type="button"
                onClick={onBack}
                aria-label="Back to Dispatch"
                className="w-9 h-9 rounded-full bg-white text-[#141517] flex items-center justify-center shadow-2xs cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}
            <div>
              <h1 className="tma-display text-[20px] sm:text-[22px] font-extrabold tracking-tight">
                Меню услуг ({matrix.services.length})
              </h1>
              <p className="text-[12px] text-black/60">
                Добавляйте услуги в 1 клик или выберите готовый шаблон — OnIt сразу считает по этому меню
              </p>
            </div>
          </div>

          {savedNotice && (
            <span className="px-3 py-1 rounded-full bg-[#141517] text-[#E5BC73] text-[11px] font-bold inline-flex items-center gap-1">
              <Check className="w-3.5 h-3.5" /> {savedNotice}
            </span>
          )}
        </div>

        {/* 1-Click Niche Templates */}
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-black/55">
            Быстрый старт — готовые меню по нишам:
          </div>
          <div className="flex flex-wrap gap-1.5">
            {MENU_TEMPLATES.map((tpl) => (
              <button
                key={tpl.id}
                type="button"
                onClick={() => handleApplyTemplate(tpl)}
                className="px-3.5 py-1.5 rounded-full bg-white hover:bg-[#E5BC73] text-[#141517] text-[11.5px] font-bold transition-colors cursor-pointer shadow-2xs"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* Visual 1-Line Service Creator */}
      <form
        onSubmit={handleAddItem}
        className="rounded-[26px] bg-white border border-black/[0.06] p-4 space-y-3 shadow-2xs"
      >
        <div className="text-[13px] font-extrabold flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#6B4C1B]" /> Добавить услугу в меню
        </div>

        <div className={`grid gap-2 ${compact ? "grid-cols-1" : "grid-cols-1 sm:grid-cols-[1.6fr_0.8fr_0.8fr_auto]"}`}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Название (например: Замена фильтра сплит-системы)"
            aria-label="Service name"
            className="rounded-2xl bg-[#F4F5F1] px-3.5 py-2.5 text-[12.5px] font-semibold outline-none focus:ring-2 focus:ring-black/15"
          />
          <div className="grid grid-cols-2 sm:contents gap-2">
            <input
              type="number"
              min={0}
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder={`От (${matrix.currency})`}
              aria-label="Min price"
              className="tma-mono rounded-2xl bg-[#F4F5F1] px-3 py-2.5 text-[12.5px] font-bold outline-none"
            />
            <input
              type="number"
              min={0}
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder={`До (${matrix.currency})`}
              aria-label="Max price"
              className="tma-mono rounded-2xl bg-[#F4F5F1] px-3 py-2.5 text-[12.5px] font-bold outline-none"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 rounded-full bg-[#141517] text-[#E5BC73] text-[12.5px] font-extrabold inline-flex items-center justify-center gap-1.5 cursor-pointer hover:opacity-90"
          >
            <Plus className="w-4 h-4" /> Добавить
          </button>
        </div>

        <div className="flex items-center justify-between gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-bold text-black/55 inline-flex items-center gap-1">
              <Clock className="w-3 h-3" /> Длительность:
            </span>
            {[30, 45, 60, 90].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setMinutes(m)}
                className={`tma-mono px-2.5 py-1 rounded-full text-[11px] font-bold cursor-pointer ${
                  minutes === m
                    ? "bg-[#E5BC73] text-[#1E1A14]"
                    : "bg-[#F4F5F1] text-black/65"
                }`}
              >
                {m} мин
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => setShowImport((v) => !v)}
            className="text-[11.5px] font-bold text-black/65 hover:text-[#141517] inline-flex items-center gap-1 cursor-pointer"
          >
            <Upload className="w-3.5 h-3.5" />
            Импорт списком / фото / голосом
            {showImport ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>

        {showImport && (
          <div className="pt-2 border-t border-black/[0.06] space-y-2">
            <textarea
              value={rawImport}
              onChange={(e) => setRawImport(e.target.value)}
              rows={4}
              aria-label="Bulk text menu import"
              className="tma-mono w-full rounded-2xl bg-[#F4F5F1] p-3 text-[11.5px] outline-none"
            />
            <button
              type="button"
              onClick={handleImportText}
              className="px-4 py-2 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[12px] font-extrabold cursor-pointer"
            >
              Распознать и заменить меню
            </button>
          </div>
        )}
      </form>

      {/* Active Menu Cards */}
      <section className="rounded-[28px] bg-white border border-black/[0.06] p-4 space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <span className="tma-display text-[14px] font-extrabold">
            Активные позиции меню
          </span>
          <span className="tma-mono text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-[#E7E8E3]">
            {matrix.currency}
          </span>
        </div>

        <div className={`grid gap-2.5 ${compact ? "grid-cols-1" : "grid-cols-1 md:grid-cols-2"}`}>
          {matrix.services.map((s) => (
            <div
              key={s.code}
              className="rounded-[20px] bg-[#F4F5F1] p-3.5 flex items-center justify-between gap-2.5"
            >
              <div className="min-w-0">
                <div className="text-[13px] font-extrabold truncate">{s.name}</div>
                <div className="tma-mono text-[10.5px] text-black/55 mt-0.5">
                  ~{s.estimatedMinutes} мин · {s.priceMin === s.priceMax ? s.priceMin : `${s.priceMin}–${s.priceMax}`} {matrix.currency}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDeleteItem(s.code)}
                disabled={matrix.services.length <= 1}
                aria-label={`Delete ${s.name}`}
                className="w-8 h-8 rounded-full bg-white hover:bg-red-50 hover:text-red-600 text-black/45 flex items-center justify-center shrink-0 cursor-pointer disabled:opacity-30"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
