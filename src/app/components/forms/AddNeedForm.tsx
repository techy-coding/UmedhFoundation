import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, Select } from './FormField';
import { motion } from 'motion/react';

interface AddNeedFormProps {
  onSubmit: (data: NeedFormData) => void;
  onCancel: () => void;
  initialData?: Partial<NeedFormData>;
  isEdit?: boolean;
}

export interface NeedFormData {
  item: string;
  category: string;
  quantity: string;
  priority: string;
  requiredBy: string;
  beneficiaryName: string;
  purpose: string;
  estimatedCost: string;
}

export function AddNeedForm({ onSubmit, onCancel, initialData, isEdit }: AddNeedFormProps) {
  const [formData, setFormData] = useState<NeedFormData>({
    item: initialData?.item || '',
    category: initialData?.category || '',
    quantity: initialData?.quantity || '',
    priority: initialData?.priority || '',
    requiredBy: initialData?.requiredBy || '',
    beneficiaryName: initialData?.beneficiaryName || '',
    purpose: initialData?.purpose || '',
    estimatedCost: initialData?.estimatedCost || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof NeedFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof NeedFormData, string>> = {};

    if (!formData.item.trim()) newErrors.item = 'Item name is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.quantity || parseInt(formData.quantity) <= 0) {
      newErrors.quantity = 'Valid quantity is required';
    }
    if (!formData.priority) newErrors.priority = 'Priority is required';
    if (!formData.requiredBy) newErrors.requiredBy = 'Required by date is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success(isEdit ? 'Need updated successfully!' : 'Need added successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Item Name" required error={errors.item}>
          <TextInput
            value={formData.item}
            onChange={(value) => setFormData({ ...formData, item: value })}
            placeholder="E.g., Winter Blankets, School Books"
          />
        </FormField>

        <FormField label="Category" required error={errors.category}>
          <Select
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={[
              { value: 'food', label: 'Food & Groceries' },
              { value: 'clothing', label: 'Clothing' },
              { value: 'education', label: 'Education Supplies' },
              { value: 'medical', label: 'Medical Supplies' },
              { value: 'shelter', label: 'Shelter & Bedding' },
              { value: 'hygiene', label: 'Hygiene Products' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="Select category"
          />
        </FormField>

        <FormField label="Quantity" required error={errors.quantity}>
          <TextInput
            value={formData.quantity}
            onChange={(value) => setFormData({ ...formData, quantity: value })}
            placeholder="10"
            type="number"
          />
        </FormField>

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

        <FormField label="Required By" required error={errors.requiredBy}>
          <TextInput
            value={formData.requiredBy}
            onChange={(value) => setFormData({ ...formData, requiredBy: value })}
            type="date"
          />
        </FormField>

        <FormField label="Estimated Cost (₹)" helperText="Optional - estimated cost per unit">
          <TextInput
            value={formData.estimatedCost}
            onChange={(value) => setFormData({ ...formData, estimatedCost: value })}
            placeholder="500"
            type="number"
          />
        </FormField>
      </div>

      <FormField label="Beneficiary Name" helperText="Who will benefit from this item?">
        <TextInput
          value={formData.beneficiaryName}
          onChange={(value) => setFormData({ ...formData, beneficiaryName: value })}
          placeholder="Individual or group name"
        />
      </FormField>

      <FormField label="Purpose" helperText="Explain why this item is needed">
        <TextArea
          value={formData.purpose}
          onChange={(value) => setFormData({ ...formData, purpose: value })}
          placeholder="Describe the purpose and impact of this need..."
          rows={4}
        />
      </FormField>

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
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FFD93D] to-[#FFE93D] text-black shadow-lg hover:shadow-xl transition-all"
        >
          {isEdit ? 'Update Need' : 'Add Need'}
        </motion.button>
      </div>
    </form>
  );
}
