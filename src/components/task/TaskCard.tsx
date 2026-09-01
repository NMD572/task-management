'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { Pencil, Trash2, CalendarDays, Tag } from 'lucide-react';
import TaskModal from './TaskModal';
import { useAppStore } from '@/lib/store';
import type { Task } from '@/lib/types';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const labels     = useAppStore((s) => s.labels);
  const deleteTask = useAppStore((s) => s.deleteTask);

  const label = labels.find((l) => l.id === task.labelId);

  // Format deadline: "dd/MM" hoặc "dd/MM HH:mm" nếu có giờ
  const deadlineText = task.deadline
    ? format(parseISO(task.deadline), 'dd/MM HH:mm')
    : null;

  // Check if past deadline
  const isOverdue = task.deadline
    ? new Date(task.deadline) < new Date()
    : false;

  function handleDelete() {
    if (confirm(`Xoá task "${task.name}"?`)) {
      deleteTask(task.id);
    }
  }

  return (
    <>
      <div className="group bg-white rounded-xl border border-gray-200 shadow-sm px-4 py-3 flex flex-col gap-2 hover:shadow-md transition-shadow">
        {/* ── Task name ── */}
        <p className="text-sm font-medium text-gray-800 leading-snug line-clamp-2">
          {task.name}
        </p>

        {/* ── Meta row: label + deadline ── */}
        <div className="flex items-center gap-2 flex-wrap">
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
                isOverdue
                  ? 'bg-red-100 text-red-600'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CalendarDays size={10} />
              {deadlineText}
              {isOverdue && ' ⚠'}
            </span>
          )}

          {/* Recurring indicator */}
          {task.isRecurring && (
            <span className="inline-flex items-center rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-500">
              🔁 Lặp lại
            </span>
          )}
        </div>

        {/* ── Actions (visible on hover / focus-within) ── */}
        <div className="flex items-center gap-1 justify-end opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
          <button
            type="button"
            onClick={() => setEditOpen(true)}
            aria-label="Sửa task"
            className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
          >
            <Pencil size={14} />
          </button>
          <button
            type="button"
            onClick={handleDelete}
            aria-label="Xoá task"
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
