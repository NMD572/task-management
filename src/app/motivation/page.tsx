'use client';

import { Suspense, useState, useRef, useEffect, useCallback, useTransition } from 'react';
import Link from 'next/link';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { format, parseISO, startOfWeek, endOfWeek } from 'date-fns';
import { ArrowLeft, Calendar, X, BarChart2, Search, Tag, ChevronDown } from 'lucide-react';
import Header from '@/components/layout/Header';
import HabitTable from '@/components/motivation/HabitTable';
import { FilterProvider } from '@/lib/filterContext';
import { useLanguage } from '@/lib/languageContext';
import { useAppStore } from '@/lib/store';

function getDefaultDateFrom() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}
function getDefaultDateTo() {
  return format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

function MotivationContent() {
  const { t } = useLanguage();
  const labels = useAppStore((s) => s.labels);
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  const defaultFrom = getDefaultDateFrom();
  const defaultTo = getDefaultDateTo();

  const [dateFrom, setDateFrom] = useState(() => searchParams.get('from') || defaultFrom);
  const [dateTo, setDateTo] = useState(() => searchParams.get('to') || defaultTo);
  const [searchText, setSearchText] = useState(() => searchParams.get('q') || '');
  const [labelIds, setLabelIds] = useState<string[]>(() =>
    searchParams.get('labels')?.split(',').filter(Boolean) || []
  );

  useEffect(() => {
    const urlFrom = searchParams.get('from');
    const urlTo = searchParams.get('to');
    const urlQ = searchParams.get('q') || '';
    const urlLabels = searchParams.get('labels')?.split(',').filter(Boolean) || [];

    setDateFrom(urlFrom || defaultFrom);
    setDateTo(urlTo || defaultTo);
    setSearchText(urlQ);
    setLabelIds(urlLabels);
  }, [searchParams, defaultFrom, defaultTo]);

  const pushURL = useCallback(
    (newFrom: string, newTo: string, newLabels: string[], newQ: string) => {
      startTransition(() => {
        const params = new URLSearchParams();
        const isCustomDate = newFrom !== defaultFrom || newTo !== defaultTo;
        if (isCustomDate) {
          if (newFrom) params.set('from', newFrom);
          if (newTo) params.set('to', newTo);
        }
        if (newLabels.length > 0) {
          params.set('labels', newLabels.join(','));
        }
        if (newQ.trim()) {
          params.set('q', newQ.trim());
        }
        const str = params.toString();
        router.replace(`${pathname}${str ? `?${str}` : ''}`, { scroll: false });
      });
    },
    [router, pathname, defaultFrom, defaultTo]
  );

  const handleSetDateFrom = (newFrom: string) => {
    const adjustedTo = dateTo && newFrom && dateTo < newFrom ? newFrom : dateTo;
    setDateFrom(newFrom);
    if (adjustedTo !== dateTo) {
      setDateTo(adjustedTo);
    }
    pushURL(newFrom, adjustedTo, labelIds, searchText);
  };

  const handleSetDateTo = (newTo: string) => {
    const adjustedFrom = dateFrom && newTo && dateFrom > newTo ? newTo : dateFrom;
    setDateTo(newTo);
    if (adjustedFrom !== dateFrom) {
      setDateFrom(adjustedFrom);
    }
    pushURL(adjustedFrom, newTo, labelIds, searchText);
  };

  const handleToggleLabel = (id: string) => {
    const nextLabels = labelIds.includes(id)
      ? labelIds.filter((l) => l !== id)
      : [...labelIds, id];
    setLabelIds(nextLabels);
    pushURL(dateFrom, dateTo, nextLabels, searchText);
  };

  const handleSearchChange = (val: string) => {
    setSearchText(val);
    pushURL(dateFrom, dateTo, labelIds, val);
  };

  const clearFilter = () => {
    setDateFrom(defaultFrom);
    setDateTo(defaultTo);
    setLabelIds([]);
    setSearchText('');
    pushURL(defaultFrom, defaultTo, [], '');
  };

  const hasActiveFilters =
    dateFrom !== defaultFrom ||
    dateTo !== defaultTo ||
    labelIds.length > 0 ||
    searchText.trim().length > 0;

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);

  const rangeStart = parseISO(dateFrom);
  const rangeEnd = parseISO(dateTo);

  const getLabelDisplayName = (lbl: { id: string; name: string; isDefault?: boolean }) => {
    if (lbl.isDefault && (lbl.id === 'personal' || lbl.id === 'work' || lbl.id === 'learning')) {
      return t(`labels.${lbl.id}`);
    }
    return lbl.name;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-screen-xl px-4 py-6 sm:py-8 flex flex-col">
        {/* Filters bar: Search + Label + Date range + Clear filter */}
        <div className="flex items-center gap-3 mb-6 flex-wrap shrink-0">
          {/* 1. Search text input */}
          <div className="relative min-w-0 w-full sm:w-auto sm:min-w-[180px] sm:max-w-xs">
            <Search
              size={14}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
            />
            <input
              type="text"
              value={searchText}
              onChange={(e) => handleSearchChange(e.target.value)}
              placeholder={t('header.search_placeholder')}
              className="w-full rounded-lg border border-gray-300 bg-white py-2 pl-8 pr-8 text-sm text-gray-800 placeholder-gray-400 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now transition"
            />
            {searchText && (
              <button
                type="button"
                onClick={() => handleSearchChange('')}
                aria-label={t('header.clear_search')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
              >
                <X size={14} />
              </button>
            )}
          </div>

          {/* 2. Label multi-select dropdown */}
          <div className="relative group">
            <button
              type="button"
              className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition ${
                labelIds.length > 0
                  ? 'border-do_now bg-teal-50 text-do_now'
                  : 'border-gray-300 bg-white text-gray-600 hover:bg-gray-50'
              }`}
            >
              <Tag size={14} />
              <span>
                {labelIds.length === 0
                  ? t('filter.all_labels')
                  : t('filter.labels_selected', { count: labelIds.length })}
              </span>
              <ChevronDown size={14} className="text-gray-400" />
            </button>

            {/* Dropdown */}
            <div className="absolute left-0 top-full mt-1 z-30 hidden group-focus-within:flex flex-col min-w-[180px] max-w-[calc(100vw-2rem)] rounded-xl border border-gray-200 bg-white shadow-lg py-1 focus-within:flex">
              {labels.map((label) => {
                const checked = labelIds.includes(label.id);
                return (
                  <button
                    key={label.id}
                    type="button"
                    onClick={() => handleToggleLabel(label.id)}
                    className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition text-left ${
                      checked ? 'font-semibold' : 'font-normal text-gray-700'
                    }`}
                  >
                    <span
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: label.color }}
                    />
                    <span className="flex-1">{getLabelDisplayName(label)}</span>
                    {checked && <span className="text-do_now text-xs">✓</span>}
                  </button>
                );
              })}
            </div>
          </div>

          {/* 3. Date range picker */}
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

          {/* 4. Clear filter button */}
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
          <HabitTable
            rangeStart={rangeStart}
            rangeEnd={rangeEnd}
            searchText={searchText}
            labelIds={labelIds}
          />
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
