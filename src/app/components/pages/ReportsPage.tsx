import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { TrendingUp, DollarSign, Calendar, Download, FileText, Search, Filter, CheckCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '../../context/RoleContext';
import { isFirebaseConfigured } from '../../lib/firebase';
import { subscribeToDonations, type Donation } from '../../services/donations';
import { downloadPdf } from '../../utils/download';
import { toCurrencyNumber } from '../../utils/currency';

interface Receipt {
  id: number;
  date: string;
  type: 'donation' | 'sponsorship' | 'item';
  amount: number;
  campaign: string;
  paymentMethod: string;
  transactionId: string;
  taxBenefit: boolean;
}

export function ReportsPage() {
  const [selectedTab, setSelectedTab] = useState<'receipts' | 'tax-reports' | 'impact'>('receipts');
  const [selectedYear, setSelectedYear] = useState('2026');
  const [searchQuery, setSearchQuery] = useState('');
  const { userEmail, userName } = useRole();
  const [donations, setDonations] = useState<Donation[]>([]);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToDonations(
      (items) => {
        const normalizedEmail = userEmail.trim().toLowerCase();
        setDonations(
          items.filter((item) => item.userEmail?.trim().toLowerCase() === normalizedEmail)
        );
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load donations from Firebase:', error);
        toast.error('Could not load donations from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, [userEmail]);

  const receipts: Receipt[] = useMemo(
    () =>
      donations.map((donation, index) => ({
        id: index + 1,
        date: donation.date,
        type: donation.campaign
          ? 'sponsorship'
          : donation.category === 'shelter' || donation.category === 'food'
            ? 'item'
            : 'donation',
        amount: toCurrencyNumber(donation.amount),
        campaign: donation.campaign || donation.category || 'General Donation',
        paymentMethod: (donation.paymentMethod || 'online').toUpperCase(),
        transactionId: donation.id,
        taxBenefit: donation.tax80G,
      })),
    [donations]
  );

  const filteredReceipts = useMemo(() => {
    const normalizedQuery = searchQuery.trim().toLowerCase();

    return receipts.filter((receipt) => {
      const matchesYear = receipt.date.startsWith(selectedYear);
      const matchesQuery =
        !normalizedQuery ||
        receipt.transactionId.toLowerCase().includes(normalizedQuery) ||
        receipt.campaign.toLowerCase().includes(normalizedQuery);

      return matchesYear && matchesQuery;
    });
  }, [receipts, searchQuery, selectedYear]);

  const taxSummary = useMemo(() => {
    const yearlyReceipts = receipts.filter((receipt) => receipt.date.startsWith(selectedYear));
    const taxDeductible = yearlyReceipts.filter((receipt) => receipt.taxBenefit).reduce((sum, receipt) => sum + receipt.amount, 0);

    return {
      totalDonations: yearlyReceipts.reduce((sum, receipt) => sum + receipt.amount, 0),
      taxDeductible,
      estimatedTaxSaving: Math.round(taxDeductible * 0.3),
      transactions: yearlyReceipts.length,
    };
  }, [receipts, selectedYear]);

  const reportStats = useMemo(
    () => [
      { label: 'Total Donations', value: `₹${(taxSummary.totalDonations / 1000).toFixed(1)}K`, color: 'from-[#FF6B35] to-[#FF8B35]' },
      { label: 'Tax Deductible', value: `₹${(taxSummary.taxDeductible / 1000).toFixed(1)}K`, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
      { label: 'Estimated Tax Saving', value: `₹${(taxSummary.estimatedTaxSaving / 1000).toFixed(1)}K`, color: 'from-[#FFD93D] to-[#FFE93D]' },
      { label: 'Total Transactions', value: taxSummary.transactions.toLocaleString(), color: 'from-[#4ECDC4] to-[#6EDDC4]' },
    ],
    [taxSummary.estimatedTaxSaving, taxSummary.taxDeductible, taxSummary.totalDonations, taxSummary.transactions]
  );

  const monthlyBreakdown = useMemo(() => {
    const monthMap = receipts
      .filter((receipt) => receipt.date.startsWith(selectedYear))
      .reduce<Record<string, number>>((acc, receipt) => {
        const key = new Date(receipt.date).toLocaleString('en-US', { month: 'long', year: 'numeric' });
        acc[key] = (acc[key] || 0) + receipt.amount;
        return acc;
      }, {});

    return Object.entries(monthMap).map(([month, amount]) => ({ month, amount }));
  }, [receipts, selectedYear]);

  const impactBreakdown = useMemo(() => {
    const categoryMap = receipts
      .filter((receipt) => receipt.date.startsWith(selectedYear))
      .reduce<Record<string, number>>((acc, receipt) => {
        const key = receipt.campaign || 'General';
        acc[key] = (acc[key] || 0) + receipt.amount;
        return acc;
      }, {});

    const total = Object.values(categoryMap).reduce((sum, amount) => sum + amount, 0);

    return Object.entries(categoryMap).map(([category, amount]) => ({
      category,
      amount,
      percentage: total > 0 ? Math.round((amount / total) * 100) : 0,
    }));
  }, [receipts, selectedYear]);

  const downloadReceipt = (receipt: Receipt) => {
    downloadPdf({
      filename: `receipt-${receipt.transactionId}.pdf`,
      title: 'Umedh Foundation Donation Receipt',
      subtitle: 'Tax Receipt Under Section 80G of Income Tax Act',
      lines: [
        `Donor Name: ${userName || 'Supporter'}`,
        `Email: ${userEmail}`,
        `Receipt Date: ${receipt.date}`,
        `80G Eligible: ${receipt.taxBenefit ? 'Yes - Tax Deductible' : 'No'}`,
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
            ['Campaign', receipt.campaign],
            ['Donation Type', receipt.type],
            ['Amount', `INR ${receipt.amount.toLocaleString()}`],
            ['Payment Method', receipt.paymentMethod],
            ['Transaction ID', receipt.transactionId],
            ['Date', receipt.date],
          ],
        },
      ],
    });
    toast.success('Receipt downloaded successfully.');
  };

  const download80GCertificate = () => {
    downloadPdf({
      filename: `80g-certificate-${selectedYear}.pdf`,
      title: 'Umedh Foundation 80G Tax Certificate',
      subtitle: `Financial Year ${selectedYear} - Tax Deduction Certificate`,
      lines: [
        `Donor Name: ${userName || 'Supporter'}`,
        `Email: ${userEmail}`,
        '',
        'Certificate of Donation under Section 80G of Income Tax Act, 1961',
        'This certifies that the donor has made eligible contributions to Umedh Foundation,',
        'a registered NGO under section 80G(5)(vi) of the Income Tax Act, 1961.',
        '',
        'The donations specified herein are eligible for tax deduction under Section 80G.',
      ],
      sections: [
        {
          heading: 'Tax Summary',
          isTable: true,
          rows: [
            ['Particulars', 'Amount (INR)'],
            ['Total Donations', taxSummary.totalDonations.toLocaleString()],
            ['Tax Deductible Amount', taxSummary.taxDeductible.toLocaleString()],
            ['Estimated Tax Saving (30%)', taxSummary.estimatedTaxSaving.toLocaleString()],
            ['Number of Transactions', taxSummary.transactions],
          ],
        },
      ],
    });
    toast.success('80G certificate downloaded successfully.');
  };

  const downloadTaxReport = () => {
    downloadPdf({
      filename: `tax-report-${selectedYear}.pdf`,
      title: 'Umedh Foundation Tax Report',
      subtitle: `Comprehensive Tax Summary for Financial Year ${selectedYear}`,
      lines: [
        `Donor Name: ${userName || 'Supporter'}`,
        `Email: ${userEmail}`,
        '',
        'This report provides a comprehensive summary of your donations and tax benefits',
        'for the financial year. All amounts are in Indian Rupees (INR).',
      ],
      sections: [
        {
          heading: 'Annual Summary',
          isTable: true,
          rows: [
            ['Description', 'Amount (INR)'],
            ['Total Donations', taxSummary.totalDonations.toLocaleString()],
            ['Tax Deductible Amount (50%)', taxSummary.taxDeductible.toLocaleString()],
            ['Estimated Tax Saving (30%)', taxSummary.estimatedTaxSaving.toLocaleString()],
            ['Total Transactions', taxSummary.transactions],
          ],
        },
        {
          heading: 'Monthly Breakdown',
          isTable: true,
          rows: [
            ['Month', 'Donations', 'Deductible', 'Tax Saving'],
            ...monthlyBreakdown.map(({ month, amount }) => [
              month,
              `INR ${amount.toLocaleString()}`,
              `INR ${(amount * 0.5).toLocaleString()}`,
              `INR ${(amount * 0.5 * 0.3).toLocaleString()}`
            ]),
          ],
        },
      ],
    });
    toast.success('Tax report exported successfully.');
  };

  const downloadImpactReport = () => {
    downloadPdf({
      filename: `impact-report-${selectedYear}.pdf`,
      title: 'Umedh Foundation Impact Report',
      subtitle: `Your Social Impact Summary for Financial Year ${selectedYear}`,
      lines: [
        `Donor Name: ${userName || 'Supporter'}`,
        `Email: ${userEmail}`,
        '',
        'Your generous contributions have made a significant impact in the community.',
        'This report shows how your donations have been utilized across various campaigns.',
        '',
        `Total Impact: ${filteredReceipts.length} donations supporting ${impactBreakdown.length} campaigns`,
      ],
      sections: [
        {
          heading: 'Campaign Impact Breakdown',
          isTable: true,
          rows: [
            ['Campaign/Category', 'Amount (INR)', 'Percentage', 'Impact Level'],
            ...impactBreakdown.map((item) => [
              item.category,
              item.amount.toLocaleString(),
              `${item.percentage}%`,
              item.percentage >= 30 ? 'High' : item.percentage >= 15 ? 'Medium' : 'Supporting'
            ]),
          ],
        },
        {
          heading: 'Social Impact Metrics',
          isTable: true,
          rows: [
            ['Metric', 'Estimated Impact'],
            ['Total Donations', `INR ${taxSummary.totalDonations.toLocaleString()}`],
            ['Meals Provided', Math.floor(taxSummary.totalDonations / 100)],
            ['Education Support', Math.floor(taxSummary.totalDonations / 500)],
            ['Healthcare Support', Math.floor(taxSummary.totalDonations / 1000)],
            ['Campaigns Supported', impactBreakdown.length],
          ],
        },
      ],
    });
    toast.success('Impact report exported successfully.');
  };

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="mb-2 text-3xl font-heading font-bold">Reports & Receipts</h1>
          <p className="text-muted-foreground">Download donation receipts, tax summaries, and impact reports.</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={download80GCertificate}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] px-6 py-3 font-medium text-white shadow-lg"
        >
          <Download className="h-5 w-5" />
          Download 80G Certificate
        </motion.button>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        {reportStats.map((stat) => (
          <div key={`${stat.label}-${stat.value}`} className="rounded-2xl border border-border bg-card p-6">
            <div className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color}`}>
              <FileText className="h-6 w-6 text-white" />
            </div>
            <p className="mb-1 text-sm text-muted-foreground">{stat.label}</p>
            <p key={stat.value} className="text-3xl font-bold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="overflow-hidden rounded-2xl border border-border bg-card">
        <div className="border-b border-border">
          <div className="flex">
            {(['receipts', 'tax-reports', 'impact'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setSelectedTab(tab)}
                className={`px-6 py-4 font-medium capitalize transition-colors ${
                  selectedTab === tab ? 'border-b-2 border-primary text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>
        </div>

        <div className="p-6">
          {selectedTab === 'receipts' && (
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(event) => setSearchQuery(event.target.value)}
                    placeholder="Search by transaction ID or campaign..."
                    className="w-full rounded-xl border border-transparent bg-muted/50 py-2 pl-10 pr-4 focus:border-primary focus:outline-none"
                  />
                </div>
                <select
                  value={selectedYear}
                  onChange={(event) => setSelectedYear(event.target.value)}
                  className="rounded-xl border border-transparent bg-muted/50 px-4 py-2 focus:border-primary focus:outline-none"
                >
                  <option value="2026">2026</option>
                  <option value="2025">2025</option>
                  <option value="2024">2024</option>
                </select>
                <button className="flex items-center gap-2 rounded-xl border border-border px-4 py-2 transition-colors hover:bg-muted">
                  <Filter className="h-4 w-4" />
                  Filter
                </button>
              </div>

              <div className="space-y-4">
                {filteredReceipts.length === 0 && (
                  <div className="rounded-xl border border-border bg-muted/30 p-6 text-muted-foreground">
                    No receipts match the current year or search filter.
                  </div>
                )}
                {filteredReceipts.map((receipt, index) => (
                  <motion.div
                    key={receipt.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="rounded-xl border border-border bg-muted/30 p-6"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7]">
                          <FileText className="h-6 w-6 text-white" />
                        </div>
                        <div>
                          <h3 className="mb-1 font-semibold">{receipt.campaign}</h3>
                          <div className="mb-2 flex flex-wrap gap-3 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-4 w-4" />
                              {receipt.date}
                            </div>
                            <span>•</span>
                            <span className="capitalize">{receipt.type}</span>
                            <span>•</span>
                            <span>{receipt.paymentMethod}</span>
                            <span>•</span>
                            <span className="font-mono text-xs">{receipt.transactionId}</span>
                          </div>
                          {receipt.taxBenefit && (
                            <span className="inline-flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-1 text-xs text-green-500">
                              <CheckCircle className="h-3 w-3" />
                              80G Tax Benefit Eligible
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="mb-3 text-2xl font-bold text-primary">₹{receipt.amount.toLocaleString()}</p>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.95 }}
                          onClick={() => downloadReceipt(receipt)}
                          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-white transition-colors hover:bg-primary/90"
                        >
                          <Download className="h-4 w-4" />
                          Download
                        </motion.button>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {selectedTab === 'tax-reports' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 p-8">
                <h3 className="mb-6 text-2xl font-heading font-bold">80G Tax Benefit Summary</h3>
                <div className="mb-6 grid gap-6 md:grid-cols-2">
                  <div className="rounded-xl bg-card/80 p-6">
                    <p className="mb-2 text-sm text-muted-foreground">Total Donations ({selectedYear})</p>
                    <p className="mb-4 text-4xl font-bold">₹{taxSummary.totalDonations.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Across {taxSummary.transactions} transactions</p>
                  </div>
                  <div className="rounded-xl bg-card/80 p-6">
                    <p className="mb-2 text-sm text-muted-foreground">Estimated Tax Saving (30% tax bracket)</p>
                    <p className="mb-4 text-4xl font-bold text-green-500">₹{taxSummary.estimatedTaxSaving.toLocaleString()}</p>
                    <p className="text-sm text-muted-foreground">Under Section 80G</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadTaxReport}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] py-3 font-medium text-white shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  Export Tax Report
                </motion.button>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h4 className="mb-4 font-semibold">Monthly Breakdown</h4>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="px-4 py-3 text-left text-sm font-medium text-muted-foreground">Month</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Donations</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Deductible Amount</th>
                        <th className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Tax Saving</th>
                      </tr>
                    </thead>
                    <tbody>
                      {monthlyBreakdown.map(({ month, amount }) => (
                        <tr key={month} className="border-b border-border hover:bg-muted/50">
                          <td className="px-4 py-3">{month}</td>
                          <td className="px-4 py-3 text-right">₹{amount.toLocaleString()}</td>
                          <td className="px-4 py-3 text-right">₹{(amount * 0.5).toLocaleString()}</td>
                          <td className="px-4 py-3 text-right font-medium text-green-500">₹{(amount * 0.5 * 0.3).toLocaleString()}</td>
                        </tr>
                      ))}
                      {monthlyBreakdown.length === 0 && (
                        <tr>
                          <td colSpan={4} className="px-4 py-6 text-center text-sm text-muted-foreground">
                            No monthly donation data available yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {selectedTab === 'impact' && (
            <div className="space-y-6">
              <div className="rounded-2xl border border-border bg-gradient-to-br from-[#FF6B35]/10 to-[#6C5CE7]/10 p-8">
                <h3 className="mb-6 text-2xl font-heading font-bold">Your Impact Report</h3>
                <div className="mb-6 grid gap-6 md:grid-cols-3">
                  <div className="rounded-xl bg-card/80 p-6 text-center">
                    <p className="text-3xl font-bold">{filteredReceipts.length}</p>
                    <p className="text-sm text-muted-foreground">Live receipts</p>
                  </div>
                  <div className="rounded-xl bg-card/80 p-6 text-center">
                    <p className="text-3xl font-bold">{Math.floor(taxSummary.totalDonations / 100)}</p>
                    <p className="text-sm text-muted-foreground">Estimated meals provided</p>
                  </div>
                  <div className="rounded-xl bg-card/80 p-6 text-center">
                    <p className="text-3xl font-bold">{impactBreakdown.length}</p>
                    <p className="text-sm text-muted-foreground">Campaigns impacted</p>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={downloadImpactReport}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] py-3 font-medium text-white shadow-lg"
                >
                  <Download className="h-5 w-5" />
                  Export Impact Report
                </motion.button>
              </div>

              <div className="rounded-xl border border-border bg-card p-6">
                <h4 className="mb-4 font-semibold">Impact Breakdown</h4>
                <div className="space-y-3">
                  {impactBreakdown.length === 0 && <p className="text-sm text-muted-foreground">No impact records available for this year yet.</p>}
                  {impactBreakdown.map((item) => (
                    <div key={item.category} className="rounded-xl bg-muted/30 p-4">
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-medium">{item.category}</span>
                        <span className="text-sm text-muted-foreground">{item.percentage}%</span>
                      </div>
                      <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                        <div
                          className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                          style={{ width: `${item.percentage}%` }}
                        />
                      </div>
                      <p className="text-sm text-muted-foreground">₹{item.amount.toLocaleString()}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
