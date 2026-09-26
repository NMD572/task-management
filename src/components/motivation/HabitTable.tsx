'use client';

import { useMemo } from 'react';
import { format, eachDayOfInterval } from 'date-fns';
import { Check, Ban } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import { calculateSeriesCompletionRate } from '@/lib/completion';
import type { Task } from '@/lib/types';

interface HabitTableProps {
  rangeStart: Date;
  rangeEnd: Date;
}

interface TaskSeriesGroup {
  seriesId: string;
  name: string;
  labelId: string;
  isRecurring: boolean;
  tasks: Task[];
}

export default function HabitTable({ rangeStart, rangeEnd }: HabitTableProps) {
  const { t } = useLanguage();
  const tasks = useAppStore((s) => s.tasks);
  const labels = useAppStore((s) => s.labels);
  const taskCompletions = useAppStore((s) => s.taskCompletions);
  const addTaskCompletion = useAppStore((s) => s.addTaskCompletion);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  const days = useMemo(() => {
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
      dateObj: d,
      dateStr: format(d, 'yyyy-MM-dd'),
      label: format(d, 'dd/MM'),
    }));
  }, [rangeStart, rangeEnd]);

  // Prompt 30: Group task occurrences by seriesId into a single row per series.
  // Each series displays occurrences and completions on corresponding dates.
  const seriesGroups = useMemo(() => {
    const map = new Map<string, TaskSeriesGroup>();

    for (const task of tasks) {
      const seriesId = task.seriesId ?? task.id;
      const existing = map.get(seriesId);
      if (existing) {
        existing.tasks.push(task);
        if (task.isRecurring) {
          existing.isRecurring = true;
        }
      } else {
        map.set(seriesId, {
          seriesId,
          name: task.name,
          labelId: task.labelId,
          isRecurring: task.isRecurring,
          tasks: [task],
        });
      }
    }

    const list = Array.from(map.values());
    const recurring = list.filter((g) => g.isRecurring);
    const nonRecurring = list.filter((g) => !g.isRecurring);
    return [...recurring, ...nonRecurring];
  }, [tasks]);

  const handleQuickComplete = (taskId: string, date: string) => {
    addTaskCompletion({
      taskId,
      date,
      status: 'completed',
    });
  };

  if (seriesGroups.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 shadow-sm">
        <p className="text-base font-semibold text-gray-700">{t('motivation.no_tasks')}</p>
        <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">{t('motivation.no_tasks_desc')}</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left">
          <thead className="bg-gray-50 text-gray-600 border-b border-gray-200 text-xs uppercase font-semibold">
            <tr>
              <th className="px-4 py-3 sticky left-0 z-10 bg-gray-50 border-r border-gray-200 min-w-[200px]">
                {t('motivation.col_task')}
              </th>
              <th className="px-4 py-3 text-center whitespace-nowrap min-w-[60px]">
                {t('motivation.col_rate')}
              </th>
              {days.map((day) => (
                <th key={day.dateStr} className="px-2 py-3 text-center whitespace-nowrap min-w-[48px]">
                  {day.label}
                </th>
              ))}
              <th className="px-4 py-3 min-w-[120px]">
                {t('motivation.col_progress')}
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {seriesGroups.map((series) => {
              const seriesTaskIds = new Set(series.tasks.map((t) => t.id));
              seriesTaskIds.add(series.seriesId);

              const pct = calculateSeriesCompletionRate(
                series.tasks,
                series.seriesId,
                taskCompletions,
                rangeStart,
                rangeEnd
              );
              const label = labels.find((l) => l.id === series.labelId);

              return (
                <tr key={series.seriesId} className="hover:bg-gray-50/50 transition">
                  {/* Task Name (Sticky left) */}
                  <td className="px-4 py-3 sticky left-0 z-10 bg-white border-r border-gray-100 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: label?.color || '#ccc' }}
                      />
                      <span className="truncate max-w-[180px]" title={series.name}>
                        {series.name}
                      </span>
                    </div>
                  </td>

                  {/* % */}
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">
                    {pct}%
                  </td>

                  {/* Days */}
                  {days.map((day) => {
                    const dayStr = day.dateStr;

                    // 1. Ưu tiên hiển thị trạng thái đã xử lý (completed / skipped)
                    const completion = taskCompletions.find(
                      (c) =>
                        (seriesTaskIds.has(c.taskId) || c.taskId === series.seriesId) &&
                        c.date === dayStr
                    );

                    if (completion?.status === 'completed') {
                      return (
                        <td
                          key={dayStr}
                          className="px-2 py-2 text-center"
                          title={t('motivation.status_completed')}
                        >
                          <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                            <Check size={14} strokeWidth={2.5} />
                          </div>
                        </td>
                      );
                    }

                    if (completion?.status === 'skipped') {
                      return (
                        <td
                          key={dayStr}
                          className="px-2 py-2 text-center"
                          title={t('motivation.status_skipped')}
                        >
                          <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 mx-auto">
                            <Ban size={14} strokeWidth={2} />
                          </div>
                        </td>
                      );
                    }

                    // 2. Chưa xử lý: kiểm tra xem ngày này có active task hay không
                    // - Task không có deadline: CHỈ active ở đúng ngày startDate
                    // - Task có deadline: active trong khoảng [startDate, deadline]
                    const activeTask = series.tasks.find((t) => {
                      if (!t.deadline) {
                        return t.startDate === dayStr;
                      }
                      const deadlineDateStr = t.deadline.split('T')[0];
                      return t.startDate <= dayStr && dayStr <= deadlineDateStr;
                    });

                    if (!activeTask) {
                      return (
                        <td
                          key={dayStr}
                          className="px-2 py-2 text-center text-gray-300"
                          title={t('motivation.status_inactive')}
                        >
                          —
                        </td>
                      );
                    }

                    // 3. Có active task chưa xử lý
                    const isFuture = dayStr > todayStr;
                    if (isFuture) {
                      return (
                        <td key={dayStr} className="px-2 py-2 text-center">
                          <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-gray-50 border border-dashed border-gray-200 mx-auto" />
                        </td>
                      );
                    }

                    // Hôm nay hoặc quá khứ chưa xử lý: nút bấm tick nhanh
                    return (
                      <td key={dayStr} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickComplete(activeTask.id, dayStr)}
                          title={t('motivation.status_pending')}
                          className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-white border border-gray-300 hover:border-do_now hover:bg-teal-50 hover:text-do_now transition cursor-pointer mx-auto text-transparent"
                        >
                          <Check size={14} strokeWidth={2.5} />
                        </button>
                      </td>
                    );
                  })}

                  {/* Progress Bar */}
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2 w-[120px]">
                      <div className="flex-1 bg-gray-100 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-do_now h-2 rounded-full transition-all duration-500"
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
