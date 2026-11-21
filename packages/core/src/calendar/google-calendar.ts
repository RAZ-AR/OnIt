import type { CalendarBooking } from "../geo/routing-and-slots.js";
import type { GeoPoint } from "../schemas/channel.js";

export interface CreateBookingInput {
  calendarId: string;
  technicianId: string;
  title: string;
  description: string;
  address?: string;
  location: GeoPoint;
  startIso: string;
  endIso: string;
}

export interface CalendarProvider {
  listBookings(params: {
    calendarId: string;
    technicianId: string;
    timeMinIso: string;
    timeMaxIso: string;
    fallbackLocation: GeoPoint;
  }): Promise<CalendarBooking[]>;
  createBooking(input: CreateBookingInput): Promise<CalendarBooking>;
}

export class InMemoryCalendarProvider implements CalendarProvider {
  private readonly bookings: CalendarBooking[] = [];

  constructor(initial: CalendarBooking[] = []) {
    this.bookings = [...initial];
  }

  async listBookings(params: {
    calendarId: string;
    technicianId: string;
    timeMinIso: string;
    timeMaxIso: string;
    fallbackLocation: GeoPoint;
  }): Promise<CalendarBooking[]> {
    const minMs = Date.parse(params.timeMinIso);
    const maxMs = Date.parse(params.timeMaxIso);
    return this.bookings.filter(
      (b) =>
        b.technicianId === params.technicianId &&
        Date.parse(b.endIso) > minMs &&
        Date.parse(b.startIso) < maxMs
    );
  }

  async createBooking(input: CreateBookingInput): Promise<CalendarBooking> {
    const booking: CalendarBooking = {
      id: `bk_${this.bookings.length + 1}`,
      technicianId: input.technicianId,
      startIso: input.startIso,
      endIso: input.endIso,
      location: input.location,
      title: input.title,
    };
    this.bookings.push(booking);
    return booking;
  }
}

export class GoogleCalendarProvider implements CalendarProvider {
  private readonly accessToken: string;
  private readonly apiBase: string;
  private readonly fetchImpl: typeof fetch;

  constructor(config: {
    accessToken: string;
    apiBase?: string;
    fetchImpl?: typeof fetch;
  }) {
    this.accessToken = config.accessToken;
    this.apiBase = (
      config.apiBase ?? "https://www.googleapis.com/calendar/v3"
    ).replace(/\/+$/, "");
    this.fetchImpl = config.fetchImpl ?? fetch;
  }

  async listBookings(params: {
    calendarId: string;
    technicianId: string;
    timeMinIso: string;
    timeMaxIso: string;
    fallbackLocation: GeoPoint;
  }): Promise<CalendarBooking[]> {
    const url = new URL(
      `${this.apiBase}/calendars/${encodeURIComponent(params.calendarId)}/events`
    );
    url.searchParams.set("timeMin", params.timeMinIso);
    url.searchParams.set("timeMax", params.timeMaxIso);
    url.searchParams.set("singleEvents", "true");
    url.searchParams.set("orderBy", "startTime");

    const res = await this.fetchImpl(url.toString(), {
      headers: { Authorization: `Bearer ${this.accessToken}` },
    });
    if (!res.ok) {
      throw new Error(`Google Calendar list failed (${res.status})`);
    }
    const data = (await res.json()) as {
      items?: Array<{
        id?: string;
        summary?: string;
        start?: { dateTime?: string };
        end?: { dateTime?: string };
        extendedProperties?: {
          private?: { onit_lat?: string; onit_lng?: string };
        };
      }>;
    };

    const result: CalendarBooking[] = [];
    for (const ev of data.items ?? []) {
      if (!ev.id || !ev.start?.dateTime || !ev.end?.dateTime) continue;
      const lat = Number(ev.extendedProperties?.private?.onit_lat);
      const lng = Number(ev.extendedProperties?.private?.onit_lng);
      const location =
        !Number.isNaN(lat) && !Number.isNaN(lng) && (lat !== 0 || lng !== 0)
          ? { lat, lng }
          : params.fallbackLocation;
      result.push({
        id: ev.id,
        technicianId: params.technicianId,
        startIso: ev.start.dateTime,
        endIso: ev.end.dateTime,
        location,
        title: ev.summary,
      });
    }
    return result;
  }

  async createBooking(input: CreateBookingInput): Promise<CalendarBooking> {
    const url = `${this.apiBase}/calendars/${encodeURIComponent(input.calendarId)}/events`;
    const res = await this.fetchImpl(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        summary: input.title,
        description: input.description,
        location: input.address,
        start: { dateTime: input.startIso },
        end: { dateTime: input.endIso },
        extendedProperties: {
          private: {
            onit_lat: String(input.location.lat),
            onit_lng: String(input.location.lng),
          },
        },
      }),
    });

    if (!res.ok) {
      throw new Error(`Google Calendar create failed (${res.status})`);
    }

    const ev = (await res.json()) as { id?: string };
    return {
      id: ev.id ?? `gcal_${Date.now()}`,
      technicianId: input.technicianId,
      startIso: input.startIso,
      endIso: input.endIso,
      location: input.location,
      title: input.title,
    };
  }
}
