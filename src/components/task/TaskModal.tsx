'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { X } from 'lucide-react';
import TaskForm from './TaskForm';
import UnsavedChangesModal from '@/components/common/UnsavedChangesModal';
import type { Task } from '@/lib/types';

interface TaskModalProps {
  /** Pass a task to open in edit mode; omit for create mode */
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
}

export default function TaskModal({ task, isOpen, onClose }: TaskModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  const [isDirty, setIsDirty] = useState(false);
  const [showDiscardConfirm, setShowDiscardConfirm] = useState(false);

  // Reset dirty state whenever modal opens or closes
  useEffect(() => {
    if (isOpen) {
      setIsDirty(false);
      setShowDiscardConfirm(false);
    }
  }, [isOpen]);

  const handleRequestClose = useCallback(() => {
    if (isDirty) {
      setShowDiscardConfirm(true);
    } else {
      onClose();
    }
  }, [isDirty, onClose]);

  // Close on Escape key (with unsaved changes check)
  useEffect(() => {
    if (!isOpen) return;
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        // If discard confirmation is open, let UnsavedChangesModal handle it
        if (!showDiscardConfirm) {
          handleRequestClose();
        }
      }
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, showDiscardConfirm, handleRequestClose]);

  // Lock body scroll while open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4 animate-in fade-in duration-150"
        onClick={(e) => {
          // Check backdrop click
          if (dialogRef.current && !dialogRef.current.contains(e.target as Node)) {
            handleRequestClose();
          }
        }}
      >
        {/* Dialog */}
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={task ? 'Sửa task' : 'Thêm task mới'}
          className="w-full max-w-lg rounded-2xl bg-white shadow-xl flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-150"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 shrink-0">
            <h2 className="text-lg font-semibold text-gray-800">
              {task ? 'Sửa task' : 'Thêm task mới'}
            </h2>
            <button
              type="button"
              onClick={handleRequestClose}
              aria-label="Đóng"
              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-700 transition"
            >
              <X size={18} />
            </button>
          </div>

          {/* Scrollable form body */}
          <div className="overflow-y-auto px-6 py-5 flex-1">
            <TaskForm
              task={task}
              onSuccess={onClose}
              onCancel={handleRequestClose}
              onDirtyChange={setIsDirty}
            />
          </div>
        </div>
      </div>

      {/* Unsaved Changes Confirmation Modal */}
      <UnsavedChangesModal
        isOpen={showDiscardConfirm}
        onContinue={() => setShowDiscardConfirm(false)}
        onDiscard={() => {
          setShowDiscardConfirm(false);
          setIsDirty(false);
          onClose();
        }}
        title="Huỷ thay đổi?"
        message="Các thông tin bạn vừa chỉnh sửa chưa được lưu. Bạn có chắc muốn huỷ bỏ và đóng không?"
      />
    </>
  );
}
