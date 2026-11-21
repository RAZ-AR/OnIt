import { describe, expect, it, vi } from "vitest";
import {
  findOptimalRouteSlots,
  formatSlotsOffer,
  formatSlotTime,
  HaversineRoutingProvider,
  NominatimGeocoder,
  OsrmRoutingProvider,
  type CalendarBooking,
} from "../src/index.js";

// Real Yerevan coordinates
const KENTRON_TUMANYAN = { lat: 40.1811, lng: 44.5136 };
const KENTRON_NEARBY = { lat: 40.1845, lng: 44.5162 }; // ~400m from Tumanyan
const AVAN_NORTH = { lat: 40.2144, lng: 44.5681 }; // ~6km northeast
const EREBUNI_SOUTH = { lat: 40.1352, lng: 44.5191 }; // ~5km south

describe("Geo-Aware Route Optimization & OSRM", () => {
  it("picks slots near an existing Kentron job over far-away morning/evening slots", async () => {
    const bookings: CalendarBooking[] = [
      {
        id: "b1",
        technicianId: "tech-1",
        // 10:00–11:00 Yerevan (UTC+4 -> 06:00–07:00Z) in Kentron
        startIso: "2026-05-10T06:00:00.000Z",
        endIso: "2026-05-10T07:00:00.000Z",
        location: KENTRON_TUMANYAN,
      },
      {
        id: "b2",
        technicianId: "tech-1",
        // 15:00–16:00 Yerevan (11:00–12:00Z) in Avan
        startIso: "2026-05-10T11:00:00.000Z",
        endIso: "2026-05-10T12:00:00.000Z",
        location: AVAN_NORTH,
      },
    ];

    const slots = await findOptimalRouteSlots(
      {
        technicianId: "tech-1",
        homeBase: EREBUNI_SOUTH,
        targetLocation: KENTRON_NEARBY,
        jobDurationMinutes: 60,
        workingWindow: {
          dateIso: "2026-05-10",
          startHour: 9,
          endHour: 19,
          tzOffsetMinutes: 240,
        },
        existingBookings: bookings,
        maxResults: 2,
      },
      new HaversineRoutingProvider()
    );

    expect(slots).toHaveLength(2);
    // Best slot should be right after the Kentron job (11:30 Yerevan -> ~6 min drive)
    expect(formatSlotTime(slots[0]!.startIso, 240)).toBe("11:30");
    expect(slots[0]!.travelMinutesFromPrev).toBeLessThanOrEqual(8);

    const offer = formatSlotsOffer(slots, "ru", 240);
    expect(offer).toContain("11:30");
  });

  it("queries OSRM and falls back gracefully to Haversine when OSRM is unreachable", async () => {
    const okFetch = vi.fn(async () =>
      new Response(
        JSON.stringify({ code: "Ok", routes: [{ duration: 720 }] }),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const osrm = new OsrmRoutingProvider({
      baseUrl: "http://osrm.local:5000",
      fetchImpl: okFetch as unknown as typeof fetch,
    });
    expect(await osrm.travelMinutes(KENTRON_TUMANYAN, AVAN_NORTH)).toBe(12);

    const failingOsrm = new OsrmRoutingProvider({
      baseUrl: "http://osrm.local:5000",
      fetchImpl: (async () => {
        throw new Error("ECONNREFUSED");
      }) as unknown as typeof fetch,
      fallbackToHaversine: true,
    });
    const fallbackMins = await failingOsrm.travelMinutes(
      KENTRON_TUMANYAN,
      AVAN_NORTH
    );
    expect(fallbackMins).toBeGreaterThanOrEqual(10);
  });

  it("geocodes Yerevan street address via Nominatim", async () => {
    const mockFetch = vi.fn(async () =>
      new Response(
        JSON.stringify([
          {
            lat: "40.1811",
            lon: "44.5136",
            display_name: "Tumanyan Street, Kentron, Yerevan, Armenia",
            importance: 0.62,
          },
        ]),
        { status: 200, headers: { "content-type": "application/json" } }
      )
    );
    const geo = new NominatimGeocoder({
      fetchImpl: mockFetch as unknown as typeof fetch,
    });
    const res = await geo.geocode("Tumanyan 15, Yerevan", "am");
    expect(res?.point.lat).toBeCloseTo(40.1811, 3);
    expect(res?.confidence).toBe("high");
  });
});
