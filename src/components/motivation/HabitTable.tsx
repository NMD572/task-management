'use client';

import { useMemo } from 'react';
import { format, eachDayOfInterval, startOfDay, endOfDay, parseISO } from 'date-fns';
import { Check, Ban } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import { calculateSeriesCompletionRate } from '@/lib/completion';
import type { Task, TaskCompletion } from '@/lib/types';

interface HabitTableProps {
  rangeStart: Date;
  rangeEnd: Date;
  searchText?: string;
  labelIds?: string[];
}

interface TaskSeriesGroup {
  seriesId: string;
  name: string;
  labelId: string;
  isRecurring: boolean;
  tasks: Task[];
  taskIdsList: string[];
}

type CellStatus =
  | { type: 'completed' }
  | { type: 'skipped' }
  | { type: 'pending'; targetTaskId: string; isFuture: boolean }
  | { type: 'empty' };

interface SeriesRowData {
  series: TaskSeriesGroup;
  pct: number;
  cellStatuses: Map<string, CellStatus>;
}

// Helper to look up completion for any task in a series on a specific date
function getSeriesCompletion(
  series: TaskSeriesGroup,
  dateStr: string,
  completionMap: Map<string, TaskCompletion>
): TaskCompletion | undefined {
  // Check root seriesId
  const rootComp = completionMap.get(`${series.seriesId}_${dateStr}`);
  if (rootComp) return rootComp;

  // Check each occurrence ID in series
  for (const taskId of series.taskIdsList) {
    const comp = completionMap.get(`${taskId}_${dateStr}`);
    if (comp) return comp;
  }
  return undefined;
}

