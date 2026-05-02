import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';
import { createNotification } from './notifications';
import { toCurrencyNumber } from '../utils/currency';

export interface CampaignRecord {
  id: string;
  title: string;
  description: string;
  category: string;
  goal: number;
  raised: number;
  supporters: number;
  deadline: string;
  image: string;
  status: 'active' | 'completed' | 'draft';
  createdDate: string;
}

export interface CampaignInput {
  title: string;
  description: string;
  category: string;
  goal: string;
  deadline: string;
  image?: string;
  status?: CampaignRecord['status'];
}

export const fallbackCampaigns: CampaignRecord[] = [];

function mapCampaignData(data: CampaignInput, existing?: Partial<CampaignRecord>) {
  const goal = toCurrencyNumber(data.goal || (data as CampaignInput & { targetAmount?: string }).targetAmount);
  const nextStatus =
    data.status ??
    existing?.status ??
    (data.deadline && new Date(data.deadline).getTime() < Date.now() ? 'completed' : 'active');

  return {
    title: data.title,
    description: data.description,
    category: data.category,
    goal,
    raised: toCurrencyNumber(existing?.raised),
    supporters: toCurrencyNumber(existing?.supporters),
    deadline: data.deadline,
    image: data.image || existing?.image || '',
    status: nextStatus,
    createdDate: existing?.createdDate || new Date().toISOString().split('T')[0],
  };
}

function normalizeStatus(value: unknown, deadline: string): CampaignRecord['status'] {
  const status = String(value || '').toLowerCase();

  if (status === 'completed' || status === 'draft') return status;
  if (deadline && new Date(deadline).getTime() < Date.now()) return 'completed';
  return 'active';
}

function normalizeCampaignRecord(item: CampaignRecord & Record<string, unknown>): CampaignRecord {
  const goal = toCurrencyNumber(item.goal ?? item.targetAmount ?? item.target ?? item.amountNeeded);
  const raised = toCurrencyNumber(item.raised ?? item.raisedAmount ?? item.fundsRaised ?? item.currentAmount);
  const supporters = toCurrencyNumber(item.supporters ?? item.supporterCount ?? item.donorCount ?? item.donors);
  const deadline = String(item.deadline ?? item.endDate ?? '');

  return {
    id: String(item.id),
    title: String(item.title ?? item.name ?? 'Untitled campaign'),
    description: String(item.description ?? ''),
    category: String(item.category ?? 'General'),
    goal,
    raised,
    supporters,
    deadline,
    image: String(item.image ?? item.imageUrl ?? ''),
    status: normalizeStatus(item.status, deadline),
    createdDate: String(item.createdDate ?? item.createdAt ?? item.date ?? new Date().toISOString().split('T')[0]),
  };
}

export function subscribeToCampaigns(
  callback: (items: CampaignRecord[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection(
    'campaigns',
    callback,
    fallbackCampaigns,
    (items) =>
      [...items]
        .map((item) => normalizeCampaignRecord(item as CampaignRecord & Record<string, unknown>))
        .sort((a, b) => b.createdDate.localeCompare(a.createdDate)),
    onError
  );
}

export async function createCampaign(data: CampaignInput) {
  await createRecord('campaigns', mapCampaignData(data));
  await createNotification({
    title: 'New campaign launched',
    message: `${data.title} is now live and open for support.`,
    type: 'campaign',
    audience: 'roles',
    roles: ['donor', 'volunteer'],
    link: '/dashboard/campaigns',
  });
}

export async function updateCampaign(id: string, data: CampaignInput, existing: CampaignRecord) {
  await updateRecord('campaigns', id, mapCampaignData(data, existing));
}

export async function deleteCampaign(id: string) {
  await deleteRecord('campaigns', id);
}
