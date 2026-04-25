import { useState } from 'react';
import { toast } from 'sonner';
import { FormField, TextInput, TextArea, Select } from './FormField';
import { motion } from 'motion/react';
import { saveToFolder } from '../../utils/fileHandler';

interface AddEventFormProps {
  onSubmit: (data: EventFormData) => void;
  onCancel: () => void;
  initialData?: Partial<EventFormData>;
  isEdit?: boolean;
}

export interface EventFormData {
  title: string;
  description: string;
  eventType: string;
  date: string;
  time: string;
  duration: string;
  location: string;
  volunteersNeeded: string;
  skillsRequired: string;
  contactPerson: string;
  contactEmail: string;
  contactPhone: string;
  image: File | string | null;
}

export function AddEventForm({ onSubmit, onCancel, initialData, isEdit }: AddEventFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
    title: initialData?.title || '',
    description: initialData?.description || '',
    eventType: initialData?.eventType || '',
    date: initialData?.date || '',
    time: initialData?.time || '',
    duration: initialData?.duration || '',
    location: initialData?.location || '',
    volunteersNeeded: initialData?.volunteersNeeded || '',
    skillsRequired: initialData?.skillsRequired || '',
    contactPerson: initialData?.contactPerson || '',
    contactEmail: initialData?.contactEmail || '',
    contactPhone: initialData?.contactPhone || '',
    image: initialData?.image || null,
  });

  const [errors, setErrors] = useState<Partial<Record<keyof EventFormData, string>>>({});

  const validate = () => {
    const newErrors: Partial<Record<keyof EventFormData, string>> = {};

    if (!formData.title.trim()) newErrors.title = 'Event title is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.eventType) newErrors.eventType = 'Event type is required';
    if (!formData.date) newErrors.date = 'Event date is required';
    if (!formData.time) newErrors.time = 'Event time is required';
    if (!formData.location.trim()) newErrors.location = 'Location is required';
    if (formData.contactEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.contactEmail)) {
      newErrors.contactEmail = 'Invalid email address';
    }
    if (formData.contactPhone && !/^\d{10}$/.test(formData.contactPhone)) {
      newErrors.contactPhone = 'Invalid phone number (10 digits required)';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSubmit(formData);
      toast.success(isEdit ? 'Event updated successfully!' : 'Event created successfully!');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Event Title" required error={errors.title}>
        <TextInput
          value={formData.title}
          onChange={(value) => setFormData({ ...formData, title: value })}
          placeholder="E.g., Community Food Distribution Drive"
        />
      </FormField>

      <FormField label="Description" required error={errors.description}>
        <TextArea
          value={formData.description}
          onChange={(value) => setFormData({ ...formData, description: value })}
          placeholder="Describe the event, its purpose, and what volunteers will do..."
          rows={4}
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <FormField label="Event Type" required error={errors.eventType}>
          <Select
            value={formData.eventType}
            onChange={(value) => setFormData({ ...formData, eventType: value })}
            options={[
              { value: 'volunteering', label: 'Volunteering Activity' },
              { value: 'fundraiser', label: 'Fundraiser' },
              { value: 'awareness', label: 'Awareness Campaign' },
              { value: 'training', label: 'Training Workshop' },
              { value: 'celebration', label: 'Celebration Event' },
              { value: 'distribution', label: 'Distribution Drive' },
            ]}
            placeholder="Select event type"
          />
        </FormField>

        <FormField label="Date" required error={errors.date}>
          <TextInput
            value={formData.date}
            onChange={(value) => setFormData({ ...formData, date: value })}
            type="date"
          />
        </FormField>

        <FormField label="Time" required error={errors.time}>
          <TextInput
            value={formData.time}
            onChange={(value) => setFormData({ ...formData, time: value })}
            type="time"
          />
        </FormField>

        <FormField label="Duration" helperText="E.g., 2 hours, 4 hours">
          <TextInput
            value={formData.duration}
            onChange={(value) => setFormData({ ...formData, duration: value })}
            placeholder="3 hours"
          />
        </FormField>

        <FormField label="Volunteers Needed" helperText="Number of volunteers required">
          <TextInput
            value={formData.volunteersNeeded}
            onChange={(value) => setFormData({ ...formData, volunteersNeeded: value })}
            placeholder="10"
            type="number"
          />
        </FormField>
      </div>

      <FormField label="Location" required error={errors.location}>
        <TextInput
          value={formData.location}
          onChange={(value) => setFormData({ ...formData, location: value })}
          placeholder="Full address of the event"
        />
      </FormField>

      <FormField label="Skills Required" helperText="Any specific skills volunteers should have">
        <TextInput
          value={formData.skillsRequired}
          onChange={(value) => setFormData({ ...formData, skillsRequired: value })}
          placeholder="E.g., First Aid, Cooking, Teaching"
        />
      </FormField>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <FormField label="Contact Person">
          <TextInput
            value={formData.contactPerson}
            onChange={(value) => setFormData({ ...formData, contactPerson: value })}
            placeholder="Name"
          />
        </FormField>

        <FormField label="Contact Email" error={errors.contactEmail}>
          <TextInput
            value={formData.contactEmail}
            onChange={(value) => setFormData({ ...formData, contactEmail: value })}
            placeholder="email@example.com"
            type="email"
          />
        </FormField>

        <FormField label="Contact Phone" error={errors.contactPhone}>
          <TextInput
            value={formData.contactPhone}
            onChange={(value) => setFormData({ ...formData, contactPhone: value })}
            placeholder="10-digit number"
            type="tel"
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
          {isEdit ? 'Update Event' : 'Create Event'}
        </motion.button>
      </div>
    </form>
  );
}
