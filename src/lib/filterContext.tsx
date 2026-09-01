'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useTransition,
  type ReactNode,
} from 'react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { startOfWeek, endOfWeek, format } from 'date-fns';

// ── Default date range: current week (Mon–Sun) ────────────────────────────
function getDefaultDateFrom() {
  return format(startOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}
function getDefaultDateTo() {
  return format(endOfWeek(new Date(), { weekStartsOn: 1 }), 'yyyy-MM-dd');
}

// ── Types ─────────────────────────────────────────────────────────────────
export interface FilterState {
  searchText: string;
  labelIds: string[];   // empty = all labels
  dateFrom: string;     // YYYY-MM-DD
  dateTo: string;       // YYYY-MM-DD
}

interface FilterContextValue extends FilterState {
  setSearchText: (v: string) => void;
  toggleLabel: (id: string) => void;
  setDateFrom: (v: string) => void;
  setDateTo: (v: string) => void;
  clearFilters: () => void;
  hasActiveFilters: boolean;
}

// ── Context ───────────────────────────────────────────────────────────────
const FilterContext = createContext<FilterContextValue | null>(null);

export function useFilter() {
  const ctx = useContext(FilterContext);
  if (!ctx) throw new Error('useFilter must be used within FilterProvider');
  return ctx;
}

// ── URL helpers ───────────────────────────────────────────────────────────
function buildSearch(state: FilterState): string {
  const params = new URLSearchParams();
  if (state.searchText)          params.set('q', state.searchText);
  if (state.labelIds.length)     params.set('labels', state.labelIds.join(','));
  if (state.dateFrom)            params.set('from', state.dateFrom);
  if (state.dateTo)              params.set('to', state.dateTo);
  const str = params.toString();
  return str ? `?${str}` : '';
}

function parseFromURL(searchParams: URLSearchParams): FilterState {
  const defaultFrom = getDefaultDateFrom();
  const defaultTo   = getDefaultDateTo();
  return {
    searchText: searchParams.get('q') ?? '',
    labelIds:   searchParams.get('labels')?.split(',').filter(Boolean) ?? [],
    dateFrom:   searchParams.get('from') ?? defaultFrom,
    dateTo:     searchParams.get('to')   ?? defaultTo,
  };
}

// ── Provider ──────────────────────────────────────────────────────────────
export function FilterProvider({ children }: { children: ReactNode }) {
  const router      = useRouter();
  const pathname    = usePathname();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();

  // Initialise from URL on mount
  const [state, setState] = useState<FilterState>(() =>
    parseFromURL(searchParams)
  );

  // Sync URL → state when URL changes externally (browser back/fwd)
  useEffect(() => {
    setState(parseFromURL(searchParams));
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.toString()]);

  // Push new state to URL (debounce-free — search gets its own debounce in Header)
  const pushURL = useCallback(
    (next: FilterState) => {
      startTransition(() => {
        router.replace(`${pathname}${buildSearch(next)}`, { scroll: false });
      });
    },
    [router, pathname]
  );

  const setSearchText = useCallback(
    (v: string) => {
      setState((prev) => {
        const next = { ...prev, searchText: v };
        pushURL(next);
        return next;
      });
    },
    [pushURL]
  );

  const toggleLabel = useCallback(
    (id: string) => {
      setState((prev) => {
        const exists = prev.labelIds.includes(id);
        const next = {
          ...prev,
          labelIds: exists
            ? prev.labelIds.filter((l) => l !== id)
            : [...prev.labelIds, id],
        };
        pushURL(next);
        return next;
      });
    },
    [pushURL]
  );

  const setDateFrom = useCallback(
    (v: string) => {
      setState((prev) => {
        const next = { ...prev, dateFrom: v };
        pushURL(next);
        return next;
      });
    },
    [pushURL]
  );

  const setDateTo = useCallback(
    (v: string) => {
      setState((prev) => {
        const next = { ...prev, dateTo: v };
        pushURL(next);
        return next;
      });
    },
    [pushURL]
  );

  const clearFilters = useCallback(() => {
    const next: FilterState = {
      searchText: '',
      labelIds:   [],
      dateFrom:   getDefaultDateFrom(),
      dateTo:     getDefaultDateTo(),
    };
    setState(next);
    pushURL(next);
  }, [pushURL]);

  const hasActiveFilters =
    state.searchText !== '' ||
    state.labelIds.length > 0 ||
    state.dateFrom !== getDefaultDateFrom() ||
    state.dateTo !== getDefaultDateTo();

  return (
    <FilterContext.Provider
      value={{
        ...state,
        setSearchText,
        toggleLabel,
        setDateFrom,
        setDateTo,
        clearFilters,
        hasActiveFilters,
      }}
    >
      {children}
    </FilterContext.Provider>
  );
}
