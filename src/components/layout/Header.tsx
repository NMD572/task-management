'use client';

import { useState } from 'react';
import { Search, Globe, LogIn, Plus } from 'lucide-react';
import TaskModal from '@/components/task/TaskModal';

export default function Header() {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white border-b border-gray-200 shadow-sm">
        <div className="mx-auto max-w-screen-xl px-4 py-3 flex items-center gap-3">
          {/* ── Logo / App name ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Simple 2×2 colored square as logo */}
            <div className="grid grid-cols-2 gap-0.5 w-6 h-6">
              <div className="rounded-sm bg-do_now" />
              <div className="rounded-sm bg-schedule" />
              <div className="rounded-sm bg-delegate" />
              <div className="rounded-sm bg-eliminate" />
            </div>
            <span className="hidden sm:block font-bold text-gray-800 text-lg leading-none whitespace-nowrap">
              Eisenhower
            </span>
          </div>

          {/* ── Search bar (center, takes remaining space) ── */}
          <div className="flex-1 min-w-0">
            <div className="relative">
              <Search
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
                size={16}
              />
              <input
                type="text"
                placeholder="Tìm kiếm task..."
                className="w-full rounded-lg border border-gray-200 bg-gray-50 py-2 pl-9 pr-4 text-sm text-gray-800 placeholder-gray-400 focus:border-do_now focus:bg-white focus:outline-none focus:ring-1 focus:ring-do_now transition"
                // Logic search sẽ được nối ở Prompt 5
                readOnly
              />
            </div>
          </div>

          {/* ── Right-side actions ── */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Add task button */}
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="flex items-center gap-1.5 rounded-lg bg-do_now px-3 py-2 text-sm font-medium text-white hover:bg-teal-600 transition"
            >
              <Plus size={16} />
              <span className="hidden sm:inline">Thêm task</span>
            </button>

            {/* Language toggle placeholder */}
            <button
              type="button"
              title="Đổi ngôn ngữ"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              // Logic i18n sẽ được nối ở Prompt 10
              disabled
            >
              <Globe size={16} />
              <span className="hidden sm:inline">VI</span>
            </button>

            {/* Google login placeholder */}
            <button
              type="button"
              title="Đăng nhập với Google"
              className="flex items-center gap-1.5 rounded-lg border border-gray-200 px-2.5 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 transition"
              // Logic Google SSO sẽ được nối ở Prompt 7
              disabled
            >
              <LogIn size={16} />
              <span className="hidden sm:inline">Đăng nhập</span>
            </button>
          </div>
        </div>
      </header>

      {/* Task modal — rendered outside header via portal-like placement */}
      <TaskModal isOpen={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
}
