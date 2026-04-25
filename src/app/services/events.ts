import type { EventFormData } from '../components/forms/AddEventForm';
import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';
import { createNotification } from './notifications';

export interface EventRecord {
  id: string;
  title: string;
  description: string;
  eventType: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  volunteersNeeded: string;
  volunteersRegistered: number;
  skillsRequired: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  image?: string;
}

export const fallbackEvents: EventRecord[] = [];

function mapEventFormData(data: EventFormData, volunteersRegistered: number, existingImage = '') {
  return {
    title: data.title,
    description: data.description,
    eventType: data.eventType,
    date: data.date,
    time: data.time,
    duration: data.duration,
    location: data.location,
    volunteersNeeded: data.volunteersNeeded,
    volunteersRegistered,
    skillsRequired: data.skillsRequired,
    contactPerson: data.contactPerson,
    contactEmail: data.contactEmail,
    contactPhone: data.contactPhone,
    image:
      typeof data.image === 'string'
        ? data.image
        : data.image
          ? data.image.name
          : existingImage,
  };
}

export function subscribeToEvents(
  callback: (items: EventRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection(
    'events',
    callback,
    fallbackEvents,
    (items) => [...items].sort((a, b) => a.date.localeCompare(b.date)),
    onError
  );
}

export async function createEvent(data: EventFormData) {
  await createRecord('events', mapEventFormData(data, 0));
  await createNotification({
    title: 'New event announced',
    message: `${data.title} has been scheduled for ${data.date} at ${data.time}.`,
    type: 'event',
    audience: 'roles',
    roles: ['donor', 'volunteer'],
    link: '/dashboard/events',
  });
}

export async function updateEvent(id: string, data: EventFormData, volunteersRegistered: number, existingImage = '') {
  await updateRecord('events', id, mapEventFormData(data, volunteersRegistered, existingImage));
}

export async function deleteEvent(id: string) {
  await deleteRecord('events', id);
}
