import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, Search, Filter, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  createBeneficiary,
  deleteBeneficiary,
  updateBeneficiary,
  fallbackBeneficiaries,
  subscribeToBeneficiaries,
  type Beneficiary,
} from '../../services/beneficiaries';
import type { BeneficiaryFormData } from '../forms/AddBeneficiaryForm';
import { Modal } from '../common/Modal';
import { AddBeneficiaryForm } from '../forms/AddBeneficiaryForm';
import { ConfirmDialog } from '../common/ConfirmDialog';

export function BeneficiariesPage() {
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>(fallbackBeneficiaries);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToBeneficiaries(
      (items) => {
        setBeneficiaries(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load beneficiaries from Firebase:', error);
        toast.error('Could not load beneficiaries from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);
  const [showViewModal, setShowViewModal] = useState(false);
  const [selectedBeneficiary, setSelectedBeneficiary] = useState<Beneficiary | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('all');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToBeneficiaries(
      (items) => {
        setBeneficiaries(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load beneficiaries from Firebase:', error);
        toast.error('Could not load beneficiaries from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleAdd = async (data: BeneficiaryFormData) => {
    try {
      if (!isFirebaseConfigured) {
        const newBeneficiary: Beneficiary = {
          id: Date.now().toString(),
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
        };
        setBeneficiaries((current) => [...current, newBeneficiary]);
      } else {
        await createBeneficiary(data);
      }

      setShowAddModal(false);
    } catch (error) {
      console.error('Failed to add beneficiary:', error);
      toast.error('Could not save beneficiary.');
    }
  };

  const handleEdit = async (data: BeneficiaryFormData) => {
    if (selectedBeneficiary) {
      try {
        if (!isFirebaseConfigured) {
          setBeneficiaries((current) =>
            current.map((b) =>
              b.id === selectedBeneficiary.id
                ? {
                    ...b,
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
                  }
                : b
            )
          );
        } else {
          await updateBeneficiary(selectedBeneficiary.id, data, selectedBeneficiary.photo || '');
        }

        setShowEditModal(false);
        setSelectedBeneficiary(null);
      } catch (error) {
        console.error('Failed to update beneficiary:', error);
        toast.error('Could not update beneficiary.');
      }
    }
  };

  const handleDelete = async () => {
    if (selectedBeneficiary) {
      try {
        if (!isFirebaseConfigured) {
          setBeneficiaries((current) => current.filter((b) => b.id !== selectedBeneficiary.id));
        } else {
          await deleteBeneficiary(selectedBeneficiary.id);
        }

        toast.success('Beneficiary removed successfully');
        setSelectedBeneficiary(null);
        setShowDeleteDialog(false);
      } catch (error) {
        console.error('Failed to delete beneficiary:', error);
        toast.error('Could not delete beneficiary.');
      }
    }
  };

  const openEditModal = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowEditModal(true);
  };

  const openDeleteDialog = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowDeleteDialog(true);
  };

  const openViewModal = (beneficiary: Beneficiary) => {
    setSelectedBeneficiary(beneficiary);
    setShowViewModal(true);
  };

  const filteredBeneficiaries = beneficiaries.filter((b) => {
    const matchesSearch = b.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterCategory === 'all' || b.category === filterCategory;
    return matchesSearch && matchesFilter;
  });

  const categoryLabels: Record<string, string> = {
    orphan: 'Orphan Child',
    elderly: 'Elderly',
    disabled: 'Differently Abled',
  };

  const healthStatusColors: Record<string, string> = {
    good: 'bg-green-500/10 text-green-600',
    fair: 'bg-yellow-500/10 text-yellow-600',
    'needs-attention': 'bg-orange-500/10 text-orange-600',
    critical: 'bg-red-500/10 text-red-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Beneficiary Management</h1>
          <p className="text-muted-foreground mt-1">Manage children and elderly under care</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Beneficiary
        </motion.button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="pl-11 pr-8 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Categories</option>
              <option value="orphan">Orphan Children</option>
              <option value="elderly">Elderly</option>
              <option value="disabled">Differently Abled</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && (
            <div className="mb-4 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Loading beneficiaries from Firebase...
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-4 px-4">Name</th>
                <th className="text-left py-4 px-4">Age</th>
                <th className="text-left py-4 px-4">Category</th>
                <th className="text-left py-4 px-4">Admission Date</th>
                <th className="text-left py-4 px-4">Health Status</th>
                <th className="text-right py-4 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBeneficiaries.map((beneficiary) => (
                <tr key={beneficiary.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center text-white font-semibold">
                        {beneficiary.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{beneficiary.name}</p>
                        <p className="text-xs text-muted-foreground capitalize">{beneficiary.gender}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">{beneficiary.age} years</td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-sm">
                      {categoryLabels[beneficiary.category]}
                    </span>
                  </td>
                  <td className="py-4 px-4">{new Date(beneficiary.admissionDate).toLocaleDateString()}</td>
                  <td className="py-4 px-4">
                    <span className={`px-3 py-1 rounded-full text-sm capitalize ${healthStatusColors[beneficiary.healthStatus]}`}>
                      {beneficiary.healthStatus.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex items-center justify-end gap-2">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openViewModal(beneficiary)}
                        className="w-9 h-9 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openEditModal(beneficiary)}
                        className="w-9 h-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => openDeleteDialog(beneficiary)}
                        className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredBeneficiaries.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No beneficiaries found</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Add New Beneficiary" size="md">
        <AddBeneficiaryForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Beneficiary" size="md">
        {selectedBeneficiary && (
          <AddBeneficiaryForm
            onSubmit={handleEdit}
            onCancel={() => setShowEditModal(false)}
            initialData={selectedBeneficiary}
            isEdit
          />
        )}
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Beneficiary Details" size="md">
        {selectedBeneficiary && (
          <div className="space-y-4">
            <div className="flex items-center gap-4 pb-4 border-b border-border">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center text-white text-2xl font-bold">
                {selectedBeneficiary.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <h3 className="text-xl font-semibold">{selectedBeneficiary.name}</h3>
                <p className="text-muted-foreground">{categoryLabels[selectedBeneficiary.category]}</p>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Age</p>
                <p className="font-medium">{selectedBeneficiary.age} years</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Gender</p>
                <p className="font-medium capitalize">{selectedBeneficiary.gender}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Admission Date</p>
                <p className="font-medium">{new Date(selectedBeneficiary.admissionDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Health Status</p>
                <p className={`font-medium capitalize ${healthStatusColors[selectedBeneficiary.healthStatus]}`}>
                  {selectedBeneficiary.healthStatus.replace('-', ' ')}
                </p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Beneficiary"
        message={`Are you sure you want to remove ${selectedBeneficiary?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
