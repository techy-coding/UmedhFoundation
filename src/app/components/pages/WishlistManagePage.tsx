import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AddNeedForm, NeedFormData } from '../forms/AddNeedForm';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, AlertCircle, CheckCircle, Search, Eye } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  createNeed,
  deleteNeed,
  fallbackNeeds,
  getDonorEntries,
  subscribeToNeeds,
  updateNeed,
  type NeedRecord as Need,
} from '../../services/wishlist';

export function WishlistManagePage() {
  const [needs, setNeeds] = useState<Need[]>(fallbackNeeds);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  const [showModal, setShowModal] = useState(false);
  const [editingNeed, setEditingNeed] = useState<Need | null>(null);
  const [needToDelete, setNeedToDelete] = useState<Need | null>(null);
  const [viewDetailsNeed, setViewDetailsNeed] = useState<Need | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToNeeds(
      (items) => {
        setNeeds(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load wishlist needs from Firebase:', error);
        toast.error('Could not load wishlist needs from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleSubmit = async (data: NeedFormData) => {
    try {
      if (editingNeed) {
        if (!isFirebaseConfigured) {
          setNeeds((current) =>
            current.map((n) =>
              n.id === editingNeed.id ? { ...n, ...data } : n
            )
          );
        } else {
          // Preserve existing donors when staff/admin edits the need.
          await updateNeed(
            editingNeed.id,
            data,
            editingNeed.fulfilledQuantity,
            editingNeed.status,
            getDonorEntries(editingNeed)
          );
        }
        toast.success('Need updated successfully');
      } else {
        if (!isFirebaseConfigured) {
          const newNeed: Need = {
            id: Date.now().toString(),
            ...data,
            status: 'pending',
            fulfilledQuantity: 0,
          };
          setNeeds((current) => [...current, newNeed]);
        } else {
          await createNeed(data);
        }
        toast.success('Need added successfully');
      }

      setShowModal(false);
      setEditingNeed(null);
    } catch (error) {
      console.error('Failed to save wishlist need:', error);
      toast.error('Could not save need.');
    }
  };

  const handleDelete = async () => {
    if (needToDelete) {
      try {
        if (!isFirebaseConfigured) {
          setNeeds((current) => current.filter((n) => n.id !== needToDelete.id));
        } else {
          await deleteNeed(needToDelete.id);
        }

        toast.success('Need deleted successfully');
        setNeedToDelete(null);
      } catch (error) {
        console.error('Failed to delete need:', error);
        toast.error('Could not delete need.');
      }
    }
  };

  const priorityColors: Record<string, string> = {
    urgent: 'bg-red-500/10 text-red-600 border-red-500/20',
    high: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    medium: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
    low: 'bg-green-500/10 text-green-600 border-green-500/20',
  };

  const filteredNeeds = needs.filter(
    (n) =>
      (n.item && n.item.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (n.category && n.category.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Sort needs by category - Education first, then others
  const sortedNeeds = [...filteredNeeds].sort((a, b) => {
    const aCat = a.category || '';
    const bCat = b.category || '';
    if (aCat === 'education' && bCat !== 'education') return -1;
    if (aCat !== 'education' && bCat === 'education') return 1;
    return aCat.localeCompare(bCat);
  });

  // Group needs by category
  const educationNeeds = sortedNeeds.filter((n) => n.category === 'education');
  const otherNeeds = sortedNeeds.filter((n) => n.category && n.category !== 'education');

  const categoryLabels: Record<string, string> = {
    food: 'Food & Groceries',
    clothing: 'Clothing',
    education: 'Education Supplies',
    medical: 'Medical Supplies',
    shelter: 'Shelter & Bedding',
    hygiene: 'Hygiene Products',
    other: 'Other',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Wishlist Management</h1>
          <p className="text-muted-foreground mt-1">Manage items needed for beneficiaries</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingNeed(null);
            setShowModal(true);
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FFD93D] to-[#FFE93D] text-black shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Need
        </motion.button>
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search needs by item or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      {isLoading && (
        <div className="rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Loading wishlist needs from Firebase...
        </div>
      )}

      {/* Education Category */}
      {educationNeeds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
              <span className="text-2xl">📚</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Education Supplies</h2>
              <p className="text-sm text-muted-foreground">{educationNeeds.length} items needed</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {educationNeeds.map((need) => {
              const progress = (need.fulfilledQuantity / parseInt(need.quantity)) * 100;
              return (
                <div key={need.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{need.item}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityColors[need.priority]}`}>
                          {need.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-600 text-xs">
                          {categoryLabels[need.category]}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setViewDetailsNeed(need)}
                        className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingNeed(need);
                          setShowModal(true);
                        }}
                        className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNeedToDelete(need)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">
                        {need.fulfilledQuantity}/{need.quantity}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FFD93D] to-[#FFE93D]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Due: {new Date(need.requiredBy).toLocaleDateString()}</span>
                      {need.status === 'fulfilled' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : need.status === 'partial' ? (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Other Categories */}
      {otherNeeds.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center">
              <span className="text-2xl">🎁</span>
            </div>
            <div>
              <h2 className="text-xl font-semibold">Other Necessities</h2>
              <p className="text-sm text-muted-foreground">{otherNeeds.length} items needed</p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {otherNeeds.map((need) => {
              const progress = (need.fulfilledQuantity / parseInt(need.quantity)) * 100;

              return (
                <div key={need.id} className="bg-card border border-border rounded-xl p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <h3 className="font-semibold mb-1">{need.item}</h3>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded-full text-xs border ${priorityColors[need.priority]}`}>
                          {need.priority}
                        </span>
                        <span className="px-2 py-0.5 rounded-full bg-secondary/10 text-secondary text-xs">
                          {categoryLabels[need.category]}
                        </span>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setViewDetailsNeed(need)}
                        className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center"
                      >
                        <Eye className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingNeed(need);
                          setShowModal(true);
                        }}
                        className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setNeedToDelete(need)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Quantity</span>
                      <span className="font-medium">
                        {need.fulfilledQuantity}/{need.quantity}
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-[#FFD93D] to-[#FFE93D]" style={{ width: `${progress}%` }} />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-muted-foreground">Due: {new Date(need.requiredBy).toLocaleDateString()}</span>
                      {need.status === 'fulfilled' ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : need.status === 'partial' ? (
                        <AlertCircle className="w-4 h-4 text-orange-600" />
                      ) : null}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingNeed ? 'Edit Need' : 'Add Need'} size="md">
        <AddNeedForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingNeed(null);
          }}
          initialData={editingNeed || undefined}
          isEdit={!!editingNeed}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!needToDelete}
        onClose={() => setNeedToDelete(null)}
        onConfirm={handleDelete}
        title="Delete Need"
        message={`Are you sure you want to delete "${needToDelete?.item}"?`}
        confirmText="Delete"
        variant="danger"
      />

      {/* View Details Modal */}
      <Modal 
        isOpen={!!viewDetailsNeed} 
        onClose={() => setViewDetailsNeed(null)} 
        title="Need Details" 
        size="lg"
      >
        {viewDetailsNeed && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-4">Need Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Item</label>
                    <p className="font-medium">{viewDetailsNeed.item}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Category</label>
                    <p className="font-medium capitalize">{viewDetailsNeed.category}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Priority</label>
                    <span className={`inline-block px-2 py-1 rounded-full text-xs border ${priorityColors[viewDetailsNeed.priority]}`}>
                      {viewDetailsNeed.priority}
                    </span>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Quantity</label>
                    <p className="font-medium">{viewDetailsNeed.fulfilledQuantity}/{viewDetailsNeed.quantity}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Progress</label>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div 
                        className="bg-blue-600 h-2 rounded-full" 
                        style={{ width: `${(viewDetailsNeed.fulfilledQuantity / parseInt(viewDetailsNeed.quantity)) * 100}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {Math.round((viewDetailsNeed.fulfilledQuantity / parseInt(viewDetailsNeed.quantity)) * 100)}% fulfilled
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Status</label>
                    <p className="font-medium capitalize">{viewDetailsNeed.status}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Required By</label>
                    <p className="font-medium">{new Date(viewDetailsNeed.requiredBy).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-4">Beneficiary Information</h3>
                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Beneficiary Name</label>
                    <p className="font-medium">{viewDetailsNeed.beneficiaryName}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Purpose</label>
                    <p className="font-medium">{viewDetailsNeed.purpose}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Estimated Cost</label>
                    <p className="font-medium">₹{viewDetailsNeed.estimatedCost}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Donor Information - show every donor who contributed */}
            {(viewDetailsNeed.status === 'fulfilled' || viewDetailsNeed.status === 'partial') && (() => {
              const donorEntries = getDonorEntries(viewDetailsNeed);

              if (donorEntries.length === 0) {
                return (
                  <div className="border-t pt-6">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <p className="text-yellow-800">
                        <strong>Note:</strong> Donor information is not available for this item. This might be because the donation was made anonymously or the donor details were not captured during checkout.
                      </p>
                    </div>
                  </div>
                );
              }

              const totalContributed = donorEntries.reduce(
                (sum, donor) => sum + Number(donor.quantity || 0),
                0
              );
              const totalAmount = donorEntries.reduce(
                (sum, donor) => sum + Number(donor.amount || 0),
                0
              );

              return (
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-semibold">
                      Donor Information
                      <span className="ml-2 text-sm font-normal text-muted-foreground">
                        ({donorEntries.length} donor{donorEntries.length === 1 ? '' : 's'})
                      </span>
                    </h3>
                    {totalAmount > 0 && (
                      <div className="text-sm text-muted-foreground">
                        {totalContributed > 0 && (
                          <span className="mr-3">
                            <strong className="text-foreground">{totalContributed}</strong> item(s) contributed
                          </span>
                        )}
                        <span>
                          Total: <strong className="text-foreground">₹{totalAmount.toLocaleString()}</strong>
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-3">
                    {donorEntries.map((donor, index) => (
                      <div
                        key={`${donor.email || 'donor'}-${index}`}
                        className="rounded-xl border border-border bg-muted/30 p-4"
                      >
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Donor Name</label>
                            <p className="font-medium">{donor.name || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Email</label>
                            <p className="font-medium break-all">{donor.email || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-sm font-medium text-muted-foreground">Phone</label>
                            <p className="font-medium">{donor.phone || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-3 text-sm">
                          {donor.donationDate && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Donation Date</label>
                              <p className="font-medium">{new Date(donor.donationDate).toLocaleDateString()}</p>
                            </div>
                          )}
                          {donor.quantity !== undefined && donor.quantity > 0 && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Quantity</label>
                              <p className="font-medium">{donor.quantity} item(s)</p>
                            </div>
                          )}
                          {donor.amount !== undefined && donor.amount > 0 && (
                            <div>
                              <label className="text-xs font-medium text-muted-foreground">Amount</label>
                              <p className="font-medium">₹{Number(donor.amount).toLocaleString()}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </Modal>
    </div>
  );
}
