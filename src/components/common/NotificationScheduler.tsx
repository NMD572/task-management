'use client';

import { useNotificationScheduler } from '@/lib/notification';

/**
 * Headless component that mounts useNotificationScheduler once at the app root level.
 */
export default function NotificationScheduler() {
  useNotificationScheduler();
  return null;
}
