import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, Select } from './FormField';
import { motion } from 'motion/react';
import { saveToFolder } from '../../utils/fileHandler';

interface AddCampaignFormProps {
  onSubmit: (data: CampaignFormData) => void;
  onCancel: () => void;
  initialData?: Partial<CampaignFormData>;
  isEdit?: boolean;
}

export interface CampaignFormData {
  title: string;
  description: string;
  category: string;
  targetAmount: string;
  startDate: string;
  endDate: string;
  beneficiaryCount: string;
  location: string;
  image: File | string | null;
  status: string;
}

export function AddCampaignForm({ onSubmit, onCancel, initialData, isEdit }: AddCampaignFormProps) {
  const [formData, setFormData] = useState<CampaignFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    category: initialData?.category || '',
    targetAmount: initialData?.targetAmount || '',
    startDate: initialData?.startDate || '',
    endDate: initialData?.endDate || '',
    beneficiaryCount: initialData?.beneficiaryCount || '',
    location: initialData?.location || '',
    image: initialData?.image || null,
    status: initialData?.status || 'active',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof CampaignFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof CampaignFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Campaign title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.targetAmount || parseFloat(formData.targetAmount) <= 0) {
      newErrors.targetAmount = 'Valid target amount is required';
    }
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    if (!formData.endDate) newErrors.endDate = 'End date is required';
    if (formData.startDate && formData.endDate && new Date(formData.startDate) >= new Date(formData.endDate)) {
      newErrors.endDate = 'End date must be after start date';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success(isEdit ? 'Campaign updated successfully!' : 'Campaign created successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Campaign Title" required error={errors.title}>
        <TextInput
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value })}
          placeholder="E.g., Feed 100 Children This Winter"
        />
      </FormField>

      <FormField label="Description" required error={errors.description} helperText="Explain the campaign goals and impact">
        <TextArea
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Describe the campaign in detail..."
          rows={5}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Category" required error={errors.category}>
          <Select
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={[
              { value: 'education', label: 'Education' },
              { value: 'food', label: 'Food & Nutrition' },
              { value: 'healthcare', label: 'Healthcare' },
              { value: 'shelter', label: 'Shelter' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'emergency', label: 'Emergency Relief' },
            ]}
            placeholder="Select category"
          />
        </FormField>

        <FormField label="Target Amount (₹)" required error={errors.targetAmount}>
          <TextInput
            value={formData.targetAmount}
            onChange={(value) => setFormData({ ...formData, targetAmount: value })}
            placeholder="100000"
            type="number"
          />
        </FormField>

        <FormField label="Start Date" required error={errors.startDate}>
          <TextInput
            value={formData.startDate}
            onChange={(value) => setFormData({ ...formData, startDate: value })}
            type="date"
          />
        </FormField>

        <FormField label="End Date" required error={errors.endDate}>
          <TextInput
            value={formData.endDate}
            onChange={(value) => setFormData({ ...formData, endDate: value })}
            type="date"
          />
        </FormField>

        <FormField label="Beneficiary Count" helperText="Number of people this campaign will help">
          <TextInput
            value={formData.beneficiaryCount}
            onChange={(value) => setFormData({ ...formData, beneficiaryCount: value })}
            placeholder="50"
            type="number"
          />
        </FormField>

        <FormField label="Location">
          <TextInput
            value={formData.location}
            onChange={(value) => setFormData({ ...formData, location: value })}
            placeholder="E.g., Mumbai, Maharashtra"
          />
        </FormField>

        <FormField label="Status" required>
          <Select
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'draft', label: 'Draft' },
              { value: 'paused', label: 'Paused' },
              { value: 'completed', label: 'Completed' },
            ]}
          />
        </FormField>
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
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#6C5CE7] to-[#8C7CE7] text-white shadow-lg hover:shadow-xl transition-all"
        >
          {isEdit ? 'Update Campaign' : 'Create Campaign'}
        </motion.button>
      </div>
    </form>
  );
}
