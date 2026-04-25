import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  assignedToEmail: string;
  assignedToName: string;
  dueDate: string;
  location?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  status: 'pending' | 'in-progress' | 'completed';
  createdDate: string;
  completedDate?: string;
  createdBy?: string;
  eventId?: string;
  points?: number;
}

export const fallbackTasks: TaskRecord[] = [];

export interface TaskInput {
  title: string;
  description: string;
  assignedToEmail: string;
  assignedToName?: string;
  dueDate: string;
  location?: string;
  category?: string;
  priority?: 'low' | 'medium' | 'high';
  createdBy?: string;
  eventId?: string;
  points?: number;
}

function mapTaskInput(data: TaskInput, existing?: Partial<TaskRecord>): Omit<TaskRecord, 'id'> {
  const result: Omit<TaskRecord, 'id'> = {
    title: data.title,
    description: data.description,
    assignedToEmail: data.assignedToEmail,
    assignedToName: data.assignedToName || existing?.assignedToName || '',
    dueDate: data.dueDate,
    location: data.location || existing?.location || '',
    category: data.category || existing?.category || 'general',
    priority: data.priority || existing?.priority || 'medium',
    status: existing?.status || 'pending',
    createdDate: existing?.createdDate || new Date().toISOString(),
    createdBy: data.createdBy || existing?.createdBy || '',
    eventId: data.eventId || existing?.eventId || '',
    points: data.points ?? existing?.points ?? 10,
  };

  // Only include completedDate if it exists (for new tasks, don't include it at all)
  if (existing?.completedDate) {
    result.completedDate = existing.completedDate;
  }

  return result;
}

export function subscribeToTasks(
  callback: (items: TaskRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection<TaskRecord>(
    'tasks',
    callback,
    fallbackTasks,
    (items) =>
      [...items].sort((a, b) => {
        // Pending first, then in-progress, completed last. Within a group,
        // earliest due date first.
        const statusOrder: Record<string, number> = { pending: 0, 'in-progress': 1, completed: 2 };
        const statusDiff = (statusOrder[a.status] ?? 3) - (statusOrder[b.status] ?? 3);
        if (statusDiff !== 0) return statusDiff;
        return (a.dueDate || '').localeCompare(b.dueDate || '');
      }),
    onError
  );
}

export async function createTask(data: TaskInput) {
  await createRecord('tasks', mapTaskInput(data));
}

export async function updateTask(id: string, data: TaskInput, existing: TaskRecord) {
  await updateRecord('tasks', id, mapTaskInput(data, existing));
}

export async function setTaskStatus(task: TaskRecord, status: TaskRecord['status']) {
  const completedDate =
    status === 'completed' ? task.completedDate || new Date().toISOString() : task.completedDate || '';

  await updateRecord('tasks', task.id, {
    ...task,
    status,
    completedDate,
  });
}

export async function deleteTask(id: string) {
  await deleteRecord('tasks', id);
}
