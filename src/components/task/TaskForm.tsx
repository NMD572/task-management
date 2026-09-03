'use client';

import { useState } from 'react';
import { format } from 'date-fns';
import { Plus, X, Tag } from 'lucide-react';
import { useAppStore } from '@/lib/store';
import type { Classification, Task } from '@/lib/types';

// ── Types ──────────────────────────────────────────────────────────────────
interface TaskFormProps {
  /** Pass a task to edit; omit for create mode */
  task?: Task;
  onSuccess: () => void;
  onCancel: () => void;
}

interface FormErrors {
  name?: string;
  startDate?: string;
  deadline?: string;
  labelId?: string;
  classification?: string;
  recurringIntervalDays?: string;
}

// ── Classification options ─────────────────────────────────────────────────
const CLASSIFICATION_OPTIONS: { value: Classification; label: string; color: string }[] = [
  { value: 'do_now',    label: 'Thực hiện ngay', color: 'bg-do_now text-white' },
  { value: 'schedule',  label: 'Lên kế hoạch',   color: 'bg-schedule text-white' },
  { value: 'delegate',  label: 'Ủy quyền',        color: 'bg-delegate text-white' },
  { value: 'eliminate', label: 'Loại bỏ',          color: 'bg-eliminate text-white' },
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

// ── Form initial values ────────────────────────────────────────────────────
function getInitialValues(task?: Task) {
  const today = format(new Date(), 'yyyy-MM-dd');
  return {
    name:                    task?.name ?? '',
    description:             task?.description ?? '',
    startDate:               task?.startDate ?? today,
    deadline:                task?.deadline ?? '',
    labelId:                 task?.labelId ?? '',
    classification:          task?.classification ?? ('' as Classification | ''),
    isRecurring:             task?.isRecurring ?? false,
    recurringIntervalDays:   task?.recurringIntervalDays ?? 1,
    onlyRepeatWhenPrevDone:  task?.onlyRepeatWhenPrevDone ?? false,
  };
}

// ── Component ──────────────────────────────────────────────────────────────
export default function TaskForm({ task, onSuccess, onCancel }: TaskFormProps) {
  const labels     = useAppStore((s) => s.labels);
  const addTask    = useAppStore((s) => s.addTask);
  const updateTask = useAppStore((s) => s.updateTask);
  const addLabel   = useAppStore((s) => s.addLabel);

  const [values, setValues] = useState(getInitialValues(task));
  const [errors, setErrors] = useState<FormErrors>({});

  // ── Inline Custom Label State ──
  const [showCreateLabel, setShowCreateLabel] = useState(false);
  const [newLabelName, setNewLabelName] = useState('');
  const [newLabelColor, setNewLabelColor] = useState(PRESET_LABEL_COLORS[0]);
  const [newLabelError, setNewLabelError] = useState('');

  // ── Helpers ──
  const set = <K extends keyof typeof values>(key: K, val: (typeof values)[K]) =>
    setValues((prev) => ({ ...prev, [key]: val }));

  // ── Validation ──
  function validate(): boolean {
    const errs: FormErrors = {};

    if (!values.name.trim()) {
      errs.name = 'Tên task không được để trống.';
    } else if (values.name.length > 255) {
      errs.name = 'Tên task tối đa 255 ký tự.';
    }

    if (!values.labelId) {
      errs.labelId = 'Vui lòng chọn nhãn.';
    }

    if (!values.classification) {
      errs.classification = 'Vui lòng chọn phân loại.';
    }

    if (values.startDate && values.deadline) {
      if (values.deadline < values.startDate) {
        errs.deadline = 'Deadline phải lớn hơn hoặc bằng ngày bắt đầu.';
      }
    }

    if (values.isRecurring) {
      const interval = Number(values.recurringIntervalDays);
      if (!interval || interval <= 0) {
        errs.recurringIntervalDays = 'Chu kỳ lặp phải lớn hơn 0.';
      }
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  // ── Handle Custom Label Creation ──
  function handleCreateCustomLabel() {
    const trimmed = newLabelName.trim();
    if (!trimmed) {
      setNewLabelError('Tên nhãn không được để trống.');
      return;
    }
    if (trimmed.length > 255) {
      setNewLabelError('Tên nhãn tối đa 255 ký tự.');
      return;
    }

    // Case-insensitive duplicate check
    const isDuplicate = labels.some(
      (l) => l.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (isDuplicate) {
      setNewLabelError('Tên nhãn này đã tồn tại.');
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

  // ── Submit ──
  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      name:           values.name.trim(),
      description:    values.description.trim() || undefined,
      startDate:      values.startDate,
      deadline:       values.deadline || undefined,
      labelId:        values.labelId,
      classification: values.classification as Classification,
      isRecurring:    values.isRecurring,
      ...(values.isRecurring && {
        recurringIntervalDays:  Number(values.recurringIntervalDays),
        onlyRepeatWhenPrevDone: values.onlyRepeatWhenPrevDone,
      }),
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
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      {/* ── Name ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Tên task <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          maxLength={255}
          value={values.name}
          onChange={(e) => set('name', e.target.value)}
          placeholder="VD: Viết báo cáo tuần"
          className={inputCls(errors.name)}
        />
        {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name}</p>}
      </div>

      {/* ── Description ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Mô tả
        </label>
        <textarea
          rows={3}
          value={values.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Mô tả thêm về task (không bắt buộc)"
          className={`${inputCls()} resize-y min-h-[80px]`}
        />
      </div>

      {/* ── Dates row ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Ngày bắt đầu
          </label>
          <input
            type="date"
            value={values.startDate}
            onChange={(e) => set('startDate', e.target.value)}
            className={inputCls(errors.startDate)}
          />
          {errors.startDate && <p className="mt-1 text-xs text-red-500">{errors.startDate}</p>}
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Deadline
          </label>
          <input
            type="datetime-local"
            value={values.deadline}
            onChange={(e) => set('deadline', e.target.value)}
            className={inputCls(errors.deadline)}
          />
          {errors.deadline && <p className="mt-1 text-xs text-red-500">{errors.deadline}</p>}
        </div>
      </div>

      {/* ── Label ── */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <label className="block text-sm font-medium text-gray-700">
            Nhãn <span className="text-red-500">*</span>
          </label>
          {!showCreateLabel && (
            <button
              type="button"
              onClick={() => {
                setShowCreateLabel(true);
                setNewLabelName('');
                setNewLabelError('');
              }}
              className="text-xs text-do_now hover:underline font-medium flex items-center gap-1"
            >
              <Plus size={13} />
              Tạo nhãn mới
            </button>
          )}
        </div>

        <select
          value={values.labelId}
          onChange={(e) => {
            if (e.target.value === '__create_new__') {
              setShowCreateLabel(true);
            } else {
              set('labelId', e.target.value);
            }
          }}
          className={inputCls(errors.labelId)}
        >
          <option value="">— Chọn nhãn —</option>
          {labels.map((lbl) => (
            <option key={lbl.id} value={lbl.id}>
              {lbl.name} {lbl.isDefault ? '' : '(Tuỳ chỉnh)'}
            </option>
          ))}
          <option value="__create_new__" className="text-do_now font-semibold">
            ➕ Tạo nhãn mới...
          </option>
        </select>
        {errors.labelId && <p className="mt-1 text-xs text-red-500">{errors.labelId}</p>}

        {/* Inline Create Label Form */}
        {showCreateLabel && (
          <div className="mt-3 p-4 bg-gray-50 rounded-xl border border-gray-200 flex flex-col gap-3 animate-in fade-in duration-150">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-gray-800 flex items-center gap-1.5">
                <Tag size={13} className="text-do_now" />
                Tạo nhãn tuỳ chỉnh mới
              </span>
              <button
                type="button"
                onClick={() => {
                  setShowCreateLabel(false);
                  setNewLabelName('');
                  setNewLabelError('');
                }}
                className="text-gray-400 hover:text-gray-600 rounded p-0.5"
                title="Đóng"
              >
                <X size={15} />
              </button>
            </div>

            {/* Label Name Input */}
            <div>
              <input
                type="text"
                maxLength={255}
                placeholder="Nhập tên nhãn (VD: Dự án Alpha)"
                value={newLabelName}
                onChange={(e) => {
                  setNewLabelName(e.target.value);
                  if (newLabelError) setNewLabelError('');
                }}
                className={`w-full rounded-lg border bg-white px-3 py-1.5 text-sm focus:outline-none focus:ring-1 ${
                  newLabelError
                    ? 'border-red-400 focus:ring-red-400'
                    : 'border-gray-300 focus:border-do_now focus:ring-do_now'
                }`}
              />
              {newLabelError && <p className="text-xs text-red-500 mt-1">{newLabelError}</p>}
            </div>

            {/* Color selection */}
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-gray-600 shrink-0">Màu sắc:</span>
              <div className="flex items-center gap-1.5 flex-wrap">
                {PRESET_LABEL_COLORS.map((c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => setNewLabelColor(c)}
                    className={`w-5 h-5 rounded-full border-2 transition-transform ${
                      newLabelColor === c ? 'scale-125 border-gray-900 shadow-sm' : 'border-transparent hover:scale-110'
                    }`}
                    style={{ backgroundColor: c }}
                  />
                ))}

                {/* Color input */}
                <div className="relative w-5 h-5 rounded-full overflow-hidden border border-gray-300 cursor-pointer ml-1" title="Tự chọn màu khác">
                  <input
                    type="color"
                    value={newLabelColor}
                    onChange={(e) => setNewLabelColor(e.target.value)}
                    className="absolute -top-2 -left-2 w-9 h-9 cursor-pointer border-0 p-0"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-1 border-t border-gray-200">
              <button
                type="button"
                onClick={() => {
                  setShowCreateLabel(false);
                  setNewLabelName('');
                  setNewLabelError('');
                }}
                className="px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200 rounded-lg transition"
              >
                Huỷ
              </button>
              <button
                type="button"
                onClick={handleCreateCustomLabel}
                className="px-3 py-1.5 text-xs font-medium text-white bg-do_now hover:bg-teal-600 rounded-lg transition shadow-xs"
              >
                Lưu nhãn
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Classification segmented control ── */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Phân loại <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-2">
          {CLASSIFICATION_OPTIONS.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => set('classification', opt.value)}
              className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                values.classification === opt.value ? opt.color : UNSELECTED_CLS
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
        {errors.classification && (
          <p className="mt-1 text-xs text-red-500">{errors.classification}</p>
        )}
      </div>

      {/* ── isRecurring toggle ── */}
      <div>
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium text-gray-700">Task lặp lại</label>
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

        {/* Recurring sub-fields (visible only when isRecurring = true) */}
        {values.isRecurring && (
          <div className="mt-4 rounded-lg border border-gray-200 bg-gray-50 p-4 flex flex-col gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Chu kỳ lặp (ngày) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                min={1}
                value={values.recurringIntervalDays}
                onChange={(e) =>
                  set('recurringIntervalDays', parseInt(e.target.value) || 1)
                }
                className={inputCls(errors.recurringIntervalDays)}
              />
              {errors.recurringIntervalDays && (
                <p className="mt-1 text-xs text-red-500">{errors.recurringIntervalDays}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">
                Chỉ lặp khi hoàn thành task trước
              </label>
              <button
                type="button"
                role="switch"
                aria-checked={values.onlyRepeatWhenPrevDone}
                onClick={() => set('onlyRepeatWhenPrevDone', !values.onlyRepeatWhenPrevDone)}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
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
          Huỷ
        </button>
        <button
          type="submit"
          className="rounded-lg bg-do_now px-5 py-2 text-sm font-medium text-white hover:bg-teal-600 transition"
        >
          {task ? 'Lưu thay đổi' : 'Thêm task'}
        </button>
      </div>
    </form>
  );
}
