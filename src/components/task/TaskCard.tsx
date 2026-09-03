'use client';

import { useState } from 'react';
import { format, parseISO } from 'date-fns';
import {
  Pencil,
  Trash2,
  CalendarDays,
  Tag,
  Check,
  Ban,
  Repeat,
  RotateCcw,
  MessageSquare,
} from 'lucide-react';
import TaskModal from './TaskModal';
import ConfirmModal from '@/components/common/ConfirmModal';
import { useAppStore } from '@/lib/store';
import { generateNextOccurrence } from '@/lib/recurring';
import type { Task, TaskCompletionStatus } from '@/lib/types';

interface TaskCardProps {
  task: Task;
}

export default function TaskCard({ task }: TaskCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);

  // Completion modal state
  const [completionModal, setCompletionModal] = useState<{
    open: boolean;
    status: TaskCompletionStatus;
  } | null>(null);
  const [completionNote, setCompletionNote] = useState('');

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
  const todayCompletion = taskCompletions.find(
    (tc) => tc.taskId === task.id && tc.date === todayStr
  );

  const isCompletedToday = todayCompletion?.status === 'completed';
  const isSkippedToday   = todayCompletion?.status === 'skipped';

  // Format deadline: "dd/MM" hoặc "dd/MM HH:mm" nếu có giờ
  const deadlineText = task.deadline
    ? format(parseISO(task.deadline), 'dd/MM HH:mm')
    : null;

  // Check if past deadline
  const isOverdue = task.deadline
    ? new Date(task.deadline) < new Date()
    : false;

  function handleOpenCompletionModal(status: TaskCompletionStatus) {
    setCompletionModal({ open: true, status });
    setCompletionNote('');
  }

  function handleConfirmCompletion() {
    if (!completionModal) return;

    const status = completionModal.status;
    const note = completionNote.trim() || undefined;

    // 1. Record completion/skip for today
    addTaskCompletion({
      taskId: task.id,
      date: todayStr,
      status,
      note,
    });

    // 2. If task is recurring and onlyRepeatWhenPrevDone is true,
    // both 'completed' and 'skipped' generate the next occurrence
    if (task.isRecurring && task.onlyRepeatWhenPrevDone) {
      const nextOccurrence = generateNextOccurrence(task);
      if (nextOccurrence) {
        // Current task is resolved and transfers recurrence
        updateTask(task.id, { isRecurring: false });
        addTask(nextOccurrence);
      }
    }

    setCompletionModal(null);
    setCompletionNote('');
  }

  function handleConfirmDelete() {
    deleteTask(task.id);
  }

  return (
    <>
      <div
        className={`group bg-white rounded-xl border shadow-sm px-4 py-3 flex flex-col gap-2.5 hover:shadow-md transition-all ${
          isCompletedToday
            ? 'border-emerald-200 bg-emerald-50/20 opacity-60 hover:opacity-100'
            : isSkippedToday
            ? 'border-gray-200 bg-gray-50/60 opacity-60 hover:opacity-100'
            : 'border-gray-200'
        }`}
      >
        {/* ── Top row: Task name + Edit/Delete actions ── */}
        <div className="flex items-start justify-between gap-2">
          {/* Task name */}
          <p
            className={`text-sm font-medium leading-snug line-clamp-2 flex-1 transition ${
              isCompletedToday
                ? 'line-through text-gray-400'
                : isSkippedToday
                ? 'text-gray-500 italic'
                : 'text-gray-800'
            }`}
          >
            {task.name}
          </p>

          {/* Quick Edit/Delete Actions (visible on hover / focus-within) */}
          <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity shrink-0">
            <button
              type="button"
              onClick={() => setEditOpen(true)}
              aria-label="Sửa task"
              title="Sửa task"
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <Pencil size={13} />
            </button>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              aria-label="Xoá task"
              title="Xoá task"
              className="rounded-lg p-1 text-gray-400 hover:bg-red-50 hover:text-red-500 transition"
            >
              <Trash2 size={13} />
            </button>
          </div>
        </div>

        {/* ── Meta row: label + deadline + recurring ── */}
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
                isCompletedToday || isSkippedToday
                  ? 'bg-gray-100 text-gray-400'
                  : isOverdue
                  ? 'bg-red-100 text-red-600 font-semibold'
                  : 'bg-gray-100 text-gray-600'
              }`}
            >
              <CalendarDays size={10} />
              {deadlineText}
              {!isCompletedToday && !isSkippedToday && isOverdue && ' ⚠'}
            </span>
          )}

          {/* Recurring indicator */}
          {task.isRecurring && (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600"
              title={`Lặp lại mỗi ${task.recurringIntervalDays} ngày ${
                task.onlyRepeatWhenPrevDone ? '(khi hoàn thành/bỏ qua)' : '(cố định)'
              }`}
            >
              <Repeat size={10} />
              {task.recurringIntervalDays}d
              {task.onlyRepeatWhenPrevDone ? ' ✓' : ' ↻'}
            </span>
          )}
        </div>

        {/* ── Note display if exists for today ── */}
        {todayCompletion?.note && (
          <div className="text-xs text-gray-600 bg-gray-50/80 rounded-lg p-2 border border-gray-100 flex items-start gap-1.5">
            <MessageSquare size={13} className="text-gray-400 mt-0.5 shrink-0" />
            <span className="italic leading-relaxed">{todayCompletion.note}</span>
          </div>
        )}

        {/* ── Bottom row: Status badge or Action buttons (Hoàn thành / Bỏ qua) ── */}
        <div className="pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
          {todayCompletion ? (
            /* Already processed today */
            <div className="flex items-center justify-between w-full">
              {isCompletedToday ? (
                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-xs font-medium text-emerald-700">
                  <Check size={12} strokeWidth={2.5} />
                  Đã hoàn thành
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-xs font-medium text-amber-700">
                  <Ban size={12} />
                  Đã bỏ qua
                </span>
              )}

              {/* Undo action */}
              <button
                type="button"
                onClick={() => removeTaskCompletion(task.id, todayStr)}
                title="Huỷ đánh dấu hôm nay"
                className="inline-flex items-center gap-1 text-xs text-gray-400 hover:text-red-500 transition py-0.5 px-1.5 rounded hover:bg-gray-100"
              >
                <RotateCcw size={11} />
                Huỷ
              </button>
            </div>
          ) : (
            /* Action buttons: Hoàn thành & Bỏ qua */
            <div className="flex items-center gap-2 w-full">
              <button
                type="button"
                onClick={() => handleOpenCompletionModal('completed')}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50/80 hover:bg-emerald-100 text-emerald-700 px-2.5 py-1.5 text-xs font-semibold transition shadow-xs"
              >
                <Check size={13} strokeWidth={2.5} />
                Hoàn thành
              </button>

              <button
                type="button"
                onClick={() => handleOpenCompletionModal('skipped')}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-200 bg-gray-50 hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700 text-gray-600 px-2.5 py-1.5 text-xs font-medium transition"
              >
                <Ban size={13} />
                Bỏ qua
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Edit modal */}
      <TaskModal
        task={task}
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
      />

      {/* Delete confirmation modal */}
      <ConfirmModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
        title="Xoá task"
        variant="danger"
        confirmText="Xoá task"
        cancelText="Huỷ"
        message={
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xoá task{' '}
            <strong className="text-gray-900 font-semibold">&ldquo;{task.name}&rdquo;</strong> không?
            Hành động này không thể hoàn tác.
          </p>
        }
      />

      {/* Complete / Skip confirmation modal with optional note */}
      <ConfirmModal
        isOpen={!!completionModal}
        onClose={() => {
          setCompletionModal(null);
          setCompletionNote('');
        }}
        onConfirm={handleConfirmCompletion}
        title={
          completionModal?.status === 'completed'
            ? 'Hoàn thành task hôm nay'
            : 'Bỏ qua task hôm nay'
        }
        variant={completionModal?.status === 'completed' ? 'primary' : 'warning'}
        confirmText={
          completionModal?.status === 'completed'
            ? 'Xác nhận hoàn thành'
            : 'Xác nhận bỏ qua'
        }
        cancelText="Huỷ"
        message={
          <p className="text-gray-600">
            {completionModal?.status === 'completed' ? (
              <span>
                Xác nhận hoàn thành task{' '}
                <strong className="text-gray-900 font-semibold">&ldquo;{task.name}&rdquo;</strong> cho
                ngày hôm nay ({format(new Date(), 'dd/MM/yyyy')})?
              </span>
            ) : (
              <span>
                Đánh dấu không thể hoàn thành task{' '}
                <strong className="text-gray-900 font-semibold">&ldquo;{task.name}&rdquo;</strong> cho
                ngày hôm nay ({format(new Date(), 'dd/MM/yyyy')})?
              </span>
            )}
          </p>
        }
      >
        <div className="flex flex-col gap-1.5 pt-1">
          <label className="text-xs font-medium text-gray-700">
            Ghi chú thêm (không bắt buộc):
          </label>
          <textarea
            rows={3}
            value={completionNote}
            onChange={(e) => setCompletionNote(e.target.value)}
            placeholder={
              completionModal?.status === 'completed'
                ? 'Nhập kết quả, kinh nghiệm hoặc cảm nhận...'
                : 'Nhập lý do không thể hoàn thành...'
            }
            className="w-full rounded-lg border border-gray-300 p-2.5 text-sm bg-white focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now resize-y min-h-[80px]"
          />
        </div>
      </ConfirmModal>
    </>
  );
}
