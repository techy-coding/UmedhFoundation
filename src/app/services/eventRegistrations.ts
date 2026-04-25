import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';

export interface EventRegistrationRecord {
  id: string;
  eventId: string;
  eventTitle: string;
  volunteerEmail: string;
  volunteerName: string;
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
  approvedDate?: string;
  approvedBy?: string;
}

export const fallbackEventRegistrations: EventRegistrationRecord[] = [];

export interface EventRegistrationInput {
  eventId: string;
  eventTitle: string;
  volunteerEmail: string;
  volunteerName: string;
  registrationDate: string;
  status: 'pending' | 'approved' | 'rejected';
}

function mapEventRegistrationInput(data: EventRegistrationInput): Omit<EventRegistrationRecord, 'id'> {
  return {
    eventId: data.eventId,
    eventTitle: data.eventTitle,
    volunteerEmail: data.volunteerEmail,
    volunteerName: data.volunteerName,
    registrationDate: data.registrationDate,
    status: data.status,
  };
}

export function subscribeToEventRegistrations(
  callback: (items: EventRegistrationRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection<EventRegistrationRecord>(
    'eventRegistrations',
    callback,
    fallbackEventRegistrations,
    (items) => [...items].sort((a, b) => new Date(b.registrationDate).getTime() - new Date(a.registrationDate).getTime()),
    onError
  );
}

export async function createEventRegistration(data: EventRegistrationInput) {
  await createRecord('eventRegistrations', mapEventRegistrationInput(data));
}

export async function updateEventRegistration(id: string, data: Partial<EventRegistrationRecord>) {
  await updateRecord('eventRegistrations', id, data);
}

export async function deleteEventRegistration(id: string) {
  await deleteRecord('eventRegistrations', id);
}

// Helper function to get registrations for a specific volunteer
export function getVolunteerRegistrations(
  registrations: EventRegistrationRecord[],
  volunteerEmail: string
): EventRegistrationRecord[] {
  return registrations.filter(reg => reg.volunteerEmail === volunteerEmail);
}

// Helper function to get registrations for a specific event
export function getEventRegistrations(
  registrations: EventRegistrationRecord[],
  eventId: string
): EventRegistrationRecord[] {
  return registrations.filter(reg => reg.eventId === eventId);
}

// Helper function to check if a volunteer is registered for an event
export function isVolunteerRegisteredForEvent(
  registrations: EventRegistrationRecord[],
  eventId: string,
  volunteerEmail: string
): boolean {
  return registrations.some(reg => 
    reg.eventId === eventId && 
    reg.volunteerEmail === volunteerEmail && 
    reg.status === 'approved'
  );
}
