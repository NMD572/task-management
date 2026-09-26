'use client';

import { useMemo } from 'react';
import { format, parseISO, eachDayOfInterval, isBefore, isAfter, startOfDay } from 'date-fns';
import { Check, Ban } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import { calculateCompletionRate } from '@/lib/completion';

interface HabitTableProps {
  rangeStart: Date;
  rangeEnd: Date;
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

  // Filter tasks to show in table: we might only want to show recurring tasks or all tasks. 
  // Let's show all tasks but group recurring first.
  const displayTasks = useMemo(() => {
    const recurring = tasks.filter((t) => t.isRecurring);
    const nonRecurring = tasks.filter((t) => !t.isRecurring);
    return [...recurring, ...nonRecurring];
  }, [tasks]);

  const handleQuickComplete = (taskId: string, date: string) => {
    addTaskCompletion({
      taskId,
      date,
      status: 'completed',
    });
  };

  if (displayTasks.length === 0) {
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
            {displayTasks.map((task) => {
              const pct = calculateCompletionRate(task, taskCompletions, rangeStart, rangeEnd);
              const label = labels.find((l) => l.id === task.labelId);
              
              const taskStart = startOfDay(parseISO(task.startDate));
              const taskDeadline = task.deadline ? startOfDay(parseISO(task.deadline)) : null;

              return (
                <tr key={task.id} className="hover:bg-gray-50/50 transition">
                  {/* Task Name (Sticky left) */}
                  <td className="px-4 py-3 sticky left-0 z-10 bg-white border-r border-gray-100 font-medium">
                    <div className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: label?.color || '#ccc' }}
                      />
                      <span className="truncate max-w-[180px]" title={task.name}>
                        {task.name}
                      </span>
                    </div>
                  </td>
                  
                  {/* % */}
                  <td className="px-4 py-3 text-center font-semibold text-gray-700">
                    {pct}%
                  </td>

                  {/* Days */}
                  {days.map((day) => {
                    // Determine status
                    const isActive = !isBefore(day.dateObj, taskStart) && (taskDeadline === null || !isAfter(day.dateObj, taskDeadline));
                    const completion = taskCompletions.find((c) => c.taskId === task.id && c.date === day.dateStr);

                    if (!isActive) {
                      return (
                        <td key={day.dateStr} className="px-2 py-2 text-center text-gray-300" title={t('motivation.status_inactive')}>
                          —
                        </td>
                      );
                    }

                    if (completion?.status === 'completed') {
                      return (
                        <td key={day.dateStr} className="px-2 py-2 text-center" title={t('motivation.status_completed')}>
                          <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 mx-auto">
                            <Check size={14} strokeWidth={2.5} />
                          </div>
                        </td>
                      );
                    }

                    if (completion?.status === 'skipped') {
                      return (
                        <td key={day.dateStr} className="px-2 py-2 text-center" title={t('motivation.status_skipped')}>
                          <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-gray-100 text-gray-400 mx-auto">
                            <Ban size={14} strokeWidth={2} />
                          </div>
                        </td>
                      );
                    }

                    // Pending
                    const isFuture = day.dateStr > todayStr;
                    if (isFuture) {
                      return (
                        <td key={day.dateStr} className="px-2 py-2 text-center">
                          <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-gray-50 border border-dashed border-gray-200 mx-auto" />
                        </td>
                      );
                    }

                    // Past or Today without completion - Clickable to quick complete
                    return (
                      <td key={day.dateStr} className="px-2 py-2 text-center">
                        <button
                          type="button"
                          onClick={() => handleQuickComplete(task.id, day.dateStr)}
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
