"use client";

import React, { useMemo, useState } from "react";
import {
  calculateQuote,
  EQUIPMENT_MODELS,
  searchEquipmentModels,
  searchStreets,
  YEREVAN_STREETS,
  type EquipmentModelRef,
  type PriceMatrix,
  type StreetRef,
} from "@onit/core";
import { Camera, Check, MapPin, Search, Sparkles, Wrench, X } from "lucide-react";
import type { CardTone, DefectPhotoKind, DemoJob } from "../data/demo-data";

export function NewOrderSheet({
  matrix,
  defaultSlot = "16:30",
  onClose,
  onCreate,
}: {
  matrix: PriceMatrix;
  defaultSlot?: string;
  onClose: () => void;
  onCreate: (job: DemoJob) => void;
}) {
  const [clientName, setClientName] = useState("Тигран В.");
  const [clientPhone, setClientPhone] = useState("+374 91 640-210");
  const [streetQuery, setStreetQuery] = useState("");
  const [selectedStreet, setSelectedStreet] = useState<StreetRef>(YEREVAN_STREETS[0]!);
  const [houseNum, setHouseNum] = useState("18, кв. 12");
  const [modelQuery, setModelQuery] = useState("");
  const [selectedModel, setSelectedModel] = useState<EquipmentModelRef>(EQUIPMENT_MODELS[0]!);
  const [selectedService, setSelectedService] = useState(
    matrix.services[0]?.code ?? "ac_freon_refill"
  );
  const [photoKind, setPhotoKind] = useState<DefectPhotoKind>("frost_pipe");
  const [slotTime, setSlotTime] = useState(defaultSlot);
  const [floor, setFloor] = useState(2);
  const [outerAccess, setOuterAccess] = useState(true);
  const [urgent, setUrgent] = useState(false);

  const streetMatches = useMemo(() => searchStreets(streetQuery, 5), [streetQuery]);
  const modelMatches = useMemo(() => searchEquipmentModels(modelQuery, 4), [modelQuery]);

  const liveQuote = useMemo(
    () =>
      calculateQuote(matrix, {
        detectedLanguage: "ru",
        summaryForMaster: `${selectedModel.brand} ${selectedModel.model}`,
        requiredTools: selectedModel.requiredTools,
        services: [{ code: selectedService, quantity: 1 }],
        attributes: {
          floor,
          outer_unit_accessible: outerAccess,
          urgent,
        },
        confidence: 0.94,
        outOfCatalog: false,
      }),
    [matrix, selectedModel, selectedService, floor, outerAccess, urgent]
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const serviceObj = matrix.services.find((s) => s.code === selectedService);
    const fmt = (n: number) => n.toLocaleString("en-US").replace(/,/g, " ");
    const priceRange =
      liveQuote.status === "ready"
        ? liveQuote.totalMin === liveQuote.totalMax
          ? `${fmt(liveQuote.totalMin)} ${liveQuote.currency}`
          : `${fmt(liveQuote.totalMin)} – ${fmt(liveQuote.totalMax)} ${liveQuote.currency}`
        : "Ожидает оценки";

    const durationMin =
      liveQuote.status === "ready"
        ? liveQuote.estimatedMinutes
        : serviceObj?.estimatedMinutes ?? 45;

    const tones: CardTone[] = ["ochre", "lavender", "teal", "slate"];
    const tone = urgent ? "rose" : tones[Math.floor(Math.random() * tones.length)]!;

    onCreate({
      id: `ord_${Date.now().toString().slice(-3)}`,
      title: serviceObj?.name.slice(0, 28) ?? "Новый выезд",
      subtitle: `${durationMin}м · ${priceRange}`,
      district: selectedStreet.district,
      address: `${selectedStreet.nameRu} ${houseNum}`,
      clientName: clientName.trim() || "Новый клиент",
      clientPhone: clientPhone.trim() || "+374 91 000-000",
      technician: "Aram",
      avatarKey: "ani",
      status: "booked",
      confidence: 94,
      priceRange,
      durationMin,
      slotTime,
      endTime: "по графику",
      etaMinutes: 8,
      startCol: 2.5,
      spanCols: 4.0,
      location: selectedStreet.point,
      defectSummary: `${selectedModel.brand} ${selectedModel.model} (${selectedModel.capacityLabel}, ${selectedModel.refrigerant ?? ""}). ${floor} этаж, ${outerAccess ? "доступ с балкона" : "сложный доступ"}.`,
      equipmentModelId: selectedModel.id,
      photoKind,
      cardTone: tone,
      channel: "telegram",
      voiceLangBadge: "RU",
      floorLabel: `${floor} этаж · ${outerAccess ? "балкон" : "окно"}`,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/45 backdrop-blur-[3px] flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[480px] max-h-[90vh] overflow-y-auto thin-scroll rounded-t-[32px] sm:rounded-[32px] bg-[#F7F7F4] text-[#141517] p-5 space-y-4 shadow-2xl border border-black/10"
      >
        <div className="w-10 h-1 rounded-full bg-black/15 mx-auto sm:hidden" />

        <div className="flex items-start justify-between gap-2">
          <div>
            <span className="text-[10.5px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#E5BC73] text-[#1E1A14]">
              Справочники Еревана + Модели
            </span>
            <h3 className="text-[20px] font-extrabold tracking-tight mt-1">
              Создать заказ с авто-сметой
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close new order sheet"
            className="w-8 h-8 rounded-full bg-black/8 flex items-center justify-center cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* 1. Yerevan Streets Reference Picker */}
        <div className="rounded-[22px] bg-white p-3.5 border border-black/[0.06] space-y-2">
          <div className="text-[11.5px] font-bold flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5" /> Улица Еревана ({YEREVAN_STREETS.length} в базе)
          </div>
          <div className="flex items-center gap-2 rounded-xl bg-[#F2F3EF] px-3 py-2">
            <Search className="w-3.5 h-3.5 text-black/45 shrink-0" />
            <input
              value={streetQuery}
              onChange={(e) => setStreetQuery(e.target.value)}
              placeholder="Поиск: Туманяна, Կոմիտաս, Arabkir, Мегамолл..."
              aria-label="Search Yerevan street"
              className="w-full bg-transparent text-[12px] outline-none"
            />
          </div>
          <div className="flex flex-wrap gap-1.5">
            {streetMatches.map((st) => {
              const active = st.id === selectedStreet.id;
              return (
                <button
                  key={st.id}
                  type="button"
                  onClick={() => setSelectedStreet(st)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-semibold cursor-pointer transition-colors ${
                    active
                      ? "bg-[#141517] text-white"
                      : "bg-[#F2F3EF] text-[#141517] hover:bg-[#E5BC73]/50"
                  }`}
                >
                  {active ? "✓ " : ""}
                  {st.nameRu} · {st.district}
                </button>
              );
            })}
          </div>
          <div className="grid grid-cols-2 gap-2 pt-1">
            <input
              value={houseNum}
              onChange={(e) => setHouseNum(e.target.value)}
              placeholder="Дом, кв."
              aria-label="House and apartment"
              className="rounded-xl bg-[#F2F3EF] px-3 py-2 text-[12px] outline-none"
            />
            <input
              value={slotTime}
              onChange={(e) => setSlotTime(e.target.value)}
              placeholder="Время (16:30)"
              aria-label="Visit time slot"
              className="rounded-xl bg-[#F2F3EF] px-3 py-2 text-[12px] font-bold outline-none"
            />
          </div>
        </div>

        {/* 2. Equipment Model Catalog Picker */}
        <div className="rounded-[22px] bg-white p-3.5 border border-black/[0.06] space-y-2">
          <div className="text-[11.5px] font-bold flex items-center gap-1.5">
            <Wrench className="w-3.5 h-3.5" /> Модель прибора ({EQUIPMENT_MODELS.length} популярных моделей)
          </div>
          <input
            value={modelQuery}
            onChange={(e) => setModelQuery(e.target.value)}
            placeholder="LG, Daikin, Midea, R32, R410A..."
            aria-label="Search equipment model"
            className="w-full rounded-xl bg-[#F2F3EF] px-3 py-2 text-[12px] outline-none"
          />
          <div className="grid grid-cols-2 gap-1.5">
            {modelMatches.map((m) => {
              const active = m.id === selectedModel.id;
              return (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setSelectedModel(m)}
                  className={`p-2.5 rounded-2xl text-left text-[11px] border transition-all cursor-pointer ${
                    active
                      ? "bg-[#141517] text-white border-[#141517]"
                      : "bg-[#F7F7F4] text-[#141517] border-black/[0.06] hover:border-black/25"
                  }`}
                >
                  <div className="font-bold truncate">
                    {m.brand} {m.model}
                  </div>
                  <div className="text-[10px] opacity-70 mt-0.5">
                    {m.capacityLabel} · {m.refrigerant ?? "Split"}
                  </div>
                </button>
              );
            })}
          </div>
          <div className="text-[10.5px] text-black/60">
            Инструмент: {selectedModel.requiredTools.join(", ")}
          </div>
        </div>

        {/* 3. Service, Modifiers & Photo */}
        <div className="rounded-[22px] bg-white p-3.5 border border-black/[0.06] space-y-2.5">
          <div className="grid grid-cols-2 gap-2">
            <input
              value={clientName}
              onChange={(e) => setClientName(e.target.value)}
              placeholder="Имя клиента"
              aria-label="Client name"
              className="rounded-xl bg-[#F2F3EF] px-3 py-2 text-[12px] outline-none"
            />
            <input
              value={clientPhone}
              onChange={(e) => setClientPhone(e.target.value)}
              placeholder="Телефон"
              aria-label="Client phone"
              className="rounded-xl bg-[#F2F3EF] px-3 py-2 text-[12px] outline-none"
            />
          </div>

          <select
            value={selectedService}
            onChange={(e) => setSelectedService(e.target.value)}
            aria-label="Select service"
            className="w-full rounded-xl bg-[#F2F3EF] px-3 py-2 text-[12px] font-semibold outline-none"
          >
            {matrix.services.map((s) => (
              <option key={s.code} value={s.code}>
                {s.name} ({s.priceMin}–{s.priceMax} {matrix.currency})
              </option>
            ))}
          </select>

          <div className="flex flex-wrap gap-1.5 text-[11px]">
            <button
              type="button"
              onClick={() => setFloor((f) => (f >= 5 ? 1 : f + 1))}
              className="px-2.5 py-1 rounded-full bg-[#F2F3EF] font-semibold cursor-pointer"
            >
              Этаж: {floor}
            </button>
            <button
              type="button"
              onClick={() => setOuterAccess((v) => !v)}
              className={`px-2.5 py-1 rounded-full font-semibold cursor-pointer ${
                outerAccess ? "bg-[#A7CCC9] text-[#122423]" : "bg-[#CCA2A9] text-[#231417]"
              }`}
            >
              {outerAccess ? "✓ Доступ с балкона" : "⚠ Сложный доступ"}
            </button>
            <button
              type="button"
              onClick={() => setUrgent((v) => !v)}
              className={`px-2.5 py-1 rounded-full font-semibold cursor-pointer ${
                urgent ? "bg-[#E5BC73] text-[#1E1A14]" : "bg-[#F2F3EF]"
              }`}
            >
              {urgent ? "⚡ Срочно (+20%)" : "Обычный выезд"}
            </button>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap pt-0.5">
            <span className="text-[10.5px] font-bold text-black/55 inline-flex items-center gap-1">
              <Camera className="w-3 h-3" /> Фото:
            </span>
            {(
              [
                { id: "frost_pipe", label: "Обмерзание" },
                { id: "drain_leak", label: "Течь" },
                { id: "coil_dirt", label: "Грязь" },
                { id: "pcb_burn", label: "Плата" },
              ] as const
            ).map((ph) => (
              <button
                key={ph.id}
                type="button"
                onClick={() => setPhotoKind(ph.id)}
                className={`px-2.5 py-1 rounded-full text-[10.5px] font-bold cursor-pointer ${
                  photoKind === ph.id
                    ? "bg-[#141517] text-white"
                    : "bg-[#F2F3EF] text-[#141517]"
                }`}
              >
                {ph.label}
              </button>
            ))}
          </div>
        </div>

        {/* Deterministic Live Quote Preview + Submit */}
        <div className="rounded-[22px] bg-[#141517] text-white p-4 flex items-center justify-between gap-3">
          <div>
            <div className="text-[10px] uppercase tracking-wider text-[#E5BC73] font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Авто-смета Quote Engine
            </div>
            <div className="text-[20px] font-extrabold tabular-nums mt-0.5">
              {liveQuote.status === "ready"
                ? `${liveQuote.totalMin.toLocaleString("ru-RU")} – ${liveQuote.totalMax.toLocaleString("ru-RU")} ${liveQuote.currency}`
                : "Нужно уточнение"}
            </div>
          </div>
          <button
            type="submit"
            className="px-4 py-2.5 rounded-full bg-[#E5BC73] text-[#1E1A14] text-[12px] font-extrabold inline-flex items-center gap-1.5 cursor-pointer hover:brightness-95 shrink-0"
          >
            <Check className="w-4 h-4" /> Создать
          </button>
        </div>
      </form>
    </div>
  );
}
