'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import { format, parseISO } from 'date-fns';
import { X, Tag, CalendarDays } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import { useLanguage } from '@/lib/languageContext';
import UnsavedChangesModal from '@/components/common/UnsavedChangesModal';
import {
  type Classification,
  type MonthAnchor,
  type RecurrenceMode,
  type Task,
  getRecurrenceMode,
} from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────
interface TaskFormProps {
  /** Pass a task to edit; omit for create mode */
  task?: Task;
  onSuccess: () => void;
  onCancel: () => void;
  onDirtyChange?: (isDirty: boolean) => void;
}

interface FormErrors {
  name?: string;
  startDate?: string;
  deadline?: string;
  labelId?: string;
  classification?: string;
  recurringIntervalDays?: string;
  anchorOffsetDays?: string;
}

// ── Classification options ─────────────────────────────────────────────────
const CLASSIFICATION_OPTIONS: { value: Classification; labelKey: string; color: string }[] = [
  { value: 'do_now',    labelKey: 'quadrants.do_now_title',    color: 'bg-do_now text-white' },
  { value: 'schedule',  labelKey: 'quadrants.schedule_title',  color: 'bg-schedule text-white' },
  { value: 'delegate',  labelKey: 'quadrants.delegate_title',  color: 'bg-delegate text-white' },
  { value: 'eliminate', labelKey: 'quadrants.eliminate_title', color: 'bg-eliminate text-white' },
];

const UNSELECTED_CLS = 'bg-white border border-gray-300 text-gray-600 hover:bg-gray-50';

const PRESET_LABEL_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EC4899', // Pink
  '#7C3AED', // Purple
  '#14B8A6', // Teal
  '#EF4444', // Red
  '#6366F1', // Indigo
];

type OffsetDirection = 'exact' | 'before' | 'after';

function getOffsetDirectionAndValue(offset?: number): { direction: OffsetDirection; absDays: number } {
  if (!offset || offset === 0) {
    return { direction: 'exact', absDays: 0 };
  }
  if (offset < 0) {
    return { direction: 'before', absDays: Math.abs(offset) };
  }
  return { direction: 'after', absDays: offset };
}

