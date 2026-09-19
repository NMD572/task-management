'use client';

import { useRef } from 'react';
import { X, ChevronDown, Tag, CalendarRange } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { useFilter } from '@/lib/filterContext';
import { useAppStore } from '@/lib/store';

export default function FilterBar() {
  const labels = useAppStore((s) => s.labels);
  const {
    labelIds,
    dateFrom,
    dateTo,
    toggleLabel,
    setDateFrom,
    setDateTo,
    clearFilters,
    hasActiveFilters,
  } = useFilter();

  const fromInputRef = useRef<HTMLInputElement>(null);
  const toInputRef   = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-wrap items-center gap-3 mb-4">

      {/* ── Label multi-select ── */}
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
              ? 'Tất cả nhãn'
              : `${labelIds.length} nhãn đã chọn`}
          </span>
          <ChevronDown size={14} className="text-gray-400" />
        </button>

        {/* Dropdown */}
        <div className="absolute left-0 top-full mt-1 z-30 hidden group-focus-within:flex flex-col
                        min-w-[200px] rounded-xl border border-gray-200 bg-white shadow-lg py-1 focus-within:flex">
          {labels.map((label) => {
            const checked = labelIds.includes(label.id);
            return (
              <button
                key={label.id}
                type="button"
                onClick={() => toggleLabel(label.id)}
                className={`flex items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 transition text-left ${
                  checked ? 'font-semibold' : 'font-normal text-gray-700'
                }`}
              >
                {/* Color dot */}
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: label.color }}
                />
                <span className="flex-1">{label.name}</span>
                {checked && (
                  <span className="text-do_now text-xs">✓</span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ── Date range ── */}
      <div className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm">
        {/* From date — button triggers showPicker() on hidden input */}
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
            aria-label="Chọn từ ngày"
          >
            <CalendarRange size={14} className="text-gray-400 shrink-0" />
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
            onChange={(e) => setDateFrom(e.target.value)}
            aria-hidden="true"
            tabIndex={-1}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
          />
        </div>

        <span className="text-gray-400 select-none">→</span>

        {/* To date — button triggers showPicker() on hidden input */}
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
            aria-label="Chọn đến ngày"
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
            onChange={(e) => setDateTo(e.target.value)}
            aria-hidden="true"
            tabIndex={-1}
            className="absolute opacity-0 pointer-events-none w-0 h-0"
          />
        </div>
      </div>

      {/* ── Active label chips ── */}
      {labelIds.length > 0 && (
        <div className="flex flex-wrap items-center gap-1">
          {labelIds.map((id) => {
            const label = labels.find((l) => l.id === id);
            if (!label) return null;
            return (
              <span
                key={id}
                className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
                style={{ backgroundColor: label.color }}
              >
                {label.name}
                <button
                  type="button"
                  onClick={() => toggleLabel(id)}
                  aria-label={`Bỏ chọn nhãn ${label.name}`}
                  className="ml-0.5 hover:opacity-75"
                >
                  <X size={10} />
                </button>
              </span>
            );
          })}
        </div>
      )}

      {/* ── Clear all filters ── */}
      {hasActiveFilters && (
        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition"
        >
          <X size={14} />
          Xoá bộ lọc
        </button>
      )}
    </div>
  );
}
