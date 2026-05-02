import { motion } from 'motion/react';
import { TrendingUp, Users, Target, DollarSign, Download, Heart, MapPin, Calendar } from 'lucide-react';
import { PieChart, Pie, Cell, BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  subscribeToDonations,
  type Donation,
} from '../../services/donations';
import {
  subscribeToBeneficiaries,
  type Beneficiary,
} from '../../services/beneficiaries';
import { subscribeToCampaigns, type CampaignRecord } from '../../services/campaigns';
import { downloadPdf } from '../../utils/download';
import { toCurrencyNumber } from '../../utils/currency';

export function ImpactDashboard() {
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [donations, setDonations] = useState<Donation[]>([]);
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>([]);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribeDonations = subscribeToDonations(
      (donations) => {
        setDonations(donations);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load donations from Firebase:', error);
        toast.error('Could not load donations from Firebase.');
        setIsLoading(false);
      }
    );

    const unsubscribeBeneficiaries = subscribeToBeneficiaries(
      (beneficiaries) => setBeneficiaries(beneficiaries),
      (error) => {
        console.error('Failed to load beneficiaries from Firebase:', error);
        toast.error('Could not load beneficiaries from Firebase.');
      }
    );

    const unsubscribeCampaigns = subscribeToCampaigns(
      (campaigns) => setCampaigns(campaigns),
      (error) => {
        console.error('Failed to load campaigns from Firebase:', error);
        toast.error('Could not load campaigns from Firebase.');
      }
    );

    return () => {
      unsubscribeDonations();
      unsubscribeBeneficiaries();
      unsubscribeCampaigns();
    };
  }, []);

  const totalFunds = useMemo(() => donations.reduce((sum, item) => sum + toCurrencyNumber(item.amount), 0), [donations]);

  const periodLabels = useMemo(() => {
    switch (selectedPeriod) {
      case 'week':
        return { current: 'Current Week', previous: 'Previous Week' };
      case 'year':
        return { current: 'Current Year', previous: 'Previous Year' };
      case 'month':
      default:
        return { current: 'Current Month', previous: 'Previous Month' };
    }
  }, [selectedPeriod]);

  const periodRange = useMemo(() => {
    const now = new Date();
    const end = new Date(now);
    let currentStart = new Date(now);
    let previousStart = new Date(now);
    let previousEnd = new Date(now);

    if (selectedPeriod === 'week') {
      currentStart.setDate(now.getDate() - 6);
      previousEnd = new Date(currentStart);
      previousEnd.setDate(currentStart.getDate() - 1);
      previousStart = new Date(previousEnd);
      previousStart.setDate(previousEnd.getDate() - 6);
    } else if (selectedPeriod === 'year') {
      currentStart = new Date(now.getFullYear(), 0, 1);
      previousStart = new Date(now.getFullYear() - 1, 0, 1);
      previousEnd = new Date(now.getFullYear() - 1, 11, 31);
    } else {
      currentStart = new Date(now.getFullYear(), now.getMonth(), 1);
      previousStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      previousEnd = new Date(now.getFullYear(), now.getMonth(), 0);
    }

    const normalize = (date: Date) => {
      const normalized = new Date(date);
      normalized.setHours(0, 0, 0, 0);
      return normalized;
    };

    return {
      currentStart: normalize(currentStart),
      currentEnd: normalize(end),
      previousStart: normalize(previousStart),
      previousEnd: normalize(previousEnd),
    };
  }, [selectedPeriod]);

  const isDateInRange = (value: string | undefined, start: Date, end: Date) => {
    if (!value) {
      return false;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      return false;
    }

    date.setHours(0, 0, 0, 0);
    return date >= start && date <= end;
  };

  const toImpactScore = (value: number, multiplier: number) => Math.min(100, value * multiplier);

  const fundDistribution = useMemo(() => {
    const palette = ['#FF6B35', '#6C5CE7', '#FFD93D', '#4ECDC4', '#FF8B94'];
    const grouped = donations.reduce<Record<string, number>>((acc, item) => {
      const key = item.category || 'general';
      acc[key] = (acc[key] || 0) + toCurrencyNumber(item.amount);
      return acc;
    }, {});
    const total = Object.values(grouped).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(grouped).map(([name, amount], index) => ({
      name: name.charAt(0).toUpperCase() + name.slice(1),
      value: total > 0 ? Math.round((amount / total) * 100) : 0,
      amount,
      color: palette[index % palette.length],
      children: beneficiaries.length,
    }));
  }, [beneficiaries.length, donations]);

  const monthlyImpact = useMemo(() => {
    const monthMap = new Map<string, { month: string; children: number; elders: number }>();
    donations.forEach((donation) => {
      const month = new Date(donation.date).toLocaleString('en-US', { month: 'short' });
      const current = monthMap.get(month) || { month, children: 0, elders: 0 };
      if ((donation.category || '').toLowerCase().includes('health')) {
        current.elders += 1;
      } else {
        current.children += 1;
      }
      monthMap.set(month, current);
    });
    return Array.from(monthMap.values());
  }, [donations]);

  const regionalImpact = useMemo(() => {
    const regionMap = beneficiaries.reduce<Record<string, { homes: number; beneficiaries: number; amount: number }>>((acc, item) => {
      const region = item.address?.split(',').pop()?.trim() || 'Unspecified';
      acc[region] = acc[region] || { homes: 1, beneficiaries: 0, amount: 0 };
      acc[region].beneficiaries += 1;
      acc[region].amount = totalFunds / Math.max(beneficiaries.length, 1) * acc[region].beneficiaries;
      return acc;
    }, {});

    return Object.entries(regionMap).map(([region, info]) => ({ region, ...info }));
  }, [beneficiaries, totalFunds]);

  const impactMetrics = useMemo(() => {
    const currentDonations = donations.filter((d) =>
      isDateInRange(d.date, periodRange.currentStart, periodRange.currentEnd)
    );
    const previousDonations = donations.filter((d) =>
      isDateInRange(d.date, periodRange.previousStart, periodRange.previousEnd)
    );
    const currentBeneficiaries = beneficiaries.filter((b) =>
      isDateInRange(b.admissionDate, periodRange.currentStart, periodRange.currentEnd)
    );
    const previousBeneficiaries = beneficiaries.filter((b) =>
      isDateInRange(b.admissionDate, periodRange.previousStart, periodRange.previousEnd)
    );
    const currentCampaigns = campaigns.filter((c) =>
      isDateInRange(c.createdDate, periodRange.currentStart, periodRange.currentEnd)
    );
    const previousCampaigns = campaigns.filter((c) =>
      isDateInRange(c.createdDate, periodRange.previousStart, periodRange.previousEnd)
    );

    return [
      {
        subject: 'Education',
        A: toImpactScore(
          currentDonations.filter((d) => d.category.toLowerCase().includes('education')).length,
          20
        ),
        B: toImpactScore(
          previousDonations.filter((d) => d.category.toLowerCase().includes('education')).length,
          20
        ),
        fullMark: 100,
      },
      {
        subject: 'Nutrition',
        A: toImpactScore(
          currentDonations.filter((d) => d.category.toLowerCase().includes('food')).length,
          20
        ),
        B: toImpactScore(
          previousDonations.filter((d) => d.category.toLowerCase().includes('food')).length,
          20
        ),
        fullMark: 100,
      },
      {
        subject: 'Healthcare',
        A: toImpactScore(
          currentDonations.filter((d) => d.category.toLowerCase().includes('health')).length,
          20
        ),
        B: toImpactScore(
          previousDonations.filter((d) => d.category.toLowerCase().includes('health')).length,
          20
        ),
        fullMark: 100,
      },
      {
        subject: 'Reach',
        A: toImpactScore(currentBeneficiaries.length, 25),
        B: toImpactScore(previousBeneficiaries.length, 25),
        fullMark: 100,
      },
      {
        subject: 'Campaigns',
        A: toImpactScore(currentCampaigns.length, 25),
        B: toImpactScore(previousCampaigns.length, 25),
        fullMark: 100,
      },
    ];
  }, [beneficiaries, campaigns, donations, periodRange]);

  const milestones = useMemo(
    () => campaigns.slice(0, 4).map((campaign, index) => ({
      id: index + 1,
      title: campaign.title,
      date: campaign.createdDate,
      achieved: campaign.raised > 0,
    })),
    [campaigns]
  );

  const successStories = useMemo(
    () => beneficiaries.slice(0, 3).map((item) => ({
      id: item.id,
      name: item.name,
      age: item.age,
      story: item.specialNeeds || item.medicalHistory || 'Live beneficiary story available in Firebase.',
      image: item.photo || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=200&h=200&fit=crop',
      achievement: item.education || item.healthStatus || 'Support in progress',
      before: item.medicalHistory || 'Needs support',
      after: item.specialNeeds || 'Receiving care',
    })),
    [beneficiaries]
  );

  const exportReport = () => {
    downloadPdf({
      filename: `impact-dashboard-${selectedPeriod}.pdf`,
      title: 'Umedh Foundation Impact Dashboard Report',
      subtitle: `Comprehensive Impact Analysis for ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)} Period`,
      lines: [
        `Report Generated: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
        `Period: ${selectedPeriod.charAt(0).toUpperCase() + selectedPeriod.slice(1)}`,
        '',
        'Key Impact Metrics:',
        `• Total Lives Impacted: ${beneficiaries.length}`,
        `• Meals Served (Estimated): ${Math.floor(totalFunds / 100)}`,
        `• Children Educated: ${beneficiaries.filter((b) => b.education).length}`,
        `• Partner Homes: ${regionalImpact.length}`,
        `• Total Funds Raised: ₹${totalFunds.toLocaleString()}`,
        '',
        'This report provides a comprehensive overview of Umedh Foundation\'s social impact',
        'across various programs and geographic regions.',
      ],
      sections: [
        {
          heading: 'Fund Distribution by Category',
          isTable: true,
          rows: [
            ['Category', 'Amount (₹)', 'Percentage (%)', 'Beneficiaries'],
            ...fundDistribution.map((item) => [
              item.name,
              item.amount.toLocaleString(),
              `${item.value}%`,
              item.children.toString()
            ]),
          ],
        },
        {
          heading: 'Monthly Impact Trends',
          isTable: true,
          rows: [
            ['Month', 'Children Reached', 'Elders Supported', 'Total Impact'],
            ...monthlyImpact.map((item) => [
              item.month,
              item.children.toString(),
              item.elders.toString(),
              (item.children + item.elders).toString()
            ]),
          ],
        },
        {
          heading: 'Regional Impact Breakdown',
          isTable: true,
          rows: [
            ['Region', 'Partner Homes', 'Beneficiaries', 'Funds Allocated (₹)', 'Impact Score'],
            ...regionalImpact.map((region) => [
              region.region,
              region.homes.toString(),
              region.beneficiaries.toString(),
              Math.round(region.amount).toLocaleString(),
              `${Math.min(100, region.beneficiaries * 15)}%`
            ]),
          ],
        },
        {
          heading: 'Campaign Performance',
          isTable: true,
          rows: [
            ['Campaign Name', 'Amount Raised (₹)', 'Supporters', 'Status'],
            ...campaigns.slice(0, 10).map((campaign) => [
              campaign.title,
              campaign.raised.toLocaleString(),
              campaign.supporters.toString(),
              campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)
            ]),
          ],
        },
        {
          heading: 'Impact Quality Assessment',
          isTable: true,
          rows: [
            ['Impact Area', `${periodLabels.current} (%)`, `${periodLabels.previous} (%)`, 'Improvement'],
            ...impactMetrics.map((metric) => [
              metric.subject,
              `${metric.A}%`,
              `${metric.B}%`,
              `${metric.A > metric.B ? '+' : ''}${metric.A - metric.B}%`
            ]),
          ],
        },
      ],
    });
  };

  const impactSummaryStats = useMemo(
    () => [
      { label: 'Lives Impacted', value: beneficiaries.length.toString(), change: 'Live records', icon: Heart, color: 'from-[#FF6B35] to-[#FF8B35]' },
      { label: 'Meals Served', value: Math.floor(totalFunds / 100).toString(), change: 'Estimated from donations', icon: TrendingUp, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
      { label: 'Children Educated', value: beneficiaries.filter((b) => b.education).length.toString(), change: 'Education records', icon: Users, color: 'from-[#FFD93D] to-[#FFE93D]' },
      { label: 'Partner Homes', value: regionalImpact.length.toString(), change: 'Derived from addresses', icon: MapPin, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
    ],
    [beneficiaries, regionalImpact.length, totalFunds]
  );

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Impact Dashboard</h1>
          <p className="text-muted-foreground">Real-time view of where your donations make a difference</p>
        </div>
        <div className="flex items-center gap-3">
          <select value={selectedPeriod} onChange={(e) => setSelectedPeriod(e.target.value as 'week' | 'month' | 'year')} className="px-4 py-2 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none">
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="year">This Year</option>
          </select>
          <motion.button whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={exportReport} className="px-4 py-2 bg-primary text-white rounded-xl flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export Report
          </motion.button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-6">
        {impactSummaryStats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div key={`${stat.label}-${stat.value}-${stat.change}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: i * 0.1 }} className="bg-card rounded-2xl p-6 border border-border">
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
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-xl font-heading font-semibold mb-6">Fund Distribution</h3>
          {fundDistribution.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No fund distribution data yet.</div>
          ) : (
            <div className="grid md:grid-cols-2 gap-6">
              <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                  <Pie data={fundDistribution} cx="50%" cy="50%" labelLine={false} label={({ percent = 0 }) => `${(percent * 100).toFixed(0)}%`} outerRadius={80} dataKey="amount">
                    {fundDistribution.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
              <div className="space-y-3">
                {fundDistribution.map((item, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                        <span className="font-medium">{item.name}</span>
                      </div>
                      <span className="text-muted-foreground">{item.value}%</span>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">₹{item.amount.toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.3 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-xl font-heading font-semibold mb-6">Monthly Impact Trends</h3>
          {monthlyImpact.length === 0 ? (
            <div className="h-[250px] flex items-center justify-center text-sm text-muted-foreground">No monthly impact data yet.</div>
          ) : (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyImpact}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis dataKey="month" stroke="var(--muted-foreground)" />
                <YAxis stroke="var(--muted-foreground)" allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: 'var(--card)', border: '1px solid var(--border)', borderRadius: '12px' }} />
                <Legend />
                <Line type="monotone" dataKey="children" stroke="#FF6B35" strokeWidth={2} name="Children" />
                <Line type="monotone" dataKey="elders" stroke="#6C5CE7" strokeWidth={2} name="Elders" />
              </LineChart>
            </ResponsiveContainer>
          )}
        </motion.div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="lg:col-span-2 bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-xl font-heading font-semibold mb-6">Regional Impact</h3>
          {regionalImpact.length === 0 ? (
            <div className="py-12 text-center text-sm text-muted-foreground">No regional data yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Region</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Homes</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Beneficiaries</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Funds Allocated</th>
                    <th className="text-left py-3 px-4 font-medium text-sm text-muted-foreground">Impact</th>
                  </tr>
                </thead>
                <tbody>
                  {regionalImpact.map((region, i) => (
                    <motion.tr key={i} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.05 }} className="border-b border-border hover:bg-muted/50 transition-colors">
                      <td className="py-4 px-4 font-medium">{region.region}</td>
                      <td className="py-4 px-4">{region.homes}</td>
                      <td className="py-4 px-4">{region.beneficiaries.toLocaleString()}</td>
                      <td className="py-4 px-4">₹{Math.round(region.amount).toLocaleString()}</td>
                      <td className="py-4 px-4">
                        <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                          <div className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]" style={{ width: `${Math.min(100, region.beneficiaries * 15)}%` }}></div>
                        </div>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>

        <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }} className="bg-card rounded-2xl p-6 border border-border">
          <h3 className="text-xl font-heading font-semibold mb-6">Milestones</h3>
          <div className="space-y-4">
            {milestones.length === 0 && <div className="text-sm text-muted-foreground">No milestones yet.</div>}
            {milestones.map((milestone) => (
              <div key={milestone.id} className={`flex items-start gap-3 p-4 rounded-xl ${milestone.achieved ? 'bg-green-500/10 border border-green-500/20' : 'bg-muted/50 border border-border'}`}>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${milestone.achieved ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground'}`}>
                  <Calendar className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <p className="font-medium mb-1">{milestone.title}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">{milestone.date}</div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }} className="bg-card rounded-2xl p-6 border border-border">
        <h3 className="text-xl font-heading font-semibold mb-6">Impact Quality Assessment</h3>
        {impactMetrics.length === 0 ? (
          <div className="h-[400px] flex items-center justify-center text-sm text-muted-foreground">No quality data yet.</div>
        ) : (
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={impactMetrics}>
              <PolarGrid stroke="var(--border)" />
              <PolarAngleAxis dataKey="subject" stroke="var(--muted-foreground)" />
              <PolarRadiusAxis stroke="var(--muted-foreground)" />
              <Radar name={periodLabels.current} dataKey="A" stroke="#FF6B35" fill="#FF6B35" fillOpacity={0.3} />
              <Radar name={periodLabels.previous} dataKey="B" stroke="#6C5CE7" fill="#6C5CE7" fillOpacity={0.3} />
              <Legend />
              <Tooltip />
            </RadarChart>
          </ResponsiveContainer>
        )}
      </motion.div>
    </div>
  );
}
