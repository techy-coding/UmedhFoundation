import { motion } from 'motion/react';
import { Users, AlertCircle, TrendingUp, FileText, Plus } from 'lucide-react';
import { useEffect, useState, useMemo } from 'react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import { subscribeToBeneficiaries } from '../../services/beneficiaries';
import { subscribeToNeeds } from '../../services/wishlist';
import { subscribeToDonations } from '../../services/donations';

export function StaffDashboard() {
  const [beneficiaries, setBeneficiaries] = useState<any[]>([]);
  const [needs, setNeeds] = useState<any[]>([]);
  const [donations, setDonations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribeBeneficiaries = subscribeToBeneficiaries(
      (items) => setBeneficiaries(items),
      (error) => {
        console.error('Failed to load beneficiaries from Firebase:', error);
        toast.error('Could not load beneficiaries from Firebase.');
      }
    );

    const unsubscribeNeeds = subscribeToNeeds(
      (items) => setNeeds(items),
      (error) => {
        console.error('Failed to load needs from Firebase:', error);
        toast.error('Could not load needs from Firebase.');
      }
    );

    const unsubscribeDonations = subscribeToDonations(
      (items) => setDonations(items),
      (error) => {
        console.error('Failed to load donations from Firebase:', error);
        toast.error('Could not load donations from Firebase.');
      }
    );

    return () => {
      unsubscribeBeneficiaries();
      unsubscribeNeeds();
      unsubscribeDonations();
    };
  }, []);

  const stats = useMemo(() => [
    { 
      label: 'Total Beneficiaries', 
      value: beneficiaries.length.toString(), 
      change: beneficiaries.length > 0 ? `+${beneficiaries.length} this month` : 'No records yet', 
      icon: Users, 
      color: 'from-[#FF6B35] to-[#FF8B35]' 
    },
    { 
      label: 'Active Needs', 
      value: needs.filter(n => n.status === 'pending').length.toString(), 
      change: needs.filter(n => n.priority === 'high').length > 0 ? `${needs.filter(n => n.priority === 'high').length} urgent` : 'Nothing urgent', 
      icon: AlertCircle, 
      color: 'from-[#FF6B35] to-[#FF8B35]', 
      urgent: needs.filter(n => n.priority === 'high').length > 0 
    },
    { 
      label: 'Donations Received', 
      value: `₹${donations.reduce((sum, d) => sum + (Number(d.amount) || 0), 0).toLocaleString()}`, 
      change: donations.length > 0 ? `${donations.length} donations` : 'No donations yet', 
      icon: TrendingUp, 
      color: 'from-[#6C5CE7] to-[#8C7CE7]' 
    },
    { 
      label: 'Reports Generated', 
      value: '0', 
      change: 'No reports yet', 
      icon: FileText, 
      color: 'from-[#FFD93D] to-[#FFE93D]' 
    },
  ], [beneficiaries, needs, donations]);

  const urgentNeeds = useMemo(() => 
    needs.filter(n => n.priority === 'high' && n.status === 'pending').slice(0, 5)
      .map((need, index) => ({
        id: index + 1,
        item: need.item,
        quantity: need.quantity,
        fulfilled: need.fulfilledQuantity || 0,
        urgency: need.priority,
        location: need.beneficiaryName || 'Unknown'
      }))
  , [needs]);

  const recentBeneficiaries = useMemo(() => 
    beneficiaries.slice(0, 5).map((b, index) => ({
      id: index + 1,
      name: b.name,
      age: b.age,
      category: b.category,
      location: b.location || 'Unknown',
      status: b.status || 'active'
    }))
  , [beneficiaries]);

  const needsProgress = useMemo(() => {
    const categories = ['education', 'healthcare', 'food', 'clothing', 'shelter'];
    return categories.map(category => {
      const categoryNeeds = needs.filter(n => n.category === category);
      const total = categoryNeeds.reduce((sum, n) => sum + (Number(n.quantity) || 0), 0);
      const fulfilled = categoryNeeds.reduce((sum, n) => sum + (Number(n.fulfilledQuantity) || 0), 0);
      return { category, total, fulfilled };
    });
  }, [needs]);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Staff Dashboard</h1>
          <p className="text-muted-foreground">Manage beneficiaries and needs</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 border border-primary text-primary rounded-xl font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Need
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Beneficiary
          </motion.button>
        </div>
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
              className="bg-card rounded-2xl p-6 border border-border relative"
            >
              {stat.urgent && (
                <div className="absolute top-4 right-4 w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
              )}
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
                <Icon className="w-6 h-6 text-white" />
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold mb-2">{stat.value}</p>
              <span className="text-sm text-muted-foreground">{stat.change}</span>
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
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading font-semibold flex items-center gap-2">
              Urgent Needs
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
            </h3>
            <button className="text-primary hover:underline">View All</button>
          </div>
          <div className="space-y-4">
            {urgentNeeds.length === 0 && <div className="text-sm text-muted-foreground">No urgent needs yet.</div>}
            {urgentNeeds.map((need) => {
              const progress = (need.fulfilled / need.quantity) * 100;
              return (
                <div key={need.id} className="p-4 bg-red-500/5 border border-red-500/20 rounded-xl">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h4 className="font-semibold mb-1">{need.item}</h4>
                      <p className="text-sm text-muted-foreground">📍 {need.location}</p>
                    </div>
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      need.urgency === 'high' ? 'bg-red-500/10 text-red-500' : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {need.urgency === 'high' ? '🔥 Urgent' : '⚠️ Medium'}
                    </span>
                  </div>
                  <div>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">{need.fulfilled}/{need.quantity}</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full ${progress < 50 ? 'bg-red-500' : 'bg-green-500'}`}
                        style={{ width: `${progress}%` }}
                      ></div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-heading font-semibold mb-6">Needs Progress Overview</h3>
          <div className="space-y-4">
            {needsProgress.length === 0 && <div className="text-sm text-muted-foreground">No needs progress data yet.</div>}
            {needsProgress.map((item, i) => {
              const progress = (item.fulfilled / item.total) * 100;
              return (
                <div key={i}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium">{item.category}</span>
                    <span className="text-sm text-muted-foreground">
                      {item.fulfilled}/{item.total} ({Math.round(progress)}%)
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 + i * 0.1 }}
                      className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                    ></motion.div>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 border border-border"
      >
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-heading font-semibold">Recent Beneficiaries</h3>
          <button className="text-primary hover:underline">Manage All</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Name</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Age</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Category</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Location</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {recentBeneficiaries.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 px-4 text-center text-muted-foreground">No beneficiaries added yet.</td>
                </tr>
              )}
              {recentBeneficiaries.map((person) => (
                <tr key={person.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-4 px-4 font-medium">{person.name}</td>
                  <td className="py-4 px-4">{person.age}</td>
                  <td className="py-4 px-4">{person.category}</td>
                  <td className="py-4 px-4 text-sm text-muted-foreground">{person.location}</td>
                  <td className="py-4 px-4 text-right">
                    <span className={`px-3 py-1 rounded-full text-sm ${
                      person.status === 'Sponsored'
                        ? 'bg-green-500/10 text-green-500'
                        : 'bg-yellow-500/10 text-yellow-500'
                    }`}>
                      {person.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <button className="text-primary hover:underline text-sm">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-2xl p-6 border border-border"
        >
          <h4 className="font-semibold mb-3 text-yellow-500">⚠️ Alerts</h4>
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">No staff alerts yet.</p>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl p-6 border border-border col-span-2"
        >
          <h4 className="font-semibold mb-4">Quick Actions</h4>
          <div className="grid grid-cols-3 gap-3">
            {['Create Report', 'Add Event', 'Update Need'].map((action, i) => (
              <motion.button
                key={i}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-4 py-3 bg-muted hover:bg-muted/80 rounded-xl text-sm font-medium transition-colors"
              >
                {action}
              </motion.button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
