// lib/store.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type {
  Task,
  Label,
  TaskCompletion,
  NotificationConfig,
  UrgencyAutoUpgradeConfig,
  UserProfile,
} from './types';

// ── Default labels (seeded on first init) ──────────────────────────────────
const DEFAULT_LABELS: Label[] = [
  { id: 'label-1', name: 'Cá nhân', isDefault: true, color: '#3B82F6' },
  { id: 'label-2', name: 'Công việc', isDefault: true, color: '#10B981' },
  { id: 'label-3', name: 'Phát triển bản thân', isDefault: true, color: '#F59E0B' },
  { id: 'label-4', name: 'Thói quen tốt', isDefault: true, color: '#14B8A6' },
  { id: 'label-5', name: 'Thói quen xấu', isDefault: true, color: '#EF4444' },
];

const DEFAULT_NOTIFICATION_CONFIG: NotificationConfig = {
  generalEnabled: false,
  perQuadrant: {
    do_now: true,
    schedule: true,
    delegate: true,
    eliminate: false,
  },
  reminderDays: 2,
  notifyFromTime: undefined,
  notifyToTime: undefined,
};

const DEFAULT_URGENCY_CONFIG: UrgencyAutoUpgradeConfig = {
  enabled: false,
  daysThreshold: 2,
};

// ── Helper: generate unique id ─────────────────────────────────────────────
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

// ── Store interface ────────────────────────────────────────────────────────
interface AppState {
  // Data
  tasks: Task[];
  labels: Label[];
  taskCompletions: TaskCompletion[];
  notificationConfig: NotificationConfig;
  urgencyConfig: UrgencyAutoUpgradeConfig;
  userProfile: UserProfile | null;

  // Task actions
  addTask: (task: Omit<Task, 'id' | 'createdAt'> | Task) => void;
  updateTask: (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>) => void;
  deleteTask: (id: string) => void;

  // Label actions
  addLabel: (label: Omit<Label, 'id'> | Label) => string;
  updateLabel: (id: string, updates: Partial<Omit<Label, 'id'>>) => void;
  deleteLabel: (id: string) => void;

  // TaskCompletion actions
  addTaskCompletion: (completion: TaskCompletion) => void;
  removeTaskCompletion: (taskId: string, date: string) => void;

  // Config actions
  updateNotificationConfig: (config: Partial<NotificationConfig>) => void;
  updateUrgencyConfig: (config: Partial<UrgencyAutoUpgradeConfig>) => void;

  // User profile actions
  setUserProfile: (profile: UserProfile) => void;
  clearUserProfile: () => void;
}

// ── Zustand store with persist middleware ───────────────────────────────────
export const useAppStore = create<AppState>()(
  persist(
    (set) => ({
      // ── Initial state ──
      tasks: [],
      labels: DEFAULT_LABELS,
      taskCompletions: [],
      notificationConfig: DEFAULT_NOTIFICATION_CONFIG,
      urgencyConfig: DEFAULT_URGENCY_CONFIG,
      userProfile: null,

      // ── Task actions ──
      addTask: (taskData) =>
        set((state) => ({
          tasks: [
            ...state.tasks,
            {
              ...taskData,
              id: ('id' in taskData && taskData.id) ? taskData.id : generateId(),
              createdAt: ('createdAt' in taskData && taskData.createdAt) ? taskData.createdAt : new Date().toISOString(),
            },
          ],
        })),

      updateTask: (id, updates) =>
        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === id ? { ...task, ...updates } : task
          ),
        })),

      deleteTask: (id) =>
        set((state) => ({
          tasks: state.tasks.filter((task) => task.id !== id),
          // Also clean up related completions to avoid orphaned data
          taskCompletions: state.taskCompletions.filter(
            (tc) => tc.taskId !== id
          ),
        })),

      // ── Label actions ──
      addLabel: (labelData) => {
        const id = 'id' in labelData && labelData.id ? labelData.id : generateId();
        set((state) => ({
          labels: [
            ...state.labels,
            {
              ...labelData,
              id,
            },
          ],
        }));
        return id;
      },

      updateLabel: (id, updates) =>
        set((state) => ({
          labels: state.labels.map((label) =>
            label.id === id ? { ...label, ...updates } : label
          ),
        })),

      deleteLabel: (id) =>
        set((state) => {
          const defaultLabelId =
            state.labels.find((l) => l.isDefault && l.name === 'Cá nhân')?.id ||
            state.labels.find((l) => l.isDefault)?.id ||
            'label-1';

          return {
            labels: state.labels.filter((label) => label.id !== id),
            tasks: state.tasks.map((task) =>
              task.labelId === id ? { ...task, labelId: defaultLabelId } : task
            ),
          };
        }),

      // ── TaskCompletion actions ──
      addTaskCompletion: (completion) =>
        set((state) => {
          // Prevent duplicate completion for same task+date
          const exists = state.taskCompletions.some(
            (tc) => tc.taskId === completion.taskId && tc.date === completion.date
          );
          if (exists) {
            return {
              taskCompletions: state.taskCompletions.map((tc) =>
                tc.taskId === completion.taskId && tc.date === completion.date
                  ? completion
                  : tc
              ),
            };
          }
          return {
            taskCompletions: [...state.taskCompletions, completion],
          };
        }),

      removeTaskCompletion: (taskId, date) =>
        set((state) => ({
          taskCompletions: state.taskCompletions.filter(
            (tc) => !(tc.taskId === taskId && tc.date === date)
          ),
        })),

      // ── Config actions ──
      updateNotificationConfig: (config) =>
        set((state) => ({
          notificationConfig: { ...state.notificationConfig, ...config },
        })),

      updateUrgencyConfig: (config) =>
        set((state) => ({
          urgencyConfig: { ...state.urgencyConfig, ...config },
        })),

      // ── User profile actions ──
      setUserProfile: (profile) => set({ userProfile: profile }),
      clearUserProfile: () => set({ userProfile: null }),
    }),
    {
      name: 'eisenhower-app-storage', // localStorage key
    }
  )
);
