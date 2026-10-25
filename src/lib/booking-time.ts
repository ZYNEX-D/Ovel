export function localDateString(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function addDaysLocal(date: Date, days: number): string {
  return localDateString(new Date(date.getFullYear(), date.getMonth(), date.getDate() + days));
}

export function parseDisplayTime(display: string): { hours: number; minutes: number } | null {
  const match = /^(\d{1,2}):(\d{2})\s*([AaPp][Mm])$/.exec(display.trim());
  if (!match) return null;
  let hours = Number(match[1]);
  const minutes = Number(match[2]);
  const meridiem = match[3].toUpperCase();
  if (hours < 1 || hours > 12 || minutes < 0 || minutes > 59) return null;
  if (meridiem === "AM") {
    hours = hours === 12 ? 0 : hours;
  } else if (hours !== 12) {
    hours += 12;
  }
  return { hours, minutes };
}

export function displayTimeToIsoLocal(date: string, display: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return null;
  const parsed = parseDisplayTime(display);
  if (!parsed) return null;
  const hours = String(parsed.hours).padStart(2, "0");
  const minutes = String(parsed.minutes).padStart(2, "0");
  return `${date}T${hours}:${minutes}:00`;
}

export function addMinutes(localDateTime: string, minutesToAdd: number): string | null {
  if (!Number.isFinite(minutesToAdd)) return null;
  const match = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})/.exec(localDateTime);
  if (!match) return null;
  const date = new Date(
    Number(match[1]),
    Number(match[2]) - 1,
    Number(match[3]),
    Number(match[4]),
    Number(match[5]),
    0,
    0,
  );
  if (Number.isNaN(date.getTime())) return null;
  date.setMinutes(date.getMinutes() + minutesToAdd);
  const hours = String(date.getHours()).padStart(2, "0");
  const minutes = String(date.getMinutes()).padStart(2, "0");
  return `${localDateString(date)}T${hours}:${minutes}:00`;
}

export function durationMinutes(startIso: string, endIso: string): number | null {
  const start = Date.parse(startIso);
  const end = Date.parse(endIso);
  if (!Number.isFinite(start) || !Number.isFinite(end) || end <= start) return null;
  return Math.round((end - start) / 60000);
}

export function dollarsToCents(value: number): number | null {
  if (!Number.isFinite(value) || value < 0) return null;
  return Math.round(value * 100);
}

export function centsToDollars(value?: number | null): number {
  if (value == null || !Number.isFinite(value) || value < 0) return 0;
  return Math.round(value / 100);
}
