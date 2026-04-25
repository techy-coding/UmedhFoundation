import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AddSponsorshipForm, SponsorshipFormData } from '../forms/AddSponsorshipForm';
import { motion } from 'motion/react';
import { Plus, Heart, X, Search } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import { subscribeToSponsorships } from '../../services/sponsorships';

interface Sponsorship {
  id: string;
  beneficiaryName: string;
  sponsorshipType: string;
  monthlyAmount: string;
  startDate: string;
  status: string;
}

export function SponsorshipsManagePage() {
  const [sponsorships, setSponsorships] = useState<Sponsorship[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [cancelSponsorship, setCancelSponsorship] = useState<Sponsorship | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToSponsorships(
      (items: any[]) => {
        setSponsorships(items);
        setIsLoading(false);
      },
      (error: any) => {
        console.error('Failed to load sponsorships from Firebase:', error);
        toast.error('Could not load sponsorships from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleSubmit = (data: SponsorshipFormData) => {
    const newSponsorship: Sponsorship = {
      id: Date.now().toString(),
      beneficiaryName: data.beneficiaryId,
      sponsorshipType: data.sponsorshipType,
      monthlyAmount: data.monthlyAmount,
      startDate: data.startDate,
      status: 'active',
    };
    setSponsorships([newSponsorship, ...sponsorships]);
    setShowModal(false);
    toast.success('Sponsorship created successfully!');
  };

  const handleCancel = () => {
    if (cancelSponsorship) {
      setSponsorships(sponsorships.filter((s) => s.id !== cancelSponsorship.id));
      toast.success('Sponsorship cancelled');
      setCancelSponsorship(null);
    }
  };

  const typeLabels: Record<string, string> = {
    education: 'Education',
    healthcare: 'Healthcare',
    general: 'General Care',
    complete: 'Complete',
  };

  const filteredSponsorships = sponsorships.filter((s) =>
    s.beneficiaryName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    typeLabels[s.sponsorshipType].toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Sponsorships</h1>
          <p className="text-muted-foreground mt-1">Support children and elderly through sponsorships</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Start Sponsorship
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Active Sponsorships</p>
          <p className="text-3xl font-bold">{sponsorships.filter(s => s.status === 'active').length}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Monthly Commitment</p>
          <p className="text-3xl font-bold">
            ₹{sponsorships.reduce((sum, s) => sum + parseInt(s.monthlyAmount), 0).toLocaleString()}
          </p>
        </div>
        <div className="bg-card border border-border rounded-xl p-6">
          <p className="text-sm text-muted-foreground mb-1">Lives Impacted</p>
          <p className="text-3xl font-bold">{sponsorships.length}</p>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by beneficiary name or type..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredSponsorships.map((sponsorship) => (
          <div key={sponsorship.id} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center text-white font-bold">
                  {sponsorship.beneficiaryName.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h3 className="font-semibold">{sponsorship.beneficiaryName}</h3>
                  <p className="text-sm text-muted-foreground">{typeLabels[sponsorship.sponsorshipType]}</p>
                </div>
              </div>
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setCancelSponsorship(sponsorship)}
                className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center"
              >
                <X className="w-4 h-4" />
              </motion.button>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div>
                <p className="text-xs text-muted-foreground">Monthly Amount</p>
                <p className="font-semibold">₹{parseInt(sponsorship.monthlyAmount).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Since</p>
                <p className="font-semibold">{new Date(sponsorship.startDate).toLocaleDateString()}</p>
              </div>
              <div className="col-span-2">
                <span className="px-3 py-1 rounded-full bg-green-500/10 text-green-600 text-xs">
                  {sponsorship.status}
                </span>
              </div>
            </div>
          </div>
        ))}

        {filteredSponsorships.length === 0 && (
          <div className="col-span-2 text-center py-12 bg-card border border-border rounded-xl">
            <Heart className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
            <p className="text-muted-foreground">No active sponsorships yet</p>
            <p className="text-sm text-muted-foreground mt-1">Start sponsoring to make a difference</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Start a Sponsorship" size="md">
        <AddSponsorshipForm
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!cancelSponsorship}
        onClose={() => setCancelSponsorship(null)}
        onConfirm={handleCancel}
        title="Cancel Sponsorship"
        message={`Are you sure you want to cancel sponsorship for ${cancelSponsorship?.beneficiaryName}?`}
        confirmText="Cancel Sponsorship"
        variant="warning"
      />
    </div>
  );
}
