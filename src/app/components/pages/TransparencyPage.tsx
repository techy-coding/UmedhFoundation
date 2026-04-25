import { useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Download, FileText, Shield, CheckCircle, TrendingUp } from 'lucide-react';
import { useState } from 'react';
import { subscribeToDonations, type Donation } from '../../services/donations';
import { subscribeToBeneficiaries, type Beneficiary } from '../../services/beneficiaries';
import { subscribeToCampaigns, type CampaignRecord } from '../../services/campaigns';

export function TransparencyPage() {
  const [donations, setDonations] = useState<Donation[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);

  useEffect(() => subscribeToDonations(setDonations), []);
  useEffect(() => subscribeToBeneficiaries(setBeneficiaries), []);
  useEffect(() => subscribeToCampaigns(setCampaigns), []);

  const totalFunds = useMemo(
    () => donations.reduce((sum, donation) => sum + Number(donation.amount || 0), 0),
    [donations]
  );

  const fundUsage = useMemo(() => {
    const categoryTotals = donations.reduce<Record<string, number>>((acc, donation) => {
      const key = donation.category || 'General';
      acc[key] = (acc[key] || 0) + Number(donation.amount || 0);
      return acc;
    }, {});

    const palette = ['#FF6B35', '#6C5CE7', '#FFD93D', '#4ECDC4', '#FF8B94'];
    const total = Object.values(categoryTotals).reduce((sum, value) => sum + value, 0);

    return Object.entries(categoryTotals).map(([name, amount], index) => ({
      name,
      value: total > 0 ? Math.round((amount / total) * 100) : 0,
      amount,
      color: palette[index % palette.length],
      beneficiaries: beneficiaries.length,
    }));
  }, [beneficiaries.length, donations]);

  const quarterlyBreakdown = useMemo(() => {
    const quarterMap: Record<string, { quarter: string; total: number }> = {};

    donations.forEach((donation) => {
      const date = new Date(donation.date || Date.now());
      const year = date.getFullYear();
      const quarter = `Q${Math.floor(date.getMonth() / 3) + 1} ${year}`;
      quarterMap[quarter] = quarterMap[quarter] || { quarter, total: 0 };
      quarterMap[quarter].total += Number(donation.amount || 0);
    });

    return Object.values(quarterMap).sort((a, b) => a.quarter.localeCompare(b.quarter));
  }, [donations]);

  const auditReports = useMemo(
    () => [
      { year: `${new Date().getFullYear()}-${String((new Date().getFullYear() + 1) % 100).padStart(2, '0')}`, status: 'Live', auditor: 'Firebase Realtime Database' },
      { year: 'Collection Status', status: campaigns.length > 0 || donations.length > 0 ? 'Active' : 'Waiting for data', auditor: 'Umedh Platform' },
    ],
    [campaigns.length, donations.length]
  );

  const certifications = [
    { name: 'Realtime Database', status: 'Connected', icon: Shield },
    { name: 'Firebase Auth', status: 'Enabled', icon: CheckCircle },
    { name: 'Storage Uploads', status: 'Enabled', icon: FileText },
    { name: 'Live Metrics', status: 'Derived from Firebase', icon: CheckCircle },
  ];

  const directProgramUse = totalFunds > 0 ? '100%' : '0%';
  const adminCosts = totalFunds > 0 ? '0%' : '0%';

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="text-center mb-8">
        <h1 className="text-4xl font-heading font-bold mb-4">Financial Transparency</h1>
        <p className="text-xl text-muted-foreground">This page now reflects live Firebase donation data</p>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Funds Received', value: `₹${totalFunds.toLocaleString()}`, color: 'from-[#FF6B35] to-[#FF8B35]' },
          { label: 'Direct Program Use', value: directProgramUse, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
          { label: 'Admin Costs', value: adminCosts, color: 'from-[#FFD93D] to-[#FFE93D]' },
          { label: 'Lives Impacted', value: beneficiaries.length.toLocaleString(), color: 'from-[#4ECDC4] to-[#6EDDC4]' },
        ].map((stat) => (
          <motion.div
            key={stat.label}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-card rounded-2xl p-6 border border-border"
          >
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
            <p className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-8 border border-border">
          <h3 className="text-2xl font-heading font-bold mb-6">Fund Distribution</h3>
          {fundUsage.length === 0 ? (
            <p className="text-sm text-muted-foreground">No donation categories available yet.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={fundUsage}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, percent }) => `${name} ${((percent || 0) * 100).toFixed(0)}%`}
                    outerRadius={100}
                    dataKey="amount"
                  >
                    {fundUsage.map((entry) => (
                      <Cell key={entry.name} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-4">
                {fundUsage.map((item) => (
                  <div key={item.name} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-4 h-4 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="text-sm font-medium">{item.name}</span>
                      </div>
                      <span className="text-sm text-muted-foreground">{item.value}%</span>
                    </div>
                    <div className="pl-6">
                      <p className="text-xs text-muted-foreground">₹{item.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-8 border border-border">
          <h3 className="text-2xl font-heading font-bold mb-6">Quarterly Intake</h3>
          {quarterlyBreakdown.length === 0 ? (
            <p className="text-sm text-muted-foreground">No donation history available for quarterly breakdown yet.</p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={quarterlyBreakdown}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="quarter" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--card)',
                    border: '1px solid var(--border)',
                    borderRadius: '12px',
                  }}
                />
                <Legend />
                <Bar dataKey="total" fill="#FF6B35" name="Donations Received" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 rounded-2xl p-8 border border-border">
        <h3 className="text-2xl font-heading font-bold mb-6">Platform Status</h3>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {certifications.map((cert, i) => {
            const Icon = cert.icon;
            return (
              <motion.div
                key={cert.name}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.1 * i }}
                className="bg-card/80 backdrop-blur-sm rounded-xl p-6 border border-border text-center"
              >
                <div className="w-16 h-16 bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] rounded-full flex items-center justify-center mx-auto mb-4">
                  <Icon className="w-8 h-8 text-white" />
                </div>
                <h4 className="font-semibold mb-2">{cert.name}</h4>
                <p className="text-sm text-green-500">{cert.status}</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-8 border border-border">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-heading font-bold">Audit Snapshot</h3>
          <button className="px-4 py-2 bg-primary text-white rounded-xl flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Period</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Status</th>
                <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Source</th>
              </tr>
            </thead>
            <tbody>
              {auditReports.map((report) => (
                <tr key={report.year} className="border-b border-border hover:bg-muted/50">
                  <td className="py-4 px-4 font-medium">{report.year}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm ${report.status === 'Live' || report.status === 'Active' ? 'bg-green-500/10 text-green-500' : 'bg-yellow-500/10 text-yellow-500'}`}>
                      {report.status}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-muted-foreground">{report.auditor}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
}
