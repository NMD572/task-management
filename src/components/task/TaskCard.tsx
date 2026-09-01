'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, CalendarDays, Tag, Check, Repeat } from 'lucide-react';
import TaskModal from './TaskModal';
import { useAppStore } from '@/lib/store';
import { generateNextOccurrence } from '@/lib/recurring';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const labels               = useAppStore((s) => s.labels);
  const deleteTask           = useAppStore((s) => s.deleteTask);
  const updateTask           = useAppStore((s) => s.updateTask);
  const addTask              = useAppStore((s) => s.addTask);
  const taskCompletions      = useAppStore((s) => s.taskCompletions);
  const addTaskCompletion    = useAppStore((s) => s.addTaskCompletion);
  const removeTaskCompletion = useAppStore((s) => s.removeTaskCompletion);

  const label = labels.find((l) => l.id === task.labelId);

  // Check completion for today (YYYY-MM-DD)
  const todayStr = format(new Date(), 'yyyy-MM-dd');
  const isCompletedToday = taskCompletions.some(
    (tc) => tc.taskId === task.id && tc.date === todayStr && tc.completed
  );

  // Format deadline: "dd/MM" hoặc "dd/MM HH:mm" nếu có giờ
  const deadlineText = task.deadline
    ? format(parseISO(task.deadline), 'dd/MM HH:mm')
    : null;

  // Check if past deadline
  const isOverdue = task.deadline
    ? new Date(task.deadline) < new Date()
    : false;

  function handleToggleComplete() {
    if (isCompletedToday) {
      removeTaskCompletion(task.id, todayStr);
    } else {
      // 1. Record completion for today
      addTaskCompletion({
        taskId: task.id,
        date: todayStr,
        completed: true,
      });

      // 2. If task is recurring, generate next occurrence
      if (task.isRecurring) {
        const nextOccurrence = generateNextOccurrence(task);
        if (nextOccurrence) {
          // The current task is completed and hands over recurring role to next instance
          updateTask(task.id, { isRecurring: false });
          // Add the next occurrence to store
          addTask(nextOccurrence);
        }
      }
    }
  }

  function handleDelete() {
    if (confirm(`Xoá task "${task.name}"?`)) {
      deleteTask(task.id);
    }
  }

  return (
    <>
      <div
        className={`group bg-white rounded-xl border shadow-sm px-4 py-3 flex flex-col gap-2 hover:shadow-md transition-all ${
          isCompletedToday
            ? 'border-emerald-200 bg-emerald-50/20'
            : 'border-gray-200'
        }`}
      >
        {/* ── Top row: Checkbox + Task name ── */}
        <div className="flex items-start gap-2.5">
          {/* Checkbox action: Đánh dấu hoàn thành */}
          <button
            type="button"
            onClick={handleToggleComplete}
            title={isCompletedToday ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
            aria-label={isCompletedToday ? 'Đánh dấu chưa hoàn thành' : 'Đánh dấu hoàn thành'}
            className={`mt-0.5 w-5 h-5 rounded-md border flex items-center justify-center transition shrink-0 ${
              isCompletedToday
                ? 'bg-emerald-500 border-emerald-500 text-white shadow-sm'
                : 'border-gray-300 hover:border-emerald-500 hover:bg-emerald-50 text-transparent'
            }`}
          >
            <Check size={13} strokeWidth={2.5} className={isCompletedToday ? 'opacity-100' : 'opacity-0'} />
          </button>

          {/* Task name */}
          <p
            className={`text-sm font-medium leading-snug line-clamp-2 flex-1 transition ${
              isCompletedToday
                ? 'line-through text-gray-400'
                : 'text-gray-800'
            }`}
          >
            {task.name}
          </p>
        </div>

        {/* ── Meta row: label + deadline + recurring ── */}
        <div className="flex items-center gap-2 flex-wrap pl-7.5">
          {/* Label badge */}
          {label && (
            <span
              className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: label.color }}
            >
              <Tag size={10} />
              {label.name}
            </span>
          )}

          {/* Deadline badge */}
          {deadlineText && (
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${
                isCompletedToday
                  ? 'bg-gray-100 text-gray-400'
                  : isOverdue
                  ? 'bg-red-100 text-red-600 font-semibold'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CalendarDays size={10} />
              {deadlineText}
              {!isCompletedToday && isOverdue && ' ⚠'}
            </span>
          )}

          {/* Recurring indicator */}
          {task.isRecurring && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
              title={`Lặp lại mỗi ${task.recurringIntervalDays} ngày ${
                task.onlyRepeatWhenPrevDone ? '(khi hoàn thành)' : '(cố định)'
              }`}
            >
              <Repeat size={10} />
              {task.recurringIntervalDays}d
              {task.onlyRepeatWhenPrevDone ? ' ✓' : ' ↻'}
            </span>
          )}
        </div>

        {/* ── Actions (visible on hover / focus-within) ── */}
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity pt-1 border-t border-gray-50">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Sửa task"
            title="Sửa task"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Xoá task"
            title="Xoá task"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
          >
            <Trash2 size={14} />
          </button>
        </div>
      </div>

      {/* Edit modal */}
      <TaskModal
        task={task}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />
    </>
  );
}
