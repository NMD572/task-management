'use client';

import { useEffect } from 'react';
import { AlertCircle } from 'lucide-react';

export interface UnsavedChangesModalProps {
  isOpen: boolean;
  onContinue: () => void; // "Tiếp tục sửa"
  onDiscard: () => void;  // "Huỷ bỏ"
  title?: string;
  message?: string;
  continueText?: string;
  discardText?: string;
}

export default function UnsavedChangesModal({
  isOpen,
  onContinue,
  onDiscard,
  title = 'Huỷ thay đổi?',
  message = 'Bạn có các thay đổi chưa được lưu. Bạn có chắc chắn muốn huỷ bỏ không?',
  continueText = 'Tiếp tục sửa',
  discardText = 'Huỷ bỏ',
}: UnsavedChangesModalProps) {
  // Close confirmation on Escape by choosing to continue editing (keep modal open)
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onContinue();
      }
    }
    window.addEventListener('keydown', onKey, true);
    return () => window.removeEventListener('keydown', onKey, true);
  }, [isOpen, onContinue]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 px-4 animate-in fade-in duration-150"
      onClick={(e) => {
        e.stopPropagation();
        onContinue();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-sm rounded-2xl bg-white shadow-2xl p-5 border border-gray-100 flex flex-col gap-3 animate-in zoom-in-95 duration-150"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center shrink-0">
            <AlertCircle size={16} />
          </div>
          <h3 className="text-sm font-semibold text-gray-900">{title}</h3>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed">{message}</p>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={onContinue}
            className="rounded-lg border border-gray-300 bg-white px-3.5 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 transition shadow-xs"
          >
            {continueText}
          </button>
          <button
            type="button"
            onClick={onDiscard}
            className="rounded-lg bg-red-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-red-700 transition shadow-xs"
          >
            {discardText}
          </button>
        </div>
      </div>
    </div>
  );
}
