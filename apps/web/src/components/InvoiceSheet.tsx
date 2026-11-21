"use client";

import React, { useMemo, useState } from "react";
import {
  Check,
  Copy,
  CreditCard,
  Minus,
  Percent,
  Plus,
  Receipt,
  Send,
  Trash2,
  X,
} from "lucide-react";
import { useOnItStore } from "../context/OnItStore";
import type { DemoJob } from "../data/demo-data";

interface InvoiceItem {
  id: string;
  name: string;
  qty: number;
  unitPrice: number;
}

interface InvoiceAdjustment {
  id: string;
  direction: "surcharge" | "discount";
  mode: "percent" | "fixed";
  label: string;
  value: number;
}

const SURCHARGE_PRESETS: Array<{
  label: string;
  direction: "surcharge" | "discount";
  mode: "percent" | "fixed";
  value: number;
}> = [
  { label: "Сложность доступа", direction: "surcharge", mode: "percent", value: 20 },
  { label: "Негабарит / тяжёлый блок", direction: "surcharge", mode: "fixed", value: 5000 },
  { label: "Срочный выезд", direction: "surcharge", mode: "percent", value: 25 },
  { label: "Высотные работы", direction: "surcharge", mode: "fixed", value: 6000 },
  { label: "Постоянный клиент", direction: "discount", mode: "percent", value: 10 },
  { label: "Скидка мастера", direction: "discount", mode: "fixed", value: 2000 },
];

function parseInitialPrice(priceRange: string, fallback: number): number {
  const m = priceRange.replace(/\s/g, "").match(/(\d{3,7})/);
  return m?.[1] ? Number(m[1]) : fallback;
}

