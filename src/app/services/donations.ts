import { get, onValue, orderByChild, push, query, ref, set, update } from 'firebase/database';
import { database } from '../lib/firebase';
import type { DonationFormData } from '../components/forms/AddDonationForm';
import { createNotification } from './notifications';

export interface Donation {
  id: string;
  amount: string;
  category: string;
  date: string;
  paymentMethod: string;
  status: string;
  tax80G: boolean;
  campaign: string;
  isRecurring: boolean;
  frequency: string;
  message: string;
  isAnonymous: boolean;
  userId?: string;
  userEmail?: string;
  userName?: string;
  campaignId?: string;
  paymentGateway?: string;
  paymentId?: string;
  paymentOrderId?: string;
  paymentSignature?: string;
}

export const fallbackDonations: Donation[] = [];

export function subscribeToDonations(
  callback: (donations: Donation[]) => void,
  onError?: (error: Error) => void
) {
  if (!database) {
    callback(fallbackDonations);
    return () => undefined;
  }

  const donationsRef = query(ref(database, 'donations'), orderByChild('date'));

  return onValue(
    donationsRef,
    (snapshot) => {
      const value = snapshot.val();

      if (!value) {
        callback([]);
        return;
      }

      const donations = Object.entries(value)
        .map(([id, donation]) => ({
          id,
          ...(donation as Omit<Donation, 'id'>),
        }))
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

      callback(donations);
    },
    (error) => {
      onError?.(error);
    }
  );
}

export async function createDonation(data: DonationFormData) {
  if (!database) {
    throw new Error('Firebase is not configured yet.');
  }

  const savedUser = localStorage.getItem('user');
  const parsedUser = savedUser ? JSON.parse(savedUser) : null;

  const donationsRef = ref(database, 'donations');
  const newDonationRef = push(donationsRef);

  await set(newDonationRef, {
    amount: data.amount,
    category: data.category,
    date: new Date().toISOString().split('T')[0],
    paymentMethod: data.paymentMethod,
    status: 'completed',
    tax80G: data.tax80G,
    campaign: data.campaign,
    isRecurring: data.isRecurring,
    frequency: data.frequency,
    message: data.message,
    isAnonymous: data.isAnonymous,
    userId: parsedUser?.id || '',
    userEmail: parsedUser?.email || localStorage.getItem('userEmail') || '',
    userName: parsedUser?.name || localStorage.getItem('userName') || '',
    campaignId: data.campaignId || '',
    paymentGateway: data.paymentGateway || '',
    paymentId: data.paymentId || '',
    paymentOrderId: data.paymentOrderId || '',
    paymentSignature: data.paymentSignature || '',
  });

  if (data.campaignId) {
    const campaignRef = ref(database, `campaigns/${data.campaignId}`);
    const snapshot = await get(campaignRef);

    if (snapshot.exists()) {
      const campaign = snapshot.val();
      const nextRaised = Number(campaign.raised || 0) + Number(data.amount || 0);
      const nextSupporters = Number(campaign.supporters || 0) + 1;
      const nextStatus = nextRaised >= Number(campaign.goal || 0) && Number(campaign.goal || 0) > 0 ? 'completed' : campaign.status || 'active';

      await update(campaignRef, {
        raised: nextRaised,
        supporters: nextSupporters,
        status: nextStatus,
      });
    }
  }

  await Promise.all([
    createNotification({
      title: 'Donation received',
      message: `${parsedUser?.name || localStorage.getItem('userName') || 'A donor'} contributed ₹${Number(data.amount || 0).toLocaleString()} to ${data.campaign || 'General Donation'}.`,
      type: 'donation',
      audience: 'roles',
      roles: ['admin', 'staff'],
      link: '/dashboard/impact',
    }),
    createNotification({
      title: 'Thank you for your donation',
      message: `Your donation of ₹${Number(data.amount || 0).toLocaleString()} for ${data.campaign || 'General Donation'} was recorded successfully.`,
      type: 'donation',
      audience: 'user',
      userEmail: parsedUser?.email || localStorage.getItem('userEmail') || '',
      link: '/dashboard/reports',
    }),
  ]);
}
