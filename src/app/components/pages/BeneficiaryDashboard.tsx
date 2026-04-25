import { motion } from 'motion/react';
import { Heart, MessageCircle, Calendar, User } from 'lucide-react';

export function BeneficiaryDashboard() {
  const stats = [
    { label: 'Support Received', value: '₹0', change: 'No support recorded', icon: Heart, color: 'from-[#FF6B35] to-[#FF8B35]' },
    { label: 'Pending Requests', value: '0', change: 'Nothing in review', icon: MessageCircle, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
    { label: 'My Sponsor', value: 'None', change: 'No sponsor assigned', icon: User, color: 'from-[#FFD93D] to-[#FFE93D]' },
    { label: 'Upcoming Events', value: '0', change: 'Nothing scheduled', icon: Calendar, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
  ];

  const supportHistory: Array<{ id: number; type: string; amount: number; date: string; status: string }> = [];

  const requests: Array<{ id: number; title: string; date: string; status: string }> = [];

  const announcements: Array<{ id: number; title: string; message: string; date: string }> = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-heading font-bold mb-2">My Dashboard</h1>
        <p className="text-muted-foreground">Track your support and requests</p>
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
              <span className="text-sm text-muted-foreground">{stat.change}</span>
            </motion.div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-2xl p-6 border border-border"
        >
          <h3 className="text-xl font-heading font-semibold mb-6">My Sponsor</h3>
          <div className="bg-card/80 backdrop-blur-sm rounded-xl p-6 text-center">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center mx-auto mb-4 text-white text-2xl font-bold">
              PS
            </div>
            <h4 className="text-xl font-semibold mb-2">No sponsor assigned</h4>
            <p className="text-muted-foreground mb-4">This section will update once sponsorship is added.</p>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">Total Support</p>
                <p className="text-lg font-bold">₹0</p>
              </div>
              <div className="bg-muted/50 rounded-lg p-3">
                <p className="text-sm text-muted-foreground mb-1">Months</p>
                <p className="text-lg font-bold">0</p>
              </div>
            </div>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="w-full px-4 py-2 bg-primary text-white rounded-xl"
            >
              Send Thank You Message
            </motion.button>
          </div>
        </motion.div>

        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl p-6 border border-border"
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-heading font-semibold">My Requests</h3>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
            >
              New Request
            </motion.button>
          </div>
          <div className="space-y-3">
            {requests.length === 0 && <div className="text-sm text-muted-foreground">No support requests submitted yet.</div>}
            {requests.map((request) => (
              <div key={request.id} className="p-4 bg-muted/30 rounded-xl">
                <div className="flex items-start justify-between mb-2">
                  <h4 className="font-semibold">{request.title}</h4>
                  <span className={`px-3 py-1 rounded-full text-xs ${
                    request.status === 'approved'
                      ? 'bg-green-500/10 text-green-500'
                      : 'bg-yellow-500/10 text-yellow-500'
                  }`}>
                    {request.status}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground">{request.date}</p>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-card rounded-2xl p-6 border border-border"
      >
        <h3 className="text-xl font-heading font-semibold mb-6">Support History</h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Type</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Amount</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Date</th>
                <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {supportHistory.length === 0 && (
                <tr>
                  <td colSpan={4} className="py-8 px-4 text-center text-muted-foreground">No support history yet.</td>
                </tr>
              )}
              {supportHistory.map((item) => (
                <tr key={item.id} className="border-b border-border hover:bg-muted/50">
                  <td className="py-4 px-4">{item.type}</td>
                  <td className="py-4 px-4 text-right font-medium">₹{item.amount.toLocaleString()}</td>
                  <td className="py-4 px-4 text-right text-sm text-muted-foreground">{item.date}</td>
                  <td className="py-4 px-4 text-right">
                    <span className="px-3 py-1 bg-green-500/10 text-green-500 rounded-full text-sm">
                      {item.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="bg-card rounded-2xl p-6 border border-border"
      >
        <h3 className="text-xl font-heading font-semibold mb-6">Announcements</h3>
        <div className="space-y-4">
          {announcements.length === 0 && <div className="text-sm text-muted-foreground">No announcements yet.</div>}
          {announcements.map((announcement) => (
            <div key={announcement.id} className="p-4 bg-gradient-to-br from-[#FF6B35]/5 to-[#6C5CE7]/5 rounded-xl">
              <div className="flex items-start justify-between mb-2">
                <h4 className="font-semibold">{announcement.title}</h4>
                <span className="text-xs text-muted-foreground">{announcement.date}</span>
              </div>
              <p className="text-sm text-muted-foreground">{announcement.message}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </div>
  );
}
