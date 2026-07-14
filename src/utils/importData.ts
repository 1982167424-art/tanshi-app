import { useAuthStore } from '@/store/useAuthStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import { useCompanionStore } from '@/store/useCompanionStore';
import { ExportData } from './exportData';

export interface ImportResult {
  success: boolean;
  message: string;
  details?: {
    days: number;
    notes: number;
    habits: number;
    moods: number;
    conversations: number;
  };
}

const isValidExportData = (data: unknown): data is ExportData => {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;

  if (typeof d.version !== 'number') return false;
  if (typeof d.exportDate !== 'string') return false;
  if (typeof d.appName !== 'string') return false;

  if (typeof d.auth !== 'object' || d.auth === null) return false;
  if (!Array.isArray(d.days)) return false;
  if (!Array.isArray(d.notes)) return false;
  if (!Array.isArray(d.habits)) return false;
  if (!Array.isArray(d.moods)) return false;
  if (!Array.isArray(d.conversations)) return false;

  return true;
};

export const validateImportFile = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        if (!text) {
          resolve({ success: false, message: '文件内容为空' });
          return;
        }

        const json = JSON.parse(text);
        if (!isValidExportData(json)) {
          resolve({ success: false, message: '文件格式不正确，缺少必要字段或数据类型不匹配' });
          return;
        }

        if (json.appName !== '探时') {
          resolve({ success: false, message: '该文件不是探时应用的备份文件' });
          return;
        }

        resolve({ success: true, message: '文件验证通过' });
      } catch {
        resolve({ success: false, message: '无法解析JSON文件，请检查文件格式' });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: '读取文件失败' });
    };

    reader.readAsText(file);
  });
};

export const importAllData = async (file: File): Promise<ImportResult> => {
  return new Promise((resolve) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const data: ExportData = JSON.parse(text);

        const authState = useAuthStore.getState();
        if (data.auth.currentUser) {
          useAuthStore.setState({
            currentUser: { ...authState.currentUser, ...data.auth.currentUser } as typeof authState.currentUser,
          });
        }

        const daysState = useDaysStore.getState();
        const existingDayIds = new Set(daysState.days.map((d) => d.id));
        const newDays = data.days.filter((d) => !existingDayIds.has(d.id));
        useDaysStore.setState({ days: [...daysState.days, ...newDays] });

        const notesState = useNotesStore.getState();
        const existingNoteIds = new Set(notesState.notes.map((n) => n.id));
        const newNotes = data.notes.filter((n) => !existingNoteIds.has(n.id));
        useNotesStore.setState({ notes: [...notesState.notes, ...newNotes] });

        const habitsState = useHabitsStore.getState();
        const existingHabitIds = new Set(habitsState.habits.map((h) => h.id));
        const newHabits = data.habits.filter((h) => !existingHabitIds.has(h.id));
        useHabitsStore.setState({ habits: [...habitsState.habits, ...newHabits] });

        const moodState = useMoodStore.getState();
        const existingMoodIds = new Set(moodState.moods.map((m) => m.id));
        const newMoods = data.moods.filter((m) => !existingMoodIds.has(m.id));
        useMoodStore.setState({ moods: [...moodState.moods, ...newMoods] });

        const companionState = useCompanionStore.getState();
        const existingConvIds = new Set(companionState.conversations.map((c) => c.id));
        const newConversations = data.conversations.filter((c) => !existingConvIds.has(c.id));
        useCompanionStore.setState({ conversations: [...companionState.conversations, ...newConversations] });

        resolve({
          success: true,
          message: '数据导入成功',
          details: {
            days: newDays.length,
            notes: newNotes.length,
            habits: newHabits.length,
            moods: newMoods.length,
            conversations: newConversations.length,
          },
        });
      } catch {
        resolve({ success: false, message: '导入过程中发生错误' });
      }
    };

    reader.onerror = () => {
      resolve({ success: false, message: '读取文件失败' });
    };

    reader.readAsText(file);
  });
};
