/**
 * Ovel Core Availability Slot Engine
 * Computes available booking slots for a given staff member, service, and date:
 * Available Slots = (Staff Working Hours) - (Existing Bookings) - (Buffer Times)
 */

export interface WorkingHourRule {
  start: string; // e.g. "09:00"
  end: string;   // e.g. "18:00"
  active: boolean;
}

export type WeeklyWorkingHours = Record<
  "monday" | "tuesday" | "wednesday" | "thursday" | "friday" | "saturday" | "sunday",
  WorkingHourRule
>;

export interface ExistingSlotBlock {
  startTime: string; // ISO string e.g. "2026-10-12T10:00:00.000Z"
  endTime: string;   // ISO string e.g. "2026-10-12T11:00:00.000Z"
  status?: string;
}

export interface SlotComputationParams {
  date: string; // YYYY-MM-DD
  serviceDurationMinutes: number;
  bufferBeforeMinutes?: number;
  bufferAfterMinutes?: number;
  workingHours: WeeklyWorkingHours;
  existingBookings: ExistingSlotBlock[];
  slotIntervalMinutes?: number; // default 30 mins
}

export interface ComputedSlot {
  time: string;       // e.g. "09:30 AM"
  isoString: string;  // e.g. "2026-10-12T09:30:00"
  available: boolean;
  conflictReason?: string;
}

const DAYS_OF_WEEK = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

function calendarDate(date: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);
  if (!match) return null;
  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);
  const resolved = new Date(year, month - 1, day);
  if (
    resolved.getFullYear() !== year ||
    resolved.getMonth() !== month - 1 ||
    resolved.getDate() !== day
  ) {
    return null;
  }
  return resolved;
}

function bookingMinutesOnDate(
  startIso: string,
  endIso: string,
  dayStart: Date,
): { start: number; end: number } | null {
  const start = new Date(startIso);
  const end = new Date(endIso);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || end <= start) return null;
  const dayEnd = new Date(dayStart.getFullYear(), dayStart.getMonth(), dayStart.getDate() + 1);
  if (end <= dayStart || start >= dayEnd) return null;
  const clippedStart = start < dayStart ? dayStart : start;
  const clippedEnd = end > dayEnd ? dayEnd : end;
  return {
    start: (clippedStart.getTime() - dayStart.getTime()) / 60000,
    end: (clippedEnd.getTime() - dayStart.getTime()) / 60000,
  };
}

export function computeAvailableSlots(params: SlotComputationParams): ComputedSlot[] {
  const {
    date,
    serviceDurationMinutes,
    bufferBeforeMinutes = 0,
    bufferAfterMinutes = 15,
    workingHours,
    existingBookings,
    slotIntervalMinutes = 30,
  } = params;

  if (
    serviceDurationMinutes <= 0 ||
    slotIntervalMinutes <= 0 ||
    bufferBeforeMinutes < 0 ||
    bufferAfterMinutes < 0
  ) {
    return [];
  }

  const dayStart = calendarDate(date);
  if (!dayStart) return [];

  const dayName = DAYS_OF_WEEK[dayStart.getDay()];
  const rule = workingHours[dayName];
  if (!rule || !rule.active) return [];

  const [startHour, startMin] = rule.start.split(":").map(Number);
  const [endHour, endMin] = rule.end.split(":").map(Number);
  const dayStartMinutes = startHour * 60 + startMin;
  const dayEndMinutes = endHour * 60 + endMin;
  if (
    !Number.isFinite(dayStartMinutes) ||
    !Number.isFinite(dayEndMinutes) ||
    dayEndMinutes <= dayStartMinutes
  ) {
    return [];
  }

  const totalRequiredSpan = bufferBeforeMinutes + serviceDurationMinutes + bufferAfterMinutes;
  const bookedRanges = existingBookings
    .filter((booking) => booking.status !== "cancelled")
    .map((booking) => {
      const range = bookingMinutesOnDate(booking.startTime, booking.endTime, dayStart);
      if (!range) return null;
      return {
        start: range.start - bufferBeforeMinutes,
        end: range.end + bufferAfterMinutes,
      };
    })
    .filter((range): range is { start: number; end: number } => range !== null);

  const slots: ComputedSlot[] = [];
  for (
    let currentMin = dayStartMinutes;
    currentMin + totalRequiredSpan <= dayEndMinutes;
    currentMin += slotIntervalMinutes
  ) {
    const slotStartMin = currentMin + bufferBeforeMinutes;
    const slotEndMin = slotStartMin + serviceDurationMinutes;
    const hasCollision = bookedRanges.some((booking) => {
      return slotStartMin < booking.end && slotEndMin > booking.start;
    });

    const hours = Math.floor(slotStartMin / 60);
    const mins = slotStartMin % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMins = mins < 10 ? `0${mins}` : mins;
    const formattedDisplay = `${displayHours}:${displayMins} ${ampm}`;
    const padH = String(hours).padStart(2, "0");
    const padM = String(mins).padStart(2, "0");

    slots.push({
      time: formattedDisplay,
      isoString: `${date}T${padH}:${padM}:00`,
      available: !hasCollision,
      conflictReason: hasCollision ? "Already reserved" : undefined,
    });
  }

  return slots;
}
