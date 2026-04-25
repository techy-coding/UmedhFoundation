import type { BeneficiaryFormData } from '../components/forms/AddBeneficiaryForm';
import { createRecord, deleteRecord, subscribeToCollection, updateRecord } from './firebaseCrud';

export interface Beneficiary {
  id: string;
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
  photo?: string;
}

export const fallbackBeneficiaries: Beneficiary[] = [];

function mapBeneficiaryFormData(data: BeneficiaryFormData, existingPhoto = '') {
  return {
    name: data.name,
    age: data.age,
    gender: data.gender,
    category: data.category,
    admissionDate: data.admissionDate,
    healthStatus: data.healthStatus,
    education: data.education,
    guardianName: data.guardianName,
    guardianContact: data.guardianContact,
    address: data.address,
    medicalHistory: data.medicalHistory,
    specialNeeds: data.specialNeeds,
    photo:
      typeof data.photo === 'string'
        ? data.photo
        : data.photo
          ? data.photo.name
          : existingPhoto,
  };
}

export function subscribeToBeneficiaries(
  callback: (items: Beneficiary[]) => void,
  onError?: (error: Error) => void
) {
  return subscribeToCollection(
    'beneficiaries',
    callback,
    fallbackBeneficiaries,
    (items) => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    onError
  );
}

export async function createBeneficiary(data: BeneficiaryFormData) {
  await createRecord('beneficiaries', mapBeneficiaryFormData(data));
}

export async function updateBeneficiary(id: string, data: BeneficiaryFormData, existingPhoto = '') {
  await updateRecord('beneficiaries', id, mapBeneficiaryFormData(data, existingPhoto));
}

export async function deleteBeneficiary(id: string) {
  await deleteRecord('beneficiaries', id);
}
