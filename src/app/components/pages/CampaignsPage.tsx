import { useState, useEffect, useMemo } from 'react';
import { motion } from 'motion/react';
import { Plus, Trash2, TrendingUp, Target, Calendar, Search, Filter, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AddCampaignForm, type CampaignFormData } from '../forms/AddCampaignForm';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  createCampaign,
  deleteCampaign,
  fallbackCampaigns,
  subscribeToCampaigns,
  updateCampaign,
  type CampaignRecord,
} from '../../services/campaigns';

export function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(fallbackCampaigns);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const campaignStats = useMemo(
    () =>
      isLoading
        ? [
            {
              label: 'Active Campaigns',
              value: 'Loading...',
              icon: TrendingUp,
              iconClassName: 'text-green-600',
              iconBgClassName: 'bg-green-500/10',
            },
            {
              label: 'Total Raised',
              value: 'Loading...',
              icon: Target,
              iconClassName: 'text-blue-600',
              iconBgClassName: 'bg-blue-500/10',
            },
            {
              label: 'Completed',
              value: 'Loading...',
              icon: Calendar,
              iconClassName: 'text-purple-600',
              iconBgClassName: 'bg-purple-500/10',
            },
          ]
        : [
            {
              label: 'Active Campaigns',
              value: campaigns.filter((campaign) => campaign.status === 'active').length.toLocaleString(),
              icon: TrendingUp,
              iconClassName: 'text-green-600',
              iconBgClassName: 'bg-green-500/10',
            },
            {
              label: 'Total Raised',
              value: `₹${campaigns.reduce((sum, campaign) => sum + campaign.raised, 0).toLocaleString()}`,
              icon: Target,
              iconClassName: 'text-blue-600',
              iconBgClassName: 'bg-blue-500/10',
            },
            {
              label: 'Completed',
              value: campaigns.filter((campaign) => campaign.status === 'completed').length.toLocaleString(),
              icon: Calendar,
              iconClassName: 'text-purple-600',
              iconBgClassName: 'bg-purple-500/10',
            },
          ],
    [campaigns, isLoading]
  );

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToCampaigns(
      (items) => {
        setCampaigns(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load campaigns from Firebase:', error);
        toast.error('Could not load campaigns from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleAdd = async (data: CampaignFormData) => {
    try {
      if (!isFirebaseConfigured) {
        // Fallback mode - add to local state
        const newCampaign: CampaignRecord = {
          id: Date.now().toString(),
          title: data.title,
          description: data.description || '',
          category: data.category,
          goal: Number(data.targetAmount) || 0,
          raised: 0,
          supporters: 0,
          deadline: data.endDate,
          image: '',
          status: data.status as 'active' | 'completed' | 'draft',
          createdDate: new Date().toISOString().split('T')[0],
        };
        setCampaigns([...campaigns, newCampaign]);
      } else {
        await createCampaign({
          title: data.title,
          description: data.description || '',
          category: data.category,
          goal: data.targetAmount,
          deadline: data.endDate,
          image: typeof data.image === 'string' ? data.image : '',
        });
      }
      setShowAddModal(false);
      toast.success('Campaign created successfully');
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast.error('Could not create campaign.');
    }
  };

  const handleEdit = async (data: CampaignFormData) => {
    if (!selectedCampaign) return;
    
    try {
      if (!isFirebaseConfigured) {
        // Fallback mode - update local state
        setCampaigns(
          campaigns.map((c) =>
            c.id === selectedCampaign.id
              ? {
                  ...c,
                  title: data.title,
                  description: data.description || c.description,
                  category: data.category,
                  goal: Number(data.targetAmount) || c.goal,
                  deadline: data.endDate,
                  status: data.status as 'active' | 'completed' | 'draft',
                }
              : c
          )
        );
      } else {
        await updateCampaign(
          selectedCampaign.id,
          {
          title: data.title,
          description: data.description || '',
          category: data.category,
          goal: data.targetAmount,
          deadline: data.endDate,
          image: typeof data.image === 'string' ? data.image : selectedCampaign.image,
          },
          selectedCampaign
        );
      }
      setShowEditModal(false);
      setSelectedCampaign(null);
      toast.success('Campaign updated successfully');
    } catch (error) {
      console.error('Failed to update campaign:', error);
      toast.error('Could not update campaign.');
    }
  };

  const handleDelete = async () => {
    if (!selectedCampaign) return;
    
    try {
      if (!isFirebaseConfigured) {
        // Fallback mode - remove from local state
        setCampaigns(campaigns.filter((c) => c.id !== selectedCampaign.id));
      } else {
        await deleteCampaign(selectedCampaign.id);
      }
      toast.success('Campaign deleted successfully');
      setSelectedCampaign(null);
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Failed to delete campaign:', error);
      toast.error('Could not delete campaign.');
    }
  };

  const categoryLabels: Record<string, string> = {
    education: 'Education',
    food: 'Food & Nutrition',
    healthcare: 'Healthcare',
    shelter: 'Shelter',
    clothing: 'Clothing',
    emergency: 'Emergency Relief',
    'Food & Nutrition': 'Food & Nutrition',
    Education: 'Education',
    Healthcare: 'Healthcare',
    Infrastructure: 'Infrastructure',
    'Basic Needs': 'Basic Needs',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600',
    draft: 'bg-gray-500/10 text-gray-600',
    paused: 'bg-yellow-500/10 text-yellow-600',
    completed: 'bg-blue-500/10 text-blue-600',
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const categoryLabel = categoryLabels[c.category] || c.category || 'Uncategorized';
    const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         categoryLabel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterStatus === 'all' || c.status === filterStatus;
    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Campaign Management</h1>
          <p className="text-muted-foreground mt-1">Create and manage fundraising campaigns</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {campaignStats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div key={`${stat.label}-${stat.value}`} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className={`w-12 h-12 rounded-xl ${stat.iconBgClassName} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconClassName}`} />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p key={stat.value} className="text-2xl font-bold">{stat.value}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search campaigns by title or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-11 pr-8 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="draft">Draft</option>
            <option value="completed">Completed</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {isLoading && (
          <div className="text-center py-8">
            <p className="text-muted-foreground">Loading campaigns from Firebase...</p>
          </div>
        )}
        {filteredCampaigns.map((campaign) => {
          const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;
          return (
            <div key={campaign.id} className="bg-card border border-border rounded-2xl p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-xl font-semibold">{campaign.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColors[campaign.status]}`}>
                      {campaign.status}
                    </span>
                    <span className="px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs">
                      {categoryLabels[campaign.category] || campaign.category}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {campaign.supporters} supporters • Created: {new Date(campaign.createdDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowViewModal(true);
                    }}
                    className="w-10 h-10 rounded-lg bg-blue-500/10 text-blue-600 flex items-center justify-center hover:bg-blue-500/20 transition-colors"
                  >
                    <Eye className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowEditModal(true);
                    }}
                    className="w-10 h-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                  >
                    <Edit className="w-5 h-5" />
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSelectedCampaign(campaign);
                      setShowDeleteDialog(true);
                    }}
                    className="w-10 h-10 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center hover:bg-red-500/20 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </motion.button>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-semibold">{progress.toFixed(1)}%</span>
                </div>
                <div className="h-3 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min(progress, 100)}%` }}
                    transition={{ duration: 1, ease: 'easeOut' }}
                    className="h-full bg-gradient-to-r from-[#6C5CE7] to-[#8C7CE7]"
                  />
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="font-semibold">₹{campaign.raised.toLocaleString()}</span>
                  <span className="text-muted-foreground">of ₹{campaign.goal.toLocaleString()}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <Modal isOpen={showAddModal} onClose={() => setShowAddModal(false)} title="Create New Campaign" size="md">
        <AddCampaignForm onSubmit={handleAdd} onCancel={() => setShowAddModal(false)} />
      </Modal>

      <Modal isOpen={showEditModal} onClose={() => setShowEditModal(false)} title="Edit Campaign" size="md">
        {selectedCampaign && (
          <AddCampaignForm
            onSubmit={handleEdit}
            onCancel={() => setShowEditModal(false)}
            initialData={{
              title: selectedCampaign.title,
              description: selectedCampaign.description,
              category: selectedCampaign.category,
              targetAmount: selectedCampaign.goal.toString(),
              startDate: selectedCampaign.createdDate,
              endDate: selectedCampaign.deadline,
              image: selectedCampaign.image,
              status: selectedCampaign.status,
            }}
            isEdit
          />
        )}
      </Modal>

      <Modal isOpen={showViewModal} onClose={() => setShowViewModal(false)} title="Campaign Details" size="md">
        {selectedCampaign && (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold pb-4 border-b border-border">{selectedCampaign.title}</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{categoryLabels[selectedCampaign.category] || selectedCampaign.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Status</p>
                <p className={`font-medium capitalize ${statusColors[selectedCampaign.status]}`}>
                  {selectedCampaign.status}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Goal Amount</p>
                <p className="font-medium">₹{selectedCampaign.goal.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Raised Amount</p>
                <p className="font-medium">₹{selectedCampaign.raised.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created Date</p>
                <p className="font-medium">{new Date(selectedCampaign.createdDate).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Deadline</p>
                <p className="font-medium">{new Date(selectedCampaign.deadline).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Supporters</p>
                <p className="font-medium">{selectedCampaign.supporters} people</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      <ConfirmDialog
        isOpen={showDeleteDialog}
        onClose={() => setShowDeleteDialog(false)}
        onConfirm={handleDelete}
        title="Delete Campaign"
        message={`Are you sure you want to delete "${selectedCampaign?.title}"? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
