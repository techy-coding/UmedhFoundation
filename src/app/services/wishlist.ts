import type { NeedFormData } from '../components/forms/AddNeedForm';
import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';

export interface DonorEntry {
  name: string;
  email: string;
  phone: string;
  donationDate?: string;
  quantity?: number;
  amount?: number;
}

export interface NeedRecord {
  id: string;
  item: string;
  category: string;
  quantity: string;
  priority: string;
  requiredBy: string;
  beneficiaryName: string;
  purpose: string;
  estimatedCost: string;
  status: 'pending' | 'fulfilled' | 'partial';
  fulfilledQuantity: number;
  /** Latest donor — kept for backward compatibility with older records. */
  donorInfo?: DonorEntry;
  /** Full list of donors that contributed to this need. */
  donors?: DonorEntry[];
}

export const fallbackNeeds: NeedRecord[] = [];

/**
 * Always returns an array of donor entries for a need, whether the record uses
 * the new `donors` array or only has the legacy single `donorInfo` object.
 */
export function getDonorEntries(need: NeedRecord | null | undefined): DonorEntry[] {
  if (!need) {
    return [];
  }

  if (Array.isArray(need.donors) && need.donors.length > 0) {
    return need.donors;
  }

  if (need.donorInfo && typeof need.donorInfo === 'object') {
    return [need.donorInfo];
  }

  return [];
}

function mapNeedFormData(
  data: NeedFormData,
  fulfilledQuantity: number,
  status: NeedRecord['status'],
  donors?: DonorEntry[]
) {
  const needData: Omit<NeedRecord, 'id'> = {
    item: data.item,
    category: data.category,
    quantity: data.quantity,
    priority: data.priority,
    requiredBy: data.requiredBy,
    beneficiaryName: data.beneficiaryName,
    purpose: data.purpose,
    estimatedCost: data.estimatedCost,
    fulfilledQuantity,
    status,
  };

  if (donors && donors.length > 0) {
    needData.donors = donors;
    // Keep a legacy single-donor copy (latest) so old code paths still work.
    needData.donorInfo = donors[donors.length - 1];
  }

  return needData;
}

export function subscribeToNeeds(
  callback: (items: NeedRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection(
    'wishlist',
    callback,
    fallbackNeeds,
    (items) => [...items].sort((a, b) => (a.requiredBy || '').localeCompare(b.requiredBy || '')),
    onError
  );
}

export async function createNeed(data: NeedFormData) {
  await createRecord('wishlist', mapNeedFormData(data, 0, 'pending'));
}

export async function updateNeed(
  id: string,
  data: NeedFormData,
  fulfilledQuantity: number,
  status: NeedRecord['status'],
  donors?: DonorEntry[]
) {
  const needData = mapNeedFormData(data, fulfilledQuantity, status, donors);
  await updateRecord('wishlist', id, needData);
}

export async function deleteNeed(id: string) {
  await deleteRecord('wishlist', id);
}
