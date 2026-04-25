import { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { Plus, Calendar, Target, TrendingUp, Users, X } from 'lucide-react';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';
import { isFirebaseConfigured } from '../../lib/firebase';
import { useRole } from '../../context/RoleContext';
import {
  createCampaign,
  fallbackCampaigns,
  subscribeToCampaigns,
  type CampaignInput,
  type CampaignRecord,
} from '../../services/campaigns';

export function CampaignPage() {
  const navigate = useNavigate();
  const { role } = useRole();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<CampaignRecord | null>(null);
  const [campaigns, setCampaigns] = useState<CampaignRecord[]>(fallbackCampaigns);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [formData, setFormData] = useState<CampaignInput>({
    title: '',
    description: '',
    goal: '',
    deadline: '',
    category: '',
    image: '',
  });

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
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

  const stats = useMemo(() => {
    const totalRaised = campaigns.reduce((sum, campaign) => sum + campaign.raised, 0);
    const totalSupporters = campaigns.reduce((sum, campaign) => sum + campaign.supporters, 0);
    const activeCampaigns = campaigns.filter((campaign) => campaign.status === 'active').length;

    return [
      { label: 'Total Campaigns', value: campaigns.length.toString(), icon: Target },
      { label: 'Active Campaigns', value: activeCampaigns.toString(), icon: TrendingUp },
      { label: 'Funds Raised', value: `₹${totalRaised.toLocaleString()}`, icon: Calendar },
      { label: 'Total Supporters', value: totalSupporters.toLocaleString(), icon: Users },
    ];
  }, [campaigns]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      if (!isFirebaseConfigured) {
        toast.error('Firebase is not configured yet.');
        return;
      }

      await createCampaign(formData);
      toast.success('Campaign created successfully!');
      setShowCreateForm(false);
      setFormData({ title: '', description: '', goal: '', deadline: '', category: '', image: '' });
    } catch (error) {
      console.error('Failed to create campaign:', error);
      toast.error('Could not create campaign.');
    }
  };

  const handleViewDetails = (campaign: CampaignRecord) => {
    if (role === 'admin' || role === 'staff') {
      setSelectedCampaign(campaign);
      return;
    }

    navigate(`/dashboard/donate?campaign=${campaign.id}`);
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-heading font-bold mb-2">Campaigns</h1>
          <p className="text-muted-foreground">Create and manage fundraising campaigns</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-6 py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg flex items-center gap-2"
        >
          {showCreateForm ? <X className="w-5 h-5" /> : <Plus className="w-5 h-5" />}
          {showCreateForm ? 'Cancel' : 'Create Campaign'}
        </motion.button>
      </div>

      {showCreateForm && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl p-8 border border-border"
        >
          <h2 className="text-2xl font-heading font-bold mb-6">Create New Campaign</h2>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Campaign Title</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="Enter campaign title"
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  required
                  rows={4}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none"
                  placeholder="Describe your campaign and its impact..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Goal Amount (₹)</label>
                <input
                  type="number"
                  value={formData.goal}
                  onChange={(e) => setFormData({ ...formData, goal: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="500000"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Deadline</label>
                <input
                  type="date"
                  value={formData.deadline}
                  onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Category</label>
                <select
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                >
                  <option value="">Select category</option>
                  <option value="Food & Nutrition">Food & Nutrition</option>
                  <option value="Education">Education</option>
                  <option value="Healthcare">Healthcare</option>
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Basic Needs">Basic Needs</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Image URL</label>
                <input
                  type="url"
                  value={formData.image}
                  onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  placeholder="https://..."
                />
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white rounded-xl font-medium shadow-lg"
            >
              Create Campaign
            </motion.button>
          </form>
        </motion.div>
      )}

      <div className="grid lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-card rounded-2xl p-6 border border-border"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] flex items-center justify-center">
                  <Icon className="w-6 h-6 text-white" />
                </div>
              </div>
              <p className="text-muted-foreground text-sm mb-1">{stat.label}</p>
              <p className="text-3xl font-bold">{stat.value}</p>
            </motion.div>
          );
        })}
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-heading font-bold">All Campaigns</h2>

        {isLoading && (
          <div className="rounded-2xl border border-border bg-card px-6 py-8 text-muted-foreground">
            Loading campaigns from Firebase...
          </div>
        )}

        {!isLoading && campaigns.length === 0 && (
          <div className="rounded-2xl border border-border bg-card px-6 py-12 text-center">
            <p className="text-lg font-medium">No campaigns available yet.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Create your first campaign to start collecting support.
            </p>
          </div>
        )}

        <div className="grid md:grid-cols-2 gap-6">
          {campaigns.map((campaign, i) => {
            const progress = campaign.goal > 0 ? (campaign.raised / campaign.goal) * 100 : 0;
            const image = campaign.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop';

            return (
              <motion.div
                key={campaign.id}
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}
                className="bg-card rounded-2xl overflow-hidden border border-border shadow-lg"
              >
                <div className="relative h-48">
                  <img
                    src={image}
                    alt={campaign.title}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=400&h=300&fit=crop';
                    }}
                  />
                  <div className="absolute top-4 right-4 px-3 py-1 bg-white/90 dark:bg-black/90 backdrop-blur-sm rounded-full text-sm font-medium">
                    {campaign.status === 'completed' ? (
                      <span className="text-green-500">✓ Completed</span>
                    ) : (
                      <span>{campaign.deadline || 'Open'}</span>
                    )}
                  </div>
                  <div className="absolute top-4 left-4 px-3 py-1 bg-secondary/90 backdrop-blur-sm rounded-full text-xs text-white">
                    {campaign.category}
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-heading font-semibold mb-2">{campaign.title}</h3>
                  <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{campaign.description}</p>

                  <div className="mb-4">
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-muted-foreground">Progress</span>
                      <span className="font-medium">
                        ₹{(campaign.raised / 1000).toFixed(0)}K / ₹{(campaign.goal / 1000).toFixed(0)}K
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(progress, 100)}%` }}
                        transition={{ duration: 1, delay: 0.5 }}
                        className={`h-full ${
                          campaign.status === 'completed'
                            ? 'bg-green-500'
                            : 'bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]'
                        }`}
                      ></motion.div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">{Math.round(progress)}% funded</p>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Users className="w-4 h-4" />
                      {campaign.supporters} supporters
                    </div>
                    <button
                      onClick={() => handleViewDetails(campaign)}
                      className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors text-sm"
                    >
                      View Details
                    </button>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>

      {selectedCampaign && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4"
          onClick={() => setSelectedCampaign(null)}
        >
          <motion.div
            initial={{ y: 24, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="w-full max-w-3xl overflow-hidden rounded-3xl border border-border bg-card shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="relative h-72">
              <img
                src={selectedCampaign.image || 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=500&fit=crop'}
                alt={selectedCampaign.title}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = 'https://images.unsplash.com/photo-1488521787991-ed7bbaae773c?w=800&h=500&fit=crop';
                }}
              />
              <button
                onClick={() => setSelectedCampaign(null)}
                className="absolute right-4 top-4 rounded-full bg-black/70 p-2 text-white transition hover:bg-black/90"
              >
                <X className="h-5 w-5" />
              </button>
              <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/90 to-transparent p-6 text-white">
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  <span className="rounded-full bg-secondary px-3 py-1 text-white">{selectedCampaign.category}</span>
                  <span className="rounded-full bg-white/15 px-3 py-1">
                    {selectedCampaign.status === 'completed' ? 'Completed' : selectedCampaign.status}
                  </span>
                </div>
                <h3 className="text-3xl font-heading font-bold">{selectedCampaign.title}</h3>
              </div>
            </div>

            <div className="space-y-6 p-6">
              <p className="text-muted-foreground">{selectedCampaign.description}</p>

              <div className="grid gap-4 md:grid-cols-4">
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Raised</p>
                  <p className="mt-1 text-xl font-semibold">₹{selectedCampaign.raised.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Goal</p>
                  <p className="mt-1 text-xl font-semibold">₹{selectedCampaign.goal.toLocaleString()}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Supporters</p>
                  <p className="mt-1 text-xl font-semibold">{selectedCampaign.supporters}</p>
                </div>
                <div className="rounded-2xl bg-muted/40 p-4">
                  <p className="text-sm text-muted-foreground">Deadline</p>
                  <p className="mt-1 text-xl font-semibold">{selectedCampaign.deadline || 'Open'}</p>
                </div>
              </div>

              <div>
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Funding progress</span>
                  <span className="font-medium">
                    {Math.round(selectedCampaign.goal > 0 ? (selectedCampaign.raised / selectedCampaign.goal) * 100 : 0)}%
                  </span>
                </div>
                <div className="h-3 overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7]"
                    style={{
                      width: `${Math.min(
                        selectedCampaign.goal > 0 ? (selectedCampaign.raised / selectedCampaign.goal) * 100 : 0,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <div className="flex flex-wrap justify-end gap-3">
                <button
                  onClick={() => setSelectedCampaign(null)}
                  className="rounded-xl border border-border px-4 py-2 text-sm font-medium transition hover:bg-muted/50"
                >
                  Close
                </button>
                {role === 'admin' || role === 'staff' ? (
                  <button
                    onClick={() => {
                      setSelectedCampaign(null);
                      navigate('/dashboard/campaigns-manage');
                    }}
                    className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] px-4 py-2 text-sm font-medium text-white"
                  >
                    Manage Campaigns
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setSelectedCampaign(null);
                      navigate(`/dashboard/donate?campaign=${selectedCampaign.id}`);
                    }}
                    className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] px-4 py-2 text-sm font-medium text-white"
                  >
                    Donate to Campaign
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </div>
  );
}
