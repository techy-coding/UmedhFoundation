import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { User, Lock, Mail, Shield, Upload, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { useRole } from '../../context/RoleContext';
import { changePassword } from '../../services/auth';

export function ProfileSettingsPage() {
  const { userName, userEmail, role } = useRole();
  const [activeTab, setActiveTab] = useState<'profile' | 'security'>('profile');
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    name: userName,
    email: userEmail,
    phone: '',
    address: '',
    bio: '',
  });
  const [avatar, setAvatar] = useState<string | null>(null);
  const [securityForm, setSecurityForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (!savedUser) {
      return;
    }

    try {
      const parsedUser = JSON.parse(savedUser);

      // Fall back to splitting the legacy full name if firstName/lastName
      // aren't stored yet (e.g. accounts created before the register form
      // collected them).
      const fallbackFirst =
        parsedUser.firstName ||
        (typeof parsedUser.name === 'string' ? parsedUser.name.trim().split(' ')[0] : '') ||
        '';
      const fallbackLast =
        parsedUser.lastName ||
        (typeof parsedUser.name === 'string'
          ? parsedUser.name.trim().split(' ').slice(1).join(' ')
          : '') ||
        '';

      setProfileData((current) => ({
        ...current,
        firstName: fallbackFirst,
        lastName: fallbackLast,
        name: parsedUser.name || current.name,
        email: parsedUser.email || current.email,
        phone: parsedUser.phone || '',
        address: parsedUser.address || '',
        bio: parsedUser.bio || '',
      }));
      setAvatar(parsedUser.avatar || parsedUser.picture || null);
    } catch (error) {
      console.error('Failed to parse saved user profile:', error);
    }
  }, [userEmail, userName]);

  const handleAvatarUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      const nextAvatar = reader.result as string;
      setAvatar(nextAvatar);

      const savedUser = localStorage.getItem('user');
      const parsedUser = savedUser ? JSON.parse(savedUser) : {};
      localStorage.setItem('user', JSON.stringify({ ...parsedUser, avatar: nextAvatar }));
      toast.success('Profile picture updated.');
    };
    reader.readAsDataURL(file);
  };

  const handleSave = () => {
    const savedUser = localStorage.getItem('user');
    const parsedUser = savedUser ? JSON.parse(savedUser) : {};
    const combinedName =
      `${(profileData.firstName || '').trim()} ${(profileData.lastName || '').trim()}`.trim() ||
      profileData.name;

    const nextUser = {
      ...parsedUser,
      ...profileData,
      name: combinedName,
      avatar,
      role,
    };

    localStorage.setItem('user', JSON.stringify(nextUser));
    localStorage.setItem('userName', combinedName);
    localStorage.setItem('userEmail', profileData.email);
    setProfileData((current) => ({ ...current, name: combinedName }));
    toast.success('Profile updated successfully.');
  };


  const handlePasswordUpdate = async () => {
    // Validate form fields
    if (!securityForm.currentPassword || !securityForm.newPassword || !securityForm.confirmPassword) {
      toast.error('Please fill in all password fields.');
      return;
    }

    // Validate new password strength
    if (securityForm.newPassword.length < 6) {
      toast.error('New password must be at least 6 characters long.');
      return;
    }

    if (securityForm.newPassword.length > 50) {
      toast.error('New password is too long (maximum 50 characters).');
      return;
    }

    // Check if new password is same as current
    if (securityForm.currentPassword === securityForm.newPassword) {
      toast.error('New password must be different from current password.');
      return;
    }

    // Validate password confirmation
    if (securityForm.newPassword !== securityForm.confirmPassword) {
      toast.error('New password and confirmation do not match.');
      return;
    }

    setIsUpdatingPassword(true);

    try {
      await changePassword(securityForm.currentPassword, securityForm.newPassword);
      setSecurityForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      toast.success('Password updated successfully.');
    } catch (error: any) {
      console.error('Failed to change password:', error);
      // The error message is now properly handled in the auth service
      toast.error(error?.message || 'Could not change password. Please try again.');
    } finally {
      setIsUpdatingPassword(false);
    }
  };


  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <div>
        <h1 className="mb-2 text-3xl font-heading font-bold">Profile & Settings</h1>
        <p className="text-muted-foreground">Manage your account, preferences, password, and live activity.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-4">
        <div className="space-y-4 lg:col-span-1">
          <div className="rounded-2xl border border-border bg-card p-6 text-center">
            <div className="relative mb-4 inline-block">
              {avatar ? (
                <img src={avatar} alt="Profile" className="mx-auto h-24 w-24 rounded-full object-cover" />
              ) : (
                <div className="mx-auto flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-[#FF6B35] to-[#6C5CE7] text-3xl font-bold text-white">
                  {(profileData.name || 'U').substring(0, 2).toUpperCase()}
                </div>
              )}
              <label className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-primary transition-transform hover:scale-110">
                <Camera className="h-4 w-4 text-white" />
                <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              </label>
            </div>
            <h3 className="mb-1 text-lg font-semibold">{profileData.name || 'User'}</h3>
            <p className="mb-2 text-sm text-muted-foreground">{profileData.email || 'No email available'}</p>
            <p className="text-xs uppercase tracking-wide text-primary">{role}</p>
          </div>

          <nav className="rounded-2xl border border-border bg-card p-3">
            {(['profile', 'security'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`mb-2 w-full rounded-xl px-4 py-3 text-left capitalize transition-colors last:mb-0 ${
                  activeTab === tab
                    ? 'bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] text-white'
                    : 'text-muted-foreground hover:bg-muted'
                }`}
              >
                {tab === 'profile' && <User className="mr-2 inline h-4 w-4" />}
                {tab === 'security' && <Lock className="mr-2 inline h-4 w-4" />}
                {tab}
              </button>
            ))}
          </nav>
        </div>

        <div className="lg:col-span-3">
          {activeTab === 'profile' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-8">
              <h2 className="mb-6 text-2xl font-heading font-bold">Personal Information</h2>
              <div className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">First Name</label>
                    <input
                      type="text"
                      value={profileData.firstName}
                      onChange={(event) => setProfileData({ ...profileData, firstName: event.target.value })}
                      className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Last Name</label>
                    <input
                      type="text"
                      value={profileData.lastName}
                      onChange={(event) => setProfileData({ ...profileData, lastName: event.target.value })}
                      className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <div>
                    <label className="mb-2 block text-sm font-medium">Email Address</label>
                    <input
                      type="email"
                      value={profileData.email}
                      onChange={(event) => setProfileData({ ...profileData, email: event.target.value })}
                      className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="mb-2 block text-sm font-medium">Phone Number</label>
                    <input
                      type="tel"
                      value={profileData.phone}
                      onChange={(event) => setProfileData({ ...profileData, phone: event.target.value })}
                      className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Location</label>
                  <input
                    type="text"
                    value={profileData.address}
                    onChange={(event) => setProfileData({ ...profileData, address: event.target.value })}
                    className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium">Bio</label>
                  <textarea
                    value={profileData.bio}
                    onChange={(event) => setProfileData({ ...profileData, bio: event.target.value })}
                    rows={4}
                    className="w-full resize-none rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={handleSave}
                  className="rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] px-6 py-3 font-medium text-white"
                >
                  Save Changes
                </motion.button>
              </div>
            </motion.div>
          )}

          {activeTab === 'security' && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="rounded-2xl border border-border bg-card p-8">
              <h2 className="mb-2 text-2xl font-heading font-bold">Security Settings</h2>
              <p className="mb-6 text-sm text-muted-foreground">
                Change your Firebase account password here without going back to the login screen.
              </p>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <label className="mb-2 block text-sm font-medium">Current Password</label>
                  <input
                    type="password"
                    value={securityForm.currentPassword}
                    onChange={(event) => setSecurityForm({ ...securityForm, currentPassword: event.target.value })}
                    className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">New Password</label>
                  <input
                    type="password"
                    value={securityForm.newPassword}
                    onChange={(event) => setSecurityForm({ ...securityForm, newPassword: event.target.value })}
                    className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>
                <div>
                  <label className="mb-2 block text-sm font-medium">Confirm New Password</label>
                  <input
                    type="password"
                    value={securityForm.confirmPassword}
                    onChange={(event) => setSecurityForm({ ...securityForm, confirmPassword: event.target.value })}
                    className="w-full rounded-xl border border-transparent bg-muted/50 px-4 py-3 focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={handlePasswordUpdate}
                disabled={isUpdatingPassword}
                className="mt-6 rounded-xl bg-gradient-to-r from-[#FF6B35] to-[#6C5CE7] px-6 py-3 font-medium text-white disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isUpdatingPassword ? 'Updating Password...' : 'Change Password'}
              </motion.button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
