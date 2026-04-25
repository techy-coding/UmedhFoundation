import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, Select } from './FormField';
import { motion } from 'motion/react';

interface CreateSupportRequestFormProps {
  onSubmit: (data: SupportRequestFormData) => void;
  onCancel: () => void;
}

export interface SupportRequestFormData {
  requestType: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  requiredBy: string;
  estimatedCost: string;
}

export function CreateSupportRequestForm({ onSubmit, onCancel }: CreateSupportRequestFormProps) {
  const [formData, setFormData] = useState<SupportRequestFormData>({
    requestType: '',
    title: '',
    description: '',
    priority: '',
    category: '',
    requiredBy: '',
    estimatedCost: '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof SupportRequestFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof SupportRequestFormData, string>> = {};

    if (!formData.requestType) newErrors.requestType = 'Request type is required';
    if (!formData.title.trim()) newErrors.title = 'Title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.category) newErrors.category = 'Category is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success('Support request submitted successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Request Type" required error={errors.requestType}>
        <Select
          value={formData.requestType}
          onChange={(value) => setFormData({ ...formData, requestType: value })}
          options={[
            { value: 'material', label: 'Material Support' },
            { value: 'financial', label: 'Financial Assistance' },
            { value: 'medical', label: 'Medical Support' },
            { value: 'educational', label: 'Educational Support' },
            { value: 'counseling', label: 'Counseling/Guidance' },
            { value: 'other', label: 'Other' },
          ]}
          placeholder="Select request type"
        />
      </FormField>

      <FormField label="Request Title" required error={errors.title}>
        <TextInput
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value })}
          placeholder="Brief title for your request"
        />
      </FormField>

      <FormField label="Description" required error={errors.description} helperText="Explain your need in detail">
        <TextArea
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Provide detailed information about what you need and why..."
          rows={5}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Priority" required error={errors.priority}>
          <Select
            value={formData.priority}
            onChange={(value) => setFormData({ ...formData, priority: value })}
            options={[
              { value: 'urgent', label: 'Urgent' },
              { value: 'high', label: 'High' },
              { value: 'medium', label: 'Medium' },
              { value: 'low', label: 'Low' },
            ]}
            placeholder="Select priority"
          />
        </FormField>

        <FormField label="Category" required error={errors.category}>
          <Select
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={[
              { value: 'education', label: 'Education' },
              { value: 'healthcare', label: 'Healthcare' },
              { value: 'food', label: 'Food & Nutrition' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'shelter', label: 'Shelter' },
              { value: 'personal', label: 'Personal Items' },
              { value: 'emergency', label: 'Emergency' },
            ]}
            placeholder="Select category"
          />
        </FormField>

        <FormField label="Required By" helperText="When do you need this support?">
          <TextInput
            value={formData.requiredBy}
            onChange={(value) => setFormData({ ...formData, requiredBy: value })}
            type="date"
          />
        </FormField>

        <FormField label="Estimated Cost (₹)" helperText="If you know the approximate cost">
          <TextInput
            value={formData.estimatedCost}
            onChange={(value) => setFormData({ ...formData, estimatedCost: value })}
            placeholder="1000"
            type="number"
          />
        </FormField>
      </div>

      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4">
        <p className="text-sm text-blue-600 dark:text-blue-400">
          <strong>Note:</strong> Your request will be reviewed by staff members. You will be notified once it's approved
          and matched with a donor or sponsor.
        </p>
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
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF8B94] to-[#FFA894] text-white shadow-lg hover:shadow-xl transition-all"
        >
          Submit Request
        </motion.button>
      </div>
    </form>
  );
}
