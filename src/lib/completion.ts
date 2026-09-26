import { parseISO, eachDayOfInterval, isAfter, isBefore, startOfDay, format } from 'date-fns';
import type { Task, TaskCompletion } from './types';

/**
 * Tính % hoàn thành của một task trong khoảng [rangeStart, rangeEnd].
 *
 * - Mẫu số (denominator): các ngày trong range mà task "active"
 *   (startDate <= ngày <= deadline, hoặc startDate <= ngày nếu không có deadline)
 * - Tử số (numerator): số ngày có TaskCompletion.status === 'completed'
 * - Ngày có status === 'skipped' KHÔNG tính là hoàn thành nhưng vẫn tính vào mẫu số
 * - Trả về Math.round(numerator / denominator * 100), hoặc 0 nếu denominator = 0
 */
export function calculateCompletionRate(
  task: Task,
  completions: TaskCompletion[],
  rangeStart: Date,
  rangeEnd: Date
): number {
  // Lấy danh sách các ngày trong range
  const days = eachDayOfInterval({ start: rangeStart, end: rangeEnd });

  // Completions chỉ của task này
  const taskCompletions = completions.filter((c) => c.taskId === task.id);

  let activeDays = 0;
  let completedDays = 0;

  const taskStart = startOfDay(parseISO(task.startDate));
  const taskDeadline = task.deadline ? startOfDay(parseISO(task.deadline)) : null;

  for (const day of days) {
    const dayStr = format(day, 'yyyy-MM-dd');

    // Kiểm tra ngày có nằm trong "active window" của task không
    const isActive =
      !isBefore(day, taskStart) && (taskDeadline === null || !isAfter(day, taskDeadline));

    if (!isActive) continue;

    activeDays++;

    const completion = taskCompletions.find((c) => c.date === dayStr);
    if (completion?.status === 'completed') {
      completedDays++;
    }
  }

  if (activeDays === 0) return 0;
  return Math.round((completedDays / activeDays) * 100);
}
