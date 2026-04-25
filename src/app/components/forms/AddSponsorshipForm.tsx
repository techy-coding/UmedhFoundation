import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, Select } from './FormField';
import { motion } from 'motion/react';

interface AddSponsorshipFormProps {
  onSubmit: (data: SponsorshipFormData) => void;
  onCancel: () => void;
}

export interface SponsorshipFormData {
  beneficiaryId: string;
  sponsorshipType: string;
  monthlyAmount: string;
  duration: string;
  startDate: string;
  includedItems: string[];
  personalMessage: string;
  allowContact: boolean;
}

export function AddSponsorshipForm({ onSubmit, onCancel }: AddSponsorshipFormProps) {
  const [formData, setFormData] = useState<SponsorshipFormData>({
    beneficiaryId: '',
    sponsorshipType: '',
    monthlyAmount: '',
    duration: '',
    startDate: '',
    includedItems: [],
    personalMessage: '',
    allowContact: false,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SponsorshipFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof SponsorshipFormData, string>> = {};

    if (!formData.beneficiaryId) newErrors.beneficiaryId = 'Please select a beneficiary';
    if (!formData.sponsorshipType) newErrors.sponsorshipType = 'Sponsorship type is required';
    if (!formData.monthlyAmount || parseFloat(formData.monthlyAmount) <= 0) {
      newErrors.monthlyAmount = 'Valid monthly amount is required';
    }
    if (!formData.duration) newErrors.duration = 'Duration is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success('Sponsorship created successfully!');
    }
  };

  const toggleIncludedItem = (item: string) => {
    setFormData({
      ...formData,
      includedItems: formData.includedItems.includes(item)
        ? formData.includedItems.filter((i) => i !== item)
        : [...formData.includedItems, item],
    });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Select Beneficiary" required error={errors.beneficiaryId}>
        <Select
          value={formData.beneficiaryId}
          onChange={(value) => setFormData({ ...formData, beneficiaryId: value })}
          options={[
            { value: 'child001', label: 'Aarav Kumar - 8 years old' },
            { value: 'child002', label: 'Priya Sharma - 10 years old' },
            { value: 'child003', label: 'Rohan Patel - 12 years old' },
            { value: 'elderly001', label: 'Mrs. Lakshmi Iyer - 68 years old' },
            { value: 'elderly002', label: 'Mr. Ramesh Verma - 72 years old' },
          ]}
          placeholder="Choose a child or elderly person"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Sponsorship Type" required error={errors.sponsorshipType}>
          <Select
            value={formData.sponsorshipType}
            onChange={(value) => setFormData({ ...formData, sponsorshipType: value })}
            options={[
              { value: 'education', label: 'Education Sponsorship' },
              { value: 'healthcare', label: 'Healthcare Sponsorship' },
              { value: 'general', label: 'General Care Sponsorship' },
              { value: 'complete', label: 'Complete Sponsorship' },
            ]}
            placeholder="Select type"
          />
        </FormField>

        <FormField label="Monthly Amount (₹)" required error={errors.monthlyAmount}>
          <TextInput
            value={formData.monthlyAmount}
            onChange={(value) => setFormData({ ...formData, monthlyAmount: value })}
            placeholder="2000"
            type="number"
          />
        </FormField>

        <FormField label="Duration" required error={errors.duration}>
          <Select
            value={formData.duration}
            onChange={(value) => setFormData({ ...formData, duration: value })}
            options={[
              { value: '6months', label: '6 Months' },
              { value: '1year', label: '1 Year' },
              { value: '2years', label: '2 Years' },
              { value: 'ongoing', label: 'Ongoing (Until 18 years)' },
            ]}
            placeholder="Select duration"
          />
        </FormField>

        <FormField label="Start Date" required error={errors.startDate}>
          <TextInput
            value={formData.startDate}
            onChange={(value) => setFormData({ ...formData, startDate: value })}
            type="date"
          />
        </FormField>
      </div>

      <FormField label="What's Included" helperText="Select what your sponsorship will cover">
        <div className="grid grid-cols-2 gap-3 mt-2">
          {['Education', 'Food', 'Clothing', 'Healthcare', 'Shelter', 'Recreation'].map((item) => (
            <div
              key={item}
              onClick={() => toggleIncludedItem(item)}
              className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                formData.includedItems.includes(item)
                  ? 'border-primary bg-primary/10'
                  : 'border-border hover:border-primary/50'
              }`}
            >
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={formData.includedItems.includes(item)}
                  onChange={() => {}}
                  className="w-4 h-4"
                />
                <span className="text-sm font-medium">{item}</span>
              </div>
            </div>
          ))}
        </div>
      </FormField>

      <FormField
        label="Personal Message"
        helperText="Optional - send a message to the beneficiary"
      >
        <TextArea
          value={formData.personalMessage}
          onChange={(value) => setFormData({ ...formData, personalMessage: value })}
          placeholder="Write a personal message of encouragement..."
          rows={4}
        />
      </FormField>

      <div className="bg-muted/30 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <input
            type="checkbox"
            id="allowContact"
            checked={formData.allowContact}
            onChange={(e) => setFormData({ ...formData, allowContact: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300 mt-0.5"
          />
          <div>
            <label htmlFor="allowContact" className="text-sm font-medium cursor-pointer block">
              Allow periodic updates from beneficiary
            </label>
            <p className="text-xs text-muted-foreground mt-1">
              Receive photos, progress reports, and messages from the person you're sponsoring
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 pt-4 border-t border-border">
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="button"
          onClick={onCancel}
          className="flex-1 py-3 rounded-xl bg-muted hover:bg-muted/80 transition-colors"
        >
          Cancel
        </motion.button>
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white shadow-lg hover:shadow-xl transition-all"
        >
          Start Sponsorship
        </motion.button>
      </div>
    </form>
  );
}