export default function HabitTable({
  rangeStart,
  rangeEnd,
  searchText = '',
  labelIds = [],
}: HabitTableProps) {
  const { t } = useLanguage();
  const tasks = useAppStore((s) => s.tasks);
  const labels = useAppStore((s) => s.labels);
  const taskCompletions = useAppStore((s) => s.taskCompletions);
  const addTaskCompletion = useAppStore((s) => s.addTaskCompletion);

  const todayStr = format(new Date(), 'yyyy-MM-dd');

  // Days list for the selected range only
  const days = useMemo(() => {
    return eachDayOfInterval({ start: rangeStart, end: rangeEnd }).map((d) => ({
      dateObj: d,
      dateStr: format(d, 'yyyy-MM-dd'),
      label: format(d, 'dd/MM'),
    }));
  }, [rangeStart, rangeEnd]);

  // Prompt 32 Performance Optimization:
  // Pre-index completions into a Map<`${taskId}_${date}`, TaskCompletion>
  // and a Set<taskId> for quick O(1) lookups instead of scanning taskCompletions repeatedly.
  const { completionMap, processedTaskIds } = useMemo(() => {
    const map = new Map<string, TaskCompletion>();
    const processed = new Set<string>();

    for (const c of taskCompletions) {
      map.set(`${c.taskId}_${c.date}`, c);
      processed.add(c.taskId);
    }

    return { completionMap: map, processedTaskIds: processed };
  }, [taskCompletions]);

  // Prompt 31 Requirement 1 & 2:
  // Filter tasks using search text, labelIds, and Matrix 4 ô date-range visibility rules
  const filteredTasks = useMemo(() => {
    const rangeStartObj = rangeStart ? startOfDay(rangeStart) : null;
    const rangeEndObj = rangeEnd ? endOfDay(rangeEnd) : null;

    return tasks.filter((task) => {
      // 1. Search text filter (case-insensitive)
      if (searchText && searchText.trim()) {
        const q = searchText.trim().toLowerCase();
        if (!task.name.toLowerCase().includes(q)) return false;
      }

      // 2. Label filter
      if (labelIds && labelIds.length > 0) {
        if (!labelIds.includes(task.labelId)) return false;
      }

      // 3. Date range filter (same logic as Matrix 4 ô)
      if (task.startDate) {
        const taskStart = startOfDay(parseISO(task.startDate));
        if (rangeEndObj && taskStart > rangeEndObj) {
          return false;
        }
        if (rangeStartObj && task.deadline) {
          const taskDeadline = parseISO(task.deadline);
          if (taskDeadline < rangeStartObj) {
            return false;
          }
        }
      }

      return true;
    });
  }, [tasks, searchText, labelIds, rangeStart, rangeEnd]);

  // Prompt 30: Group filtered tasks by seriesId into 1 series representation
  const seriesGroups = useMemo(() => {
    const map = new Map<string, TaskSeriesGroup>();

    for (const task of filteredTasks) {
      const seriesId = task.seriesId ?? task.id;
      const existing = map.get(seriesId);
      if (existing) {
        existing.tasks.push(task);
        existing.taskIdsList.push(task.id);
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
          taskIdsList: [task.id],
        });
      }
    }

    const list = Array.from(map.values());
    const recurring = list.filter((g) => g.isRecurring);
    const nonRecurring = list.filter((g) => !g.isRecurring);
    return [...recurring, ...nonRecurring];
  }, [filteredTasks]);

  // Prompt 32 Requirement 1, 2, 4:
  // Compute cell statuses for each series across the date range.
  // Filter out any row where ALL days in the range have status "—" (empty).
  const visibleRows = useMemo(() => {
    const rows: SeriesRowData[] = [];

    for (const series of seriesGroups) {
      const cellStatuses = new Map<string, CellStatus>();
      let hasDataInRow = false;

      for (const day of days) {
        const dayStr = day.dateStr;

        // 1. Ưu tiên kiểm tra completion đã lưu ở ngày này
        const completion = getSeriesCompletion(series, dayStr, completionMap);

        if (completion?.status === 'completed') {
          cellStatuses.set(dayStr, { type: 'completed' });
          hasDataInRow = true;
          continue;
        }

        if (completion?.status === 'skipped') {
          cellStatuses.set(dayStr, { type: 'skipped' });
          hasDataInRow = true;
          continue;
        }

        // 2. Không có completion ở ngày này: kiểm tra xem có task chưa xử lý có targetDate === dayStr không
        // - Task có deadline: targetDate là ngày deadline (chỉ tại đúng ngày deadline)
        // - Task không có deadline: targetDate là startDate (chỉ tại đúng ngày startDate)
        // - Chỉ hiển thị khi task CHƯA được xử lý ở bất kỳ ngày nào
        const untreatedTask = series.tasks.find((t) => {
          if (processedTaskIds.has(t.id)) return false;

          const targetDate = t.deadline ? t.deadline.split('T')[0] : t.startDate;
          return targetDate === dayStr;
        });

        if (untreatedTask) {
          const isFuture = dayStr > todayStr;
          cellStatuses.set(dayStr, {
            type: 'pending',
            targetTaskId: untreatedTask.id,
            isFuture,
          });
          hasDataInRow = true;
          continue;
        }

        // 3. Các ngày còn lại: "—" (không có dữ liệu)
        cellStatuses.set(dayStr, { type: 'empty' });
      }

      // Prompt 32 Requirement 1:
      // Chỉ hiển thị task/series có ít nhất một ngày trong khoảng đang chọn mà trạng thái không phải dấu "—".
      // Nếu tất cả ngày trong khoảng đều là "—", không hiển thị dòng task/series đó.
      if (hasDataInRow) {
        const pct = calculateSeriesCompletionRate(
          series.tasks,
          series.seriesId,
          taskCompletions,
          rangeStart,
          rangeEnd
        );

        rows.push({
          series,
          pct,
          cellStatuses,
        });
      }
    }

    return rows;
  }, [seriesGroups, days, completionMap, processedTaskIds, todayStr, taskCompletions, rangeStart, rangeEnd]);

  const handleQuickComplete = (taskId: string, date: string) => {
    addTaskCompletion({
      taskId,
      date,
      status: 'completed',
    });
  };

  if (visibleRows.length === 0) {
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
              <th className="px-4 py-3 sticky left-0 z-10 bg-gray-50 border-r border-gray-200 min-w-[140px] sm:min-w-[200px]">
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
            {visibleRows.map(({ series, pct, cellStatuses }) => {
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
                      <span className="truncate max-w-[100px] sm:max-w-[180px]" title={series.name}>
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
                    const cell = cellStatuses.get(dayStr) ?? { type: 'empty' };

                    // 1. Completed
                    if (cell.type === 'completed') {
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

                    // 2. Skipped
                    if (cell.type === 'skipped') {
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

                    // 3. Pending untreated task on target date
                    if (cell.type === 'pending') {
                      // Ngày tương lai: vòng tròn nét đứt
                      if (cell.isFuture) {
                        return (
                          <td key={dayStr} className="px-2 py-2 text-center">
                            <div className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-gray-50 border border-dashed border-gray-200 mx-auto" />
                          </td>
                        );
                      }

                      // Hôm nay hoặc quá khứ: nút bấm tick nhanh
                      return (
                        <td key={dayStr} className="px-2 py-2 text-center">
                          <button
                            type="button"
                            onClick={() => handleQuickComplete(cell.targetTaskId, dayStr)}
                            title={t('motivation.status_pending')}
                            className="inline-flex w-7 h-7 items-center justify-center rounded-full bg-white border border-gray-300 hover:border-do_now hover:bg-teal-50 hover:text-do_now transition cursor-pointer mx-auto text-transparent"
                          >
                            <Check size={14} strokeWidth={2.5} />
                          </button>
                        </td>
                      );
                    }

                    // 4. Empty / Inactive day: "—"
                    return (
                      <td
                        key={dayStr}
                        className="px-2 py-2 text-center text-gray-300"
                        title={t('motivation.status_inactive')}
                      >
                        —
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
