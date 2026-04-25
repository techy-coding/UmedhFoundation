import { createRecord, deleteRecord, subscribeToCollection } from './firebaseCrud';

export interface AchievementRecord {
  id: string;
  title: string;
  description: string;
  volunteerEmail: string;
  volunteerName: string;
  earnedDate: string;
  taskId?: string;
  category?: string;
  icon?: string;
  points?: number;
}

export const fallbackAchievements: AchievementRecord[] = [];

export interface AchievementInput {
  title: string;
  description: string;
  volunteerEmail: string;
  volunteerName: string;
  taskId?: string;
  category?: string;
  icon?: string;
  points?: number;
}

function mapAchievementInput(data: AchievementInput): Omit<AchievementRecord, 'id'> {
  return {
    title: data.title,
    description: data.description,
    volunteerEmail: data.volunteerEmail,
    volunteerName: data.volunteerName,
    earnedDate: new Date().toISOString(),
    taskId: data.taskId || '',
    category: data.category || 'general',
    icon: data.icon || '🏆',
    points: data.points ?? 10,
  };
}

export function subscribeToAchievements(
  callback: (items: AchievementRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection<AchievementRecord>(
    'achievements',
    callback,
    fallbackAchievements,
    (items) => [...items].sort((a, b) => (b.earnedDate || '').localeCompare(a.earnedDate || '')),
    onError
  );
}

export async function createAchievement(data: AchievementInput) {
  await createRecord('achievements', mapAchievementInput(data));
}

export async function deleteAchievement(id: string) {
  await deleteRecord('achievements', id);
}
