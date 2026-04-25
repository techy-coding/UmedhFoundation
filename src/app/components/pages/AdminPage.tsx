import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, MoreVertical, CheckCircle, XCircle, Download, FileText } from 'lucide-react';
import { toast } from 'sonner';
import { subscribeToUsers, updateUserStatus, type UserRecord } from '../../services/users';
import { subscribeToCampaigns, type CampaignRecord } from '../../services/campaigns';
import { subscribeToDonations, type Donation } from '../../services/donations';
import { downloadPdf } from '../../utils/download';

export function AdminPage() {
  const [activeTab, setActiveTab] = useState<'users' | 'campaigns' | 'analytics'>('users');
  const [searchQuery, setSearchQuery] = useState('');
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [donations, setDonations] = useState<Donation[]>([]);

  useEffect(() => subscribeToUsers(setUsers), []);
  useEffect(() => subscribeToCampaigns(setCampaigns), []);
  useEffect(() => subscribeToDonations(setDonations), []);

  const filteredUsers = useMemo(
    () =>
      users.filter((user) => {
        const haystack = `${user.name} ${user.email}`.toLowerCase();
        return haystack.includes(searchQuery.toLowerCase());
      }),
    [searchQuery, users]
  );

  const pendingApprovals = useMemo(
    () => users.filter((user) => user.status === 'pending'),
    [users]
  );

  const analytics = useMemo(() => {
    const totalRevenue = donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0);

    return [
      { label: 'Total Users', value: users.length.toLocaleString() },
      { label: 'Pending Approvals', value: pendingApprovals.length.toLocaleString() },
      { label: 'Active Campaigns', value: campaigns.filter((campaign) => campaign.status === 'active').length.toLocaleString() },
      { label: 'Total Revenue', value: `₹${totalRevenue.toLocaleString()}` },
    ];
  }, [campaigns, donations, pendingApprovals.length, users.length]);

  const filteredCampaigns = useMemo(
    () =>
      campaigns.filter((campaign) => {
        const haystack = `${campaign.title} ${campaign.category} ${campaign.status}`.toLowerCase();
        return haystack.includes(searchQuery.toLowerCase());
      }),
    [campaigns, searchQuery]
  );

  const totalRevenue = useMemo(
    () => donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0),
    [donations]
  );

  const exportCurrentView = () => {
    if (activeTab === 'users') {
      downloadPdf({
        filename: 'admin-users-export.pdf',
        title: 'Admin Users Export',
        subtitle: 'Live export of platform users from Firebase.',
        lines: [
          `Total Users: ${filteredUsers.length}`,
          `Pending Approvals: ${pendingApprovals.length}`,
        ],
        sections: [
          {
            heading: 'Users',
            isTable: true,
            rows: [
              ['Name', 'Email', 'Role', 'Status', 'Joined'],
              ...filteredUsers.map((user) => [user.name, user.email, user.role, user.status, user.joinedDate]),
            ],
          },
        ],
      });
      toast.success('Users export downloaded.');
      return;
    }

    if (activeTab === 'campaigns') {
      downloadPdf({
        filename: 'admin-campaign-approvals.pdf',
        title: 'Pending Campaign/User Approval Export',
        subtitle: 'Approval-focused export from the admin panel.',
        lines: [`Pending Approvals: ${pendingApprovals.length}`],
        sections: [
          {
            heading: 'Pending Approvals',
            isTable: true,
            rows: [
              ['Name', 'Email', 'Role', 'Joined'],
              ...pendingApprovals.map((user) => [user.name, user.email, user.role, user.joinedDate]),
            ],
          },
          {
            heading: 'Campaign Snapshot',
            isTable: true,
            rows: [
              ['Campaign', 'Category', 'Status', 'Goal', 'Raised'],
              ...filteredCampaigns.map((campaign) => [
                campaign.title,
                campaign.category,
                campaign.status,
                `₹${Number(campaign.goal || 0).toLocaleString()}`,
                `₹${Number(campaign.raised || 0).toLocaleString()}`,
              ]),
            ],
          },
        ],
      });
      toast.success('Approval export downloaded.');
      return;
    }

    downloadPdf({
      filename: 'admin-analytics-export.pdf',
      title: 'Admin Analytics Export',
      subtitle: 'Analytics snapshot from the admin panel.',
      sections: [
        {
          heading: 'Key Metrics',
          isTable: true,
          rows: [
            ['Metric', 'Value'],
            ...analytics.map((item) => [item.label, item.value]),
          ],
        },
        {
          heading: 'Donation Summary',
          isTable: true,
          rows: [
            ['Donation ID', 'User', 'Campaign', 'Amount', 'Date', 'Status'],
            ...donations.slice(0, 20).map((donation) => [
              donation.id,
              donation.userName || donation.userEmail || 'Unknown',
              donation.campaign || donation.category || 'General',
              `₹${Number(donation.amount || 0).toLocaleString()}`,
              donation.date,
              donation.status,
            ]),
          ],
        },
      ],
    });
    toast.success('Analytics export downloaded.');
  };

  const generateAdminReport = () => {
    downloadPdf({
      filename: 'admin-platform-report.pdf',
      title: 'Admin Platform Report',
      subtitle: 'Comprehensive platform report generated from the admin dashboard.',
      lines: [
        `Total Platform Users: ${users.length}`,
        `Pending Approvals: ${pendingApprovals.length}`,
        `Active Campaigns: ${campaigns.filter((campaign) => campaign.status === 'active').length}`,
        `Total Revenue: ₹${totalRevenue.toLocaleString()}`,
        `Donation Records: ${donations.length}`,
      ],
      sections: [
        {
          heading: 'Platform Overview',
          isTable: true,
          rows: [
            ['Metric', 'Value'],
            ...analytics.map((item) => [item.label, item.value]),
          ],
        },
        {
          heading: 'User Summary',
          isTable: true,
          rows: [
            ['Name', 'Email', 'Role', 'Status', 'Joined'],
            ...users.map((user) => [user.name, user.email, user.role, user.status, user.joinedDate]),
          ],
        },
        {
          heading: 'Campaign Summary',
          isTable: true,
          rows: [
            ['Campaign', 'Category', 'Status', 'Goal', 'Raised', 'Supporters'],
            ...campaigns.map((campaign) => [
              campaign.title,
              campaign.category,
              campaign.status,
              `₹${Number(campaign.goal || 0).toLocaleString()}`,
              `₹${Number(campaign.raised || 0).toLocaleString()}`,
              Number(campaign.supporters || 0).toLocaleString(),
            ]),
          ],
        },
        {
          heading: 'Recent Donations',
          isTable: true,
          rows: [
            ['Date', 'User', 'Campaign', 'Amount', 'Method', 'Status'],
            ...donations.slice(0, 25).map((donation) => [
              donation.date,
              donation.userName || donation.userEmail || 'Unknown',
              donation.campaign || donation.category || 'General',
              `₹${Number(donation.amount || 0).toLocaleString()}`,
              donation.paymentMethod,
              donation.status,
            ]),
          ],
        },
      ],
    });

    toast.success('Admin report generated.');
  };

  const handleApprove = async (user: UserRecord) => {
    try {
      await updateUserStatus(user, 'active');
      toast.success('User approved successfully!');
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error('Could not approve user.');
    }
  };

  const handleReject = async (user: UserRecord) => {
    try {
      await updateUserStatus(user, 'inactive');
      toast.error('User rejected.');
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error('Could not reject user.');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Admin Panel</h1>
          <p className="text-muted-foreground">Manage live users, campaigns, and donation activity</p>
        </div>
        <div className="flex gap-3">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={exportCurrentView}
            className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors flex items-center gap-2"
          >
            <Download className="w-4 h-4" />
            Export
          </motion.button>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={generateAdminReport}
            className="px-4 py-2 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl flex items-center gap-2"
          >
            <FileText className="w-4 h-4" />
            Generate Report
          </motion.button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {analytics.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold mb-2">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <div className="border-b border-border">
          <div className="flex">
            {(['users', 'campaigns', 'analytics'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-6 py-4 font-medium capitalize transition-colors ${
                  activeTab === tab ? 'text-primary border-b-2 border-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {activeTab === 'users' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search users by name or email..."
                    className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none"
                  />
                </div>
                <button className="px-4 py-2 border border-border rounded-xl hover:bg-muted transition-colors flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter
                </button>
              </div>

              {filteredUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground">No users found.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">User</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Role</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                        <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Joined</th>
                        <th className="text-right py-3 px-4 font-medium text-sm text-muted-foreground">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredUsers.map((user, i) => (
                        <motion.tr
                          key={user.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="border-b border-border hover:bg-muted/50 transition-colors"
                        >
                          <td className="py-4 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center text-white font-semibold">
                                {user.name.charAt(0)}
                              </div>
                              <div>
                                <p className="font-medium">{user.name}</p>
                                <p className="text-sm text-muted-foreground">{user.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4">
                            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-full text-sm capitalize">{user.role}</span>
                          </td>
                          <td className="py-4 px-4">
                            <span className={`px-3 py-1 rounded-full text-sm ${user.status === 'active' ? 'bg-green-500/10 text-green-500' : user.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' : 'bg-muted text-muted-foreground'}`}>
                              {user.status}
                            </span>
                          </td>
                          <td className="py-4 px-4 text-sm text-muted-foreground">{user.joinedDate}</td>
                          <td className="py-4 px-4">
                            <div className="flex items-center justify-end gap-2">
                              {user.status === 'pending' && (
                                <>
                                  <button onClick={() => handleApprove(user)} className="p-2 hover:bg-green-500/10 rounded-lg transition-colors">
                                    <CheckCircle className="w-4 h-4 text-green-500" />
                                  </button>
                                  <button onClick={() => handleReject(user)} className="p-2 hover:bg-red-500/10 rounded-lg transition-colors">
                                    <XCircle className="w-4 h-4 text-red-500" />
                                  </button>
                                </>
                              )}
                              <button className="p-2 hover:bg-muted rounded-lg transition-colors">
                                <MoreVertical className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </motion.tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {activeTab === 'campaigns' && (
            <div className="space-y-4">
              <h3 className="text-xl font-heading font-semibold">Pending User Approvals</h3>
              {pendingApprovals.length === 0 ? (
                <p className="text-sm text-muted-foreground">No pending approvals right now.</p>
              ) : (
                pendingApprovals.map((item, i) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.1 }}
                    className="bg-muted/30 rounded-xl p-6 border border-border flex items-center justify-between"
                  >
                    <div>
                      <h4 className="font-semibold mb-1">{item.name}</h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{item.email}</span>
                        <span>•</span>
                        <span className="capitalize">{item.role}</span>
                        <span>•</span>
                        <span>{item.joinedDate}</span>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleReject(item)} className="px-4 py-2 border border-border rounded-lg hover:bg-red-500/10 hover:border-red-500 hover:text-red-500 transition-colors">
                        Reject
                      </button>
                      <button onClick={() => handleApprove(item)} className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors">
                        Approve
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          )}

          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Donation Records</h3>
                  <p className="text-3xl font-bold">{donations.length.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">Live entries from Firebase</p>
                </div>
                <div className="bg-gradient-to-br from-[#4ECDC4]/10 to-[#6EDDC4]/10 rounded-xl p-6">
                  <h3 className="text-lg font-semibold mb-2">Campaign Records</h3>
                  <p className="text-3xl font-bold">{campaigns.length.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground mt-2">Available across public and donor pages</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
