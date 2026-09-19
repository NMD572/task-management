'use client';

import { Suspense, useMemo, useState, useRef, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
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
import { useLanguage } from '@/lib/languageContext';
import { useAppStore } from '@/lib/store';
import type { TaskCompletion } from '@/lib/types';

// Default date range: today (From = today, To = today, ISO yyyy-MM-dd)
function getDefaultDateFrom() {
  return format(new Date(), 'yyyy-MM-dd');
}
function getDefaultDateTo() {
  return format(new Date(), 'yyyy-MM-dd');
}

function CompletedTasksContent() {
  const { t }        = useLanguage();
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const taskCompletions = useAppStore((s) => s.taskCompletions);
  const tasks           = useAppStore((s) => s.tasks);
  const labels          = useAppStore((s) => s.labels);

  const defaultFrom = getDefaultDateFrom();
  const defaultTo   = getDefaultDateTo();

  // Read initial dates from URL query params or fallback to current week
  const [dateFrom, setDateFrom] = useState(() => searchParams.get('from') || defaultFrom);
  const [dateTo,   setDateTo]   = useState(() => searchParams.get('to')   || defaultTo);

  // Sync state with URL when back/forward navigation occurs
  useEffect(() => {
    const urlFrom = searchParams.get('from');
    const urlTo   = searchParams.get('to');
    setDateFrom(urlFrom || defaultFrom);
    setDateTo(urlTo     || defaultTo);
  }, [searchParams, defaultFrom, defaultTo]);

  // Push filter to URL query params (?from=...&to=...)
  const pushURL = useCallback(
    (newFrom: string, newTo: string) => {
      startTransition(() => {
        const params = new URLSearchParams(searchParams.toString());
        const isCustom = newFrom !== defaultFrom || newTo !== defaultTo;
        if (isCustom) {
          if (newFrom) params.set('from', newFrom);
          else params.delete('from');
          if (newTo) params.set('to', newTo);
          else params.delete('to');
        } else {
          params.delete('from');
          params.delete('to');
        }
        const str = params.toString();
        router.replace(`${pathname}${str ? `?${str}` : ''}`, { scroll: false });
      });
    },
    [router, pathname, searchParams, defaultFrom, defaultTo]
  );

  // Handle date changes with range auto-correction and URL sync
  const handleSetDateFrom = (newFrom: string) => {
    const adjustedTo = dateTo && newFrom && dateTo < newFrom ? newFrom : dateTo;
    setDateFrom(newFrom);
    if (adjustedTo !== dateTo) {
      setDateTo(adjustedTo);
    }
    pushURL(newFrom, adjustedTo);
  };

  const handleSetDateTo = (newTo: string) => {
    const adjustedFrom = dateFrom && newTo && dateFrom > newTo ? newTo : dateFrom;
    setDateTo(newTo);
    if (adjustedFrom !== dateFrom) {
      setDateFrom(adjustedFrom);
    }
    pushURL(adjustedFrom, newTo);
  };

  // Clear filter resets to current week and cleans URL
  const clearFilter = () => {
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
    pushURL(defaultFrom, defaultTo);
  };

  // Refs for showPicker()
  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef   = useRef<HTMLInputElement>(null);

  // Filter completions by selected date range (inclusive) and sort descending
  const filteredCompletions = useMemo(() => {
    const filtered = taskCompletions.filter((tc) => {
      return tc.date >= dateFrom && tc.date <= dateTo;
    });
    return [...filtered].sort((a, b) => b.date.localeCompare(a.date));
  }, [taskCompletions, dateFrom, dateTo]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-4xl px-4 py-8">
        {/* Date range filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap">
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
            {/* From date */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => {
                  try {
                    fromInputRef.current?.showPicker();
                  } catch {
                    fromInputRef.current?.focus();
                  }
                }}
                className="flex items-center gap-1.5 text-sm text-gray-700 hover:text-do_now transition cursor-pointer"
                aria-label={t('filter.from_date_aria')}
              >
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <span>
                  {dateFrom
                    ? format(parseISO(dateFrom), 'dd/MM/yyyy')
                    : <span className="text-gray-400">dd/MM/yyyy</span>
                  }
                </span>
              </button>
              <input
                ref={fromInputRef}
                type="date"
                value={dateFrom}
                onChange={(e) => handleSetDateFrom(e.target.value)}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              />
            </div>

            <span className="text-gray-400 select-none">→</span>

            {/* To date */}
            <div className="relative flex items-center">
              <button
                type="button"
                onClick={() => {
                  try {
                    toInputRef.current?.showPicker();
                  } catch {
                    toInputRef.current?.focus();
                  }
                }}
                className="text-sm text-gray-700 hover:text-do_now transition cursor-pointer"
                aria-label={t('filter.to_date_aria')}
              >
                {dateTo
                  ? format(parseISO(dateTo), 'dd/MM/yyyy')
                  : <span className="text-gray-400">dd/MM/yyyy</span>
                }
              </button>
              <input
                ref={toInputRef}
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => handleSetDateTo(e.target.value)}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              />
            </div>
          </div>

          <button
            type="button"
            onClick={clearFilter}
            className="px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
          >
            {t('filter.clear_filter')}
          </button>
        </div>

        {/* ── Breadcrumb / Header Navigation ── */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-do_now transition"
          >
            <ArrowLeft size={16} />
            {t('completed.back_to_matrix')}
          </Link>

          <span className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 bg-white px-3 py-1.5 rounded-full border border-gray-200 shadow-xs">
            <History size={13} className="text-do_now" />
            {t('completed.tasks_processed', { count: filteredCompletions.length })}
          </span>
        </div>

        {/* ── Page Title ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-do_now flex items-center justify-center border border-teal-100 shadow-sm">
              <CheckCircle2 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('completed.title')}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('completed.subtitle')}
              </p>
            </div>
          </div>
        </div>

        {/* ── Content List ── */}
        {filteredCompletions.length === 0 ? (
          <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-400 shadow-sm">
            <CheckCircle2 size={44} className="mx-auto text-gray-300 mb-3" />
            <p className="text-base font-semibold text-gray-700">{t('completed.empty_title')}</p>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto">
              {t('completed.empty_description')}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden divide-y divide-gray-100">
            {filteredCompletions.map((tc: TaskCompletion, idx: number) => {
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
                          {t('completed.status_completed')}
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-700 border border-amber-200">
                          <Ban size={12} />
                          {t('completed.status_skipped')}
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
                        {label.isDefault && (label.id === 'personal' || label.id === 'work' || label.id === 'learning')
                          ? t(`labels.${label.id}`)
                          : label.name}
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
                      {task ? task.name : <span className="italic text-gray-400">{t('completed.task_deleted')}</span>}
                    </h3>
                  </div>

                  {/* Row 3: Note (if exists) */}
                  {tc.note && (
                    <div className="flex items-start gap-2 text-xs text-gray-600 bg-gray-50 rounded-xl p-3 border border-gray-100">
                      <MessageSquare size={14} className="text-do_now shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <span className="font-semibold text-gray-700 not-italic block mb-0.5">{t('completed.note_label')}</span>
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
