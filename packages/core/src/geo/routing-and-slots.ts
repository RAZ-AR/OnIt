import type { GeoPoint, RouteSlot } from "../schemas/channel.js";
import type { SupportedLanguage } from "../schemas/triage.js";

export interface GeocodeResult {
  point: GeoPoint;
  displayName: string;
  confidence: "high" | "low";
}

export interface GeocoderProvider {
  geocode(address: string, countryCode?: string): Promise<GeocodeResult | null>;
}

export interface RoutingProvider {
  travelMinutes(from: GeoPoint, to: GeoPoint): Promise<number>;
}

export interface CalendarBooking {
  id: string;
  technicianId: string;
  startIso: string;
  endIso: string;
  location: GeoPoint;
  title?: string;
}

export interface WorkingWindow {
  dateIso: string; // YYYY-MM-DD
  startHour: number; // e.g. 9
  endHour: number; // e.g. 19
  tzOffsetMinutes?: number; // e.g. 240 for UTC+4 (Yerevan)
}

export interface SlotOptimizationInput {
  technicianId: string;
  homeBase: GeoPoint;
  targetLocation: GeoPoint;
  jobDurationMinutes: number;
  workingWindow: WorkingWindow;
  existingBookings: CalendarBooking[];
  bufferMinutes?: number;
  stepMinutes?: number;
  maxResults?: number;
}

export function haversineKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(h)));
}

/**
 * Fallback urban speed estimator (~24 km/h avg in Yerevan traffic + 5 min parking).
 */
export function estimateUrbanTravelMinutes(from: GeoPoint, to: GeoPoint): number {
  const km = haversineKm(from, to);
  if (km < 0.15) return 5;
  return Math.max(5, Math.round((km / 24) * 60 + 5));
}

export class NominatimGeocoder implements GeocoderProvider {
  private readonly baseUrl: string;
  private readonly userAgent: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config?: {
    baseUrl?: string;
    userAgent?: string;
    fetchImpl?: typeof fetch;
  }) {
    this.baseUrl = (
      config?.baseUrl ?? "https://nominatim.openstreetmap.org"
    ).replace(/\/+$/, "");
    this.userAgent = config?.userAgent ?? "OnIt-Dispatcher/0.1 (im-onit.com)";
    this.fetchImpl = config?.fetchImpl ?? fetch;
  }

  async geocode(
    address: string,
    countryCode = "am"
  ): Promise<GeocodeResult | null> {
    const url = new URL(`${this.baseUrl}/search`);
    url.searchParams.set("q", address);
    url.searchParams.set("format", "json");
    url.searchParams.set("limit", "1");
    if (countryCode) {
      url.searchParams.set("countrycodes", countryCode);
    }

    const res = await this.fetchImpl(url.toString(), {
      headers: { "User-Agent": this.userAgent, Accept: "application/json" },
    });
    if (!res.ok) return null;

    const rows = (await res.json()) as Array<{
      lat?: string;
      lon?: string;
      display_name?: string;
      importance?: number;
    }>;
    const first = rows[0];
    if (!first?.lat || !first?.lon) return null;

    return {
      point: { lat: Number(first.lat), lng: Number(first.lon) },
      displayName: first.display_name ?? address,
      confidence: (first.importance ?? 0) >= 0.35 ? "high" : "low",
    };
  }
}

export class OsrmRoutingProvider implements RoutingProvider {
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly fallbackToHaversine: boolean;

  constructor(config?: {
    baseUrl?: string;
    fetchImpl?: typeof fetch;
    fallbackToHaversine?: boolean;
  }) {
    this.baseUrl = (config?.baseUrl ?? "http://127.0.0.1:5000").replace(
      /\/+$/,
      ""
    );
    this.fetchImpl = config?.fetchImpl ?? fetch;
    this.fallbackToHaversine = config?.fallbackToHaversine ?? true;
  }

  async travelMinutes(from: GeoPoint, to: GeoPoint): Promise<number> {
    const coords = `${from.lng},${from.lat};${to.lng},${to.lat}`;
    const url = `${this.baseUrl}/route/v1/driving/${coords}?overview=false`;

    try {
      const res = await this.fetchImpl(url);
      if (!res.ok) {
        if (this.fallbackToHaversine) {
          return estimateUrbanTravelMinutes(from, to);
        }
        throw new Error(`OSRM failed (${res.status})`);
      }
      const data = (await res.json()) as {
        code?: string;
        routes?: Array<{ duration?: number }>;
      };
      const seconds = data.routes?.[0]?.duration;
      if (data.code !== "Ok" || typeof seconds !== "number") {
        if (this.fallbackToHaversine) {
          return estimateUrbanTravelMinutes(from, to);
        }
        throw new Error(`OSRM returned code=${data.code ?? "unknown"}`);
      }
      return Math.max(1, Math.round(seconds / 60));
    } catch (err) {
      if (this.fallbackToHaversine) {
        return estimateUrbanTravelMinutes(from, to);
      }
      throw err;
    }
  }
}

export class HaversineRoutingProvider implements RoutingProvider {
  async travelMinutes(from: GeoPoint, to: GeoPoint): Promise<number> {
    return estimateUrbanTravelMinutes(from, to);
  }
}

