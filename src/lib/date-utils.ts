/**
 * Date and time utilities for Indonesian Western Time (WIB / Asia/Jakarta, UTC+7).
 * Prevents UTC day-lag bugs where early morning attendances (00:00 - 06:59 WIB)
 * were falsely attributed to the previous calendar day or flagged as late.
 */

/**
 * Returns YYYY-MM-DD string in Asia/Jakarta timezone (WIB).
 */
export function getWIBDateString(date: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

/**
 * Returns WIB hour, minute, and formatted HH:mm string.
 */
export function getWIBTime(date: Date = new Date()): { hours: number; minutes: number; timeString: string } {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Jakarta",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hours = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
  const minutes = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
  return {
    hours,
    minutes,
    timeString: `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`,
  };
}

/**
 * Calculates whether the current time in WIB exceeds the office shift window end time.
 * For example: windowEndStr = "10:00", graceMinutes = 5 -> deadline 10:05 WIB.
 */
export function isOfficeClockInLate(
  now: Date = new Date(),
  windowEndStr: string = "10:00",
  graceMinutes: number = 5
): boolean {
  const { hours, minutes } = getWIBTime(now);
  const currentMinutes = hours * 60 + minutes;

  const [endHours, endMinutes] = windowEndStr.split(":").map((v) => parseInt(v, 10) || 0);
  const deadlineMinutes = endHours * 60 + endMinutes + graceMinutes;

  return currentMinutes > deadlineMinutes;
}
