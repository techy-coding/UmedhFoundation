import { useState, useEffect } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { CreateSupportRequestForm, SupportRequestFormData } from '../forms/CreateSupportRequestForm';
import { motion } from 'motion/react';
import { Plus, Trash2, Clock, CheckCircle, XCircle, Search } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import { subscribeToCollection } from '../../services/firebaseCrud';

interface SupportRequest {
  id: string;
  requestType: string;
  title: string;
  description: string;
  priority: string;
  category: string;
  status: 'pending' | 'approved' | 'rejected' | 'fulfilled';
  submittedDate: string;
}

export function SupportRequestsPage() {
  const [requests, setRequests] = useState<SupportRequest[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [deleteRequest, setDeleteRequest] = useState<SupportRequest | null>(null);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setIsLoading(false);
      return;
    }

    const unsubscribe = subscribeToCollection(
      'supportRequests',
      (items: any[]) => {
        setRequests(items);
        setIsLoading(false);
      },
      (error: any) => {
        console.error('Failed to load support requests from Firebase:', error);
        toast.error('Could not load support requests from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleSubmit = (data: SupportRequestFormData) => {
    const newRequest: SupportRequest = {
      id: Date.now().toString(),
      ...data,
      status: 'pending',
      submittedDate: new Date().toISOString().split('T')[0],
    };
    setRequests([newRequest, ...requests]);
    setShowModal(false);
    toast.success('Support request submitted!');
  };

  const handleDelete = () => {
    if (deleteRequest) {
      setRequests(requests.filter((r) => r.id !== deleteRequest.id));
      toast.success('Request deleted');
      setDeleteRequest(null);
    }
  };

  const statusConfig: Record<string, { color: string; icon: any }> = {
    pending: { color: 'bg-yellow-500/10 text-yellow-600', icon: Clock },
    approved: { color: 'bg-green-500/10 text-green-600', icon: CheckCircle },
    rejected: { color: 'bg-red-500/10 text-red-600', icon: XCircle },
    fulfilled: { color: 'bg-blue-500/10 text-blue-600', icon: CheckCircle },
  };

  const priorityColors: Record<string, string> = {
    urgent: 'border-red-500 bg-red-500/5',
    high: 'border-orange-500 bg-orange-500/5',
    medium: 'border-yellow-500 bg-yellow-500/5',
    low: 'border-green-500 bg-green-500/5',
  };

  const filteredRequests = requests.filter((r) =>
    r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
    r.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Support Requests</h1>
          <p className="text-muted-foreground mt-1">Request and track support items</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#FF8B94] to-[#FFA894] text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          New Request
        </motion.button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {Object.entries(statusConfig).map(([status, config]) => (
          <div key={`${status}-${requests.filter((r) => r.status === status).length}`} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2 mb-1">
              <config.icon className="w-4 h-4 text-muted-foreground" />
              <p className="text-sm text-muted-foreground capitalize">{status}</p>
            </div>
            <p key={requests.filter((r) => r.status === status).length} className="text-2xl font-bold">{requests.filter((r) => r.status === status).length}</p>
          </div>
        ))}
      </div>

      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search requests by title, description, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-card border border-border focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredRequests.map((request) => {
          const StatusIcon = statusConfig[request.status].icon;
          return (
            <div
              key={request.id}
              className={`bg-card border-2 rounded-xl p-5 ${priorityColors[request.priority]}`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-semibold text-lg">{request.title}</h3>
                    <span className={`px-3 py-1 rounded-full text-xs flex items-center gap-1 ${statusConfig[request.status].color}`}>
                      <StatusIcon className="w-3 h-3" />
                      {request.status}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mb-3">{request.description}</p>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="px-2 py-1 rounded bg-secondary/10 text-secondary capitalize">
                      {request.category}
                    </span>
                    <span className="capitalize">{request.priority} priority</span>
                    <span>Submitted: {new Date(request.submittedDate).toLocaleDateString()}</span>
                  </div>
                </div>
                {request.status === 'pending' && (
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => setDeleteRequest(request)}
                    className="w-9 h-9 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center"
                  >
                    <Trash2 className="w-4 h-4" />
                  </motion.button>
                )}
              </div>
            </div>
          );
        })}

        {filteredRequests.length === 0 && (
          <div className="text-center py-12 bg-card border border-border rounded-xl">
            <p className="text-muted-foreground">No support requests yet</p>
          </div>
        )}
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Create Support Request" size="md">
        <CreateSupportRequestForm
          onSubmit={handleSubmit}
          onCancel={() => setShowModal(false)}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteRequest}
        onClose={() => setDeleteRequest(null)}
        onConfirm={handleDelete}
        title="Delete Request"
        message={`Are you sure you want to delete "${deleteRequest?.title}"?`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
