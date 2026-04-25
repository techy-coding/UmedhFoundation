import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, Select } from './FormField';
import { motion } from 'motion/react';

interface AddDonationFormProps {
  onSubmit: (data: DonationFormData) => void;
  onCancel: () => void;
}

export interface DonationFormData {
  amount: string;
  category: string;
  campaign: string;
  campaignId?: string;
  isRecurring: boolean;
  frequency: string;
  paymentMethod: string;
  message: string;
  isAnonymous: boolean;
  tax80G: boolean;
  paymentGateway?: string;
  paymentId?: string;
  paymentOrderId?: string;
  paymentSignature?: string;
}

export function AddDonationForm({ onSubmit, onCancel }: AddDonationFormProps) {
  const [formData, setFormData] = useState<DonationFormData>({
    amount: '',
    category: '',
    campaign: '',
    isRecurring: false,
    frequency: 'monthly',
    paymentMethod: '',
    message: '',
    isAnonymous: false,
    tax80G: true,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof DonationFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof DonationFormData, string>> = {};

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      newErrors.amount = 'Valid donation amount is required';
    }
    if (!formData.category) newErrors.category = 'Donation category is required';
    if (!formData.paymentMethod) newErrors.paymentMethod = 'Payment method is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success('Donation processed successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Donation Amount (₹)" required error={errors.amount}>
        <TextInput
          value={formData.amount}
          onChange={(value) => setFormData({ ...formData, amount: value })}
          placeholder="1000"
          type="number"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Donation Category" required error={errors.category}>
          <Select
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={[
              { value: 'general', label: 'General Fund' },
              { value: 'education', label: 'Education' },
              { value: 'food', label: 'Food & Nutrition' },
              { value: 'healthcare', label: 'Healthcare' },
              { value: 'shelter', label: 'Shelter' },
              { value: 'emergency', label: 'Emergency Relief' },
            ]}
            placeholder="Select category"
          />
        </FormField>

        <FormField label="Campaign" helperText="Optional - donate to a specific campaign">
          <Select
            value={formData.campaign}
            onChange={(value) => setFormData({ ...formData, campaign: value })}
            options={[
              { value: '', label: 'No specific campaign' },
              { value: 'feed100', label: 'Feed 100 Children' },
              { value: 'winterwarmth', label: 'Winter Warmth Drive' },
              { value: 'educationforall', label: 'Education for All' },
            ]}
          />
        </FormField>
      </div>

      <div className="bg-muted/30 rounded-xl p-4 space-y-4">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="recurring"
            checked={formData.isRecurring}
            onChange={(e) => setFormData({ ...formData, isRecurring: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300"
          />
          <label htmlFor="recurring" className="text-sm font-medium cursor-pointer">
            Make this a recurring donation
          </label>
        </div>

        {formData.isRecurring && (
          <FormField label="Frequency">
            <Select
              value={formData.frequency}
              onChange={(value) => setFormData({ ...formData, frequency: value })}
              options={[
                { value: 'weekly', label: 'Weekly' },
                { value: 'monthly', label: 'Monthly' },
                { value: 'quarterly', label: 'Quarterly' },
                { value: 'yearly', label: 'Yearly' },
              ]}
            />
          </FormField>
        )}
      </div>

      <FormField label="Payment Method" required error={errors.paymentMethod}>
        <Select
          value={formData.paymentMethod}
          onChange={(value) => setFormData({ ...formData, paymentMethod: value })}
          options={[
            { value: 'upi', label: 'UPI' },
            { value: 'card', label: 'Credit/Debit Card' },
            { value: 'netbanking', label: 'Net Banking' },
            { value: 'wallet', label: 'Digital Wallet' },
          ]}
          placeholder="Select payment method"
        />
      </FormField>

      <FormField label="Message" helperText="Optional - add a message with your donation">
        <TextArea
          value={formData.message}
          onChange={(value) => setFormData({ ...formData, message: value })}
          placeholder="Your message of support..."
          rows={3}
        />
      </FormField>

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="anonymous"
            checked={formData.isAnonymous}
            onChange={(e) => setFormData({ ...formData, isAnonymous: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300"
          />
          <label htmlFor="anonymous" className="text-sm cursor-pointer">
            Make my donation anonymous
          </label>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="tax80g"
            checked={formData.tax80G}
            onChange={(e) => setFormData({ ...formData, tax80G: e.target.checked })}
            className="w-5 h-5 rounded border-gray-300"
          />
          <label htmlFor="tax80g" className="text-sm cursor-pointer">
            I want 80G tax receipt
          </label>
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
          Proceed to Payment
        </motion.button>
      </div>
    </form>
  );
}
