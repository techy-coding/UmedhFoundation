import { motion } from 'motion/react';
import { Heart, TrendingUp, Gift, Users, Calendar, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRole } from '../../context/RoleContext';
import { isFirebaseConfigured } from '../../lib/firebase';
import { fallbackDonations, subscribeToDonations, type Donation } from '../../services/donations';
import {
  fallbackSponsorships,
  subscribeToSponsorships,
  type SponsorshipRecord,
} from '../../services/sponsorships';
import { useNavigate } from 'react-router-dom';
import { toCurrencyNumber } from '../../utils/currency';
import { downloadPdf } from '../../utils/download';

function isDonationForUser(donation: Donation, userEmail: string) {
  return donation.userEmail?.trim().toLowerCase() === userEmail.trim().toLowerCase();
}

function isSponsorshipForUser(sponsorship: SponsorshipRecord, userEmail: string) {
  return sponsorship.donorEmail?.trim().toLowerCase() === userEmail.trim().toLowerCase();
}

export function DonorDashboard() {
  const navigate = useNavigate();
  const { userName, userEmail } = useRole();
  const [donations, setDonations] = useState<Donation[]>(
    fallbackDonations.filter((item) => isDonationForUser(item, userEmail))
  );
  const [sponsorships, setSponsorships] = useState<SponsorshipRecord[]>(
    fallbackSponsorships.filter((item) => isSponsorshipForUser(item, userEmail))
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setDonations(fallbackDonations.filter((item) => isDonationForUser(item, userEmail)));
      setSponsorships(fallbackSponsorships.filter((item) => isSponsorshipForUser(item, userEmail)));
      return;
    }

    const unsubscribeDonations = subscribeToDonations((items) => {
      const userDonations = items.filter((item) => isDonationForUser(item, userEmail));
      setDonations(userDonations);
    });
    const unsubscribeSponsorships = subscribeToSponsorships((items) => {
      const userSponsorships = items.filter((item) => isSponsorshipForUser(item, userEmail));
      setSponsorships(userSponsorships);
    });

    return () => {
      unsubscribeDonations();
      unsubscribeSponsorships();
    };
  }, [userEmail]);

  const normalizedDonations = useMemo(
    () =>
      [...donations]
        .sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime())
        .map((donation) => ({
          id: donation.id,
          date: donation.date,
          campaign: donation.campaign || donation.category,
          amount: toCurrencyNumber(donation.amount),
          status: donation.status,
          paymentMethod: donation.paymentMethod || donation.paymentGateway || 'RAZORPAY',
          transactionId: donation.paymentId || donation.paymentOrderId || donation.id,
          taxBenefit: donation.tax80G,
          type: donation.campaign ? 'sponsorship' : 'donation',
        })),
    [donations]
  );

  const recentDonations = useMemo(() => normalizedDonations.slice(0, 5), [normalizedDonations]);

  const donationTotal = useMemo(
    () => normalizedDonations.reduce((sum, donation) => sum + donation.amount, 0),
    [normalizedDonations]
  );

  const activeSponsorships = useMemo(
    () => sponsorships.filter((sponsorship) => sponsorship.status === 'active').length,
    [sponsorships]
  );

  const sponsorshipTotal = useMemo(
    () =>
      sponsorships.reduce(
        (sum, sponsorship) => sum + toCurrencyNumber(sponsorship.totalDonated),
        0
      ),
    [sponsorships]
  );

  const totalDonated = useMemo(
    () => donationTotal + sponsorshipTotal,
    [donationTotal, sponsorshipTotal]
  );

  const wishlistItemsSupported = useMemo(
    () =>
      donations.filter(
        (donation) => donation.category === 'shelter' || donation.category === 'food'
      ).length,
    [donations]
  );

  const totalGivingRecords = normalizedDonations.length + sponsorships.length;
  const impactScore = totalGivingRecords === 0 ? 0 : Math.min(100, 60 + normalizedDonations.length * 8 + activeSponsorships * 20);

  const stats = useMemo(
    () => [
      {
        label: 'Total Donations',
        value: `₹${totalDonated.toLocaleString()}`,
        change: `${totalGivingRecords} records`,
        icon: Heart,
        color: 'from-[#FF6B35] to-[#FF8B35]',
      },
      {
        label: 'Active Sponsorships',
        value: `${activeSponsorships}`,
        change: activeSponsorships > 0 ? `₹${sponsorshipTotal.toLocaleString()} contributed` : 'None yet',
        icon: Users,
        color: 'from-[#6C5CE7] to-[#8C7CE7]',
      },
      {
        label: 'Wishlist Items',
        value: `${wishlistItemsSupported}`,
        change: wishlistItemsSupported > 0 ? 'Supported by you' : 'No support yet',
        icon: Gift,
        color: 'from-[#FFD93D] to-[#FFE93D]',
      },
      {
        label: 'Impact Score',
        value: `${impactScore}%`,
        change: totalGivingRecords > 0 ? 'Based on your giving' : 'Start donating',
        icon: TrendingUp,
        color: 'from-[#4ECDC4] to-[#6EDDC4]',
      },
    ],
    [activeSponsorships, impactScore, sponsorshipTotal, totalDonated, totalGivingRecords, wishlistItemsSupported]
  );

  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<string, { amount: number; date: Date }>();

    donations.forEach((donation) => {
      const date = new Date(donation.date);
      if (Number.isNaN(date.getTime())) {
        return;
      }

      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      const amount = toCurrencyNumber(donation.amount);
      const existing = monthMap.get(monthKey);

      monthMap.set(monthKey, {
        amount: (existing?.amount || 0) + amount,
        date: existing?.date || new Date(date.getFullYear(), date.getMonth(), 1),
      });
    });

    return Array.from(monthMap.values())
      .sort((a, b) => a.date.getTime() - b.date.getTime())
      .map(({ amount, date }) => ({
        month: date.toLocaleString('en-US', { month: 'short' }),
        amount,
      }));
  }, [donations]);

  const impactData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    donations.forEach((donation) => {
      const label = donation.category.charAt(0).toUpperCase() + donation.category.slice(1);
      categoryMap.set(label, (categoryMap.get(label) || 0) + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, children]) => ({ category, children }));
  }, [donations]);

  const downloadReceipt = (donation: (typeof normalizedDonations)[number]) => {
    downloadPdf({
      filename: `receipt-${donation.transactionId}.pdf`,
      title: 'Umedh Foundation Donation Receipt',
      subtitle: 'Tax Receipt Under Section 80G of Income Tax Act',
      lines: [
        `Donor Name: ${userName || 'Supporter'}`,
        `Email: ${userEmail}`,
        `Receipt Date: ${donation.date}`,
        `80G Eligible: ${donation.taxBenefit ? 'Yes - Tax Deductible' : 'No'}`,
        '',
        'Thank you for your generous contribution to Umedh Foundation.',
        'Your support helps us continue our mission of serving the community.',
      ],
      sections: [
        {
          heading: 'Donation Details',
          isTable: true,
          rows: [
            ['Description', 'Details'],
            ['Campaign', donation.campaign],
            ['Donation Type', donation.type],
            ['Amount', `INR ${donation.amount.toLocaleString()}`],
            ['Payment Method', donation.paymentMethod],
            ['Transaction ID', donation.transactionId],
            ['Date', donation.date],
          ],
        },
      ],
    });

    toast.success('Receipt downloaded successfully.');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Welcome Back, {userName || 'Donor'}!</h1>
          <p className="text-muted-foreground">Here's your giving impact at a glance</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => navigate('/dashboard/donate')}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium flex items-center gap-2"
        >
          <Heart className="w-5 h-5" />
          Make a Donation
        </motion.button>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={`${stat.label}-${stat.value}-${stat.change}`}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p key={stat.value} className="text-3xl font-bold mb-2">{stat.value}</p>
              <span key={stat.change} className="text-sm text-green-500">{stat.change}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-heading font-semibold mb-6">Monthly Donation Trend</h3>
          {monthlyTrend.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              No donation trend data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                  }}
                />
                <Line type="monotone" dataKey="amount" stroke="#FF6B35" strokeWidth={3} dot={{ fill: '#FF6B35', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-heading font-semibold mb-6">Your Impact by Category</h3>
          {impactData.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">
              No impact category data yet.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={impactData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="category" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                  }}
                />
                <Bar dataKey="children" fill="url(#colorGradient)" radius={[8, 8, 0, 0]} />
                <defs>
                  <linearGradient id="colorGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#FF6B35" />
                    <stop offset="100%" stopColor="#6C5CE7" />
                  </linearGradient>
                </defs>
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold">Recent Donations</h3>
          <button onClick={() => navigate('/dashboard/reports')} className="text-primary hover:underline flex items-center gap-2">
            View All
          </button>
        </div>
        <div className="overflow-x-auto">
          {recentDonations.length > 0 ? (
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Campaign</th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Amount</th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Receipt</th>
                </tr>
              </thead>
              <tbody>
                {recentDonations.map((donation) => (
                  <tr key={donation.id} className="border-b border-border hover:bg-muted/50">
                    <td className="py-4 px-4">{donation.date}</td>
                    <td className="py-4 px-4">{donation.campaign}</td>
                    <td className="py-4 px-4 text-right font-medium">₹{donation.amount.toLocaleString()}</td>
                    <td className="py-4 px-4 text-right">
                      <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">
                        {donation.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      <button
                        onClick={() => downloadReceipt(donation)}
                        className="text-primary hover:underline flex items-center gap-1 ml-auto"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <div className="py-10 text-center text-muted-foreground">
              No donations yet. Your dashboard will update after your first contribution.
            </div>
          )}
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-heading font-semibold mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            {[
              { label: 'Donate Now', icon: Heart, onClick: () => navigate('/dashboard/donate') },
              { label: 'Sponsor Child', icon: Users, onClick: () => navigate('/dashboard/sponsorship') },
              { label: 'View Impact', icon: TrendingUp, onClick: () => navigate('/dashboard/impact') },
              { label: 'Tax Receipt', icon: Download, onClick: () => navigate('/dashboard/reports') },
            ].map((action, i) => {
              const Icon = action.icon;
              return (
                <motion.button
                  key={i}
                  whileHover={{ scale: 1.05, y: -4 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={action.onClick}
                  className="bg-card/80 backdrop-blur-sm p-4 rounded-xl border border-border hover:border-primary transition-colors flex flex-col items-center gap-2"
                >
                  <Icon className="w-5 h-5 text-primary" />
                  <span className="text-sm font-medium">{action.label}</span>
                </motion.button>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-heading font-semibold mb-4">Notifications</h3>
          <div className="space-y-3">
            {donations.length > 0 ? (
              [
                { text: 'Your donation records are now synced with Firebase.', time: 'Just now' },
                { text: 'You can download receipts from the donations section.', time: 'Today' },
              ].map((notif, i) => (
                <div key={i} className="p-3 bg-muted/30 rounded-xl">
                  <p className="text-sm mb-1">{notif.text}</p>
                  <p className="text-xs text-muted-foreground">{notif.time}</p>
                </div>
              ))
            ) : (
              <div className="p-3 bg-muted/30 rounded-xl">
                <p className="text-sm mb-1">No personal notifications yet.</p>
                <p className="text-xs text-muted-foreground">Activity will appear here after you start donating.</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