function buildUtcMsFromLocal(
  dateIso: string,
  hour: number,
  minute: number,
  tzOffsetMinutes: number
): number {
  const [y, m, d] = dateIso.split("-").map(Number);
  const utcWall = Date.UTC(y ?? 2025, (m ?? 1) - 1, d ?? 1, hour, minute, 0, 0);
  return utcWall - tzOffsetMinutes * 60_000;
}

/**
 * Geo-Aware Route Optimizer:
 * Finds open calendar slots and ranks them by lowest added travel detour
 * between previous and next jobs so the technician doesn't zig-zag across the city.
 */
export async function findOptimalRouteSlots(
  input: SlotOptimizationInput,
  router: RoutingProvider
): Promise<RouteSlot[]> {
  const tzOffset = input.workingWindow.tzOffsetMinutes ?? 240; // Yerevan UTC+4 default
  const bufferMs = (input.bufferMinutes ?? 10) * 60_000;
  const stepMs = (input.stepMinutes ?? 30) * 60_000;
  const durationMs = input.jobDurationMinutes * 60_000;
  const maxResults = input.maxResults ?? 2;

  const dayStartMs = buildUtcMsFromLocal(
    input.workingWindow.dateIso,
    input.workingWindow.startHour,
    0,
    tzOffset
  );
  const dayEndMs = buildUtcMsFromLocal(
    input.workingWindow.dateIso,
    input.workingWindow.endHour,
    0,
    tzOffset
  );

  const dayBookings = input.existingBookings
    .filter((b) => b.technicianId === input.technicianId)
    .map((b) => ({
      ...b,
      startMs: Date.parse(b.startIso),
      endMs: Date.parse(b.endIso),
    }))
    .filter((b) => b.endMs > dayStartMs && b.startMs < dayEndMs)
    .sort((a, b) => a.startMs - b.startMs);

  const scored: Array<{
    slot: RouteSlot;
    detourMinutes: number;
    startMs: number;
  }> = [];

  for (
    let candStart = dayStartMs;
    candStart + durationMs <= dayEndMs;
    candStart += stepMs
  ) {
    const candEnd = candStart + durationMs;

    const overlaps = dayBookings.some(
      (b) => candStart < b.endMs && candEnd > b.startMs
    );
    if (overlaps) continue;

    const prev = [...dayBookings]
      .reverse()
      .find((b) => b.endMs <= candStart);
    const next = dayBookings.find((b) => b.startMs >= candEnd);

    const prevPoint = prev?.location ?? input.homeBase;
    const travelFromPrev = await router.travelMinutes(
      prevPoint,
      input.targetLocation
    );

    if (prev && prev.endMs + travelFromPrev * 60_000 + bufferMs > candStart) {
      continue;
    }

    let addedDetour = travelFromPrev;
    if (next) {
      const travelToNext = await router.travelMinutes(
        input.targetLocation,
        next.location
      );
      if (candEnd + travelToNext * 60_000 + bufferMs > next.startMs) {
        continue;
      }
      const baseline = await router.travelMinutes(prevPoint, next.location);
      addedDetour = Math.max(0, travelFromPrev + travelToNext - baseline);
    }

    scored.push({
      slot: {
        startIso: new Date(candStart).toISOString(),
        endIso: new Date(candEnd).toISOString(),
        travelMinutesFromPrev: travelFromPrev,
        technicianId: input.technicianId,
      },
      detourMinutes: addedDetour,
      startMs: candStart,
    });
  }

  scored.sort(
    (a, b) => a.detourMinutes - b.detourMinutes || a.startMs - b.startMs
  );

  // Pick diverse slots (at least 90 minutes apart so client gets real choices)
  const picked: RouteSlot[] = [];
  for (const cand of scored) {
    if (picked.length >= maxResults) break;
    const tooClose = picked.some(
      (p) => Math.abs(Date.parse(p.startIso) - cand.startMs) < 90 * 60_000
    );
    if (!tooClose) {
      picked.push(cand.slot);
    }
  }

  return picked;
}

export function formatSlotTime(iso: string, tzOffsetMinutes = 240): string {
  const local = new Date(Date.parse(iso) + tzOffsetMinutes * 60_000);
  const hh = String(local.getUTCHours()).padStart(2, "0");
  const mm = String(local.getUTCMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

export function formatSlotsOffer(
  slots: RouteSlot[],
  lang: SupportedLanguage,
  tzOffsetMinutes = 240
): string {
  if (slots.length === 0) {
    return lang === "en"
      ? "No open windows left for that day — would the next day work?"
      : lang === "es"
        ? "No quedan huecos ese día, ¿te sirve el día siguiente?"
        : lang === "hy"
          ? "Այդ օրը ազատ ժամ չկա, հաջորդ օրը հարմա՞ր է։"
          : "На этот день свободных окон не осталось — подберём на следующий день?";
  }

  const times = slots.map((s) => formatSlotTime(s.startIso, tzOffsetMinutes));
  const joined = times.join(" / ");
  switch (lang) {
    case "en":
      return `Our technician is already in your area — available slots: ${joined}. Which time should I book?`;
    case "es":
      return `Nuestro técnico estará en tu zona — horarios disponibles: ${joined}. ¿Cuál reservamos?`;
    case "hy":
      return `Մեր վարպետը կլինի Ձեր տարածքում՝ ազատ ժամեր՝ ${joined}։ Ո՞ր ժամն ամրագրենք։`;
    case "ru":
    default:
      return `Мастер работает в вашем районе — есть окна в ${joined}. Какое время закрепить?`;
  }
}
