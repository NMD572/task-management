'use client';

import { Suspense, useMemo } from 'react';
import Link from 'next/link';
import { format, parseISO } from 'date-fns';
import {
  ArrowLeft,
  CheckCircle2,
  Ban,
  Check,
  Calendar,
  Tag,
  MessageSquare,
  History,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import { FilterProvider } from '@/lib/filterContext';
import { useAppStore } from '@/lib/store';
import type { TaskCompletion } from '@/lib/types';

function CompletedTasksContent() {
  const taskCompletions = useAppStore((s) => s.taskCompletions);
  const tasks           = useAppStore((s) => s.tasks);
  const labels          = useAppStore((s) => s.labels);

  // Sort completions by date descending (newest first)
  const sortedCompletions = useMemo(() => {
    return [...taskCompletions].sort((a, b) => {
      return b.date.localeCompare(a.date);
    });
  }, [taskCompletions]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        {/* ── Breadcrumb / Header Navigation ── */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-do_now transition"
          >
            <ArrowLeft size={16} />
            Quay lại Ma trận
          </Link>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs">
            <History size={13} className="text-do_now" />
            {sortedCompletions.length} lượt đã xử lý
          </span>
        </div>

        {/* ── Page Title ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-do_now flex items-center justify-center border border-teal-100 shadow-sm">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Task đã hoàn thành &amp; bỏ qua</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Lịch sử toàn bộ các công việc đã được xử lý theo từng ngày
              </p>
            </div>
          </div>
        </div>

        {/* ── Content List ── */}
        {sortedCompletions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 shadow-sm">
            <CheckCircle2 size={44} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold text-gray-700">Chưa có task nào được xử lý</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              Khi bạn đánh dấu Hoàn thành hoặc Bỏ qua một task trong Ma trận, lịch sử xử lý sẽ xuất hiện tại đây.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {sortedCompletions.map((tc: TaskCompletion, idx: number) => {
              const task = tasks.find((t) => t.id === tc.taskId);
              const label = task ? labels.find((l) => l.id === task.labelId) : null;
              const isCompleted = tc.status === 'completed';

              let formattedDate = tc.date;
              try {
                formattedDate = format(parseISO(tc.date), 'dd/MM/yyyy');
              } catch {
                formattedDate = tc.date;
              }

              return (
                <div
                  key={`${tc.taskId}-${tc.date}-${idx}`}
                  className="p-4 sm:p-5 flex flex-col gap-3 hover:bg-gray-50/60 transition"
                >
                  {/* Row 1: Date + Status Badge + Label */}
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div className="flex items-center gap-2">
                      <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-700 bg-gray-100 px-2.5 py-1 rounded-md">
                        <Calendar size={13} className="text-gray-500" />
                        {formattedDate}
                      </span>

                      {/* Status Badge */}
                      {isCompleted ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={12} strokeWidth={2.5} />
                          Hoàn thành
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-gray-100 text-gray-600 border border-gray-200">
                          <Ban size={12} />
                          Bỏ qua
                        </span>
                      )}
                    </div>

                    {/* Label */}
                    {label && (
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                        style={{ backgroundColor: label.color }}
                      >
                        <Tag size={10} />
                        {label.name}
                      </span>
                    )}
                  </div>

                  {/* Row 2: Task Name */}
                  <div>
                    <h3
                      className={`text-sm font-semibold leading-snug ${
                        isCompleted ? 'text-gray-900' : 'text-gray-600'
                      }`}
                    >
                      {task ? task.name : <span className="italic text-gray-400">(Task đã xoá)</span>}
                    </h3>
                  </div>

                  {/* Row 3: Note (if exists) */}
                  {tc.note && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <MessageSquare size={14} className="text-do_now shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700 not-italic block mb-0.5">Ghi chú:</span>
                        <p className="italic leading-relaxed whitespace-pre-wrap">{tc.note}</p>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}

export default function CompletedTasksPage() {
  return (
    <Suspense>
      <FilterProvider>
        <CompletedTasksContent />
      </FilterProvider>
    </Suspense>
  );
}
