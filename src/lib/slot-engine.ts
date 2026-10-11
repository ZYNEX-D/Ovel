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

  // 1. Identify Day of Week
  const targetDate = new Date(date + "T00:00:00");
  const dayName = DAYS_OF_WEEK[targetDate.getDay()];
  const rule = workingHours[dayName];

  if (!rule || !rule.active) {
    return []; // Business or staff is off on this day
  }

  // 2. Parse working hour limits in minutes from midnight
  const [startHour, startMin] = rule.start.split(":").map(Number);
  const [endHour, endMin] = rule.end.split(":").map(Number);

  const dayStartMinutes = startHour * 60 + startMin;
  const dayEndMinutes = endHour * 60 + endMin;

  const totalRequiredSpan = bufferBeforeMinutes + serviceDurationMinutes + bufferAfterMinutes;
  const slots: ComputedSlot[] = [];

  // 3. Convert existing bookings to minute ranges relative to this date
  const bookedRanges = existingBookings
    .filter((b) => b.status !== "cancelled")
    .map((b) => {
      const bStart = new Date(b.startTime);
      const bEnd = new Date(b.endTime);
      const startMin = bStart.getHours() * 60 + bStart.getMinutes();
      const endMin = bEnd.getHours() * 60 + bEnd.getMinutes();
      return { start: startMin, end: endMin };
    });

  // 4. Step through the day by slot interval
  for (
    let currentMin = dayStartMinutes;
    currentMin + totalRequiredSpan <= dayEndMinutes;
    currentMin += slotIntervalMinutes
  ) {
    const slotStartMin = currentMin + bufferBeforeMinutes;
    const slotEndMin = slotStartMin + serviceDurationMinutes;

    // Check collision with any existing booking
    const hasCollision = bookedRanges.some((booking) => {
      // Overlap condition: startA < endB && endA > startB
      return slotStartMin < booking.end && slotEndMin > booking.start;
    });

    const hours = Math.floor(slotStartMin / 60);
    const mins = slotStartMin % 60;
    const ampm = hours >= 12 ? "PM" : "AM";
    const displayHours = hours % 12 === 0 ? 12 : hours % 12;
    const displayMins = mins < 10 ? `0${mins}` : mins;
    const formattedDisplay = `${displayHours}:${displayMins} ${ampm}`;

    const dateStr = date;
    const padH = String(hours).padStart(2, "0");
    const padM = String(mins).padStart(2, "0");
    const iso = `${dateStr}T${padH}:${padM}:00`;

    slots.push({
      time: formattedDisplay,
      isoString: iso,
      available: !hasCollision,
      conflictReason: hasCollision ? "Already reserved" : undefined,
    });
  }

  return slots;
}
