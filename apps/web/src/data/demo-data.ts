import type { GeoPoint } from "@onit/core";

export type NavTab =
  | "dispatch"
  | "calendar"
  | "simulator"
  | "pricing"
  | "routes"
  | "analytics"
  | "account";

export type DefectPhotoKind =
  | "frost_pipe"
  | "drain_leak"
  | "coil_dirt"
  | "pcb_burn";

export type CardTone = "ochre" | "lavender" | "slate" | "rose" | "teal";

export interface DemoJob {
  id: string;
  title: string;
  subtitle: string;
  district: string;
  address: string;
  clientName: string;
  clientPhone: string;
  technician: string;
  avatarKey: AvatarKey;
  status: "triage" | "quoted" | "booked" | "hitl";
  confidence: number;
  priceRange: string;
  durationMin: number;
  slotTime: string;
  endTime?: string;
  etaMinutes?: number;
  startCol: number;
  spanCols: number;
  highlighted?: boolean;
  location: GeoPoint;
  defectSummary: string;
  equipmentModelId?: string;
  photoKind?: DefectPhotoKind;
  cardTone?: CardTone;
  channel?: "whatsapp" | "telegram";
  voiceLangBadge?: string;
  voiceDuration?: string;
  floorLabel?: string;
}

export type AvatarKey = "aram" | "davit" | "hayk" | "suren" | "ani" | "elena";

export const AVATAR_STYLES: Record<
  AvatarKey,
  { initials: string; bg: string; fg: string; ring: string }
> = {
  aram: { initials: "AR", bg: "#1E1C1A", fg: "#E5BC73", ring: "#FFFFFF" },
  davit: { initials: "DV", bg: "#2F3A3D", fg: "#A6CBC9", ring: "#FFFFFF" },
  hayk: { initials: "HK", bg: "#2B253A", fg: "#D5CFE8", ring: "#FFFFFF" },
  suren: { initials: "SR", bg: "#462A30", fg: "#E8C5CB", ring: "#FFFFFF" },
  ani: { initials: "AN", bg: "#F4E5C7", fg: "#1E1A14", ring: "#FFFFFF" },
  elena: { initials: "EL", bg: "#DFE8E7", fg: "#162A29", ring: "#FFFFFF" },
};

export const CARD_TONE_STYLES: Record<
  CardTone,
  { bg: string; pillBg: string; pillText: string; ink: string; muted: string }
> = {
  ochre: {
    bg: "#E5BC73",
    pillBg: "#6B4C1B",
    pillText: "#FFFFFF",
    ink: "#1E1A14",
    muted: "rgba(30,26,20,0.68)",
  },
  slate: {
    bg: "#BCC6C8",
    pillBg: "#374143",
    pillText: "#FFFFFF",
    ink: "#161B1D",
    muted: "rgba(22,27,29,0.65)",
  },
  lavender: {
    bg: "#BEB7D4",
    pillBg: "#473E66",
    pillText: "#FFFFFF",
    ink: "#1B1726",
    muted: "rgba(27,23,38,0.65)",
  },
  rose: {
    bg: "#CCA2A9",
    pillBg: "#62323A",
    pillText: "#FFFFFF",
    ink: "#231417",
    muted: "rgba(35,20,23,0.65)",
  },
  teal: {
    bg: "#A7CCC9",
    pillBg: "#1F5753",
    pillText: "#FFFFFF",
    ink: "#122423",
    muted: "rgba(18,36,35,0.65)",
  },
};

