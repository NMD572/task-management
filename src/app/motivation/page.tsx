'use client';

import { Suspense, useState, useRef, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ArrowLeft, Calendar, X, BarChart2 } from 'lucide-react';
import Header from '@/components/layout/Header';
import HabitTable from '@/components/motivation/HabitTable';
import { FilterProvider } from '@/lib/filterContext';
import { useLanguage } from '@/lib/languageContext';

function getDefaultDateFrom() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}
function getDefaultDateTo() {
  return format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

function MotivationContent() {
  const { t } = useLanguage();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const defaultFrom = getDefaultDateFrom();
  const defaultTo = getDefaultDateTo();

  const [dateFrom, setDateFrom] = useState(() => searchParams.get('from') || defaultFrom);
  const [dateTo, setDateTo] = useState(() => searchParams.get('to') || defaultTo);

  useEffect(() => {
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    setDateFrom(urlFrom || defaultFrom);
    setDateTo(urlTo || defaultTo);
  }, [searchParams, defaultFrom, defaultTo]);

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

  const clearFilter = () => {
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
    pushURL(defaultFrom, defaultTo);
  };

  const hasActiveFilters = dateFrom !== defaultFrom || dateTo !== defaultTo;

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const rangeStart = parseISO(dateFrom);
  const rangeEnd = parseISO(dateTo);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-8 overflow-hidden flex flex-col">
        {/* Date range filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap shrink-0">
          <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
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
              >
                <Calendar size={14} className="text-gray-400 shrink-0" />
                <span>
                  {dateFrom ? format(parseISO(dateFrom), 'dd/MM/yyyy') : <span className="text-gray-400">dd/MM/yyyy</span>}
                </span>
              </button>
              <input
                ref={fromInputRef}
                type="date"
                value={dateFrom}
                onChange={(e) => handleSetDateFrom(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                tabIndex={-1}
              />
            </div>

            <span className="text-gray-400 select-none">→</span>

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
              >
                {dateTo ? format(parseISO(dateTo), 'dd/MM/yyyy') : <span className="text-gray-400">dd/MM/yyyy</span>}
              </button>
              <input
                ref={toInputRef}
                type="date"
                value={dateTo}
                min={dateFrom}
                onChange={(e) => handleSetDateTo(e.target.value)}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
                tabIndex={-1}
              />
            </div>
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={clearFilter}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <X size={14} />
              {t('motivation.clear_filter')}
            </button>
          )}
        </div>

        {/* Breadcrumb / Header Navigation */}
        <div className="mb-6 flex items-center justify-between shrink-0">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-do_now transition"
          >
            <ArrowLeft size={16} />
            {t('motivation.back_to_matrix')}
          </Link>
        </div>

        {/* Page Title */}
        <div className="mb-8 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-do_now flex items-center justify-center border border-teal-100 shadow-sm">
              <BarChart2 size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('motivation.title')}</h1>
              <p className="text-sm text-gray-500 mt-0.5">{t('motivation.subtitle')}</p>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-[400px]">
          <HabitTable rangeStart={rangeStart} rangeEnd={rangeEnd} />
        </div>
      </main>
    </div>
  );
}

export default function MotivationPage() {
  return (
    <Suspense>
      <FilterProvider>
        <MotivationContent />
      </FilterProvider>
    </Suspense>
  );
}
