// lib/types.ts

export type Classification = 'do_now' | 'schedule' | 'delegate' | 'eliminate';

export interface Label {
  id: string;
  name: string; // tối đa 255 ký tự
  isDefault: boolean; // 5 nhãn mặc định: Cá nhân, Công việc, Phát triển bản thân, Thói quen tốt, Thói quen xấu.
  color: string; // hex, tự sinh khi user tạo nhãn mới
}

export type RecurrenceMode = 'fixed_interval' | 'month_anchor';
export type MonthAnchor = 'start_of_month' | 'end_of_month';

export interface Task {
  id: string;
  name: string;                       // bắt buộc, tối đa 255 ký tự
  description?: string;               // không bắt buộc
  startDate: string;                  // ISO date — ngày bắt đầu thực hiện
  deadline?: string;                  // ISO datetime — không bắt buộc
  labelId: string;                    // tham chiếu Label
  classification: Classification;     // MVP: bắt buộc chọn thủ công (xem ghi chú AI ở 1.5.5)
  isRecurring: boolean;                // bắt buộc, mặc định false
  recurrenceMode?: RecurrenceMode;    // 'fixed_interval' | 'month_anchor', mặc định 'fixed_interval'
  recurringIntervalDays?: number;     // bắt buộc NẾU isRecurring = true và recurrenceMode = 'fixed_interval'
  monthAnchor?: MonthAnchor;          // 'start_of_month' | 'end_of_month' NẾU recurrenceMode = 'month_anchor'
  anchorOffsetDays?: number;          // số ngày bù so với neo: trước (-), sau (+), đúng ngày (0)
  seriesId?: string;                  // ID chuỗi lặp lại
  onlyRepeatWhenPrevDone?: boolean;   // bắt buộc NẾU isRecurring = true
  createdAt: string;                  // ISO, tự sinh
}

/** Helper trả về recurrenceMode của task, mặc định 'fixed_interval' cho task cũ */
export function getRecurrenceMode(task: Task): RecurrenceMode {
  return task.recurrenceMode ?? 'fixed_interval';
}

export type TaskCompletionStatus = 'completed' | 'skipped';

// Lịch sử hoàn thành theo từng ngày — entity mới, cần cho view tạo động lực (1.5.7) và trang Completed Tasks
export interface TaskCompletion {
  taskId: string;
  date: string;                       // YYYY-MM-DD
  status: TaskCompletionStatus;       // 'completed' | 'skipped'
  note?: string;                      // ghi chú chi tiết không bắt buộc
}

export interface NotificationTimeWindow {
  id: string;
  fromTime: string;                   // "HH:mm"
  toTime: string;                     // "HH:mm"
}

export interface NotificationConfig {
  generalEnabled: boolean;            // config cơ bản: bật/tắt tổng quát
  perQuadrant: Record<Classification, boolean>; // default: do_now/schedule/delegate = true, eliminate = false
  reminderDays: number;               // default 2. Công thức: deadline - hôm nay <= reminderDays thì nhắc
  timeWindows: NotificationTimeWindow[]; // danh sách các khung giờ hiển thị thông báo
}

export interface CompletionSettings {
  notePromptEnabled: boolean; // default true: mở modal ghi chú khi complete/skip; false: lưu ngay lập tức
}

export interface UrgencyAutoUpgradeConfig {
  enabled: boolean;
  daysThreshold: number;              // khi (deadline - hôm nay) <= giá trị này, tự nâng not-urgent -> urgent
}

// Chỉ lưu ở client, không có server session thật
export interface UserProfile {
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string;
}
