// lib/urgency.ts
import { parseISO, differenceInCalendarDays, startOfDay } from 'date-fns';
import type { Task, UrgencyAutoUpgradeConfig } from './types';

/**
 * Applies urgency auto-upgrade rule based on configuration:
 * When enabled, for any task with a deadline:
 * If (deadline - today) <= daysThreshold:
 * - 'schedule' -> upgraded to 'do_now'
 * - Tasks already in 'do_now', 'delegate', or 'eliminate' remain unchanged.
 *
 * NOTE: Does NOT mutate the original tasks. Returns new task objects where upgraded.
 */
export function applyUrgencyAutoUpgrade(
  tasks: Task[],
  config: UrgencyAutoUpgradeConfig
): Task[] {
  if (!config.enabled || config.daysThreshold < 0) {
    return tasks;
  }

  const today = startOfDay(new Date());

  return tasks.map((task) => {
    if (!task.deadline) {
      return task;
    }

    try {
      const deadlineDate = startOfDay(parseISO(task.deadline));
      const daysRemaining = differenceInCalendarDays(deadlineDate, today);

      if (daysRemaining <= config.daysThreshold) {
        if (task.classification === 'schedule') {
          return { ...task, classification: 'do_now' };
        }
      }
    } catch (e) {
      console.error('Error calculating urgency upgrade for task:', task.id, e);
    }

    return task;
  });
}
