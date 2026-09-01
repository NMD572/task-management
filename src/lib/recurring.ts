// lib/recurring.ts
import { addDays, parseISO, format, isBefore, isSameDay, startOfDay } from 'date-fns';
import type { Task } from './types';

/**
 * Generates the next occurrence of a recurring task.
 * Returns null if the task is not recurring or has an invalid interval.
 */
export function generateNextOccurrence(task: Task): Task | null {
  if (!task.isRecurring || !task.recurringIntervalDays || task.recurringIntervalDays <= 0) {
    return null;
  }

  try {
    const currentStart = parseISO(task.startDate);
    const nextStart = addDays(currentStart, task.recurringIntervalDays);
    const newStartDate = format(nextStart, 'yyyy-MM-dd');

    let newDeadline: string | undefined = undefined;
    if (task.deadline) {
      const currentDeadline = parseISO(task.deadline);
      const nextDeadline = addDays(currentDeadline, task.recurringIntervalDays);
      newDeadline = format(
        nextDeadline,
        task.deadline.includes('T') ? "yyyy-MM-dd'T'HH:mm" : 'yyyy-MM-dd'
      );
    }

    return {
      ...task,
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
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
 * Checks all tasks and generates missing occurrences for fixed-interval recurring tasks
 * (isRecurring = true and onlyRepeatWhenPrevDone = false) whose interval date has arrived.
 */
export function processFixedRecurringTasks(
  tasks: Task[],
  addTask: (task: Task) => void,
  updateTask: (id: string, updates: Partial<Task>) => void
): void {
  const today = startOfDay(new Date());

  // Find all active fixed-interval recurring tasks
  const fixedTasks = tasks.filter(
    (t) => t.isRecurring && !t.onlyRepeatWhenPrevDone && t.recurringIntervalDays && t.recurringIntervalDays > 0
  );

  for (const task of fixedTasks) {
    let currentTask = task;
    let iterations = 0;
    const MAX_ITERATIONS = 365; // Safeguard against runaway loops

    while (currentTask.isRecurring && iterations < MAX_ITERATIONS) {
      iterations++;
      try {
        const currentStart = parseISO(currentTask.startDate);
        const nextStart = addDays(currentStart, currentTask.recurringIntervalDays!);
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