export function InvoiceSheet({
  job,
  onClose,
}: {
  job: DemoJob;
  onClose: () => void;
}) {
  const { matrix, settings, sendInvoiceToClient, notify } = useOnItStore();
  const currency = matrix.currency;
  const invoiceNumber = `INV-${job.id.replace(/[^0-9]/g, "") || "108"}`;

  const [items, setItems] = useState<InvoiceItem[]>([
    {
      id: "i1",
      name: job.title,
      qty: 1,
      unitPrice: parseInitialPrice(job.priceRange, currency === "AMD" ? 18000 : 80),
    },
  ]);

  const [adjustments, setAdjustments] = useState<InvoiceAdjustment[]>([]);
  const [newItemName, setNewItemName] = useState("");
  const [newItemPrice, setNewItemPrice] = useState(currency === "AMD" ? "5000" : "25");

  // Custom adjustment builder
  const [adjDirection, setAdjDirection] = useState<"surcharge" | "discount">("surcharge");
  const [adjMode, setAdjMode] = useState<"percent" | "fixed">("percent");
  const [adjLabel, setAdjLabel] = useState("Сложность");
  const [adjValue, setAdjValue] = useState("15");

  const [paymentMethod, setPaymentMethod] = useState<
    "IDram / Перевод" | "Наличные" | "Карта / Stripe"
  >("IDram / Перевод");
  const [copied, setCopied] = useState(false);

  const subtotal = useMemo(
    () => items.reduce((sum, it) => sum + Math.max(0, it.qty) * Math.max(0, it.unitPrice), 0),
    [items]
  );

  const computedAdjustments = useMemo(
    () =>
      adjustments.map((adj) => {
        const raw =
          adj.mode === "percent" ? Math.round((subtotal * adj.value) / 100) : adj.value;
        const signed = adj.direction === "discount" ? -raw : raw;
        return { ...adj, delta: signed };
      }),
    [adjustments, subtotal]
  );

  const total = useMemo(() => {
    const sumDelta = computedAdjustments.reduce((s, a) => s + a.delta, 0);
    return Math.max(0, subtotal + sumDelta);
  }, [subtotal, computedAdjustments]);

  const fmt = (n: number) => `${Math.abs(n).toLocaleString("en-US").replace(/,/g, " ")} ${currency}`;

  const addCustomItem = () => {
    const name = newItemName.trim();
    const price = Number(newItemPrice);
    if (!name || Number.isNaN(price) || price < 0) return;
    setItems((prev) => [
      ...prev,
      { id: `it_${Date.now()}`, name, qty: 1, unitPrice: price },
    ]);
    setNewItemName("");
  };

  const addServiceFromMenu = (code: string) => {
    const found = matrix.services.find((s) => s.code === code);
    if (!found) return;
    setItems((prev) => [
      ...prev,
      {
        id: `it_${Date.now()}`,
        name: found.name,
        qty: 1,
        unitPrice: found.priceMin,
      },
    ]);
  };

  const addPresetAdjustment = (p: (typeof SURCHARGE_PRESETS)[number]) => {
    const val =
      p.mode === "fixed" && currency !== "AMD"
        ? Math.max(5, Math.round(p.value / 400))
        : p.value;
    setAdjustments((prev) => [
      ...prev,
      {
        id: `adj_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        direction: p.direction,
        mode: p.mode,
        label: p.label,
        value: val,
      },
    ]);
  };

  const addCustomAdjustment = () => {
    const val = Number(adjValue);
    if (Number.isNaN(val) || val <= 0) return;
    setAdjustments((prev) => [
      ...prev,
      {
        id: `adj_${Date.now()}`,
        direction: adjDirection,
        mode: adjMode,
        label:
          adjLabel.trim() ||
          (adjDirection === "surcharge" ? "Надбавка" : "Скидка"),
        value: val,
      },
    ]);
  };

  const buildInvoiceMessage = (): string => {
    const lines: string[] = [
      `🧾 Инвойс #${invoiceNumber} · ${settings.companyName}`,
      `Клиент: ${job.clientName} · ${job.address}`,
      "",
      ...items.map(
        (it) => `• ${it.name}${it.qty > 1 ? ` ×${it.qty}` : ""}: ${fmt(it.qty * it.unitPrice)}`
      ),
    ];

    if (computedAdjustments.length > 0) {
      lines.push("");
      for (const a of computedAdjustments) {
        const sign = a.delta >= 0 ? "+" : "−";
        const tag = a.mode === "percent" ? ` (${a.value}%)` : "";
        lines.push(`${sign} ${a.label}${tag}: ${sign}${fmt(a.delta)}`);
      }
    }

    lines.push("");
    lines.push(`ИТОГО К ОПЛАТЕ: ${fmt(total)}`);
    lines.push(`Оплата: ${paymentMethod}`);
    return lines.join("\n");
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(buildInvoiceMessage());
      setCopied(true);
      notify("Текст инвойса скопирован");
      setTimeout(() => setCopied(false), 1800);
    } catch {
      notify("Не удалось скопировать в буфер");
    }
  };

  const handleSend = () => {
    sendInvoiceToClient({
      jobId: job.id,
      invoiceNumber,
      total,
      currency,
      summaryText: buildInvoiceMessage(),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <div className="w-full max-w-[540px] max-h-[92vh] overflow-y-auto thin-scroll rounded-t-[32px] sm:rounded-[32px] bg-[#F7F7F4] text-[#141517] p-5 space-y-4 shadow-2xl border border-black/10">
        <div className="w-10 h-1 rounded-full bg-black/15 mx-auto sm:hidden" />

        {/* Header */}
        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[10.5px] font-extrabold">
              <Receipt className="w-3 h-3" /> Инвойс #{invoiceNumber}
            </span>
            <h3 className="tma-display text-[20px] font-extrabold mt-1">
              Счёт для {job.clientName}
            </h3>
            <p className="text-[11.5px] text-black/55">
              {job.address} · {settings.companyName}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close invoice sheet"
            className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Line Items */}
        <div className="rounded-[24px] bg-white border border-black/[0.06] p-4 space-y-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-[12.5px] font-extrabold">Позиции и работы</span>
            <select
              defaultValue=""
              onChange={(e) => {
                if (e.target.value) {
                  addServiceFromMenu(e.target.value);
                  e.target.value = "";
                }
              }}
              aria-label="Add service from menu"
              className="rounded-full bg-[#F4F5F1] px-3 py-1 text-[11px] font-bold outline-none cursor-pointer"
            >
              <option value="">+ Из меню услуг...</option>
              {matrix.services.map((s) => (
                <option key={s.code} value={s.code}>
                  {s.name} ({s.priceMin} {currency})
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            {items.map((it) => (
              <div
                key={it.id}
                className="rounded-2xl bg-[#F4F5F1] px-3 py-2 flex items-center justify-between gap-2 text-[12px]"
              >
                <span className="font-bold truncate flex-1">{it.name}</span>
                <div className="flex items-center gap-1.5 shrink-0">
                  <input
                    type="number"
                    min={1}
                    value={it.qty}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === it.id ? { ...x, qty: Math.max(1, Number(e.target.value)) } : x
                        )
                      )
                    }
                    aria-label="Quantity"
                    className="tma-mono w-12 rounded-lg bg-white px-2 py-1 text-center font-bold outline-none"
                  />
                  <span className="text-black/40">×</span>
                  <input
                    type="number"
                    min={0}
                    value={it.unitPrice}
                    onChange={(e) =>
                      setItems((prev) =>
                        prev.map((x) =>
                          x.id === it.id ? { ...x, unitPrice: Math.max(0, Number(e.target.value)) } : x
                        )
                      )
                    }
                    aria-label="Unit price"
                    className="tma-mono w-24 rounded-lg bg-white px-2 py-1 text-right font-bold outline-none"
                  />
                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setItems((prev) => prev.filter((x) => x.id !== it.id))}
                      aria-label="Remove item"
                      className="text-black/40 hover:text-red-600 cursor-pointer p-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Add custom part / line */}
          <div className="flex items-center gap-1.5 pt-1">
            <input
              value={newItemName}
              onChange={(e) => setNewItemName(e.target.value)}
              placeholder="Доп. работа или запчасть (напр. Фреон R32)"
              aria-label="Custom item name"
              className="flex-1 min-w-0 rounded-xl bg-[#F4F5F1] px-3 py-2 text-[11.5px] outline-none"
            />
            <input
              type="number"
              value={newItemPrice}
              onChange={(e) => setNewItemPrice(e.target.value)}
              aria-label="Custom item price"
              className="tma-mono w-24 rounded-xl bg-[#F4F5F1] px-2.5 py-2 text-[11.5px] font-bold text-right outline-none"
            />
            <button
              type="button"
              onClick={addCustomItem}
              aria-label="Add custom item"
              className="w-9 h-9 rounded-xl bg-[#141517] text-[#E5BC73] flex items-center justify-center shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Discounts & Surcharges (% or Fixed Amount) */}
        <div className="rounded-[24px] bg-white border border-black/[0.06] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-[12.5px] font-extrabold">
              Надбавки и скидки (% или сумма)
            </span>
            <span className="text-[10.5px] text-black/50">Сложность · Негабарит · Срочность</span>
          </div>

          {/* Quick 1-Tap Presets */}
          <div className="flex flex-wrap gap-1.5">
            {SURCHARGE_PRESETS.map((p) => (
              <button
                key={p.label}
                type="button"
                onClick={() => addPresetAdjustment(p)}
                className={`px-2.5 py-1.5 rounded-full text-[11px] font-bold cursor-pointer transition-colors ${
                  p.direction === "surcharge"
                    ? "bg-[#E5BC73]/40 hover:bg-[#E5BC73] text-[#1E1A14]"
                    : "bg-[#A7CCC9]/45 hover:bg-[#A7CCC9] text-[#122423]"
                }`}
              >
                {p.direction === "surcharge" ? "+" : "−"} {p.label}{" "}
                <span className="tma-mono opacity-75">
                  ({p.mode === "percent" ? `${p.value}%` : `${p.value} ${currency}`})
                </span>
              </button>
            ))}
          </div>

          {/* Custom Adjustment Form */}
          <div className="rounded-2xl bg-[#F4F5F1] p-3 space-y-2">
            <div className="grid grid-cols-2 gap-1.5">
              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-full bg-white">
                <button
                  type="button"
                  onClick={() => {
                    setAdjDirection("surcharge");
                    if (adjLabel === "Скидка") setAdjLabel("Сложность");
                  }}
                  className={`py-1.5 rounded-full text-[11px] font-bold cursor-pointer ${
                    adjDirection === "surcharge"
                      ? "bg-[#141517] text-[#E5BC73]"
                      : "text-black/60"
                  }`}
                >
                  + Надбавка
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setAdjDirection("discount");
                    if (adjLabel === "Сложность") setAdjLabel("Скидка");
                  }}
                  className={`py-1.5 rounded-full text-[11px] font-bold cursor-pointer ${
                    adjDirection === "discount"
                      ? "bg-[#141517] text-[#A7CCC9]"
                      : "text-black/60"
                  }`}
                >
                  − Скидка
                </button>
              </div>

              <div className="grid grid-cols-2 gap-1 p-0.5 rounded-full bg-white">
                <button
                  type="button"
                  onClick={() => setAdjMode("percent")}
                  className={`py-1.5 rounded-full text-[11px] font-bold inline-flex items-center justify-center gap-1 cursor-pointer ${
                    adjMode === "percent"
                      ? "bg-[#141517] text-white"
                      : "text-black/60"
                  }`}
                >
                  <Percent className="w-3 h-3" /> Процент
                </button>
                <button
                  type="button"
                  onClick={() => setAdjMode("fixed")}
                  className={`py-1.5 rounded-full text-[11px] font-bold cursor-pointer ${
                    adjMode === "fixed"
                      ? "bg-[#141517] text-white"
                      : "text-black/60"
                  }`}
                >
                  Сумма ({currency})
                </button>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              <input
                value={adjLabel}
                onChange={(e) => setAdjLabel(e.target.value)}
                placeholder="Причина (Негабарит, Срочность...)"
                aria-label="Adjustment reason"
                className="flex-1 min-w-0 rounded-xl bg-white px-3 py-2 text-[11.5px] outline-none"
              />
              <input
                type="number"
                min={1}
                value={adjValue}
                onChange={(e) => setAdjValue(e.target.value)}
                aria-label="Adjustment value"
                className="tma-mono w-20 rounded-xl bg-white px-2.5 py-2 text-[12px] font-bold text-right outline-none"
              />
              <button
                type="button"
                onClick={addCustomAdjustment}
                className="px-3.5 py-2 rounded-xl bg-[#141517] text-white text-[11.5px] font-bold cursor-pointer shrink-0"
              >
                Добавить
              </button>
            </div>
          </div>

          {/* Active Adjustments List */}
          {computedAdjustments.length > 0 && (
            <div className="space-y-1.5">
              {computedAdjustments.map((a) => (
                <div
                  key={a.id}
                  className="rounded-xl bg-[#F4F5F1] px-3 py-2 flex items-center justify-between text-[11.5px]"
                >
                  <span className="font-semibold inline-flex items-center gap-1.5">
                    {a.direction === "surcharge" ? (
                      <Plus className="w-3 h-3 text-[#6B4C1B]" />
                    ) : (
                      <Minus className="w-3 h-3 text-[#1F5753]" />
                    )}
                    {a.label}
                    {a.mode === "percent" && (
                      <span className="tma-mono text-[10px] text-black/50">({a.value}%)</span>
                    )}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`tma-mono font-extrabold ${
                        a.delta >= 0 ? "text-[#6B4C1B]" : "text-[#1F5753]"
                      }`}
                    >
                      {a.delta >= 0 ? "+" : "−"}
                      {fmt(a.delta)}
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        setAdjustments((prev) => prev.filter((x) => x.id !== a.id))
                      }
                      aria-label="Remove adjustment"
                      className="text-black/40 hover:text-red-600 cursor-pointer"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 3. Payment Method & Final Receipt Summary */}
        <div className="rounded-[24px] bg-[#141517] text-white p-4 space-y-3">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[10.5px] text-white/60 inline-flex items-center gap-1 mr-1">
              <CreditCard className="w-3 h-3" /> Оплата:
            </span>
            {(["IDram / Перевод", "Наличные", "Карта / Stripe"] as const).map((pm) => (
              <button
                key={pm}
                type="button"
                onClick={() => setPaymentMethod(pm)}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer ${
                  paymentMethod === pm
                    ? "bg-[#E5BC73] text-[#1E1A14]"
                    : "bg-white/10 text-white/70"
                }`}
              >
                {pm}
              </button>
            ))}
          </div>

          <div className="flex items-end justify-between gap-2 pt-2 border-t border-white/10">
            <div>
              <div className="text-[10.5px] text-white/60">
                Подытог: {fmt(subtotal)}
              </div>
              <div className="tma-display text-[26px] font-black leading-none mt-1 text-[#E5BC73] tabular-nums">
                {fmt(total)}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => void handleCopy()}
                className="px-3 py-2.5 rounded-full bg-white/12 hover:bg-white/20 text-white text-[11.5px] font-bold inline-flex items-center gap-1 cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-[#A7CCC9]" /> : <Copy className="w-3.5 h-3.5" />}
                Копия
              </button>
              <button
                type="button"
                onClick={handleSend}
                className="px-4 py-2.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer hover:brightness-95"
              >
                <Send className="w-3.5 h-3.5" /> Отправить клиенту
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
