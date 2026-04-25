import type { UserFormData } from '../components/forms/AddUserForm';
import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';

export interface UserRecord {
  id: string;
  name: string;
  firstName?: string;
  lastName?: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  joinedDate: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export const fallbackUsers: UserRecord[] = [];

function mapUserFormData(data: UserFormData, joinedDate?: string) {
  return {
    name: data.name,
    email: data.email,
    phone: data.phone,
    role: data.role,
    status: data.status,
    joinedDate: joinedDate || new Date().toISOString().split('T')[0],
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
  };
}

export function subscribeToUsers(
  callback: (items: UserRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection(
    'users',
    callback,
    fallbackUsers,
    (items) => [...items].sort((a, b) => b.joinedDate.localeCompare(a.joinedDate)),
    onError
  );
}

export async function createUser(data: UserFormData) {
  await createRecord('users', mapUserFormData(data));
}

export async function updateUser(id: string, data: UserFormData, joinedDate: string) {
  await updateRecord('users', id, mapUserFormData(data, joinedDate));
}

export async function updateUserStatus(user: UserRecord, status: string) {
  await updateRecord('users', user.id, {
    ...user,
    status,
  });
}

export async function deleteUser(id: string) {
  await deleteRecord('users', id);
}