// ── Form initial values ────────────────────────────────────────────────────
function getInitialValues(task?: Task) {
  const today = format(new Date(), 'yyyy-MM-dd');
  const initialMode: RecurrenceMode = task?.isRecurring
    ? getRecurrenceMode(task)
    : 'fixed_interval';
  const { direction, absDays } = getOffsetDirectionAndValue(task?.anchorOffsetDays);

  return {
    name:                    task?.name ?? '',
    description:             task?.description ?? '',
    startDate:               task?.startDate ?? today,
    deadline:                task?.deadline ?? '',
    labelId:                 task?.labelId ?? '',
    classification:          task?.classification ?? ('' as Classification | ''),
    isRecurring:             task?.isRecurring ?? false,
    recurrenceMode:          initialMode,
    recurringIntervalDays:   task?.recurringIntervalDays ?? 1,
    monthAnchor:             task?.monthAnchor ?? ('start_of_month' as MonthAnchor),
    offsetDirection:         direction,
    offsetAbsDays:           absDays,
    onlyRepeatWhenPrevDone:  task?.onlyRepeatWhenPrevDone ?? false,
  };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TaskForm({ task, onSuccess, onCancel, onDirtyChange }: TaskFormProps) {
  const { t }      = useLanguage();
  const labels     = useAppStore((s) => s.labels);
  const addTask    = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const addLabel   = useAppStore((s) => s.addLabel);

  const [values, setValues] = useState(getInitialValues(task));
  const [errors, setErrors] = useState<FormErrors>({});

  // Refs for native date picker showPicker()
  const startDateRef = useRef<HTMLInputElement>(null);
  const deadlineRef  = useRef<HTMLInputElement>(null);

  // ── Inline Custom Label State ──
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PRESET_LABEL_COLORS[0]);
  const [newLabelError, setNewLabelError] = useState('');
  const [showLabelDiscardConfirm, setShowLabelDiscardConfirm] = useState(false);

  // ── Check if form is dirty (different from initial values) ──
  const isFormDirty = useMemo(() => {
    const init = getInitialValues(task);
    return (
      values.name !== init.name ||
      values.description !== init.description ||
      values.startDate !== init.startDate ||
      values.deadline !== init.deadline ||
      values.labelId !== init.labelId ||
      values.classification !== init.classification ||
      values.isRecurring !== init.isRecurring ||
      values.recurrenceMode !== init.recurrenceMode ||
      values.recurringIntervalDays !== init.recurringIntervalDays ||
      values.monthAnchor !== init.monthAnchor ||
      values.offsetDirection !== init.offsetDirection ||
      values.offsetAbsDays !== init.offsetAbsDays ||
      values.onlyRepeatWhenPrevDone !== init.onlyRepeatWhenPrevDone ||
      (showCreateLabel && newLabelName.trim().length > 0)
    );
  }, [values, task, showCreateLabel, newLabelName]);

  useEffect(() => {
    onDirtyChange?.(isFormDirty);
  }, [isFormDirty, onDirtyChange]);

  // ── Helpers ──
  const set = <K extends keyof typeof values>(key: K, val: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  // ── Validation ──
  function validate(): boolean {
    const errs: FormErrors = {};

    if (!values.name.trim()) {
      errs.name = t('task.errors.name_required');
    } else if (values.name.length > 255) {
      errs.name = t('task.errors.name_max');
    }

    if (!values.labelId) {
      errs.labelId = t('task.errors.label_required');
    }

    if (!values.classification) {
      errs.classification = t('task.errors.classification_required');
    }

    if (values.startDate && values.deadline) {
      if (values.deadline < values.startDate) {
        errs.deadline = t('task.errors.deadline_before_start');
      }
    }

    if (values.isRecurring) {
      if (values.recurrenceMode === 'fixed_interval') {
        const interval = Number(values.recurringIntervalDays);
        if (!interval || interval <= 0) {
          errs.recurringIntervalDays = t('task.errors.interval_positive');
        }
      } else if (values.recurrenceMode === 'month_anchor') {
        if (values.offsetDirection !== 'exact') {
          const abs = Number(values.offsetAbsDays);
          if (!abs || abs <= 0) {
            errs.anchorOffsetDays = t('task.errors.offset_positive');
          }
        }
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Handle Custom Label Creation ──
  function handleCreateCustomLabel() {
    const trimmed = newLabelName.trim();
    if (!trimmed) {
      setNewLabelError(t('label_creation.errors.name_required'));
      return;
    }
    if (trimmed.length > 255) {
      setNewLabelError(t('label_creation.errors.name_max'));
      return;
    }

    // Case-insensitive duplicate check
    const isDuplicate = labels.some(
      (l) => l.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setNewLabelError(t('label_creation.errors.duplicate'));
      return;
    }

    const createdId = addLabel({
      name: trimmed,
      color: newLabelColor,
      isDefault: false,
    });

    set('labelId', createdId);
    setShowCreateLabel(false);
    setNewLabelName('');
    setNewLabelError('');
    if (errors.labelId) {
      setErrors((prev) => ({ ...prev, labelId: undefined }));
    }
  }

  function handleCancelCreateLabel() {
    if (newLabelName.trim().length > 0) {
      setShowLabelDiscardConfirm(true);
    } else {
      setShowCreateLabel(false);
      setNewLabelName('');
      setNewLabelError('');
    }
  }

  // ── Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    let computedOffset = 0;
    if (values.offsetDirection === 'before') {
      computedOffset = -Math.abs(Number(values.offsetAbsDays) || 0);
    } else if (values.offsetDirection === 'after') {
      computedOffset = Math.abs(Number(values.offsetAbsDays) || 0);
    }

    const payload = {
      name:           values.name.trim(),
      description:    values.description.trim() || undefined,
      startDate:      values.startDate,
      deadline:       values.deadline || undefined,
      labelId:        values.labelId,
      classification: values.classification as Classification,
      isRecurring:    values.isRecurring,
      recurrenceMode:         values.isRecurring ? values.recurrenceMode : undefined,
      onlyRepeatWhenPrevDone: values.isRecurring ? values.onlyRepeatWhenPrevDone : false,
      recurringIntervalDays:  values.isRecurring && values.recurrenceMode === 'fixed_interval'
        ? Number(values.recurringIntervalDays)
        : undefined,
      monthAnchor:            values.isRecurring && values.recurrenceMode === 'month_anchor'
        ? values.monthAnchor
        : undefined,
      anchorOffsetDays:       values.isRecurring && values.recurrenceMode === 'month_anchor'
        ? computedOffset
        : undefined,
    };

    if (task) {
      updateTask(task.id, payload);
    } else {
      addTask(payload);
    }

    onSuccess();
  }

  // ── Field style helpers ──
  const inputCls = (err?: string) =>
    `w-full rounded-lg border px-3 py-2 text-sm focus:outline-none focus:ring-1 transition ${
      err
        ? 'border-red-400 focus:ring-red-400'
        : 'border-gray-300 focus:border-do_now focus:ring-do_now'
    }`;

  return (
    <>
      <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
        {/* ── Name ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('task.name')} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            maxLength={255}
            value={values.name}
            onChange={(e) => {
              set('name', e.target.value);
              if (errors.name) setErrors((prev) => ({ ...prev, name: undefined }));
            }}
            placeholder={t('task.name_placeholder')}
            className={inputCls(errors.name)}
          />
          {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
        </div>

        {/* ── Description ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">{t('task.description')}</label>
          <textarea
            rows={3}
            value={values.description}
            onChange={(e) => set('description', e.target.value)}
            placeholder={t('task.description_placeholder')}
            className={`${inputCls()} resize-y min-h-[80px]`}
          />
        </div>

        {/* ── Start Date & Deadline ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              {t('task.start_date')} <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              {/* Clickable display — shows dd/MM/yyyy, opens native picker on click */}
              <button
                type="button"
                onClick={() => {
                  try {
                    startDateRef.current?.showPicker();
                  } catch {
                    startDateRef.current?.focus();
                  }
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left cursor-pointer transition ${
                  errors.startDate
                    ? 'border-red-400'
                    : 'border-gray-300 hover:border-do_now focus:border-do_now focus:ring-1 focus:ring-do_now'
                }`}
              >
                <span className={values.startDate ? 'text-gray-800' : 'text-gray-400'}>
                  {values.startDate
                    ? format(parseISO(values.startDate), 'dd/MM/yyyy')
                    : 'dd/MM/yyyy'}
                </span>
                <CalendarDays size={15} className="text-gray-400 shrink-0" />
              </button>
              <input
                ref={startDateRef}
                type="date"
                value={values.startDate}
                onChange={(e) => {
                  set('startDate', e.target.value);
                  if (errors.startDate) setErrors((prev) => ({ ...prev, startDate: undefined }));
                }}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              />
            </div>
            {errors.startDate && (
              <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">{t('task.deadline')}</label>
            <div className="relative">
              {/* Clickable display — shows dd/MM/yyyy HH:mm, opens native datetime picker on click */}
              <button
                type="button"
                onClick={() => {
                  try {
                    deadlineRef.current?.showPicker();
                  } catch {
                    deadlineRef.current?.focus();
                  }
                }}
                className={`w-full flex items-center justify-between gap-2 rounded-lg border px-3 py-2 text-sm text-left cursor-pointer transition ${
                  errors.deadline
                    ? 'border-red-400'
                    : 'border-gray-300 hover:border-do_now focus:border-do_now focus:ring-1 focus:ring-do_now'
                }`}
              >
                <span className={values.deadline ? 'text-gray-800' : 'text-gray-400'}>
                  {values.deadline
                    ? format(parseISO(values.deadline), 'dd/MM/yyyy HH:mm')
                    : 'dd/MM/yyyy HH:mm'}
                </span>
                <CalendarDays size={15} className="text-gray-400 shrink-0" />
              </button>
              <input
                ref={deadlineRef}
                type="datetime-local"
                value={values.deadline}
                onChange={(e) => {
                  set('deadline', e.target.value);
                  if (errors.deadline) setErrors((prev) => ({ ...prev, deadline: undefined }));
                }}
                aria-hidden="true"
                tabIndex={-1}
                className="absolute inset-0 opacity-0 pointer-events-none w-full h-full"
              />
            </div>
            {errors.deadline && (
              <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>
            )}
          </div>
        </div>

        {/* ── Label Selection & Inline Custom Label Creation ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            {t('task.label')} <span className="text-red-500">*</span>
          </label>
          <div className="flex flex-col gap-2">
            <select
              value={showCreateLabel ? '__create_new__' : values.labelId}
              onChange={(e) => {
                const val = e.target.value;
                if (val === '__create_new__') {
                  setShowCreateLabel(true);
                  setNewLabelName('');
                  setNewLabelError('');
                } else {
                  setShowCreateLabel(false);
                  set('labelId', val);
                  if (errors.labelId) setErrors((prev) => ({ ...prev, labelId: undefined }));
                }
              }}
              className={inputCls(errors.labelId)}
            >
              <option value="">{t('task.label_placeholder')}</option>
              {labels.map((lbl) => {
                const displayName =
                  lbl.isDefault && (lbl.id === 'personal' || lbl.id === 'work' || lbl.id === 'learning')
                    ? t(`labels.${lbl.id}`)
                    : lbl.name;
                return (
                  <option key={lbl.id} value={lbl.id}>
                    {displayName} {lbl.isDefault ? `(${t('task.label_default_tag')})` : ''}
                  </option>
                );
              })}
              <option value="__create_new__" className="font-semibold text-do_now">
                + {t('task.create_new_label')}
              </option>
            </select>

            {/* Inline Custom Label Creation Box */}
            {showCreateLabel && (
              <div className="p-3.5 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3 animate-in fade-in duration-150">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-semibold text-gray-700 flex items-center gap-1.5">
                    <Tag size={13} className="text-do_now" />
                    {t('label_creation.box_title')}
                  </span>
                  <button
                    type="button"
                    onClick={handleCancelCreateLabel}
                    className="text-gray-400 hover:text-gray-600 rounded p-0.5"
                    title={t('label_creation.close_title')}
                  >
                    <X size={15} />
                  </button>
                </div>

                <div>
                  <input
                    type="text"
                    maxLength={255}
                    value={newLabelName}
                    onChange={(e) => {
                      setNewLabelName(e.target.value);
                      if (newLabelError) setNewLabelError('');
                    }}
                    placeholder={t('label_creation.name_placeholder')}
                    className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-800 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                  />
                  {newLabelError && (
                    <p className="mt-1 text-xs text-red-500">{newLabelError}</p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    {t('label_creation.pick_color')}
                  </label>
                  <div className="flex items-center gap-2 flex-wrap">
                    {PRESET_LABEL_COLORS.map((clr) => (
                      <button
                        key={clr}
                        type="button"
                        onClick={() => setNewLabelColor(clr)}
                        style={{ backgroundColor: clr }}
                        className={`w-6 h-6 rounded-full transition-transform ${
                          newLabelColor === clr
                            ? 'scale-125 ring-2 ring-offset-2 ring-gray-400'
                            : 'hover:scale-110'
                        }`}
                      />
                    ))}
                    <div className="flex items-center gap-1.5 ml-2">
                      <input
                        type="color"
                        value={newLabelColor}
                        onChange={(e) => setNewLabelColor(e.target.value)}
                        className="w-6 h-6 rounded cursor-pointer border-0 p-0 bg-transparent"
                        title={t('label_creation.custom_color')}
                      />
                      <span className="text-[11px] text-gray-500">{t('label_creation.other_color')}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200">
                  <button
                    type="button"
                    onClick={handleCancelCreateLabel}
                    className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
                  >
                    {t('label_creation.cancel')}
                  </button>
                  <button
                    type="button"
                    onClick={handleCreateCustomLabel}
                    className="px-3.5 py-1.5 text-xs font-semibold text-white bg-do_now hover:bg-teal-600 rounded-lg transition shadow-xs"
                  >
                    {t('label_creation.save_and_select')}
                  </button>
                </div>
              </div>
            )}
          </div>
          {errors.labelId && <p className="mt-1 text-xs text-red-500">{errors.labelId}</p>}
        </div>

        {/* ── Classification ── */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {t('task.classification')} <span className="text-red-500">*</span>
          </label>
          <div className="grid grid-cols-2 gap-2">
            {CLASSIFICATION_OPTIONS.map((opt) => {
              const isSelected = values.classification === opt.value;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    set('classification', opt.value);
                    if (errors.classification) {
                      setErrors((prev) => ({ ...prev, classification: undefined }));
                    }
                  }}
                  className={`rounded-lg py-2.5 px-3 text-xs font-medium transition ${
                    isSelected ? opt.color : UNSELECTED_CLS
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              );
            })}
          </div>
          {errors.classification && (
            <p className="mt-1 text-xs text-red-500">{errors.classification}</p>
          )}
        </div>

        {/* ── Recurring Section ── */}
        <div className="rounded-xl border border-gray-200 p-4 bg-gray-50/50 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-800">{t('task.recurring.title')}</p>
              <p className="text-xs text-gray-500">{t('task.recurring.subtitle')}</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={values.isRecurring}
              onClick={() => set('isRecurring', !values.isRecurring)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                values.isRecurring ? 'bg-do_now' : 'bg-gray-300'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                  values.isRecurring ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {values.isRecurring && (
            <div className="flex flex-col gap-4 pt-3 border-t border-gray-200 animate-in fade-in duration-200">
              {/* Recurrence Mode Selector */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1.5">
                  {t('task.recurring.mode_label')}
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => set('recurrenceMode', 'fixed_interval')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                      values.recurrenceMode === 'fixed_interval'
                        ? 'border-do_now bg-teal-50 text-do_now font-semibold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t('task.recurring.fixed_interval')}
                  </button>
                  <button
                    type="button"
                    onClick={() => set('recurrenceMode', 'month_anchor')}
                    className={`py-2 px-3 rounded-lg text-xs font-medium border transition ${
                      values.recurrenceMode === 'month_anchor'
                        ? 'border-do_now bg-teal-50 text-do_now font-semibold shadow-xs'
                        : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    {t('task.recurring.month_anchor')}
                  </button>
                </div>
              </div>

              {/* Mode A: Fixed Interval */}
              {values.recurrenceMode === 'fixed_interval' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    {t('task.recurring.interval_label')} <span className="text-red-500">*</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1}
                      value={values.recurringIntervalDays}
                      onChange={(e) => {
                        set('recurringIntervalDays', Number(e.target.value));
                        if (errors.recurringIntervalDays) {
                          setErrors((prev) => ({ ...prev, recurringIntervalDays: undefined }));
                        }
                      }}
                      className="w-32 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                    />
                    <span className="text-xs text-gray-500">{t('task.recurring.interval_unit')}</span>
                  </div>
                  {errors.recurringIntervalDays && (
                    <p className="mt-1 text-xs text-red-500">{errors.recurringIntervalDays}</p>
                  )}
                </div>
              )}

              {/* Mode B: Month Anchor */}
              {values.recurrenceMode === 'month_anchor' && (
                <div className="flex flex-col gap-2.5">
                  <label className="block text-xs font-medium text-gray-700">
                    {t('task.recurring.month_rule_label')} <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    {/* Anchor: Start vs End of month */}
                    <select
                      value={values.monthAnchor}
                      onChange={(e) => set('monthAnchor', e.target.value as MonthAnchor)}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                    >
                      <option value="start_of_month">{t('task.recurring.month_start')}</option>
                      <option value="end_of_month">{t('task.recurring.month_end')}</option>
                    </select>

                    {/* Direction: Before / After / Exact */}
                    <select
                      value={values.offsetDirection}
                      onChange={(e) => {
                        const dir = e.target.value as OffsetDirection;
                        set('offsetDirection', dir);
                        if (dir === 'exact') {
                          set('offsetAbsDays', 0);
                        } else if (values.offsetAbsDays === 0) {
                          set('offsetAbsDays', 1);
                        }
                        if (errors.anchorOffsetDays) {
                          setErrors((prev) => ({ ...prev, anchorOffsetDays: undefined }));
                        }
                      }}
                      className="rounded-lg border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-800 focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                    >
                      <option value="exact">{t('task.recurring.exact_day')}</option>
                      <option value="before">{t('task.recurring.before_day')}</option>
                      <option value="after">{t('task.recurring.after_day')}</option>
                    </select>

                    {/* Offset Days (hidden when Exact) */}
                    {values.offsetDirection !== 'exact' ? (
                      <div className="flex items-center gap-1.5">
                        <input
                          type="number"
                          min={1}
                          max={28}
                          value={values.offsetAbsDays || ''}
                          onChange={(e) => {
                            set('offsetAbsDays', Number(e.target.value));
                            if (errors.anchorOffsetDays) {
                              setErrors((prev) => ({ ...prev, anchorOffsetDays: undefined }));
                            }
                          }}
                          placeholder={t('task.recurring.offset_placeholder')}
                          className="w-full rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm focus:border-do_now focus:outline-none focus:ring-1 focus:ring-do_now"
                        />
                        <span className="text-xs text-gray-500 shrink-0">{t('task.recurring.offset_unit')}</span>
                      </div>
                    ) : (
                      <div className="flex items-center text-xs text-gray-400 italic px-2">
                        {t('task.recurring.match_anchor_note')}
                      </div>
                    )}
                  </div>

                  {errors.anchorOffsetDays && (
                    <p className="mt-0.5 text-xs text-red-500">{errors.anchorOffsetDays}</p>
                  )}

                  <p className="text-[11px] text-gray-500 italic mt-0.5">
                    {t('task.recurring.example_note')}
                  </p>
                </div>
              )}

              {/* Only repeat when previous done toggle */}
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div>
                  <label className="text-sm font-medium text-gray-700 block">
                    {t('task.recurring.only_repeat_prev_done')}
                  </label>
                  <p className="text-[11px] text-gray-500">
                    {t('task.recurring.only_repeat_prev_done_note')}
                  </p>
                </div>
                <button
                  type="button"
                  role="switch"
                  aria-checked={values.onlyRepeatWhenPrevDone}
                  onClick={() => set('onlyRepeatWhenPrevDone', !values.onlyRepeatWhenPrevDone)}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition shrink-0 ${
                    values.onlyRepeatWhenPrevDone ? 'bg-do_now' : 'bg-gray-300'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 rounded-full bg-white shadow transition-transform ${
                      values.onlyRepeatWhenPrevDone ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* ── Actions ── */}
        <div className="flex gap-3 justify-end pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onCancel}
            className="rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
          >
            {t('common.cancel')}
          </button>
          <button
            type="submit"
            className="rounded-lg bg-do_now px-5 py-2 text-sm font-medium text-white hover:bg-teal-600 transition"
          >
            {task ? t('task.save_changes') : t('task.add_task')}
          </button>
        </div>
      </form>

      {/* Discard Custom Label creation confirm modal */}
      <UnsavedChangesModal
        isOpen={showLabelDiscardConfirm}
        onContinue={() => setShowLabelDiscardConfirm(false)}
        onDiscard={() => {
          setShowLabelDiscardConfirm(false);
          setShowCreateLabel(false);
          setNewLabelName('');
          setNewLabelError('');
        }}
        title={t('label_creation.discard_modal.title')}
        message={t('label_creation.discard_modal.message')}
        continueText={t('label_creation.discard_modal.continue_edit')}
        discardText={t('label_creation.discard_modal.discard')}
      />
    </>
  );
}
