'use client';

import TaskCard from '@/components/task/TaskCard';
import type { Classification, Task } from '@/lib/types';

// ── Quadrant metadata ──────────────────────────────────────────────────────
const QUADRANT_META: Record<
  Classification,
  { title: string; subtitle: string; headerBg: string; borderColor: string; countBg: string }
> = {
  do_now: {
    title:       'Thực hiện ngay',
    subtitle:    'Quan trọng & Khẩn cấp',
    headerBg:    'bg-do_now',
    borderColor: 'border-do_now/30',
    countBg:     'bg-teal-50 text-do_now',
  },
  schedule: {
    title:       'Lên kế hoạch',
    subtitle:    'Quan trọng & Không khẩn cấp',
    headerBg:    'bg-schedule',
    borderColor: 'border-schedule/30',
    countBg:     'bg-amber-50 text-schedule',
  },
  delegate: {
    title:       'Ủy quyền',
    subtitle:    'Không quan trọng & Khẩn cấp',
    headerBg:    'bg-delegate',
    borderColor: 'border-delegate/30',
    countBg:     'bg-pink-50 text-delegate',
  },
  eliminate: {
    title:       'Loại bỏ',
    subtitle:    'Không quan trọng & Không khẩn cấp',
    headerBg:    'bg-eliminate',
    borderColor: 'border-eliminate/30',
    countBg:     'bg-purple-50 text-eliminate',
  },
};

// ── Props ──────────────────────────────────────────────────────────────────
interface QuadrantColumnProps {
  classification: Classification;
  tasks: Task[];
}

// ── Component ──────────────────────────────────────────────────────────────
export default function QuadrantColumn({ classification, tasks }: QuadrantColumnProps) {
  const meta = QUADRANT_META[classification];

  return (
    <div className={`flex flex-col rounded-2xl border-2 ${meta.borderColor} bg-white overflow-hidden`}>
      {/* ── Column header ── */}
      <div className={`${meta.headerBg} px-4 py-3 flex items-center justify-between`}>
        <div>
          <h2 className="text-sm font-bold text-white leading-tight">{meta.title}</h2>
          <p className="text-xs text-white/80 mt-0.5">{meta.subtitle}</p>
        </div>
        {/* Task count badge */}
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${meta.countBg}`}>
          {tasks.length}
        </span>
      </div>

      {/* ── Task list ── */}
      <div className="flex-1 p-3 flex flex-col gap-2 min-h-[160px]">
        {tasks.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-6 text-gray-400">
            <p className="text-sm">Chưa có task nào</p>
            <p className="text-xs mt-1 text-gray-300">Bấm &quot;+ Thêm task&quot; để bắt đầu</p>
          </div>
        ) : (
          tasks.map((task) => (
            <TaskCard key={task.id} task={task} />
          ))
        )}
      </div>
    </div>
  );
}
