'use client';

import { Suspense, useState } from 'react';
import Link from 'next/link';
import {
  Bell,
  ArrowLeft,
  Clock,
  Calendar,
  Layers,
  Info,
  CheckCircle2,
  Tag,
  Trash2,
  Plus,
  X,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import ConfirmModal from '@/components/common/ConfirmModal';
import { FilterProvider } from '@/lib/filterContext';
import { useAppStore } from '@/lib/store';
import { validateTimeWindow } from '@/lib/notification';
import type { Classification, Label, NotificationTimeWindow } from '@/lib/types';

// ── Quadrant Info ──────────────────────────────────────────────────────────
const QUADRANTS: {
  key: Classification;
  title: string;
  subtitle: string;
  badgeBg: string;
}[] = [
  {
    key: 'do_now',
    title: 'Thực hiện ngay',
    subtitle: 'Quan trọng & Khẩn cấp',
    badgeBg: 'bg-do_now text-white',
  },
  {
    key: 'schedule',
    title: 'Lên kế hoạch',
    subtitle: 'Quan trọng & Không khẩn cấp',
    badgeBg: 'bg-schedule text-white',
  },
  {
    key: 'delegate',
    title: 'Ủy quyền',
    subtitle: 'Không quan trọng & Khẩn cấp',
    badgeBg: 'bg-delegate text-white',
  },
  {
    key: 'eliminate',
    title: 'Loại bỏ',
    subtitle: 'Không quan trọng & Không khẩn cấp',
    badgeBg: 'bg-eliminate text-white',
  },
];

function SettingsContent() {
  const notificationConfig       = useAppStore((s) => s.notificationConfig);
  const updateNotificationConfig = useAppStore((s) => s.updateNotificationConfig);
  const labels                   = useAppStore((s) => s.labels);
  const tasks                    = useAppStore((s) => s.tasks);
  const deleteLabel              = useAppStore((s) => s.deleteLabel);

  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null);

  // Time window add form state
  const [showAddTimeWindow, setShowAddTimeWindow] = useState(false);
  const [newFromTime, setNewFromTime] = useState('08:00');
  const [newToTime, setNewToTime] = useState('17:00');
  const [timeWindowError, setTimeWindowError] = useState('');

  const customLabels = labels.filter((l) => !l.isDefault);

  const { generalEnabled, perQuadrant, reminderDays } = notificationConfig;
  const timeWindows: NotificationTimeWindow[] = notificationConfig.timeWindows || [];

  // Toggle general notifications
  const handleToggleGeneral = () => {
    updateNotificationConfig({ generalEnabled: !generalEnabled });
  };

  // Toggle individual quadrant
  const handleToggleQuadrant = (quadrant: Classification) => {
    updateNotificationConfig({
      perQuadrant: {
        ...perQuadrant,
        [quadrant]: !perQuadrant[quadrant],
      },
    });
  };

  // Add time window
  const handleAddTimeWindow = () => {
    const validation = validateTimeWindow(newFromTime, newToTime);
    if (!validation.isValid) {
      setTimeWindowError(validation.error || 'Giờ không hợp lệ.');
      return;
    }

    const newWindow: NotificationTimeWindow = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      fromTime: newFromTime,
      toTime: newToTime,
    };

    updateNotificationConfig({
      timeWindows: [...timeWindows, newWindow],
    });

    setShowAddTimeWindow(false);
    setTimeWindowError('');
  };

  // Delete time window
  const handleDeleteTimeWindow = (id: string) => {
    updateNotificationConfig({
      timeWindows: timeWindows.filter((w) => w.id !== id),
    });
  };

  function handleConfirmDeleteLabel() {
    if (labelToDelete) {
      deleteLabel(labelToDelete.id);
      setLabelToDelete(null);
    }
  }

  const labelUsageCount = labelToDelete
    ? tasks.filter((t) => t.labelId === labelToDelete.id).length
    : 0;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Header />

      <main className="flex-1 mx-auto w-full max-w-3xl px-4 py-8">
        {/* ── Breadcrumb / Header Navigation ── */}
        <div className="mb-6 flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-gray-600 hover:text-do_now transition"
          >
            <ArrowLeft size={16} />
            Quay lại Ma trận
          </Link>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 size={12} />
            Tự động lưu vào bộ nhớ
          </span>
        </div>

        {/* ── Page Title ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-do_now flex items-center justify-center border border-teal-100 shadow-sm">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cài đặt</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Quản lý thông báo và các nhãn công việc tuỳ chỉnh
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* ══════════════════════════════════════════════════════════════════
              1. SECTION: CƠ BẢN (THÔNG BÁO TỔNG QUÁT)
          ══════════════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Thông báo tổng quát
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Bật hoặc tắt toàn bộ chức năng nhắc nhở và thông báo công việc
                </p>
              </div>

              {/* General switch toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={generalEnabled}
                onClick={handleToggleGeneral}
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-do_now focus:ring-offset-2 ${
                  generalEnabled ? 'bg-do_now' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    generalEnabled ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              2. SECTION: NÂNG CAO (THÔNG BÁO CHI TIẾT)
          ══════════════════════════════════════════════════════════════════ */}
          <section
            className={`bg-white rounded-2xl border border-gray-200 shadow-sm p-6 transition-all ${
              !generalEnabled ? 'opacity-50 pointer-events-none select-none' : ''
            }`}
          >
            <div className="border-b border-gray-100 pb-4 mb-6">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Layers size={18} className="text-do_now" />
                Cài đặt Thông báo Nâng cao
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Tùy chỉnh chi tiết thông báo theo từng góc phần tư và khung giờ
              </p>
            </div>

            {/* Note banner: Chỉ thực hiện reminder cho các task có deadline */}
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-blue-50/70 border border-blue-100 p-3.5 text-xs text-blue-800">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span>
                <strong>Lưu ý:</strong> Hệ thống chỉ kích hoạt nhắc nhở (reminder) đối với các
                task <strong>có thiết lập Deadline</strong>.
              </span>
            </div>

            <div className="space-y-6">
              {/* ── A. Toggles per classification ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Bật/tắt thông báo theo từng góc phần tư
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUADRANTS.map(({ key, title, subtitle, badgeBg }) => {
                    const isChecked = perQuadrant[key];
                    return (
                      <div
                        key={key}
                        onClick={() => handleToggleQuadrant(key)}
                        className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                          isChecked
                            ? 'border-gray-300 bg-gray-50/60 shadow-xs'
                            : 'border-gray-200 bg-white hover:bg-gray-50'
                        }`}
                      >
                        <div className="flex flex-col pr-2">
                          <span
                            className={`inline-block w-fit text-[11px] font-semibold px-2 py-0.5 rounded-md mb-1 ${badgeBg}`}
                          >
                            {title}
                          </span>
                          <span className="text-xs text-gray-500">{subtitle}</span>
                        </div>

                        {/* Switch */}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={isChecked}
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleQuadrant(key);
                          }}
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            isChecked ? 'bg-do_now' : 'bg-gray-300'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                              isChecked ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* ── B. Reminder days input ── */}
              <div className="pt-4 border-t border-gray-100">
                <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center gap-2">
                  <Calendar size={16} className="text-gray-400" />
                  Số ngày nhắc trước deadline
                </label>
                <div className="flex items-center gap-3 mt-2">
                  <input
                    type="number"
                    min={1}
                    max={30}
                    value={reminderDays ?? 2}
                    onChange={(e) =>
                      updateNotificationConfig({
                        reminderDays: Math.max(1, parseInt(e.target.value) || 1),
                      })
                    }
                    className="w-24 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-800 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now transition"
                  />
                  <span className="text-sm text-gray-600">ngày trước khi tới hạn</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  Công thức: Khi (Deadline − Hôm nay) ≤ {reminderDays ?? 2} ngày, hệ thống sẽ đưa vào danh sách nhắc nhở.
                </p>
              </div>

              {/* ── C. Multiple Time Windows ── */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    Khung giờ hiển thị thông báo
                  </label>
                  {!showAddTimeWindow && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowAddTimeWindow(true);
                        setTimeWindowError('');
                      }}
                      className="text-xs text-do_now hover:underline font-medium flex items-center gap-1"
                    >
                      <Plus size={13} />
                      Thêm khung giờ
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  Chỉ nhận thông báo khi thời gian hiện tại nằm trong bất kỳ khung giờ nào dưới đây.
                  (Cho phép thiết lập nhiều khung giờ không liền nhau, ví dụ: 08:00 — 09:00 và 19:00 — 20:00).
                </p>

                {/* List of active time windows */}
                {timeWindows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-xs text-gray-500 italic text-center">
                    Chưa thiết lập khung giờ giới hạn nào (thông báo có thể hiển thị bất kỳ lúc nào trong ngày).
                  </div>
                ) : (
                  <div className="flex flex-wrap gap-2.5 mb-3">
                    {timeWindows.map((tw) => (
                      <div
                        key={tw.id}
                        className="inline-flex items-center gap-2 rounded-xl bg-gray-50 border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-800 shadow-xs hover:border-gray-300 transition"
                      >
                        <Clock size={13} className="text-do_now shrink-0" />
                        <span>
                          {tw.fromTime} — {tw.toTime}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteTimeWindow(tw.id)}
                          title={`Xoá khung giờ ${tw.fromTime} - ${tw.toTime}`}
                          aria-label={`Xoá khung giờ ${tw.fromTime} - ${tw.toTime}`}
                          className="ml-1 rounded-md p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                        >
                          <Trash2 size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Inline Add Time Window Form */}
                {showAddTimeWindow && (
                  <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3 max-w-md animate-in fade-in duration-150">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                        <Clock size={13} className="text-do_now" />
                        Thêm khung giờ thông báo mới
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddTimeWindow(false);
                          setTimeWindowError('');
                        }}
                        className="text-gray-400 hover:text-gray-600 rounded p-0.5"
                        title="Đóng"
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Từ giờ</label>
                        <input
                          type="time"
                          value={newFromTime}
                          onChange={(e) => {
                            setNewFromTime(e.target.value);
                            if (timeWindowError) setTimeWindowError('');
                          }}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                        />
                      </div>

                      <span className="text-gray-400 mt-5">—</span>

                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">Đến giờ</label>
                        <input
                          type="time"
                          value={newToTime}
                          onChange={(e) => {
                            setNewToTime(e.target.value);
                            if (timeWindowError) setTimeWindowError('');
                          }}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                        />
                      </div>
                    </div>

                    {timeWindowError && (
                      <p className="text-xs text-red-500 mt-0.5">{timeWindowError}</p>
                    )}

                    <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddTimeWindow(false);
                          setTimeWindowError('');
                        }}
                        className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                      >
                        Huỷ
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTimeWindow}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-do_now hover:bg-teal-600 rounded-lg transition shadow-xs"
                      >
                        Lưu khung giờ
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              3. SECTION: QUẢN LÝ NHÃN TUỲ CHỈNH (CUSTOM LABELS)
          ══════════════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="border-b border-gray-100 pb-4 mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Tag size={18} className="text-do_now" />
                  Nhãn tuỳ chỉnh
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  Danh sách các nhãn do bạn tạo thêm. Khi xoá, các task liên quan sẽ chuyển về nhãn &quot;Cá nhân&quot;.
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 shrink-0">
                {customLabels.length} nhãn
              </span>
            </div>

            {customLabels.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <p>Chưa có nhãn tuỳ chỉnh nào.</p>
                <p className="text-xs text-gray-400 mt-1">
                  Bạn có thể tạo nhãn mới trực tiếp từ form tạo/sửa task.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {customLabels.map((lbl) => {
                  const usageCount = tasks.filter((t) => t.labelId === lbl.id).length;
                  return (
                    <div key={lbl.id} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <span
                          className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-1 ring-black/10"
                          style={{ backgroundColor: lbl.color }}
                        />
                        <span className="text-sm font-medium text-gray-800">{lbl.name}</span>
                        <span className="text-xs text-gray-400">
                          ({usageCount} task{usageCount !== 1 ? 's' : ''})
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => setLabelToDelete(lbl)}
                        aria-label={`Xoá nhãn ${lbl.name}`}
                        title="Xoá nhãn"
                        className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </main>

      {/* ── Confirm Delete Label Modal ── */}
      <ConfirmModal
        isOpen={!!labelToDelete}
        onClose={() => setLabelToDelete(null)}
        onConfirm={handleConfirmDeleteLabel}
        title="Xoá nhãn tuỳ chỉnh"
        variant="danger"
        confirmText="Xoá nhãn"
        cancelText="Huỷ"
        message={
          <p className="text-gray-600">
            Bạn có chắc chắn muốn xoá nhãn{' '}
            <strong className="text-gray-900 font-semibold">&ldquo;{labelToDelete?.name}&rdquo;</strong>?{' '}
            {labelUsageCount > 0 ? (
              <span>
                Hiện có <strong className="text-gray-900 font-semibold">{labelUsageCount} task</strong> đang
                sử dụng nhãn này và sẽ tự động được chuyển về nhãn mặc định &ldquo;Cá nhân&rdquo;.
              </span>
            ) : (
              <span>Nhãn này hiện chưa được gán cho task nào.</span>
            )}
          </p>
        }
      />
    </div>
  );
}

export default function SettingsPage() {
  return (
    <Suspense>
      <FilterProvider>
        <SettingsContent />
      </FilterProvider>
    </Suspense>
  );
}
