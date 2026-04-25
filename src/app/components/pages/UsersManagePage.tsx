import { useEffect, useState } from 'react';
import { Modal } from '../common/Modal';
import { ConfirmDialog } from '../common/ConfirmDialog';
import { AddUserForm, UserFormData } from '../forms/AddUserForm';
import { motion } from 'motion/react';
import { Plus, Edit, Trash2, Search, Filter, Mail, Phone, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  createUser,
  deleteUser,
  fallbackUsers,
  subscribeToUsers,
  updateUser,
  updateUserStatus,
  type UserRecord as User,
} from '../../services/users';

export function UsersManagePage() {
  const [users, setUsers] = useState<User[]>(fallbackUsers);
  const [isLoading, setIsLoading] = useState(isFirebaseConfigured);

  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deleteUser, setDeleteUser] = useState<User | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterRole, setFilterRole] = useState('all');

  useEffect(() => {
    if (!isFirebaseConfigured) {
      return;
    }

    const unsubscribe = subscribeToUsers(
      (items) => {
        setUsers(items);
        setIsLoading(false);
      },
      (error) => {
        console.error('Failed to load users from Firebase:', error);
        toast.error('Could not load users from Firebase.');
        setIsLoading(false);
      }
    );

    return unsubscribe;
  }, []);

  const handleSubmit = async (data: UserFormData) => {
    try {
      if (editingUser) {
        if (!isFirebaseConfigured) {
          setUsers((current) =>
            current.map((u) =>
              u.id === editingUser.id ? { ...u, ...data } : u
            )
          );
        } else {
          await updateUser(editingUser.id, data, editingUser.joinedDate);
        }
        toast.success('User updated successfully');
      } else {
        if (!isFirebaseConfigured) {
          const newUser: User = {
            id: Date.now().toString(),
            ...data,
            joinedDate: new Date().toISOString().split('T')[0],
          };
          setUsers((current) => [...current, newUser]);
        } else {
          await createUser(data);
        }
        toast.success('User added successfully');
      }

      setShowModal(false);
      setEditingUser(null);
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error('Could not save user.');
    }
  };

  const handleDelete = async () => {
    if (deleteUser) {
      try {
        if (!isFirebaseConfigured) {
          setUsers((current) => current.filter((u) => u.id !== deleteUser.id));
        } else {
          await deleteUser(deleteUser.id);
        }

        toast.success('User deleted successfully');
        setDeleteUser(null);
      } catch (error) {
        console.error('Failed to delete user:', error);
        toast.error('Could not delete user.');
      }
    }
  };

  const handleApprove = async (userId: string) => {
    const user = users.find((item) => item.id === userId);

    if (!user) {
      return;
    }

    try {
      if (!isFirebaseConfigured) {
        setUsers((current) => current.map((u) => (u.id === userId ? { ...u, status: 'active' } : u)));
      } else {
        await updateUserStatus(user, 'active');
      }
      toast.success('User approved successfully');
    } catch (error) {
      console.error('Failed to approve user:', error);
      toast.error('Could not approve user.');
    }
  };

  const handleReject = async (userId: string) => {
    const user = users.find((item) => item.id === userId);

    if (!user) {
      return;
    }

    try {
      if (!isFirebaseConfigured) {
        setUsers((current) => current.map((u) => (u.id === userId ? { ...u, status: 'inactive' } : u)));
      } else {
        await updateUserStatus(user, 'inactive');
      }
      toast.success('User rejected');
    } catch (error) {
      console.error('Failed to reject user:', error);
      toast.error('Could not reject user.');
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch = u.name.toLowerCase().includes(searchQuery.toLowerCase()) || u.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesFilter = filterRole === 'all' || u.role === filterRole;
    return matchesSearch && matchesFilter;
  });

  const roleColors: Record<string, string> = {
    donor: 'from-[#FF6B35] to-[#FF8B35]',
    volunteer: 'from-[#6C5CE7] to-[#8C7CE7]',
    staff: 'from-[#FFD93D] to-[#FFE93D]',
    admin: 'from-[#4ECDC4] to-[#6EDDC4]',
    beneficiary: 'from-[#FF8B94] to-[#FFA894]',
  };

  const statusColors: Record<string, string> = {
    active: 'bg-green-500/10 text-green-600',
    inactive: 'bg-gray-500/10 text-gray-600',
    pending: 'bg-yellow-500/10 text-yellow-600',
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">Manage platform users and permissions</p>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => {
            setEditingUser(null);
            setShowModal(true);
          }}
          className="px-6 py-3 rounded-xl bg-gradient-to-r from-[#4ECDC4] to-[#6EDDC4] text-white shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add User
        </motion.button>
      </div>

      <div className="bg-card border border-border rounded-2xl p-6">
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="pl-11 pr-8 py-2.5 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all appearance-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="donor">Donors</option>
              <option value="volunteer">Volunteers</option>
              <option value="staff">Staff</option>
              <option value="admin">Admins</option>
              <option value="beneficiary">Beneficiaries</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          {isLoading && (
            <div className="mb-4 rounded-xl bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
              Loading users from Firebase...
            </div>
          )}
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4">User</th>
                <th className="text-left py-3 px-4">Contact</th>
                <th className="text-left py-3 px-4">Role</th>
                <th className="text-left py-3 px-4">Status</th>
                <th className="text-left py-3 px-4">Joined</th>
                <th className="text-right py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${roleColors[user.role]} flex items-center justify-center text-white font-semibold`}>
                        {user.name.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{user.name}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Mail className="w-3 h-3" />
                        {user.email}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="w-3 h-3" />
                        {user.phone}
                      </div>
                    </div>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full bg-gradient-to-r ${roleColors[user.role]} text-white text-xs capitalize`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className={`px-3 py-1 rounded-full text-xs capitalize ${statusColors[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-sm text-muted-foreground">
                    {new Date(user.joinedDate).toLocaleDateString()}
                  </td>
                  <td className="py-3 px-4">
                    <div className="flex items-center justify-end gap-2">
                      {user.status === 'pending' && (
                        <>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleApprove(user.id)}
                            className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center"
                            title="Approve"
                          >
                            <CheckCircle className="w-4 h-4" />
                          </motion.button>
                          <motion.button
                            whileHover={{ scale: 1.1 }}
                            whileTap={{ scale: 0.9 }}
                            onClick={() => handleReject(user.id)}
                            className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center"
                            title="Reject"
                          >
                            <XCircle className="w-4 h-4" />
                          </motion.button>
                        </>
                      )}
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => {
                          setEditingUser(user);
                          setShowModal(true);
                        }}
                        className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4" />
                      </motion.button>
                      <motion.button
                        whileHover={{ scale: 1.1 }}
                        whileTap={{ scale: 0.9 }}
                        onClick={() => setDeleteUser(user)}
                        className="w-8 h-8 rounded-lg bg-red-500/10 text-red-600 flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </motion.button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredUsers.length === 0 && (
            <div className="text-center py-12">
              <p className="text-muted-foreground">No users found</p>
            </div>
          )}
        </div>
      </div>

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingUser ? 'Edit User' : 'Add User'} size="md">
        <AddUserForm
          onSubmit={handleSubmit}
          onCancel={() => {
            setShowModal(false);
            setEditingUser(null);
          }}
          initialData={editingUser || undefined}
          isEdit={!!editingUser}
        />
      </Modal>

      <ConfirmDialog
        isOpen={!!deleteUser}
        onClose={() => setDeleteUser(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message={`Are you sure you want to delete ${deleteUser?.name}? This action cannot be undone.`}
        confirmText="Delete"
        variant="danger"
      />
    </div>
  );
}
