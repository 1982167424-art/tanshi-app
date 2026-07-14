import { useAuthStore } from '@/store/useAuthStore';
import { useDaysStore } from '@/store/useDaysStore';
import { useNotesStore } from '@/store/useNotesStore';
import { useHabitsStore } from '@/store/useHabitsStore';
import { useMoodStore } from '@/store/useMoodStore';
import { useCompanionStore } from '@/store/useCompanionStore';

export interface ExportData {
  version: number;
  exportDate: string;
  appName: string;
  auth: {
    currentUser: ReturnType<typeof useAuthStore.getState>['currentUser'];
  };
  days: ReturnType<typeof useDaysStore.getState>['days'];
  notes: ReturnType<typeof useNotesStore.getState>['notes'];
  habits: ReturnType<typeof useHabitsStore.getState>['habits'];
  moods: ReturnType<typeof useMoodStore.getState>['moods'];
  conversations: ReturnType<typeof useCompanionStore.getState>['conversations'];
}

export const exportAllData = (): ExportData => {
  const authState = useAuthStore.getState();
  const daysState = useDaysStore.getState();
  const notesState = useNotesStore.getState();
  const habitsState = useHabitsStore.getState();
  const moodState = useMoodStore.getState();
  const companionState = useCompanionStore.getState();

  return {
    version: 1,
    exportDate: new Date().toISOString(),
    appName: '探时',
    auth: {
      currentUser: authState.currentUser,
    },
    days: daysState.days,
    notes: notesState.notes,
    habits: habitsState.habits,
    moods: moodState.moods,
    conversations: companionState.conversations,
  };
};

export const downloadJsonFile = (data: ExportData, filename?: string): void => {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  const dateStr = new Date().toLocaleDateString('zh-CN').replace(/\//g, '-');
  link.download = filename || `探时备份_${dateStr}.json`;
  link.href = url;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};
