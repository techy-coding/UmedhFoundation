import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, Select } from './FormField';
import { motion } from 'motion/react';

interface AddUserFormProps {
  onSubmit: (data: UserFormData) => void;
  onCancel: () => void;
  initialData?: Partial<UserFormData>;
  isEdit?: boolean;
}

export interface UserFormData {
  name: string;
  email: string;
  phone: string;
  role: string;
  status: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
}

export function AddUserForm({ onSubmit, onCancel, initialData, isEdit }: AddUserFormProps) {
  const [formData, setFormData] = useState<UserFormData>({
    name: initialData?.name || '',
    email: initialData?.email || '',
    phone: initialData?.phone || '',
    role: initialData?.role || '',
    status: initialData?.status || 'active',
    address: initialData?.address || '',
    city: initialData?.city || '',
    state: initialData?.state || '',
    pincode: initialData?.pincode || '',
  });

  const [errors, setErrors] = useState<Partial<Record<keyof UserFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof UserFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (!formData.phone.trim()) {
      newErrors.phone = 'Phone number is required';
    } else if (!/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits required)';
    }
    if (!formData.role) newErrors.role = 'Role is required';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success(isEdit ? 'User updated successfully!' : 'User added successfully!');
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

        <FormField label="Email Address" required error={errors.email}>
          <TextInput
            value={formData.email}
            onChange={(value) => setFormData({ ...formData, email: value })}
            placeholder="email@example.com"
            type="email"
          />
        </FormField>

        <FormField label="Phone Number" required error={errors.phone}>
          <TextInput
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            placeholder="10-digit number"
            type="tel"
          />
        </FormField>

        <FormField label="Role" required error={errors.role}>
          <Select
            value={formData.role}
            onChange={(value) => setFormData({ ...formData, role: value })}
            options={[
              { value: 'donor', label: 'Donor' },
              { value: 'volunteer', label: 'Volunteer' },
              { value: 'staff', label: 'Staff' },
              { value: 'admin', label: 'Admin' },
              { value: 'beneficiary', label: 'Beneficiary' },
            ]}
            placeholder="Select role"
          />
        </FormField>

        <FormField label="Status" required>
          <Select
            value={formData.status}
            onChange={(value) => setFormData({ ...formData, status: value })}
            options={[
              { value: 'active', label: 'Active' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'pending', label: 'Pending Approval' },
            ]}
          />
        </FormField>
      </div>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Address Details</h3>
        <div className="grid grid-cols-1 gap-4">
          <FormField label="Street Address">
            <TextInput
              value={formData.address}
              onChange={(value) => setFormData({ ...formData, address: value })}
              placeholder="House no, street, locality"
            />
          </FormField>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <FormField label="City">
              <TextInput
                value={formData.city}
                onChange={(value) => setFormData({ ...formData, city: value })}
                placeholder="City name"
              />
            </FormField>

            <FormField label="State">
              <Select
                value={formData.state}
                onChange={(value) => setFormData({ ...formData, state: value })}
                options={[
                  { value: '', label: 'Select state' },
                  { value: 'maharashtra', label: 'Maharashtra' },
                  { value: 'karnataka', label: 'Karnataka' },
                  { value: 'delhi', label: 'Delhi' },
                  { value: 'gujarat', label: 'Gujarat' },
                  { value: 'rajasthan', label: 'Rajasthan' },
                  { value: 'tamil-nadu', label: 'Tamil Nadu' },
                ]}
              />
            </FormField>

            <FormField label="Pincode">
              <TextInput
                value={formData.pincode}
                onChange={(value) => setFormData({ ...formData, pincode: value })}
                placeholder="6-digit pincode"
                type="text"
              />
            </FormField>
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
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#4ECDC4] to-[#6EDDC4] text-white shadow-lg hover:shadow-xl transition-all"
        >
          {isEdit ? 'Update User' : 'Add User'}
        </motion.button>
      </div>
    </form>
  );
}
