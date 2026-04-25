import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  Heart,
  TrendingUp,
  Gift,
  Calendar,
  MapPin,
  FileText,
  Download,
} from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '../../context/RoleContext';
import { isFirebaseConfigured } from '../../lib/firebase';
import { Modal } from '../common/Modal';
import { subscribeToBeneficiaries, type Beneficiary } from '../../services/beneficiaries';
import {
  subscribeToSponsorships,
  createSponsorship,
  type SponsorshipRecord,
} from '../../services/sponsorships';
import { downloadPdf } from '../../utils/download';
import { createNotification } from '../../services/notifications';

export function SponsorshipPage() {
  const { role, userEmail, userName } = useRole();
  const canSponsor = role === 'donor';
  const [selectedTab, setSelectedTab] = useState<'available' | 'my-sponsorships'>('available');
  const [selectedCategory, setSelectedCategory] = useState<'children' | 'elderly'>('children');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [sponsorships, setSponsorships] = useState<SponsorshipRecord[]>([]);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [selectedSponsorship, setSelectedSponsorship] = useState<SponsorshipRecord | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribeBeneficiaries = subscribeToBeneficiaries(setBeneficiaries);
    const unsubscribeSponsorships = subscribeToSponsorships(setSponsorships);

    return () => {
      unsubscribeBeneficiaries();
      unsubscribeSponsorships();
    };
  }, []);

  const mySponsored = useMemo(
    () => sponsorships.filter((item) => item.donorEmail === userEmail),
    [sponsorships, userEmail]
  );

  const sponsoredBeneficiaryIds = new Set(sponsorships.map((item) => item.beneficiaryId));
  const availableChildren = useMemo(
    () =>
      beneficiaries
        .filter((item) => (selectedCategory === 'children' ? item.category !== 'elderly' : item.category === 'elderly'))
        .filter((item) => !sponsoredBeneficiaryIds.has(item.id))
        .map((item) => ({
          id: item.id,
          name: item.name,
          age: Number(item.age || 0),
          gender: item.gender,
          location: item.address || 'Location not specified',
          story: item.specialNeeds || item.medicalHistory || 'Support profile available for sponsorship.',
          image: item.photo || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop',
          education: item.education || 'Not specified',
          interests: item.specialNeeds ? item.specialNeeds.split(',').map((value) => value.trim()).filter(Boolean) : ['Care Support'],
          monthlyNeed: item.category === 'elderly' ? 4000 : 3000,
        })),
    [beneficiaries, selectedCategory, sponsoredBeneficiaryIds]
  );

  const handleSponsor = async (child: (typeof availableChildren)[number]) => {
    if (!canSponsor) {
      toast.error('Only donor accounts can start sponsorships.');
      return;
    }

    try {
      await createSponsorship({
        beneficiaryId: child.id,
        beneficiaryName: child.name,
        beneficiaryImage: child.image,
        beneficiaryLocation: child.location,
        beneficiaryEducation: child.education,
        monthlyNeed: child.monthlyNeed,
        donorId: localStorage.getItem('userId') || userEmail,
        donorName: userName || 'Donor',
        donorEmail: userEmail,
        startDate: new Date().toISOString().split('T')[0],
        totalDonated: child.monthlyNeed,
        monthsPaid: 1,
        nextPayment: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        status: 'active',
      });
      await Promise.all([
        createNotification({
          title: 'New sponsorship started',
          message: `${userName || 'A donor'} started sponsoring ${child.name} with ₹${child.monthlyNeed.toLocaleString()}/month support.`,
          type: 'sponsorship',
          audience: 'roles',
          roles: ['admin', 'staff'],
          link: '/dashboard/sponsorship',
        }),
        createNotification({
          title: 'Sponsorship confirmed',
          message: `You are now sponsoring ${child.name}. Your monthly commitment is ₹${child.monthlyNeed.toLocaleString()}.`,
          type: 'sponsorship',
          audience: 'user',
          userEmail,
          link: '/dashboard/sponsorship',
        }),
      ]);
      toast.success(`Sponsorship started for ${child.name}.`);
      setSelectedTab('my-sponsorships');
    } catch (error) {
      console.error('Failed to create sponsorship:', error);
      toast.error('Could not create sponsorship.');
    }
  };

  const openProgressReport = (sponsorship: SponsorshipRecord) => {
    setSelectedSponsorship(sponsorship);
  };

  const downloadReceipt = (sponsorship: SponsorshipRecord) => {
    downloadPdf({
      filename: `sponsorship-receipt-${sponsorship.beneficiaryName.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`,
      title: 'Umedh Foundation Sponsorship Receipt',
      subtitle: `Monthly sponsorship contribution receipt for ${sponsorship.beneficiaryName}`,
      lines: [
        `Donor Name: ${sponsorship.donorName}`,
        `Donor Email: ${sponsorship.donorEmail}`,
        `Beneficiary: ${sponsorship.beneficiaryName}`,
        `Location: ${sponsorship.beneficiaryLocation}`,
        `Start Date: ${sponsorship.startDate}`,
        `Current Status: ${sponsorship.status}`,
      ],
      sections: [
        {
          heading: 'Payment Summary',
          isTable: true,
          rows: [
            ['Field', 'Value'],
            ['Monthly Need', `₹${sponsorship.monthlyNeed.toLocaleString()}`],
            ['Months Paid', sponsorship.monthsPaid.toString()],
            ['Total Donated', `₹${sponsorship.totalDonated.toLocaleString()}`],
            ['Next Payment', sponsorship.nextPayment],
          ],
        },
      ],
    });

    toast.success('Sponsorship receipt downloaded.');
  };

  const progressMetrics = useMemo(() => {
    if (!selectedSponsorship) {
      return null;
    }

    const annualCommitment = selectedSponsorship.monthlyNeed * 12;
    const fundedPercent = annualCommitment > 0
      ? Math.min((selectedSponsorship.totalDonated / annualCommitment) * 100, 100)
      : 0;

    return {
      annualCommitment,
      fundedPercent,
      remainingForYear: Math.max(annualCommitment - selectedSponsorship.totalDonated, 0),
      impactLevel:
        selectedSponsorship.monthsPaid >= 12
          ? 'Long-term support established'
          : selectedSponsorship.monthsPaid >= 6
            ? 'Consistent sponsorship support'
            : 'Early sponsorship journey',
    };
  }, [selectedSponsorship]);

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Child Sponsorship</h1>
          <p className="text-muted-foreground">Make a lasting impact through monthly sponsorship</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setSelectedTab('available')} className={`px-6 py-2 rounded-xl font-medium transition-all ${selectedTab === 'available' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            Available
          </button>
          <button onClick={() => setSelectedTab('my-sponsorships')} className={`px-6 py-2 rounded-xl font-medium transition-all ${selectedTab === 'my-sponsorships' ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>
            My Sponsorships ({mySponsored.length})
          </button>
        </div>
      </div>

      {!canSponsor && (
        <div className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
          This page is view-only for non-donor accounts. Only donor users can start and manage sponsorships.
        </div>
      )}

      {selectedTab === 'available' && (
        <>
          <div className="grid lg:grid-cols-4 gap-6">
            {[
              { label: 'Children Available', value: availableChildren.length.toString(), icon: Heart },
              { label: 'Sponsored This Month', value: sponsorships.length.toString(), icon: TrendingUp },
              { label: 'Average Monthly Need', value: `₹${availableChildren.length ? Math.round(availableChildren.reduce((sum, item) => sum + item.monthlyNeed, 0) / availableChildren.length) : 0}`, icon: Gift },
              { label: 'Success Rate', value: `${beneficiaries.length ? Math.round((sponsorships.length / beneficiaries.length) * 100) : 0}%`, icon: Calendar },
            ].map((stat, i) => {
              const Icon = stat.icon;
              return (
                <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-6 border border-border">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center mb-4">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex items-center gap-4">
            <div className="flex gap-2">
              <button onClick={() => setSelectedCategory('children')} className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedCategory === 'children' ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Children</button>
              <button onClick={() => setSelectedCategory('elderly')} className={`px-4 py-2 rounded-xl font-medium transition-all ${selectedCategory === 'elderly' ? 'bg-secondary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>Elderly</button>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {availableChildren.length === 0 && (
              <div className="md:col-span-2 text-center py-12 bg-card border border-border rounded-xl text-muted-foreground">
                No sponsorship profiles available yet.
              </div>
            )}
            {availableChildren.map((child, i) => (
              <motion.div key={child.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }} className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg">
                <div className="grid md:grid-cols-5 gap-6">
                  <div className="md:col-span-2 relative h-64 md:h-auto">
                    <img src={child.image} alt={child.name} className="w-full h-full object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop'; }} />
                    <div className="absolute top-4 left-4 bg-white/90 dark:bg-black/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium">
                      {child.age || '-'} years
                    </div>
                  </div>
                  <div className="md:col-span-3 p-6">
                    <h3 className="text-2xl font-heading font-bold mb-2">{child.name}</h3>
                    <div className="flex flex-wrap gap-3 text-sm text-muted-foreground mb-4">
                      <div className="flex items-center gap-1"><MapPin className="w-4 h-4" />{child.location}</div>
                      <div>Education: {child.education}</div>
                    </div>
                    <p className="text-muted-foreground mb-4 italic">&ldquo;{child.story}&rdquo;</p>
                    <div className="mb-4">
                      <p className="text-sm text-muted-foreground mb-2">Interests / Needs:</p>
                      <div className="flex flex-wrap gap-2">
                        {child.interests.map((interest) => (
                          <span key={interest} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">{interest}</span>
                        ))}
                      </div>
                    </div>
                    <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-xl p-4 mb-4">
                      <p className="text-sm text-muted-foreground mb-1">Monthly Support Needed</p>
                      <p className="text-2xl font-bold text-primary">₹{child.monthlyNeed.toLocaleString()}/month</p>
                    </div>
                    <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => handleSponsor(child)} disabled={!canSponsor} className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg disabled:cursor-not-allowed disabled:opacity-60">
                      {canSponsor ? `Sponsor ${child.name}` : 'Donor Account Required'}
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </>
      )}

      {selectedTab === 'my-sponsorships' && (
        <div className="space-y-6">
          <div className="grid lg:grid-cols-4 gap-6">
            {[
              { label: 'Active Sponsorships', value: mySponsored.length.toString(), color: 'from-[#FF6B35] to-[#FF8B35]' },
              { label: 'Total Contributed', value: `₹${mySponsored.reduce((sum, s) => sum + s.totalDonated, 0).toLocaleString()}`, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
              { label: 'Months Active', value: mySponsored.length > 0 ? Math.max(...mySponsored.map((s) => s.monthsPaid)).toString() : '0', color: 'from-[#FFD93D] to-[#FFE93D]' },
              { label: 'Impact Score', value: `${mySponsored.length * 20}%`, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
            ].map((stat, i) => (
              <motion.div key={i} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-6 border border-border">
                <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </motion.div>
            ))}
          </div>

          {mySponsored.length === 0 && (
            <div className="text-center py-12 bg-card border border-border rounded-xl text-muted-foreground">
              No active sponsorships yet.
            </div>
          )}
          {mySponsored.map((sponsorship, i) => (
            <motion.div key={sponsorship.id} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-6 border border-border">
              <div className="grid lg:grid-cols-3 gap-6">
                <div className="flex items-start gap-4">
                  <img src={sponsorship.beneficiaryImage} alt={sponsorship.beneficiaryName} className="w-20 h-20 rounded-xl object-cover" onError={(e) => { e.currentTarget.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop'; }} />
                  <div>
                    <h3 className="text-xl font-heading font-bold mb-1">{sponsorship.beneficiaryName}</h3>
                    <p className="text-sm text-muted-foreground mb-2">{sponsorship.beneficiaryLocation}</p>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-4 h-4" />
                      <span className="text-muted-foreground">Since {sponsorship.startDate}</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Donated</p>
                    <p className="text-xl font-bold">₹{sponsorship.totalDonated.toLocaleString()}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Months Paid</p>
                    <p className="text-xl font-bold">{sponsorship.monthsPaid}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Next Payment</p>
                    <p className="text-sm font-medium">{sponsorship.nextPayment}</p>
                  </div>
                  <div className="bg-muted/50 rounded-xl p-4">
                    <p className="text-sm text-muted-foreground mb-1">Monthly Need</p>
                    <p className="text-xl font-bold">₹{sponsorship.monthlyNeed.toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex flex-col gap-3">
                  <button
                    onClick={() => openProgressReport(sponsorship)}
                    className="w-full py-2 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    <FileText className="w-4 h-4" />
                    View Progress Report
                  </button>
                  <button
                    onClick={() => downloadReceipt(sponsorship)}
                    className="w-full py-2 border border-border rounded-xl hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    Download Receipt
                  </button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      <Modal
        isOpen={Boolean(selectedSponsorship)}
        onClose={() => setSelectedSponsorship(null)}
        title="Sponsorship Progress Report"
        size="md"
      >
        {selectedSponsorship && progressMetrics && (
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <img
                src={selectedSponsorship.beneficiaryImage}
                alt={selectedSponsorship.beneficiaryName}
                className="h-20 w-20 rounded-xl object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop';
                }}
              />
              <div>
                <h3 className="text-2xl font-heading font-bold">{selectedSponsorship.beneficiaryName}</h3>
                <p className="text-sm text-muted-foreground">{selectedSponsorship.beneficiaryLocation}</p>
                <p className="mt-2 text-sm text-primary">{progressMetrics.impactLevel}</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Total Donated</p>
                <p className="mt-1 text-2xl font-bold">₹{selectedSponsorship.totalDonated.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Annual Commitment</p>
                <p className="mt-1 text-2xl font-bold">₹{progressMetrics.annualCommitment.toLocaleString()}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Months Paid</p>
                <p className="mt-1 text-2xl font-bold">{selectedSponsorship.monthsPaid}</p>
              </div>
              <div className="rounded-xl bg-muted/40 p-4">
                <p className="text-sm text-muted-foreground">Next Payment</p>
                <p className="mt-1 text-2xl font-bold">{selectedSponsorship.nextPayment}</p>
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between text-sm">
                <span className="text-muted-foreground">Yearly sponsorship progress</span>
                <span className="font-medium">{progressMetrics.fundedPercent.toFixed(1)}%</span>
              </div>
              <div className="h-3 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                  style={{ width: `${progressMetrics.fundedPercent}%` }}
                />
              </div>
              <p className="mt-2 text-sm text-muted-foreground">
                Remaining to complete one full year of sponsorship: ₹{progressMetrics.remainingForYear.toLocaleString()}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/20 p-4">
              <p className="text-sm font-medium">Support snapshot</p>
              <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                <li>Beneficiary education status: {selectedSponsorship.beneficiaryEducation}</li>
                <li>Current sponsorship status: {selectedSponsorship.status}</li>
                <li>Monthly support amount: ₹{selectedSponsorship.monthlyNeed.toLocaleString()}</li>
                <li>Donor record linked to: {selectedSponsorship.donorEmail}</li>
              </ul>
            </div>

            <div className="flex justify-end">
              <button
                onClick={() => downloadReceipt(selectedSponsorship)}
                className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted"
              >
                Download Receipt
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
