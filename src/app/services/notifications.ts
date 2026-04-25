import { subscribeToCollection, createRecord } from './firebaseCrud';

export interface NotificationRecord {
  id: string;
  title: string;
  message: string;
  createdAt: string;
  type: 'system' | 'donation' | 'sponsorship' | 'event' | 'approval' | 'campaign';
  audience: 'all' | 'roles' | 'user';
  roles?: string[];
  userEmail?: string;
  link?: string;
}

export interface NotificationInput extends Omit<NotificationRecord, 'id' | 'createdAt'> {
  createdAt?: string;
}

export function subscribeToNotifications(
  callback: (items: NotificationRecord[]) => void,
  role: string,
  userEmail: string,
  onError?: (error: Error) => void
) {
  return subscribeToCollection<NotificationRecord>(
    'notifications',
    (items) => {
      const filtered = items.filter((item) => {
        if (item.audience === 'all') {
          return true;
        }

        if (item.audience === 'roles') {
          return Array.isArray(item.roles) && item.roles.includes(role);
        }

        return Boolean(userEmail) && item.userEmail === userEmail;
      });

      callback(filtered);
    },
    [],
    (items) =>
      [...items].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    onError
  );
}

export async function createNotification(input: NotificationInput) {
  await createRecord('notifications', {
    ...input,
    createdAt: input.createdAt || new Date().toISOString(),
  });
}

