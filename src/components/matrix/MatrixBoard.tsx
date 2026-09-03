'use client';

import { useMemo, useEffect, useRef } from 'react';
import { parseISO, isWithinInterval, startOfDay, endOfDay, format } from 'date-fns';
import { useAppStore } from '@/lib/store';
import { useFilter } from '@/lib/filterContext';
import { processFixedRecurringTasks } from '@/lib/recurring';
import QuadrantColumn from './QuadrantColumn';
import type { Classification, Task, TaskCompletion } from '@/lib/types';

// ── Order of quadrants in the 2×2 grid ───────────────────────────────────
const QUADRANT_ORDER: Classification[] = ['do_now', 'schedule', 'delegate', 'eliminate'];

// ── Sort tasks by deadline ascending (no-deadline tasks go last) ───────────
function sortByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

// ── Sort quadrant tasks according to Prompt 12 rules ─────────────────────
// (a) Pending tasks (no completion today) -> sorted by deadline ascending, rendered first
// (b) Processed tasks (completed or skipped today) -> pushed to the end of the quadrant
function sortQuadrantTasks(
  tasks: Task[],
  taskCompletions: TaskCompletion[],
  todayStr: string
): Task[] {
  const pendingTasks: Task[] = [];
  const processedTodayTasks: Task[] = [];

  for (const task of tasks) {
    const isProcessedToday = taskCompletions.some(
      (tc) => tc.taskId === task.id && tc.date === todayStr
    );
    if (isProcessedToday) {
      processedTodayTasks.push(task);
    } else {
      pendingTasks.push(task);
    }
  }

  return [...sortByDeadline(pendingTasks), ...sortByDeadline(processedTodayTasks)];
}

// ── Component ─────────────────────────────────────────────────────────────
export default function MatrixBoard() {
  const allTasks         = useAppStore((s) => s.tasks);
  const taskCompletions  = useAppStore((s) => s.taskCompletions);
  const addTask          = useAppStore((s) => s.addTask);
  const updateTask       = useAppStore((s) => s.updateTask);
  const { searchText, labelIds, dateFrom, dateTo } = useFilter();

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Process fixed-interval recurring tasks on load / when tasks hydrate
  const hasProcessedRef = useRef(false);
  useEffect(() => {
    if (allTasks.length > 0 && !hasProcessedRef.current) {
      hasProcessedRef.current = true;
      processFixedRecurringTasks(allTasks, addTask, updateTask);
    }
  }, [allTasks, addTask, updateTask]);

  // Apply filters — never mutate store.tasks
  const filteredTasks = useMemo(() => {
    const rangeStart = dateFrom ? startOfDay(parseISO(dateFrom)) : null;
    const rangeEnd   = dateTo   ? endOfDay(parseISO(dateTo))     : null;

    return allTasks.filter((task) => {
      // 1. Prompt 12 Rule: Task has TaskCompletion from earlier than today (date < todayStr)
      // -> exclude completely from MatrixBoard
      const hasPastCompletion = taskCompletions.some(
        (tc) => tc.taskId === task.id && tc.date < todayStr
      );
      if (hasPastCompletion) {
        return false;
      }

      // 2. Search: case-insensitive name match
      if (searchText) {
        const q = searchText.toLowerCase();
        if (!task.name.toLowerCase().includes(q)) return false;
      }

      // 3. Label filter: if any labels selected, task must match one
      if (labelIds.length > 0 && !labelIds.includes(task.labelId)) {
        return false;
      }

      // 4. Date range filter: task's startDate must fall within [from, to]
      if (rangeStart && rangeEnd && task.startDate) {
        const taskStart = parseISO(task.startDate);
        if (!isWithinInterval(taskStart, { start: rangeStart, end: rangeEnd })) {
          return false;
        }
      }

      return true;
    });
  }, [allTasks, taskCompletions, todayStr, searchText, labelIds, dateFrom, dateTo]);

  // Group + sort filtered tasks by classification according to Prompt 12 rules
  const grouped = useMemo(() => {
    const map: Record<Classification, Task[]> = {
      do_now:    [],
      schedule:  [],
      delegate:  [],
      eliminate: [],
    };
    for (const task of filteredTasks) {
      map[task.classification].push(task);
    }
    (Object.keys(map) as Classification[]).forEach((key) => {
      map[key] = sortQuadrantTasks(map[key], taskCompletions, todayStr);
    });
    return map;
  }, [filteredTasks, taskCompletions, todayStr]);

  return (
    <section aria-label="Ma trận Eisenhower">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {QUADRANT_ORDER.map((cls) => (
          <QuadrantColumn
            key={cls}
            classification={cls}
            tasks={grouped[cls]}
          />
        ))}
      </div>
    </section>
  );
}
