// lib/notification.ts
import type { NotificationTimeWindow } from './types';

/**
 * Checks if a given time falls within ANY of the configured time windows.
 * If timeWindows is empty or undefined, returns true (meaning no time restriction).
 */
export function isCurrentTimeInNotificationWindow(
  timeWindows: NotificationTimeWindow[] | undefined,
  currentDate: Date = new Date()
): boolean {
  if (!timeWindows || timeWindows.length === 0) {
    return true;
  }

  const currentHours = currentDate.getHours();
  const currentMins = currentDate.getMinutes();
  const currentTotalMins = currentHours * 60 + currentMins;

  return timeWindows.some((window) => {
    if (!window.fromTime || !window.toTime) return false;
    const [fromH, fromM] = window.fromTime.split(':').map(Number);
    const [toH, toM] = window.toTime.split(':').map(Number);
    if (isNaN(fromH) || isNaN(fromM) || isNaN(toH) || isNaN(toM)) return false;

    const startTotalMins = fromH * 60 + fromM;
    const endTotalMins = toH * 60 + toM;

    return currentTotalMins >= startTotalMins && currentTotalMins <= endTotalMins;
  });
}

/**
 * Validates a time window: fromTime must be strictly less than toTime.
 */
export function validateTimeWindow(
  fromTime: string,
  toTime: string
): { isValid: boolean; error?: string } {
  if (!fromTime || !toTime) {
    return { isValid: false, error: 'Vui lòng chọn đầy đủ giờ bắt đầu và giờ kết thúc.' };
  }

  const [fromH, fromM] = fromTime.split(':').map(Number);
  const [toH, toM] = toTime.split(':').map(Number);

  if (isNaN(fromH) || isNaN(fromM) || isNaN(toH) || isNaN(toM)) {
    return { isValid: false, error: 'Định dạng giờ không hợp lệ.' };
  }

  const startTotalMins = fromH * 60 + fromM;
  const endTotalMins = toH * 60 + toM;

  if (startTotalMins >= endTotalMins) {
    return {
      isValid: false,
      error: 'Giờ bắt đầu phải nhỏ hơn giờ kết thúc (Ví dụ: 08:00 — 09:30).',
    };
  }

  return { isValid: true };
}
