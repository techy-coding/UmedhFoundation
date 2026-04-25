import { motion } from 'motion/react';
import { Heart, TrendingUp, Gift, Users, Calendar, Download } from 'lucide-react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { useRole } from '../../context/RoleContext';
import { isFirebaseConfigured } from '../../lib/firebase';
import { fallbackDonations, subscribeToDonations, type Donation } from '../../services/donations';
import { useNavigate } from 'react-router-dom';

export function DonorDashboard() {
  const navigate = useNavigate();
  const { userName, userEmail } = useRole();
  const [donations, setDonations] = useState<Donation[]>(
    fallbackDonations.filter((item) => item.userEmail === userEmail)
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setDonations(fallbackDonations.filter((item) => item.userEmail === userEmail));
      return;
    }

    const unsubscribe = subscribeToDonations((items) => {
      const userDonations = items.filter((item) => item.userEmail === userEmail);
      setDonations(userDonations);
    });

    return unsubscribe;
  }, [userEmail]);

  const totalDonated = donations.reduce((sum, donation) => sum + parseInt(donation.amount || '0', 10), 0);
  const recurringDonations = donations.filter((donation) => donation.isRecurring).length;
  const wishlistItemsSupported = donations.filter((donation) => donation.category === 'shelter' || donation.category === 'food').length;
  const impactScore = donations.length === 0 ? 0 : Math.min(100, 60 + donations.length * 8);

  const stats = [
    { label: 'Total Donations', value: `₹${totalDonated.toLocaleString()}`, change: `${donations.length} records`, icon: Heart, color: 'from-[#FF6B35] to-[#FF8B35]' },
    { label: 'Active Sponsorships', value: `${recurringDonations}`, change: recurringDonations > 0 ? 'Ongoing' : 'None yet', icon: Users, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
    { label: 'Wishlist Items', value: `${wishlistItemsSupported}`, change: wishlistItemsSupported > 0 ? 'Supported by you' : 'No support yet', icon: Gift, color: 'from-[#FFD93D] to-[#FFE93D]' },
    { label: 'Impact Score', value: `${impactScore}%`, change: donations.length > 0 ? 'Based on your giving' : 'Start donating', icon: TrendingUp, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
  ];

  const recentDonations = donations.slice(0, 5).map((donation) => ({
    id: donation.id,
    date: donation.date,
    campaign: donation.campaign || donation.category,
    amount: parseInt(donation.amount || '0', 10),
    status: donation.status,
  }));

  const monthlyTrend = useMemo(() => {
    const monthMap = new Map<string, number>();

    donations.forEach((donation) => {
      const date = new Date(donation.date);
      const month = date.toLocaleString('en-US', { month: 'short' });
      const amount = parseInt(donation.amount || '0', 10);
      monthMap.set(month, (monthMap.get(month) || 0) + amount);
    });

    return Array.from(monthMap.entries()).map(([month, amount]) => ({ month, amount }));
  }, [donations]);

  const impactData = useMemo(() => {
    const categoryMap = new Map<string, number>();

    donations.forEach((donation) => {
      const label = donation.category.charAt(0).toUpperCase() + donation.category.slice(1);
      categoryMap.set(label, (categoryMap.get(label) || 0) + 1);
    });

    return Array.from(categoryMap.entries()).map(([category, children]) => ({ category, children }));
  }, [donations]);

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
              key={i}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold mb-2">{stat.value}</p>
              <span className="text-sm text-green-500">{stat.change}</span>
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
                      <button className="text-primary hover:underline flex items-center gap-1 ml-auto">
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
