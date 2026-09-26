// lib/recurring.ts
import {
  addDays,
  addMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
  format,
  isAfter,
  startOfDay,
  differenceInDays,
} from 'date-fns';
import { getRecurrenceMode, type MonthAnchor, type Task, type TaskCompletion } from './types';

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
 * Ensures upcoming occurrences for recurring tasks with onlyRepeatWhenPrevDone = false
 * within the interval [today, today + lookAheadDays].
 *
 * Requirements (Prompt 18):
 * 1. Only considers tasks with isRecurring = true AND onlyRepeatWhenPrevDone = false.
 *    (Tasks with onlyRepeatWhenPrevDone = true are left untouched: they only spawn on complete/skip).
 * 2. For each seriesId, computes occurrence dates that should exist in [today, today + lookAheadDays].
 * 3. For any date where no task with the same seriesId + startDate exists, creates a new occurrence.
 * 4. Returns the full updated tasks array (including existing tasks and newly created occurrences).
 */
export function ensureUpcomingOccurrences(
  tasks: Task[],
  lookAheadDays: number = 30
): Task[] {
  const today = startOfDay(new Date());
  const horizon = startOfDay(addDays(today, lookAheadDays));

  // Find all active fixed-cycle recurring tasks (that don't wait for completion)
  const generatorTasks = tasks.filter((t) => {
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

  if (generatorTasks.length === 0) {
    return tasks;
  }

  // Work on a mutable copy of tasks
  const resultTasks = [...tasks];

  // Group by seriesId so we don't process the same series multiple times
  const seenSeries = new Set<string>();

  for (const genTask of generatorTasks) {
    const seriesId = genTask.seriesId ?? genTask.id;
    if (seenSeries.has(seriesId)) {
      continue;
    }
    seenSeries.add(seriesId);

    // Find all occurrences already existing in the series
    const existingSeriesTasks = resultTasks.filter(
      (t) => (t.seriesId ?? t.id) === seriesId
    );

    // Track existing start dates (YYYY-MM-DD) for this series
    const existingDates = new Set(existingSeriesTasks.map((t) => t.startDate));

    // Determine the template/generator task: find the latest occurrence or genTask
    // Sort ascending by startDate
    const sortedExisting = [...existingSeriesTasks].sort((a, b) => {
      return a.startDate.localeCompare(b.startDate);
    });

    // Determine the latest occurrence to continue generation forward
    const latestOcc = sortedExisting[sortedExisting.length - 1] || genTask;
    if (!latestOcc.isRecurring) {
      continue;
    }

    let currentTemplate: Task = {
      ...latestOcc,
      isRecurring: true,
      recurrenceMode: getRecurrenceMode(latestOcc),
      recurringIntervalDays: latestOcc.recurringIntervalDays ?? genTask.recurringIntervalDays,
      monthAnchor: latestOcc.monthAnchor ?? genTask.monthAnchor,
      anchorOffsetDays: latestOcc.anchorOffsetDays ?? genTask.anchorOffsetDays,
    };

    let iterations = 0;
    const MAX_ITERATIONS = 120; // Safe limit (covers daily tasks for 30+ days or monthly tasks for years)

    while (iterations < MAX_ITERATIONS) {
      iterations++;

      const nextOcc = generateNextOccurrence(currentTemplate);
      if (!nextOcc) {
        break;
      }

      const nextStartDay = startOfDay(parseISO(nextOcc.startDate));

      // If next occurrence date exceeds our look-ahead horizon, we're done for this series
      if (isAfter(nextStartDay, horizon)) {
        break;
      }

      // If date not already present in the series, add it!
      if (!existingDates.has(nextOcc.startDate)) {
        existingDates.add(nextOcc.startDate);
        resultTasks.push(nextOcc);
      }

      // Advance template to continue computing forward within horizon
      currentTemplate = nextOcc;
    }
  }

  return resultTasks;
}

/**
 * Prompt 29: When editing an occurrence belonging to a recurring series with onlyRepeatWhenPrevDone = false:
 * 1. Update the target occurrence with new fields (keeping its id and seriesId).
 * 2. Delete ALL other occurrences in the same series with startDate > target occurrence startDate,
 *    EXCEPT occurrences that already have a TaskCompletion (recorded in taskCompletions).
 *    Occurrences with startDate <= target occurrence startDate are preserved untouched.
 * 3. If target occurrence isRecurring = true:
 *    Regenerate upcoming occurrences from immediately after target occurrence up to today + lookAheadDays (30 days),
 *    using the newly updated config.
 * 4. Returns the updated tasks array.
 */
export function updateRecurringSeriesOccurrences(
  tasks: Task[],
  updatedTask: Task,
  taskCompletions: TaskCompletion[] = [],
  lookAheadDays: number = 30
): Task[] {
  const seriesId = updatedTask.seriesId ?? updatedTask.id;
  const completedTaskIds = new Set(taskCompletions.map((tc) => tc.taskId));
  const targetStartDate = updatedTask.startDate;

  // 1. Filter out future occurrences of the same series (startDate > updatedTask.startDate)
  // unless they have a completion recorded. Also replace the edited task with updatedTask.
  const resultTasks: Task[] = [];
  for (const t of tasks) {
    if (t.id === updatedTask.id) {
      resultTasks.push({
        ...updatedTask,
        seriesId,
      });
      continue;
    }

    const tSeriesId = t.seriesId ?? t.id;
    if (tSeriesId === seriesId) {
      // Same series: delete future occurrences (startDate > targetStartDate) unless already completed
      if (t.startDate > targetStartDate && !completedTaskIds.has(t.id)) {
        continue;
      }
    }

    resultTasks.push(t);
  }

  // 2. If recurrence is disabled on the updated task, do not generate new occurrences
  if (!updatedTask.isRecurring) {
    return resultTasks;
  }

  // 3. Regenerate future occurrences for this series using the NEW CONFIG
  const today = startOfDay(new Date());
  const horizon = startOfDay(addDays(today, lookAheadDays));

  const existingSeriesDates = new Set(
    resultTasks
      .filter((t) => (t.seriesId ?? t.id) === seriesId)
      .map((t) => t.startDate)
  );

  let currentTemplate: Task = {
    ...updatedTask,
    seriesId,
    isRecurring: true,
  };

  let iterations = 0;
  const MAX_ITERATIONS = 120;

  while (iterations < MAX_ITERATIONS) {
    iterations++;

    const nextOcc = generateNextOccurrence(currentTemplate);
    if (!nextOcc) {
      break;
    }

    const nextStartDay = startOfDay(parseISO(nextOcc.startDate));
    if (isAfter(nextStartDay, horizon)) {
      break;
    }

    // Only add if no occurrence on this date exists for this series
    if (!existingSeriesDates.has(nextOcc.startDate)) {
      existingSeriesDates.add(nextOcc.startDate);
      resultTasks.push(nextOcc);
    }

    // Advance template forward
    currentTemplate = nextOcc;
  }

  return resultTasks;
}

/**
 * Backward-compatible helper (if any legacy callers remain).
 */
export function processFixedRecurringTasks(
  tasks: Task[],
  addTask: (task: Task) => void
): void {
  const updated = ensureUpcomingOccurrences(tasks, 30);
  const existingIds = new Set(tasks.map((t) => t.id));
  for (const task of updated) {
    if (!existingIds.has(task.id)) {
      addTask(task);
    }
  }
}