export const INITIAL_JOBS: DemoJob[] = [
  {
    id: "lead_104",
    title: "Заправка фреоном + дренаж",
    subtitle: "75м · 18–22k AMD",
    district: "Kentron",
    address: "ул. Туманяна 15, кв. 8",
    clientName: "Ани С.",
    clientPhone: "+374 91 204-811",
    technician: "Aram",
    avatarKey: "ani",
    status: "booked",
    confidence: 92,
    priceRange: "18 000 – 22 000 AMD",
    durationMin: 75,
    slotTime: "11:30",
    endTime: "12:45",
    etaMinutes: 6,
    startCol: 4.5,
    spanCols: 4.3,
    highlighted: true,
    location: { lat: 40.1811, lng: 44.5136 },
    defectSummary:
      "Сплит-система 12000 BTU обмерзает на трубке и капает дренаж. Доступ с балкона есть, 2 этаж.",
    equipmentModelId: "lg_dualcool_s12eq",
    photoKind: "frost_pipe",
    cardTone: "ochre",
    channel: "whatsapp",
    voiceLangBadge: "HY → RU",
    voiceDuration: "0:14",
    floorLabel: "2 этаж · с балкона",
  },
  {
    id: "lead_107",
    title: "Плата инвертора (HITL)",
    subtitle: "Пауза · нужна оценка",
    district: "Avan",
    address: "ул. Ачаряна 14, кв. 31",
    clientName: "Давид Г.",
    clientPhone: "+374 77 318-505",
    technician: "Hayk",
    avatarKey: "hayk",
    status: "hitl",
    confidence: 55,
    priceRange: "Нужна оценка",
    durationMin: 90,
    slotTime: "HITL",
    endTime: "10 мин SLA",
    etaMinutes: 14,
    startCol: 1.9,
    spanCols: 4.1,
    location: { lat: 40.2144, lng: 44.5681 },
    defectSummary:
      "Запах гари из наружного блока Daikin, выбивает автомат при запуске компрессора. Confidence 0.55 < 0.80 — ждёт мастера.",
    equipmentModelId: "daikin_sensira_35",
    photoKind: "pcb_burn",
    cardTone: "rose",
    channel: "whatsapp",
    voiceLangBadge: "RU → HITL",
    voiceDuration: "0:11",
    floorLabel: "4 этаж · есть лифт",
  },
  {
    id: "lead_105",
    title: "Полная профилактика сплит",
    subtitle: "60м · 15–18k AMD",
    district: "Arabkir",
    address: "пр. Комитаса 42, кв. 19",
    clientName: "Елена К.",
    clientPhone: "+374 93 771-902",
    technician: "Davit",
    avatarKey: "elena",
    status: "booked",
    confidence: 96,
    priceRange: "15 000 – 18 000 AMD",
    durationMin: 60,
    slotTime: "13:15",
    endTime: "14:15",
    etaMinutes: 9,
    startCol: 1.1,
    spanCols: 3.9,
    location: { lat: 40.2038, lng: 44.5152 },
    defectSummary:
      "Загрязнение теплообменника и крыльчатки, слабый поток воздуха. Нужна мойка высокого давления перед сезоном.",
    equipmentModelId: "midea_mission_12",
    photoKind: "coil_dirt",
    cardTone: "lavender",
    channel: "telegram",
    voiceLangBadge: "RU",
    voiceDuration: "0:18",
    floorLabel: "3 этаж · балкон",
  },
  {
    id: "lead_106",
    title: "Промывка дренажа Gree",
    subtitle: "30м · 10k AMD",
    district: "Kentron",
    address: "ул. Абовяна 22, офис 4",
    clientName: "Армен М.",
    clientPhone: "+374 99 440-128",
    technician: "Aram",
    avatarKey: "aram",
    status: "quoted",
    confidence: 88,
    priceRange: "10 000 AMD",
    durationMin: 30,
    slotTime: "15:30",
    endTime: "16:00",
    etaMinutes: 5,
    startCol: 3.2,
    spanCols: 3.6,
    location: { lat: 40.1845, lng: 44.5189 },
    defectSummary:
      "Капает вода из внутреннего блока прямо на стену. Сработало правило минимального заказа 10 000 AMD.",
    equipmentModelId: "gree_bora_09",
    photoKind: "drain_leak",
    cardTone: "teal",
    channel: "whatsapp",
    voiceLangBadge: "HY → RU",
    voiceDuration: "0:09",
    floorLabel: "1 этаж · офис",
  },
];

