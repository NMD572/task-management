'use client';

import { useMemo } from 'react';
import { useAppStore } from '@/lib/store';
import QuadrantColumn from './QuadrantColumn';
import type { Classification, Task } from '@/lib/types';

// ── Order of quadrants in the 2×2 grid ───────────────────────────────────
const QUADRANT_ORDER: Classification[] = ['do_now', 'schedule', 'delegate', 'eliminate'];

// ── Sort tasks: deadline ascending, no-deadline tasks go last ─────────────
function sortByDeadline(tasks: Task[]): Task[] {
  return [...tasks].sort((a, b) => {
    if (!a.deadline && !b.deadline) return 0;
    if (!a.deadline) return 1;
    if (!b.deadline) return -1;
    return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
  });
}

// ── Component ─────────────────────────────────────────────────────────────
export default function MatrixBoard() {
  const tasks = useAppStore((s) => s.tasks);

  // Group + sort tasks by classification
  const grouped = useMemo(() => {
    const map: Record<Classification, Task[]> = {
      do_now:    [],
      schedule:  [],
      delegate:  [],
      eliminate: [],
    };
    for (const task of tasks) {
      map[task.classification].push(task);
    }
    // Sort each group
    (Object.keys(map) as Classification[]).forEach((key) => {
      map[key] = sortByDeadline(map[key]);
    });
    return map;
  }, [tasks]);

  return (
    <section aria-label="Ma trận Eisenhower">
      {/* 2×2 grid on md+, single column on mobile */}
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
