import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { PaymentModal } from '../common/PaymentModal';
import { AddDonationForm, DonationFormData } from '../forms/AddDonationForm';
import { download80GReceipt } from '../common/Tax80GReceipt';
import { motion } from 'motion/react';
import { Download, Heart, Search } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import { createDonation, fallbackDonations, subscribeToDonations, type Donation } from '../../services/donations';

export function DonationsManagePage() {
  const [donations, setDonations] = useState<Donation[]>(fallbackDonations);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [showModal, setShowModal] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToDonations(
      (items) => {
        setDonations(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load donations from Firebase:', error);
        toast.error('Could not load donations from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);
  const [pendingDonation, setPendingDonation] = useState<DonationFormData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToDonations(
      (nextDonations) => {
        setDonations(nextDonations);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load donations from Firebase:', error);
        toast.error('Could not load donations from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleSubmit = (data: DonationFormData) => {
    setPendingDonation(data);
    setShowModal(false);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    if (pendingDonation) {
      if (!isFirebaseConfigured) {
        const newDonation: Donation = {
          id: Date.now().toString(),
          amount: pendingDonation.amount,
          category: pendingDonation.category,
          date: new Date().toISOString().split('T')[0],
          paymentMethod: pendingDonation.paymentMethod,
          status: 'completed',
          tax80G: pendingDonation.tax80G,
          campaign: pendingDonation.campaign,
          isRecurring: pendingDonation.isRecurring,
          frequency: pendingDonation.frequency,
          message: pendingDonation.message,
          isAnonymous: pendingDonation.isAnonymous,
        };

        setDonations((currentDonations) => [newDonation, ...currentDonations]);
        setPendingDonation(null);
        setShowPaymentModal(false);
        return;
      }

      try {
        await createDonation(pendingDonation);
        setPendingDonation(null);
        setShowPaymentModal(false);
        toast.success('Donation saved to Firebase.');
      } catch (error) {
        console.error('Failed to save donation to Firebase:', error);
        toast.error('Payment succeeded, but saving to Firebase failed.');
      }
    }
  };

  const downloadReceipt = (donation: Donation) => {
    download80GReceipt(donation);
  };

  const filteredDonations = donations.filter((d) =>
    d.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    d.amount.includes(searchQuery) ||
    new Date(d.date).toLocaleDateString().includes(searchQuery)
  );

  const categoryLabels: Record<string, string> = {
    general: 'General Fund',
    education: 'Education',
    food: 'Food & Nutrition',
    healthcare: 'Healthcare',
    shelter: 'Shelter',
    emergency: 'Emergency Relief',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Donations</h1>
          <p className="text-muted-foreground mt-1">View and manage your donation history</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Make Donation
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
          <p className="text-3xl font-bold">
            ₹{donations.reduce((sum, d) => sum + parseInt(d.amount), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Total Donations</p>
          <p className="text-3xl font-bold">{donations.length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Tax Saved (80G)</p>
          <p className="text-3xl font-bold">
            ₹{Math.floor(donations.filter(d => d.tax80G).reduce((sum, d) => sum + parseInt(d.amount), 0) * 0.5).toLocaleString()}
          </p>
        </div>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by amount, category, or date..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
        </div>
        {isLoading && (
          <div className="mb-4 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
            Loading donations from Firebase...
          </div>
        )}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left py-3 px-4">Date</th>
                <th className="text-left py-3 px-4">Amount</th>
                <th className="text-left py-3 px-4">Category</th>
                <th className="text-left py-3 px-4">Payment Method</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-right py-3 px-4">Receipt</th>
              </tr>
            </thead>
            <tbody>
              {filteredDonations.map((donation) => (
                <tr key={donation.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="py-3 px-4 text-sm">
                    {new Date(donation.date).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4 font-semibold">
                    ₹{parseInt(donation.amount).toLocaleString()}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs">
                      {categoryLabels[donation.category]}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm capitalize text-muted-foreground">
                    {donation.paymentMethod}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs capitalize">
                      {donation.status}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex justify-end">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => downloadReceipt(donation)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 text-primary hover:bg-primary/20 transition-colors text-sm"
                      >
                        <Download className="w-4 h-4" />
                        {donation.tax80G && '80G'}
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Make a Donation" size="md">
        <AddDonationForm
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      {pendingDonation && (
        <PaymentModal
          isOpen={showPaymentModal}
          onClose={() => {
            setShowPaymentModal(false);
            setPendingDonation(null);
          }}
          amount={pendingDonation.amount}
          onSuccess={handlePaymentSuccess}
          purpose={categoryLabels[pendingDonation.category]}
        />
      )}
    </div>
  );
}