export const CALENDAR_DAYS_PREVIEW: Array<{
  dayName: string;
  dayNum: string;
  monthShort: string;
  tone: CardTone;
  slots: Array<{ hour: string; jobId?: string; label?: string }>;
}> = [
  {
    dayName: "Вторник",
    dayNum: "14",
    monthShort: "АПР",
    tone: "lavender",
    slots: [
      { hour: "11:30", jobId: "lead_104", label: "Фреон + дренаж" },
      { hour: "13:15", jobId: "lead_105", label: "ТО Сплит" },
      { hour: "15:30", jobId: "lead_106", label: "Дренаж Gree" },
    ],
  },
  {
    dayName: "Среда",
    dayNum: "15",
    monthShort: "АПР",
    tone: "rose",
    slots: [
      { hour: "10:00", jobId: "lead_107", label: "Daikin HITL" },
      { hour: "12:30" },
      { hour: "15:00", label: "ТО Samsung" },
    ],
  },
  {
    dayName: "Четверг",
    dayNum: "16",
    monthShort: "АПР",
    tone: "teal",
    slots: [
      { hour: "09:30" },
      { hour: "11:00", label: "Заправка R32" },
      { hour: "14:00" },
    ],
  },
  {
    dayName: "Пятница",
    dayNum: "17",
    monthShort: "АПР",
    tone: "ochre",
    slots: [
      { hour: "10:00", label: "Плата Avan" },
      { hour: "13:00" },
      { hour: "16:00" },
    ],
  },
];

export const VOICE_CLIPS = [
  {
    id: "v1",
    langBadge: "HY → RU",
    duration: "0:14",
    client: "Ani · Kentron",
    original: "«Բարև Ձեզ, օդորակիչից ջուր է կաթում ու չի սառեցնում, պատշգամբից մուտք կա»",
    masterBrief: "Заправка фреоном + чистка дренажа · 18 000 – 22 000 AMD · Доступ с балкона",
    confidence: 0.93,
  },
  {
    id: "v2",
    langBadge: "ES → EN",
    duration: "0:19",
    client: "Carlos · Valencia Pilot",
    original: "«Hola, el aire hace ruido fuerte y no enfría, piso 4 sin ascensor, urgente hoy»",
    masterBrief: "AC Freon Refill + High Floor + Urgent · 115 – 145 EUR · Floor 4 no elevator",
    confidence: 0.89,
  },
  {
    id: "v3",
    langBadge: "RU → HITL",
    duration: "0:11",
    client: "Davit · Avan",
    original: "«Пошёл запах гари из наружного блока, выбивает автомат при включении»",
    masterBrief: "Эскалация мастеру (confidence 0.55): возможен пробой платы Daikin",
    confidence: 0.55,
  },
];

export const TECHNICIAN_CALENDAR: Record<string, number[]> = {
  All: [2, 5, 6, 7, 11, 12, 14, 18, 21, 22, 26, 27, 29, 30],
  Aram: [2, 5, 6, 11, 14, 18, 21, 26, 29],
  Davit: [5, 7, 12, 14, 21, 22, 27, 30],
  Hayk: [2, 6, 11, 18, 22, 26, 29],
  Suren: [7, 12, 14, 21, 27, 30],
};

export const MONTHLY_STATS = [
  { month: "Jan", height: 42, curve: 32 },
  { month: "Feb", height: 68, curve: 46 },
  { month: "Mar", height: 50, curve: 35 },
  { month: "Apr", height: 69, curve: 60 },
  { month: "May", height: 84, curve: 70 },
  { month: "Jun", height: 34, curve: 68, dashed: true },
  { month: "Jul", height: 74, curve: 42 },
];

export const YEREVAN_DISTRICTS: Array<{
  name: string;
  label: string;
  point: GeoPoint;
}> = [
  { name: "kentron", label: "Kentron (ул. Туманяна 15)", point: { lat: 40.184, lng: 44.516 } },
  { name: "arabkir", label: "Arabkir (пр. Комитаса 42)", point: { lat: 40.2038, lng: 44.5152 } },
  { name: "avan", label: "Avan (ул. Ачаряна 14)", point: { lat: 40.2144, lng: 44.5681 } },
  { name: "erebuni", label: "Erebuni (ул. Эребуни 20)", point: { lat: 40.1352, lng: 44.5191 } },
];
