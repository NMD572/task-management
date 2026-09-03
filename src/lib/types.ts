// lib/types.ts

export type Classification = 'do_now' | 'schedule' | 'delegate' | 'eliminate';

export interface Label {
  id: string;
  name: string; // tối đa 255 ký tự
  isDefault: boolean; // 5 nhãn mặc định: Cá nhân, Công việc, Phát triển bản thân, Thói quen tốt, Thói quen xấu.
  color: string; // hex, tự sinh khi user tạo nhãn mới
}

export interface Task {
  id: string;
  name: string;                       // bắt buộc, tối đa 255 ký tự
  description?: string;               // không bắt buộc
  startDate: string;                  // ISO date — ngày bắt đầu thực hiện
  deadline?: string;                  // ISO datetime — không bắt buộc
  labelId: string;                    // tham chiếu Label
  classification: Classification;     // MVP: bắt buộc chọn thủ công (xem ghi chú AI ở 1.5.5)
  isRecurring: boolean;                // bắt buộc, mặc định false
  recurringIntervalDays?: number;     // bắt buộc NẾU isRecurring = true
  onlyRepeatWhenPrevDone?: boolean;   // bắt buộc NẾU isRecurring = true
  createdAt: string;                  // ISO, tự sinh
}

export type TaskCompletionStatus = 'completed' | 'skipped';

// Lịch sử hoàn thành theo từng ngày — entity mới, cần cho view tạo động lực (1.5.7) và trang Completed Tasks
export interface TaskCompletion {
  taskId: string;
  date: string;                       // YYYY-MM-DD
  status: TaskCompletionStatus;       // 'completed' | 'skipped'
  note?: string;                      // ghi chú chi tiết không bắt buộc
}

export interface NotificationConfig {
  generalEnabled: boolean; // config cơ bản: bật/tắt tổng quát
  perQuadrant: Record<Classification, boolean>; // default: do_now/schedule/delegate = true, eliminate = false
  reminderDays: number;     // default 2. Công thức: deadline - hôm nay <= reminderDays thì nhắc
  notifyFromTime?: string;  // "HH:mm"
  notifyToTime?: string;    // "HH:mm"
}

export interface UrgencyAutoUpgradeConfig {
  enabled: boolean;
  daysThreshold: number; // khi (deadline - hôm nay) <= giá trị này, tự nâng not-urgent -> urgent
}

// Chỉ lưu ở client, không có server session thật
export interface UserProfile {
  googleId: string;
  name: string;
  email: string;
  avatarUrl: string;
}
