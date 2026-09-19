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
  Pencil,
  Plus,
  X,
  CheckSquare,
  Zap,
} from 'lucide-react';
import Header from '@/components/layout/Header';
import ConfirmModal from '@/components/common/ConfirmModal';
import { FilterProvider } from '@/lib/filterContext';
import { useLanguage } from '@/lib/languageContext';
import { useAppStore } from '@/lib/store';
import { validateTimeWindow } from '@/lib/notification';
import type { Classification, Label, NotificationTimeWindow } from '@/lib/types';

// ── Quadrant Info ──────────────────────────────────────────────────────────
const QUADRANTS: {
  key: Classification;
  titleKey: string;
  subtitleKey: string;
  badgeBg: string;
}[] = [
  {
    key: 'do_now',
    titleKey: 'quadrants.do_now_title',
    subtitleKey: 'quadrants.do_now_subtitle',
    badgeBg: 'bg-do_now text-white',
  },
  {
    key: 'schedule',
    titleKey: 'quadrants.schedule_title',
    subtitleKey: 'quadrants.schedule_subtitle',
    badgeBg: 'bg-schedule text-white',
  },
  {
    key: 'delegate',
    titleKey: 'quadrants.delegate_title',
    subtitleKey: 'quadrants.delegate_subtitle',
    badgeBg: 'bg-delegate text-white',
  },
  {
    key: 'eliminate',
    titleKey: 'quadrants.eliminate_title',
    subtitleKey: 'quadrants.eliminate_subtitle',
    badgeBg: 'bg-eliminate text-white',
  },
];

