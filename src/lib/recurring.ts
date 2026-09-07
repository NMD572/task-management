// lib/recurring.ts
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  isBefore,
  isSameDay,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import { getRecurrenceMode, type MonthAnchor, type Task } from './types';

/**
 * Calculates a date anchored to the start or end of a given month, with offset days.
 * - anchor: 'start_of_month' or 'end_of_month'
 * - offsetDays: negative (before), positive (after), 0 (exact date)
 * - referenceMonth: Date in the target month
 */
export function calculateMonthAnchorDate(
  anchor: MonthAnchor,
  offsetDays: number,
  referenceMonth: Date
): Date {
  const baseDate =
    anchor === 'start_of_month'
      ? startOfMonth(referenceMonth)
      : endOfMonth(referenceMonth);

  return addDays(baseDate, offsetDays);
}

/**
 * Generates the next occurrence of a recurring task.
 * Returns null if the task is not recurring or configuration is invalid.
 */
export function generateNextOccurrence(task: Task): Task | null {
  if (!task.isRecurring) {
    return null;
  }

  const mode = getRecurrenceMode(task);

  try {
    const currentStart = parseISO(task.startDate);
    let nextStart: Date;

    if (mode === 'month_anchor') {
      if (!task.monthAnchor) {
        return null;
      }
      // Target next month relative to current occurrence startDate
      const nextMonth = addMonths(currentStart, 1);
      nextStart = calculateMonthAnchorDate(
        task.monthAnchor,
        task.anchorOffsetDays ?? 0,
        nextMonth
      );
    } else {
      // 'fixed_interval' logic
      if (!task.recurringIntervalDays || task.recurringIntervalDays <= 0) {
        return null;
      }
      nextStart = addDays(currentStart, task.recurringIntervalDays);
    }

    const newStartDate = format(nextStart, 'yyyy-MM-dd');

    let newDeadline: string | undefined = undefined;
    if (task.deadline) {
      const currentDeadline = parseISO(task.deadline);
      // Keep deadline relative to startDate
      const durationDays = differenceInDays(currentDeadline, currentStart);
      const nextDeadline = addDays(nextStart, durationDays);

      // Preserve time string if original had time component
      if (task.deadline.includes('T')) {
        const timePart = task.deadline.split('T')[1];
        newDeadline = `${format(nextDeadline, 'yyyy-MM-dd')}T${timePart}`;
      } else {
        newDeadline = format(nextDeadline, 'yyyy-MM-dd');
      }
    }

    // Series ID: inherit from parent or fallback to task id
    const seriesId = task.seriesId ?? task.id;

    return {
      ...task,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      seriesId,
      startDate: newStartDate,
      deadline: newDeadline,
      createdAt: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error generating next occurrence:', error);
    return null;
  }
}

/**
 * Checks all tasks and generates missing occurrences for fixed-interval or fixed recurring tasks
 * (isRecurring = true and onlyRepeatWhenPrevDone = false) whose interval/scheduled date has arrived.
 */
export function processFixedRecurringTasks(
  tasks: Task[],
  addTask: (task: Task) => void,
  updateTask: (id: string, updates: Partial<Task>) => void
): void {
  const today = startOfDay(new Date());

  // Find all active fixed-cycle recurring tasks (that don't wait for completion)
  const fixedTasks = tasks.filter((t) => {
    if (!t.isRecurring || t.onlyRepeatWhenPrevDone) return false;
    const mode = getRecurrenceMode(t);
    if (mode === 'fixed_interval') {
      return t.recurringIntervalDays && t.recurringIntervalDays > 0;
    }
    if (mode === 'month_anchor') {
      return Boolean(t.monthAnchor);
    }
    return false;
  });

  for (const task of fixedTasks) {
    let currentTask = task;
    let iterations = 0;
    const MAX_ITERATIONS = 365; // Safeguard against runaway loops

    while (currentTask.isRecurring && iterations < MAX_ITERATIONS) {
      iterations++;
      try {
        const currentStart = parseISO(currentTask.startDate);
        const mode = getRecurrenceMode(currentTask);
        let nextStart: Date;

        if (mode === 'month_anchor') {
          const nextMonth = addMonths(currentStart, 1);
          nextStart = calculateMonthAnchorDate(
            currentTask.monthAnchor!,
            currentTask.anchorOffsetDays ?? 0,
            nextMonth
          );
        } else {
          nextStart = addDays(currentStart, currentTask.recurringIntervalDays!);
        }

        const nextStartDay = startOfDay(nextStart);

        // If the next occurrence date is today or in the past, spawn it
        if (isBefore(nextStartDay, today) || isSameDay(nextStartDay, today)) {
          const nextOccurrence = generateNextOccurrence(currentTask);
          if (!nextOccurrence) break;

          // Old instance is no longer the recurring generator
          updateTask(currentTask.id, { isRecurring: false });

          // Add the newly spawned instance
          addTask(nextOccurrence);

          currentTask = nextOccurrence;
        } else {
          // Next occurrence date is still in the future
          break;
        }
      } catch (e) {
        console.error('Error processing fixed recurring task:', e);
        break;
      }
    }
  }
}
