// lib/notification.ts
import { useEffect, useRef } from 'react';
import { format, parseISO, startOfDay, differenceInCalendarDays } from 'date-fns';
import type {
  NotificationTimeWindow,
  NotificationConfig,
  Task,
  TaskCompletion,
} from './types';
import { useAppStore } from './store';
import { useLanguage } from './languageContext';

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

/**
 * Requests browser notification permission if supported.
 * Returns true if granted, false otherwise.
 */
export async function requestNotificationPermission(): Promise<boolean> {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return false;
  }

  if (Notification.permission === 'granted') {
    return true;
  }

  try {
    const result = Notification.requestPermission();
    let permission: NotificationPermission;
    if (result && typeof (result as Promise<NotificationPermission>).then === 'function') {
      permission = await result;
    } else {
      permission = await new Promise<NotificationPermission>((resolve) => {
        Notification.requestPermission(resolve);
      });
    }
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
}

/**
 * Sends a task reminder notification for an eligible task.
 * Only sends if browser permission is granted, generalEnabled is true,
 * and quadrant notification is enabled for the task's classification.
 */
export function sendTaskReminder(
  task: Task,
  t?: (key: string, params?: Record<string, string | number>) => string,
  notificationConfig?: NotificationConfig
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  const config = notificationConfig ?? useAppStore.getState().notificationConfig;

  if (!config?.generalEnabled) {
    return;
  }

  if (!config.perQuadrant || !config.perQuadrant[task.classification]) {
    return;
  }

  if (
    config.notificationLabelIds &&
    config.notificationLabelIds.length > 0 &&
    !config.notificationLabelIds.includes(task.labelId)
  ) {
    return;
  }

  if (!task.deadline) {
    return;
  }

  let formattedDate = task.deadline;
  try {
    formattedDate = format(parseISO(task.deadline), 'dd/MM/yyyy');
  } catch {
    formattedDate = task.deadline;
  }

  const title = task.name || (t ? t('notification.reminder_title') : 'Nhắc việc sắp đến hạn');
  const body = t
    ? t('notification.reminder_body', { name: task.name, date: formattedDate })
    : `Task "${task.name}" đến hạn ${formattedDate}`;

  try {
    new Notification(title, {
      body,
      icon: '/favicon.ico',
    });
  } catch (error) {
    console.error('Failed to display task reminder notification:', error);
  }
}

/**
 * Checks all tasks against notification criteria and schedules reminders.
 * Criteria:
 * - generalEnabled is true and Notification.permission is 'granted'
 * - Current time falls within configured time windows (or no time window restrictions)
 * - Task has deadline and quadrant notification is enabled
 * - Task matches label filter (if notificationLabelIds is configured)
 * - Task is NOT completed or skipped today
 * - (deadline - today) <= reminderDays (and non-negative)
 */
export function checkAndNotify(
  tasks: Task[],
  taskCompletions: TaskCompletion[],
  notificationConfig: NotificationConfig,
  t?: (key: string, params?: Record<string, string | number>) => string
): void {
  if (typeof window === 'undefined' || !('Notification' in window)) {
    return;
  }

  if (Notification.permission !== 'granted') {
    return;
  }

  if (!notificationConfig || !notificationConfig.generalEnabled) {
    return;
  }

  if (!isCurrentTimeInNotificationWindow(notificationConfig.timeWindows)) {
    return;
  }

  const today = startOfDay(new Date());
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const reminderDays = notificationConfig.reminderDays ?? 2;

  for (const task of tasks) {
    if (!task.deadline) {
      continue;
    }

    if (!notificationConfig.perQuadrant || !notificationConfig.perQuadrant[task.classification]) {
      continue;
    }

    // Filter by label if notificationLabelIds is configured
    if (
      notificationConfig.notificationLabelIds &&
      notificationConfig.notificationLabelIds.length > 0 &&
      !notificationConfig.notificationLabelIds.includes(task.labelId)
    ) {
      continue;
    }

    // Do not notify if task was already completed or skipped today
    const isHandledToday = taskCompletions.some(
      (tc) => tc.taskId === task.id && tc.date === todayStr
    );
    if (isHandledToday) {
      continue;
    }

    try {
      const deadlineDate = startOfDay(parseISO(task.deadline));
      const diffDays = differenceInCalendarDays(deadlineDate, today);

      if (diffDays >= 0 && diffDays <= reminderDays) {
        sendTaskReminder(task, t, notificationConfig);
      }
    } catch (err) {
      console.error(`Error calculating deadline for task ${task.id}:`, err);
    }
  }
}

/**
 * Custom hook to handle notification permissions and scheduled checks.
 * - Prompts for permission once on app startup if generalEnabled === true.
 * - Prompts for permission if user enables generalEnabled from false to true.
 * - Runs checkAndNotify on mount and every 15 minutes (900,000 ms).
 * - Cleans up interval on unmount.
 */
export function useNotificationScheduler(): void {
  const tasks = useAppStore((s) => s.tasks);
  const taskCompletions = useAppStore((s) => s.taskCompletions);
  const notificationConfig = useAppStore((s) => s.notificationConfig);
  const { t } = useLanguage();

  const prevGeneralEnabledRef = useRef<boolean>(notificationConfig.generalEnabled);
  const isFirstMountRef = useRef<boolean>(true);

  const stateRef = useRef({ tasks, taskCompletions, notificationConfig, t });
  stateRef.current = { tasks, taskCompletions, notificationConfig, t };

  // Permission handling
  useEffect(() => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      return;
    }

    if (isFirstMountRef.current) {
      isFirstMountRef.current = false;
      // App mount: request only if generalEnabled === true and not decided yet
      if (notificationConfig.generalEnabled && Notification.permission === 'default') {
        requestNotificationPermission();
      }
    } else {
      // Toggle from false -> true: request if not decided yet
      if (
        !prevGeneralEnabledRef.current &&
        notificationConfig.generalEnabled &&
        Notification.permission === 'default'
      ) {
        requestNotificationPermission();
      }
    }

    prevGeneralEnabledRef.current = notificationConfig.generalEnabled;
  }, [notificationConfig.generalEnabled]);

  // Periodic check: once on mount, then every 15 minutes
  useEffect(() => {
    checkAndNotify(
      stateRef.current.tasks,
      stateRef.current.taskCompletions,
      stateRef.current.notificationConfig,
      stateRef.current.t
    );

    const intervalId = setInterval(() => {
      checkAndNotify(
        stateRef.current.tasks,
        stateRef.current.taskCompletions,
        stateRef.current.notificationConfig,
        stateRef.current.t
      );
    }, 900_000);

    return () => clearInterval(intervalId);
  }, []);
}
