import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, FileUpload } from './FormField';
import { motion } from 'motion/react';
import { useRole } from '../../context/RoleContext';
import { saveToFolder } from '../../utils/fileHandler';

interface ProfileUpdateFormProps {
  onSubmit: (data: ProfileFormData) => void;
  onCancel: () => void;
}

export interface ProfileFormData {
  name: string;
  email: string;
  phone: string;
  bio: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  profilePicture: File | string | null;
}

export function ProfileUpdateForm({ onSubmit, onCancel }: ProfileUpdateFormProps) {
  const { userName, userEmail } = useRole();

  const [formData, setFormData] = useState<ProfileFormData>({
    name: userName,
    email: userEmail,
    phone: '',
    bio: '',
    address: '',
    city: '',
    state: '',
    pincode: '',
    profilePicture: null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof ProfileFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof ProfileFormData, string>> = {};

    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email address';
    }
    if (formData.phone && !/^\d{10}$/.test(formData.phone)) {
      newErrors.phone = 'Invalid phone number (10 digits required)';
    }
    if (formData.pincode && !/^\d{6}$/.test(formData.pincode)) {
      newErrors.pincode = 'Invalid pincode (6 digits required)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success('Profile updated successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Profile Picture" helperText="Upload a profile picture (JPG, PNG, max 5MB)">
        <FileUpload
          onChange={async (file) => {
            if (file) {
              try {
                const uploaded = await saveToFolder(file, 'profiles');
                setFormData({ ...formData, profilePicture: uploaded.savedPath });
                localStorage.setItem('userPicture', uploaded.savedPath);
                toast.success('Profile picture uploaded successfully');
              } catch (error) {
                toast.error('Failed to upload profile picture');
              }
            }
          }}
          accept="image/*"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Full Name" required error={errors.name}>
          <TextInput
            value={formData.name}
            onChange={(value) => setFormData({ ...formData, name: value })}
            placeholder="Enter your full name"
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

        <FormField label="Phone Number" error={errors.phone}>
          <TextInput
            value={formData.phone}
            onChange={(value) => setFormData({ ...formData, phone: value })}
            placeholder="10-digit mobile number"
            type="tel"
          />
        </FormField>
      </div>

      <FormField label="Bio" helperText="Tell us about yourself">
        <TextArea
          value={formData.bio}
          onChange={(value) => setFormData({ ...formData, bio: value })}
          placeholder="Write a short bio..."
          rows={4}
        />
      </FormField>

      <div className="border-t border-border pt-6">
        <h3 className="text-lg font-semibold mb-4">Address</h3>
        <div className="space-y-4">
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
              <TextInput
                value={formData.state}
                onChange={(value) => setFormData({ ...formData, state: value })}
                placeholder="State"
              />
            </FormField>

            <FormField label="Pincode" error={errors.pincode}>
              <TextInput
                value={formData.pincode}
                onChange={(value) => setFormData({ ...formData, pincode: value })}
                placeholder="6-digit pincode"
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
          className="flex-1 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white shadow-lg hover:shadow-xl transition-all"
        >
          Update Profile
        </motion.button>
      </div>
    </form>
  );
}
