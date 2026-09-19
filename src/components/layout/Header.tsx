'use client';

import { useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Search, Globe, Plus, X, Settings, CheckSquare } from 'lucide-react';
import TaskModal from '@/components/task/TaskModal';
// import GoogleLoginButton from '@/components/auth/GoogleLoginButton';
import { useFilter } from '@/lib/filterContext';
import { useLanguage } from '@/lib/languageContext';

export default function Header() {
  const pathname = usePathname();
  const isHomePage = pathname === '/';
  const isSettingsPage = pathname === '/settings';
  const isCompletedPage = pathname === '/completed';

  const [modalOpen, setModalOpen] = useState(false);
  const { searchText, setSearchText } = useFilter();
  const { language, toggleLanguage, t } = useLanguage();

  // Debounce URL update: update local input immediately, push to context after 300ms
  const [localSearch, setLocalSearch] = useState(searchText);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchChange = useCallback(
    (value: string) => {
      setLocalSearch(value);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        setSearchText(value);
      }, 300);
    },
    [setSearchText]
  );

  const handleClearSearch = useCallback(() => {
    setLocalSearch('');
    setSearchText('');
  }, [setSearchText]);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4 py-3 flex items-center gap-3">
          {/* ── Logo / App name ── */}
          <Link
            href="/"
            className="flex items-center gap-2 shrink-0 group focus:outline-none"
            title={t('header.home_title')}
          >
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6 group-hover:scale-105 transition-transform">
              <div className="rounded-sm bg-do_now" />
              <div className="rounded-sm bg-schedule" />
              <div className="rounded-sm bg-delegate" />
              <div className="rounded-sm bg-eliminate" />
            </div>
            <span className="hidden sm:block font-bold text-gray-800 text-lg leading-none whitespace-nowrap group-hover:text-do_now transition-colors">
              {t('header.title')}
            </span>
          </Link>

          {/* ── Search bar (shown on home matrix view, spacer on other pages) ── */}
          <div className="flex-1 min-w-0">
            {isHomePage ? (
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                  size={16}
                />
                <input
                  type="text"
                  value={localSearch}
                  onChange={(e) => handleSearchChange(e.target.value)}
                  placeholder={t('header.search_placeholder')}
                  className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-9 text-sm text-gray-800 placeholder-gray-400 focus:border-do_now focus:bg-white focus:outline-none focus:ring-1 focus:ring-do_now transition"
                />
                {localSearch && (
                  <button
                    type="button"
                    onClick={handleClearSearch}
                    aria-label={t('header.clear_search')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-0.5 text-gray-400 hover:text-gray-700"
                  >
                    <X size={14} />
                  </button>
                )}
              </div>
            ) : (
              <div className="hidden sm:block" />
            )}
          </div>

          {/* ── Right-side actions ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Add task button */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-do_now px-3 py-2 text-sm font-medium text-white hover:bg-teal-600 transition shadow-sm"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">{t('header.add_task')}</span>
            </button>

            {/* Completed tasks history link */}
            <Link
              href="/completed"
              title={t('header.completed_tasks_title')}
              className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-2 text-sm font-medium transition ${
                isCompletedPage
                  ? 'border-do_now bg-teal-50 text-do_now'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <CheckSquare size={16} />
              <span className="hidden md:inline">{t('header.completed_tasks')}</span>
            </Link>

            {/* Language toggle */}
            <button
              type="button"
              onClick={toggleLanguage}
              title={t('header.change_language')}
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 hover:text-gray-900 transition cursor-pointer"
            >
              <Globe size={16} />
              <span className="font-semibold text-xs">{language.toUpperCase()}</span>
            </button>

            {/* Settings link */}
            <Link
              href="/settings"
              title={t('header.settings')}
              className={`flex items-center justify-center rounded-lg border px-2.5 py-2 text-sm font-medium transition ${
                isSettingsPage
                  ? 'border-do_now bg-teal-50 text-do_now'
                  : 'border-gray-200 text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <Settings size={16} />
            </Link>

            {/* Prompt 27: Ẩn button login với Google trên giao diện người dùng */}
            {/* <GoogleLoginButton /> */}
          </div>
        </div>
      </header>

      <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
