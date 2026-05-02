import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Search, Edit, Trash2, Heart, X } from 'lucide-react';
import { toast } from 'sonner';
import { AddBeneficiaryForm, type BeneficiaryFormData } from '../forms/AddBeneficiaryForm';
import {
  createBeneficiary,
  deleteBeneficiary,
  subscribeToBeneficiaries,
  type Beneficiary,
} from '../../services/beneficiaries';

export function BeneficiaryManagement() {
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<'all' | 'orphan' | 'elderly' | 'disabled'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [beneficiaries, setBeneficiaries] = useState<Beneficiary[]>([]);

  useEffect(() => {
    return subscribeToBeneficiaries(setBeneficiaries, (error) => {
      console.error('Failed to load beneficiaries:', error);
      toast.error('Could not load beneficiaries from Firebase.');
    });
  }, []);

  const filteredBeneficiaries = useMemo(
    () =>
      beneficiaries.filter((beneficiary) => {
        const matchesCategory = selectedCategory === 'all' || beneficiary.category === selectedCategory;
        const haystack = `${beneficiary.name} ${beneficiary.address} ${beneficiary.guardianName}`.toLowerCase();
        const matchesSearch = haystack.includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
      }),
    [beneficiaries, searchQuery, selectedCategory]
  );

  const handleCreate = async (data: BeneficiaryFormData) => {
    try {
      await createBeneficiary(data);
      setShowAddForm(false);
    } catch (error) {
      console.error('Failed to create beneficiary:', error);
      toast.error('Could not add beneficiary.');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteBeneficiary(id);
      toast.success('Beneficiary removed');
    } catch (error) {
      console.error('Failed to delete beneficiary:', error);
      toast.error('Could not remove beneficiary.');
    }
  };

  const stats = [
    { label: 'Total Beneficiaries', value: beneficiaries.length, color: 'from-[#FF6B35] to-[#FF8B35]' },
    { label: 'Children', value: beneficiaries.filter((item) => item.category === 'orphan').length, color: 'from-[#6C5CE7] to-[#8C7CE7]' },
    { label: 'Elderly', value: beneficiaries.filter((item) => item.category === 'elderly').length, color: 'from-[#FFD93D] to-[#FFE93D]' },
    { label: 'Special Care', value: beneficiaries.filter((item) => item.category === 'disabled').length, color: 'from-[#4ECDC4] to-[#6EDDC4]' },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Beneficiary Management</h1>
          <p className="text-muted-foreground">Manage live beneficiary records from Firebase</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg flex items-center gap-2"
        >
          {showAddForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showAddForm ? 'Cancel' : 'Add Beneficiary'}
        </motion.button>
      </div>

      {showAddForm && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-card rounded-2xl p-8 border border-border">
          <h2 className="text-2xl font-heading font-bold mb-6">Add New Beneficiary</h2>
          <AddBeneficiaryForm onSubmit={handleCreate} onCancel={() => setShowAddForm(false)} />
        </motion.div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <motion.div key={`${stat.label}-${stat.value}`} initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-card rounded-2xl p-6 border border-border">
            <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center mb-4`}>
              <Heart className="w-6 h-6 text-white" />
            </div>
            <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
            <p key={stat.value} className="text-3xl font-bold">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by name, address, or guardian..."
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'orphan', 'elderly', 'disabled'] as const).map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl font-medium capitalize transition-all ${
                selectedCategory === cat ? 'bg-primary text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {filteredBeneficiaries.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
          <p className="text-lg font-medium">No beneficiaries found.</p>
          <p className="mt-2 text-sm text-muted-foreground">Create beneficiary records and they will appear here automatically.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBeneficiaries.map((person, i) => (
            <motion.div
              key={person.id}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.05 }}
              whileHover={{ y: -4, boxShadow: '0 12px 24px rgba(0,0,0,0.1)' }}
              className="bg-card rounded-2xl overflow-hidden border border-border"
            >
              <div className="relative">
                <img
                  src={person.photo || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop'}
                  alt={person.name}
                  className="w-full h-48 object-cover"
                />
              </div>

              <div className="p-6">
                <h3 className="text-xl font-heading font-bold mb-2">{person.name}</h3>
                <div className="space-y-2 mb-4 text-sm text-muted-foreground">
                  <p>{person.age} years</p>
                  <p>Category: {person.category}</p>
                  <p>Health: {person.healthStatus || 'Not specified'}</p>
                  {person.education && <p>Education: {person.education}</p>}
                  {person.guardianName && <p>Guardian: {person.guardianName}</p>}
                  {person.address && <p>Address: {person.address}</p>}
                </div>

                {person.specialNeeds && (
                  <div className="bg-muted/30 rounded-xl p-3 mb-4">
                    <p className="text-sm text-muted-foreground mb-1">Special Needs</p>
                    <p className="text-sm">{person.specialNeeds}</p>
                  </div>
                )}

                <div className="flex gap-2">
                  <button className="flex-1 px-4 py-2 bg-muted text-muted-foreground rounded-lg flex items-center justify-center gap-2 cursor-default">
                    <Edit className="w-4 h-4" />
                    View
                  </button>
                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleDelete(person.id)}
                    className="px-4 py-2 border border-red-500 text-red-500 rounded-lg hover:bg-red-500/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
