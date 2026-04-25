import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, Select, FileUpload } from './FormField';
import { motion } from 'motion/react';
import { saveToFolder } from '../../utils/fileHandler';

interface AddBeneficiaryFormProps {
  onSubmit: (data: BeneficiaryFormData) => void;
  onCancel: () => void;
  initialData?: Partial<BeneficiaryFormData>;
  isEdit?: boolean;
}

export interface BeneficiaryFormData {
  name: string;
  age: string;
  gender: string;
  category: string;
  admissionDate: string;
  healthStatus: string;
  education: string;
  guardianName: string;
  guardianContact: string;
  address: string;
  medicalHistory: string;
  specialNeeds: string;
}

export function AddBeneficiaryForm({ onSubmit, onCancel, initialData, isEdit }: AddBeneficiaryFormProps) {
  const [formData, setFormData] = useState<BeneficiaryFormData>({
    name: initialData?.name || '',
    age: initialData?.age || '',
    gender: initialData?.gender || '',
    category: initialData?.category || '',
    admissionDate: initialData?.admissionDate || '',
    healthStatus: initialData?.healthStatus || '',
    education: initialData?.education || '',
    guardianName: initialData?.guardianName || '',
    guardianContact: initialData?.guardianContact || '',
    address: initialData?.address || '',
    medicalHistory: initialData?.medicalHistory || '',
    specialNeeds: initialData?.specialNeeds || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof BeneficiaryFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof BeneficiaryFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.age.trim()) newErrors.age = 'Age is required';
    if (!formData.gender) newErrors.gender = 'Gender is required';
    if (!formData.category) newErrors.category = 'Category is required';
    if (!formData.admissionDate) newErrors.admissionDate = 'Admission date is required';
    if (!formData.healthStatus) newErrors.healthStatus = 'Health status is required';
    if (formData.guardianContact && !/^\d{10}$/.test(formData.guardianContact)) {
      newErrors.guardianContact = 'Invalid contact number (10 digits required)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success(isEdit ? 'Beneficiary updated successfully!' : 'Beneficiary added successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Full Name" required error={errors.name}>
          <TextInput
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Enter full name"
          />
        </FormField>

        <FormField label="Age" required error={errors.age}>
          <TextInput
            value={formData.age}
            onChange={(value) => setFormData({ ...formData, age: value })}
            placeholder="Enter age"
            type="number"
          />
        </FormField>

        <FormField label="Gender" required error={errors.gender}>
          <Select
            value={formData.gender}
            onChange={(value) => setFormData({ ...formData, gender: value })}
            options={[
              { value: 'male', label: 'Male' },
              { value: 'female', label: 'Female' },
              { value: 'other', label: 'Other' },
            ]}
            placeholder="Select gender"
          />
        </FormField>

        <FormField label="Category" required error={errors.category}>
          <Select
            value={formData.category}
            onChange={(value) => setFormData({ ...formData, category: value })}
            options={[
              { value: 'orphan', label: 'Orphan Child' },
              { value: 'elderly', label: 'Elderly' },
              { value: 'disabled', label: 'Differently Abled' },
            ]}
            placeholder="Select category"
          />
        </FormField>

        <FormField label="Admission Date" required error={errors.admissionDate}>
          <TextInput
            value={formData.admissionDate}
            onChange={(value) => setFormData({ ...formData, admissionDate: value })}
            type="date"
          />
        </FormField>

        <FormField label="Health Status" required error={errors.healthStatus}>
          <Select
            value={formData.healthStatus}
            onChange={(value) => setFormData({ ...formData, healthStatus: value })}
            options={[
              { value: 'good', label: 'Good' },
              { value: 'fair', label: 'Fair' },
              { value: 'needs-attention', label: 'Needs Attention' },
              { value: 'critical', label: 'Critical' },
            ]}
            placeholder="Select health status"
          />
        </FormField>

        <FormField label="Education Level">
          <TextInput
            value={formData.education}
            onChange={(value) => setFormData({ ...formData, education: value })}
            placeholder="E.g., Class 5, Illiterate, Graduate"
          />
        </FormField>

        <FormField label="Guardian Name">
          <TextInput
            value={formData.guardianName}
            onChange={(value) => setFormData({ ...formData, guardianName: value })}
            placeholder="Enter guardian name (if any)"
          />
        </FormField>

        <FormField label="Guardian Contact" error={errors.guardianContact}>
          <TextInput
            value={formData.guardianContact}
            onChange={(value) => setFormData({ ...formData, guardianContact: value })}
            placeholder="10-digit mobile number"
            type="tel"
          />
        </FormField>
      </div>

      <FormField label="Address">
        <TextArea
          value={formData.address}
          onChange={(value) => setFormData({ ...formData, address: value })}
          placeholder="Enter complete address"
          rows={2}
        />
      </FormField>

      <FormField label="Medical History">
        <TextArea
          value={formData.medicalHistory}
          onChange={(value) => setFormData({ ...formData, medicalHistory: value })}
          placeholder="Any medical conditions or allergies"
          rows={2}
        />
      </FormField>

      <FormField label="Special Needs">
        <TextArea
          value={formData.specialNeeds}
          onChange={(value) => setFormData({ ...formData, specialNeeds: value })}
          placeholder="Special care requirements"
          rows={2}
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
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white shadow-lg hover:shadow-xl transition-all"
        >
          {isEdit ? 'Update Beneficiary' : 'Add Beneficiary'}
        </motion.button>
      </div>
    </form>
  );
}
