import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';
import { createNotification } from './notifications';

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
}

export const fallbackCampaigns: CampaignRecord[] = [];

function mapCampaignData(data: CampaignInput, existing?: Partial<CampaignRecord>) {
  return {
    title: data.title,
    description: data.description,
    category: data.category,
    goal: Number(data.goal) || 0,
    raised: existing?.raised ?? 0,
    supporters: existing?.supporters ?? 0,
    deadline: data.deadline,
    image: data.image || existing?.image || '',
    status:
      existing?.status ??
      (data.deadline && new Date(data.deadline).getTime() < Date.now() ? 'completed' : 'active'),
    createdDate: existing?.createdDate || new Date().toISOString().split('T')[0],
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
    (items) => [...items].sort((a, b) => b.createdDate.localeCompare(a.createdDate)),
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
