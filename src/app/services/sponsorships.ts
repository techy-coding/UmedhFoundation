import { createRecord, subscribeToCollection } from './firebaseCrud';

export interface SponsorshipRecord {
  id: string;
  beneficiaryId: string;
  beneficiaryName: string;
  beneficiaryImage: string;
  beneficiaryLocation: string;
  beneficiaryEducation: string;
  monthlyNeed: number;
  donorId: string;
  donorName: string;
  donorEmail: string;
  startDate: string;
  totalDonated: number;
  monthsPaid: number;
  nextPayment: string;
  status: 'active' | 'paused';
}

export const fallbackSponsorships: SponsorshipRecord[] = [];

export function subscribeToSponsorships(
  callback: (items: SponsorshipRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection(
    'sponsorships',
    callback,
    fallbackSponsorships,
    (items) => [...items].sort((a, b) => b.startDate.localeCompare(a.startDate)),
    onError
  );
}

export async function createSponsorship(data: Omit<SponsorshipRecord, 'id'>) {
  await createRecord('sponsorships', data);
}