function SettingsContent() {
  const { t }                    = useLanguage();
  const notificationConfig       = useAppStore((s) => s.notificationConfig);
  const updateNotificationConfig = useAppStore((s) => s.updateNotificationConfig);
  const completionSettings       = useAppStore((s) => s.completionSettings);
  const updateCompletionSettings = useAppStore((s) => s.updateCompletionSettings);
  const urgencyConfig            = useAppStore((s) => s.urgencyConfig);
  const updateUrgencyConfig      = useAppStore((s) => s.updateUrgencyConfig);
  const labels                   = useAppStore((s) => s.labels);
  const tasks                    = useAppStore((s) => s.tasks);
  const deleteLabel              = useAppStore((s) => s.deleteLabel);
  const updateLabel              = useAppStore((s) => s.updateLabel);

  const [labelToDelete, setLabelToDelete] = useState<Label | null>(null);

  // Edit label state
  const [labelToEdit, setLabelToEdit] = useState<Label | null>(null);
  const [editLabelName, setEditLabelName] = useState('');
  const [editLabelColor, setEditLabelColor] = useState('#3B82F6');
  const [editLabelError, setEditLabelError] = useState('');

  const PRESET_LABEL_COLORS = [
    '#3B82F6', '#10B981', '#F59E0B', '#EC4899',
    '#7C3AED', '#14B8A6', '#EF4444', '#6366F1',
  ];

  function handleOpenEditLabel(lbl: Label) {
    setLabelToEdit(lbl);
    setEditLabelName(lbl.name);
    setEditLabelColor(lbl.color);
    setEditLabelError('');
  }

  function handleConfirmEditLabel() {
    if (!labelToEdit) return;
    const trimmed = editLabelName.trim();

    if (!trimmed) {
      setEditLabelError(t('settings.custom_labels.edit_form.errors.name_required'));
      return;
    }
    if (trimmed.length > 255) {
      setEditLabelError(t('settings.custom_labels.edit_form.errors.name_max'));
      return;
    }
    // Duplicate check: exclude itself
    const isDuplicate = labels.some(
      (l) => l.id !== labelToEdit.id && l.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setEditLabelError(t('settings.custom_labels.edit_form.errors.duplicate'));
      return;
    }

    updateLabel(labelToEdit.id, { name: trimmed, color: editLabelColor });
    setLabelToEdit(null);
    setEditLabelName('');
    setEditLabelError('');
  }

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
      setTimeWindowError(validation.error || t('settings.advanced.add_modal.invalid_time'));
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
            {t('settings.back_to_matrix')}
          </Link>
          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
            <CheckCircle2 size={12} />
            {t('settings.auto_saved')}
          </span>
        </div>

        {/* ── Page Title ── */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-50 text-do_now flex items-center justify-center border border-teal-100 shadow-sm">
              <Bell size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{t('settings.title')}</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                {t('settings.subtitle')}
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
                  {t('settings.general.title')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('settings.general.description')}
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
                {t('settings.advanced.title')}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {t('settings.advanced.subtitle')}
              </p>
            </div>

            {/* Note banner: Chỉ thực hiện reminder cho các task có deadline */}
            <div className="mb-6 flex items-start gap-3 rounded-xl bg-blue-50/70 border border-blue-100 p-3.5 text-xs text-blue-800">
              <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
              <span dangerouslySetInnerHTML={{ __html: t('settings.advanced.note_deadline') }} />
            </div>

            <div className="space-y-6">
              {/* ── A. Toggles per classification ── */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  {t('settings.advanced.per_quadrant_title')}
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {QUADRANTS.map(({ key, titleKey, subtitleKey, badgeBg }) => {
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
                            {t(titleKey)}
                          </span>
                          <span className="text-xs text-gray-500">{t(subtitleKey)}</span>
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
                  {t('settings.advanced.reminder_days_title')}
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
                  <span className="text-sm text-gray-600">{t('settings.advanced.days_before_deadline')}</span>
                </div>
                <p className="text-xs text-gray-400 mt-1.5">
                  {t('settings.advanced.reminder_formula', { days: reminderDays ?? 2 })}
                </p>
              </div>

              {/* ── C. Multiple Time Windows ── */}
              <div className="pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <Clock size={16} className="text-gray-400" />
                    {t('settings.advanced.time_windows_title')}
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
                      {t('settings.advanced.add_time_window')}
                    </button>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-3 leading-relaxed">
                  {t('settings.advanced.time_windows_desc')}
                </p>

                {/* List of active time windows */}
                {timeWindows.length === 0 ? (
                  <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50/50 p-4 text-xs text-gray-500 italic text-center">
                    {t('settings.advanced.no_time_windows')}
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
                          title={t('settings.advanced.delete_window_aria', { from: tw.fromTime, to: tw.toTime })}
                          aria-label={t('settings.advanced.delete_window_aria', { from: tw.fromTime, to: tw.toTime })}
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
                        {t('settings.advanced.add_modal.title')}
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setShowAddTimeWindow(false);
                          setTimeWindowError('');
                        }}
                        className="text-gray-400 hover:text-gray-600 rounded p-0.5"
                        title={t('settings.advanced.add_modal.close_title')}
                      >
                        <X size={15} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3">
                      <div className="flex-1">
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">{t('settings.advanced.add_modal.from_time')}</label>
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
                        <label className="block text-[11px] font-medium text-gray-500 mb-1">{t('settings.advanced.add_modal.to_time')}</label>
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
                        {t('settings.advanced.add_modal.cancel')}
                      </button>
                      <button
                        type="button"
                        onClick={handleAddTimeWindow}
                        className="px-3.5 py-1.5 text-xs font-semibold text-white bg-do_now hover:bg-teal-600 rounded-lg transition shadow-xs"
                      >
                        {t('settings.advanced.add_modal.save')}
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
                  {t('settings.custom_labels.title')}
                </h2>
                <p className="text-sm text-gray-500 mt-1">
                  {t('settings.custom_labels.description')}
                </p>
              </div>
              <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-600 shrink-0">
                {t('settings.custom_labels.labels_count', { count: customLabels.length })}
              </span>
            </div>

            {customLabels.length === 0 ? (
              <div className="py-8 text-center text-gray-400 text-sm">
                <p>{t('settings.custom_labels.empty_title')}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {t('settings.custom_labels.empty_desc')}
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {customLabels.map((lbl) => {
                  const usageCount = tasks.filter((t) => t.labelId === lbl.id).length;
                  const isEditing = labelToEdit?.id === lbl.id;
                  return (
                    <div key={lbl.id} className="py-3 flex flex-col gap-2">
                      {/* Label row */}
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-xs ring-1 ring-black/10"
                            style={{ backgroundColor: lbl.color }}
                          />
                          <span className="text-sm font-medium text-gray-800">{lbl.name}</span>
                          <span className="text-xs text-gray-400">
                            {t('settings.custom_labels.tasks_using', {
                              count: usageCount,
                              plural: usageCount !== 1 ? 's' : '',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => isEditing ? setLabelToEdit(null) : handleOpenEditLabel(lbl)}
                            aria-label={t('settings.custom_labels.edit_aria', { name: lbl.name })}
                            title={t('settings.custom_labels.edit_title')}
                            className={`p-1.5 rounded-lg transition ${
                              isEditing
                                ? 'text-do_now bg-teal-50'
                                : 'text-gray-400 hover:text-do_now hover:bg-teal-50'
                            }`}
                          >
                            <Pencil size={15} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setLabelToDelete(lbl)}
                            aria-label={t('settings.custom_labels.delete_aria', { name: lbl.name })}
                            title={t('settings.custom_labels.delete_title')}
                            className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </div>

                      {/* Inline Edit Form */}
                      {isEditing && (
                        <div className="mt-1 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3 animate-in fade-in duration-150">
                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">{t('settings.custom_labels.edit_form.name_label')}</label>
                            <input
                              type="text"
                              maxLength={255}
                              value={editLabelName}
                              onChange={(e) => {
                                setEditLabelName(e.target.value);
                                if (editLabelError) setEditLabelError('');
                              }}
                              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                            />
                            {editLabelError && (
                              <p className="mt-1 text-xs text-red-500">{editLabelError}</p>
                            )}
                          </div>

                          <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1.5">{t('settings.custom_labels.edit_form.color_label')}</label>
                            <div className="flex items-center gap-2 flex-wrap">
                              {PRESET_LABEL_COLORS.map((clr) => (
                                <button
                                  key={clr}
                                  type="button"
                                  onClick={() => setEditLabelColor(clr)}
                                  style={{ backgroundColor: clr }}
                                  className={`w-6 h-6 rounded-full transition-transform ${
                                    editLabelColor === clr
                                      ? 'scale-125 ring-2 ring-offset-2 ring-gray-400'
                                      : 'hover:scale-110'
                                  }`}
                                />
                              ))}
                              <div className="flex items-center gap-1.5 ml-2">
                                <input
                                  type="color"
                                  value={editLabelColor}
                                  onChange={(e) => setEditLabelColor(e.target.value)}
                                  className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                                  title={t('settings.custom_labels.edit_form.custom_color_title')}
                                />
                                <span className="text-[11px] text-gray-500">{t('settings.custom_labels.edit_form.other_color')}</span>
                              </div>
                            </div>
                          </div>

                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-200">
                            <button
                              type="button"
                              onClick={() => setLabelToEdit(null)}
                              className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                            >
                              {t('settings.custom_labels.edit_form.cancel')}
                            </button>
                            <button
                              type="button"
                              onClick={handleConfirmEditLabel}
                              className="px-3.5 py-1.5 text-xs font-semibold text-white bg-do_now hover:bg-teal-600 rounded-lg transition shadow-xs"
                            >
                              {t('settings.custom_labels.edit_form.save')}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              4. SECTION: THIẾT LẬP HOÀN THÀNH / BỎ QUA (COMPLETION SETTINGS)
          ══════════════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <CheckSquare size={18} className="text-do_now" />
                  {t('settings.completion.title')}
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                  {t('settings.completion.description')}
                </p>
              </div>

              {/* Note prompt toggle switch */}
              <button
                type="button"
                role="switch"
                aria-checked={completionSettings?.notePromptEnabled ?? true}
                onClick={() =>
                  updateCompletionSettings({
                    notePromptEnabled: !(completionSettings?.notePromptEnabled ?? true),
                  })
                }
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-do_now focus:ring-offset-2 ${
                  (completionSettings?.notePromptEnabled ?? true) ? 'bg-do_now' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    (completionSettings?.notePromptEnabled ?? true) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>
          </section>

          {/* ══════════════════════════════════════════════════════════════════
              5. SECTION: TỰ ĐỘNG NÂNG MỨC ĐỘ KHẨN CẤP (URGENCY AUTO-UPGRADE)
          ══════════════════════════════════════════════════════════════════ */}
          <section className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
            <div className="border-b border-gray-100 pb-4 mb-5 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Zap size={18} className="text-schedule" />
                  {t('settings.urgency.title')}
                </h2>
                <p className="text-sm text-gray-500 mt-1 max-w-xl">
                  {t('settings.urgency.description_part1')}
                  <strong className="text-gray-700 font-medium">
                    {' '}{t('settings.urgency.description_schedule')}
                    {t('settings.urgency.description_arrow')}
                    {t('settings.urgency.description_do_now')}
                  </strong>
                  {t('settings.urgency.description_part2')}
                </p>
              </div>

              {/* Auto-upgrade switch toggle */}
              <button
                type="button"
                role="switch"
                aria-checked={urgencyConfig?.enabled ?? false}
                onClick={() =>
                  updateUrgencyConfig({
                    enabled: !(urgencyConfig?.enabled ?? false),
                  })
                }
                className={`relative inline-flex h-7 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-schedule focus:ring-offset-2 ${
                  (urgencyConfig?.enabled ?? false) ? 'bg-schedule' : 'bg-gray-200'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-6 w-6 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                    (urgencyConfig?.enabled ?? false) ? 'translate-x-5' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Threshold days input */}
            {(urgencyConfig?.enabled ?? false) && (
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-in fade-in duration-150">
                <div className="space-y-0.5">
                  <label htmlFor="urgencyThresholdInput" className="text-sm font-medium text-gray-800">
                    {t('settings.urgency.threshold_label')}
                  </label>
                  <p className="text-xs text-gray-500">
                    {t('settings.urgency.threshold_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    id="urgencyThresholdInput"
                    type="number"
                    min={0}
                    max={365}
                    value={urgencyConfig?.daysThreshold ?? 2}
                    onChange={(e) => {
                      const val = Math.max(0, parseInt(e.target.value, 10) || 0);
                      updateUrgencyConfig({ daysThreshold: val });
                    }}
                    className="w-24 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-center font-medium focus:border-schedule focus:outline-none focus:ring-1 focus:ring-schedule transition shadow-xs"
                  />
                  <span className="text-sm text-gray-600 font-medium">{t('settings.urgency.days_unit')}</span>
                </div>
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
        title={t('settings.custom_labels.delete_modal.title')}
        variant="danger"
        confirmText={t('settings.custom_labels.delete_modal.confirm')}
        cancelText={t('settings.custom_labels.delete_modal.cancel')}
        message={
          <p className="text-gray-600">
            {t('settings.custom_labels.delete_modal.message_prefix')}
            <strong className="text-gray-900 font-semibold">&ldquo;{labelToDelete?.name}&rdquo;</strong>?{' '}
            {labelUsageCount > 0 ? (
              <span>
                {t('settings.custom_labels.delete_modal.has_tasks_part1')}
                <strong className="text-gray-900 font-semibold">{labelUsageCount} {t('common.tasks')}</strong>
                {t('settings.custom_labels.delete_modal.has_tasks_part2')}
              </span>
            ) : (
              <span>{t('settings.custom_labels.delete_modal.no_tasks')}</span>
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
