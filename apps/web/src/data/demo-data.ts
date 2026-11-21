import type { GeoPoint } from "@onit/core";

export type NavTab =
  | "dispatch"
  | "simulator"
  | "pricing"
  | "routes"
  | "analytics";

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
  startCol: number; // 0..9 across timeline
  spanCols: number; // width in columns
  highlighted?: boolean;
  location: GeoPoint;
  defectSummary: string;
}

export type AvatarKey = "aram" | "davit" | "hayk" | "suren" | "ani" | "elena";

export const AVATAR_STYLES: Record<
  AvatarKey,
  { initials: string; bg: string; fg: string; ring: string }
> = {
  aram: { initials: "AR", bg: "#1F2937", fg: "#D1F366", ring: "#FFFFFF" },
  davit: { initials: "DV", bg: "#374151", fg: "#85E6DC", ring: "#FFFFFF" },
  hayk: { initials: "HK", bg: "#0F172A", fg: "#F8FAFC", ring: "#FFFFFF" },
  suren: { initials: "SR", bg: "#3F4E4F", fg: "#ECF9B2", ring: "#FFFFFF" },
  ani: { initials: "AN", bg: "#E0F2FE", fg: "#0F172A", ring: "#FFFFFF" },
  elena: { initials: "EL", bg: "#FEF3C7", fg: "#1F2937", ring: "#FFFFFF" },
};

export const INITIAL_JOBS: DemoJob[] = [
  {
    id: "lead_104",
    title: "Freon + Drain Clean",
    subtitle: "75m · 18k–22k AMD",
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
    startCol: 4.5,
    spanCols: 4.3,
    location: { lat: 40.1811, lng: 44.5136 },
    defectSummary: "Сплит-система 12000 BTU плохо холодит и капает дренаж. Доступ с балкона есть, 2 этаж.",
  },
  {
    id: "lead_105",
    title: "Split Maintenance",
    subtitle: "60m · 15k–18k AMD",
    district: "Arabkir",
    address: "пр. Комитаса 42",
    clientName: "Елена К.",
    clientPhone: "+374 93 771-902",
    technician: "Davit",
    avatarKey: "elena",
    status: "booked",
    confidence: 96,
    priceRange: "15 000 – 18 000 AMD",
    durationMin: 60,
    slotTime: "13:00",
    startCol: 1.1,
    spanCols: 3.9,
    highlighted: true,
    location: { lat: 40.2038, lng: 44.5152 },
    defectSummary: "Плановая чистка и мойка внутреннего и наружного блоков перед сезоном.",
  },
  {
    id: "lead_106",
    title: "Drainage Flush",
    subtitle: "30m · 10k AMD",
    district: "Kentron",
    address: "ул. Абовяна 22",
    clientName: "Армен М.",
    clientPhone: "+374 99 440-128",
    technician: "Aram",
    avatarKey: "aram",
    status: "quoted",
    confidence: 88,
    priceRange: "10 000 AMD",
    durationMin: 30,
    slotTime: "15:30",
    startCol: 3.2,
    spanCols: 3.6,
    location: { lat: 40.1845, lng: 44.5189 },
    defectSummary: "Забит дренаж внутреннего блока LG, сработало правило минимального заказа 10 000 AMD.",
  },
  {
    id: "lead_107",
    title: "Inverter PCB (HITL)",
    subtitle: "Paused · Master check",
    district: "Avan",
    address: "ул. Ачаряна 14",
    clientName: "Давид Г.",
    clientPhone: "+374 77 318-505",
    technician: "Hayk",
    avatarKey: "hayk",
    status: "hitl",
    confidence: 55,
    priceRange: "Ожидает мастера",
    durationMin: 90,
    slotTime: "HITL",
    startCol: 1.9,
    spanCols: 4.1,
    location: { lat: 40.2144, lng: 44.5681 },
    defectSummary: "Запах гари из наружного блока, confidence 0.55 < 0.80 — автоответ на паузе, ждём голос мастера.",
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
    masterBrief: "Эскалация мастеру (confidence 0.54): возможен пробой платы/компрессора",
    confidence: 0.54,
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
