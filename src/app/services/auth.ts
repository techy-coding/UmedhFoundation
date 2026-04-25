import {
  EmailAuthProvider,
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  reauthenticateWithCredential,
  signOut,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signInWithPopup,
  updatePassword as firebaseUpdatePassword,
  updateProfile,
} from 'firebase/auth';
import { ref, get, set } from 'firebase/database';
import { auth, database } from '../lib/firebase';

export type AuthRole = 'donor' | 'volunteer' | 'staff' | 'admin';

interface PersistedUser {
  id: string;
  name: string;
  email: string;
  picture?: string;
  role: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
}

export interface RegisterProfileDetails {
  firstName?: string;
  lastName?: string;
  phone?: string;
}

interface DefaultAdminConfig {
  email: string;
  password: string;
  name: string;
}

function ensureFirebaseAuth() {
  if (!auth || !database) {
    throw new Error('Firebase is not configured yet.');
  }
}

export function getDefaultAdminConfig(): DefaultAdminConfig | null {
  const email = (import.meta.env as any).VITE_DEFAULT_ADMIN_EMAIL?.trim();
  const password = (import.meta.env as any).VITE_DEFAULT_ADMIN_PASSWORD?.trim();
  const name = (import.meta.env as any).VITE_DEFAULT_ADMIN_NAME?.trim() || 'Admin';

  if (!email || !password) {
    return null;
  }

  return { email, password, name };
}

function buildUserProfile(params: {
  uid: string;
  email: string;
  role: string;
  name?: string | null;
  picture?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  phone?: string | null;
  status?: string;
}) {
  const firstName = (params.firstName || '').trim();
  const lastName = (params.lastName || '').trim();
  const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const displayName = combinedName || params.name?.trim() || params.email.split('@')[0];

  return {
    id: params.uid,
    name: displayName,
    firstName,
    lastName,
    email: params.email,
    phone: (params.phone || '').trim(),
    role: params.role,
    status: params.status || 'active',
    joinedDate: new Date().toISOString().split('T')[0],
    address: '',
    city: '',
    state: '',
    pincode: '',
    picture: params.picture || '',
  };
}

export class VolunteerPendingApprovalError extends Error {
  constructor(message = 'Your volunteer application is awaiting admin approval.') {
    super(message);
    this.name = 'VolunteerPendingApprovalError';
  }
}

export function persistAuthSession(user: PersistedUser) {
  // Merge onto any existing user object so we preserve extra profile fields
  // (phone, address, bio, avatar, firstName, lastName, etc.) that may already
  // be in localStorage.
  let existingUser: Record<string, unknown> = {};
  try {
    const saved = localStorage.getItem('user');
    if (saved) {
      existingUser = JSON.parse(saved);
    }
  } catch {
    existingUser = {};
  }

  const merged = {
    ...existingUser,
    ...user,
  };

  localStorage.setItem('user', JSON.stringify(merged));
  localStorage.setItem('userRole', user.role);
  localStorage.setItem('userName', user.name);
  localStorage.setItem('userEmail', user.email);

  if (user.picture) {
    localStorage.setItem('userPicture', user.picture);
  } else {
    localStorage.removeItem('userPicture');
  }
}

async function syncUserProfile(userProfile: ReturnType<typeof buildUserProfile>) {
  try {
    await set(ref(database!, `users/${userProfile.id}`), userProfile);
    return true;
  } catch (error) {
    console.error('Failed to sync user profile to Realtime Database:', error);
    return false;
  }
}

export async function registerWithEmail(
  email: string,
  password: string,
  role: AuthRole,
  details: RegisterProfileDetails = {}
) {
  ensureFirebaseAuth();

  const credential = await createUserWithEmailAndPassword(auth!, email, password);
  const firstName = (details.firstName || '').trim();
  const lastName = (details.lastName || '').trim();
  const combinedName = [firstName, lastName].filter(Boolean).join(' ').trim();
  const fallbackName = combinedName || email.split('@')[0];

  await updateProfile(credential.user, { displayName: fallbackName });

  // Volunteers must be approved by an admin before they can log in.
  const requiresApproval = role === 'volunteer';

  const userProfile = buildUserProfile({
    uid: credential.user.uid,
    email: credential.user.email || email,
    role,
    name: credential.user.displayName || fallbackName,
    picture: credential.user.photoURL,
    firstName,
    lastName,
    phone: details.phone,
    status: requiresApproval ? 'pending' : 'active',
  });

  await syncUserProfile(userProfile);

  if (requiresApproval) {
    // Don't start a session for pending volunteers — sign them out and clear
    // any partial auth state so the admin approval flow gates access.
    try {
      await signOut(auth!);
    } catch (signOutError) {
      console.warn('Failed to sign out pending volunteer:', signOutError);
    }
    return { user: credential.user, requiresApproval: true as const };
  }

  persistAuthSession({
    id: userProfile.id,
    name: userProfile.name,
    email: userProfile.email,
    picture: userProfile.picture,
    role: userProfile.role,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    phone: userProfile.phone,
  });

  return { user: credential.user, requiresApproval: false as const };
}

export async function loginWithEmail(email: string, password: string) {
  ensureFirebaseAuth();

  const credential = await signInWithEmailAndPassword(auth!, email, password);
  const snapshot = await get(ref(database!, `users/${credential.user.uid}`));
  const userProfile = snapshot.exists()
    ? snapshot.val()
    : buildUserProfile({
        uid: credential.user.uid,
        email: credential.user.email || email,
        role: 'donor',
        name: credential.user.displayName || email.split('@')[0],
        picture: credential.user.photoURL,
      });

  if (!snapshot.exists()) {
    await syncUserProfile(userProfile);
  }

  // Gate pending volunteers — they cannot log in until an admin approves them.
  if (userProfile.status === 'pending') {
    try {
      await signOut(auth!);
    } catch (signOutError) {
      console.warn('Failed to sign out pending user:', signOutError);
    }
    throw new VolunteerPendingApprovalError();
  }

  if (userProfile.status === 'inactive') {
    try {
      await signOut(auth!);
    } catch (signOutError) {
      console.warn('Failed to sign out inactive user:', signOutError);
    }
    throw new Error('Your account has been deactivated. Please contact an administrator.');
  }

  persistAuthSession({
    id: userProfile.id,
    name: userProfile.name,
    email: userProfile.email,
    picture: userProfile.picture,
    role: userProfile.role,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    phone: userProfile.phone,
  });

  return credential.user;
}

export async function loginWithGoogle(defaultRole: AuthRole = 'donor') {
  ensureFirebaseAuth();

  const provider = new GoogleAuthProvider();
  const credential = await signInWithPopup(auth!, provider);
  const snapshot = await get(ref(database!, `users/${credential.user.uid}`));
  const userProfile = snapshot.exists()
    ? snapshot.val()
    : buildUserProfile({
        uid: credential.user.uid,
        email: credential.user.email || '',
        role: defaultRole,
        name: credential.user.displayName,
        picture: credential.user.photoURL,
      });

  if (!snapshot.exists()) {
    await syncUserProfile(userProfile);
  }

  persistAuthSession({
    id: userProfile.id,
    name: userProfile.name,
    email: userProfile.email,
    picture: userProfile.picture,
    role: userProfile.role,
    firstName: userProfile.firstName,
    lastName: userProfile.lastName,
    phone: userProfile.phone,
  });

  return credential.user;
}

export async function sendResetLink(email: string) {
  ensureFirebaseAuth();
  await sendPasswordResetEmail(auth!, email);
}

export async function changePassword(currentPassword: string, newPassword: string) {
  ensureFirebaseAuth();

  // Check if user is authenticated
  if (!auth?.currentUser) {
    throw new Error('No authenticated user found. Please sign in again.');
  }

  if (!auth.currentUser.email) {
    throw new Error('User email not found. Please sign in again.');
  }

  try {
    // Reauthenticate user first
    const credential = EmailAuthProvider.credential(auth.currentUser.email, currentPassword);
    await reauthenticateWithCredential(auth.currentUser, credential);
    
    // Update password
    await firebaseUpdatePassword(auth.currentUser, newPassword);
  } catch (error: any) {
    console.error('Password change error:', error);
    
    // Handle specific Firebase auth errors
    if (error.code === 'auth/wrong-password') {
      throw new Error('Current password is incorrect. Please try again.');
    } else if (error.code === 'auth/weak-password') {
      throw new Error('New password is too weak. Please choose a stronger password.');
    } else if (error.code === 'auth/requires-recent-login') {
      throw new Error('For security reasons, please sign out and sign back in before changing your password.');
    } else if (error.code === 'auth/too-many-requests') {
      throw new Error('Too many failed attempts. Please wait a few minutes before trying again.');
    } else if (error.code === 'auth/user-not-found') {
      throw new Error('User account not found. Please sign in again.');
    } else if (error.code === 'auth/invalid-credential') {
      throw new Error('Invalid credentials. Please check your current password.');
    } else {
      throw new Error(error?.message || 'Failed to change password. Please try again.');
    }
  }
}

export async function ensureDefaultAdminUser() {
  const adminConfig = getDefaultAdminConfig();

  if (!adminConfig || !auth || !database) {
    return false;
  }

  try {
    // First try to sign in with existing admin credentials
    try {
      const credential = await signInWithEmailAndPassword(auth, adminConfig.email, adminConfig.password);
      console.log('Admin user already exists and signed in successfully');
      return true;
    } catch (signInError: any) {
      // If sign in fails, try to create the user
      if (signInError.code === 'auth/user-not-found' || signInError.code === 'auth/invalid-credential') {
        const credential = await createUserWithEmailAndPassword(auth, adminConfig.email, adminConfig.password);

        await updateProfile(credential.user, { displayName: adminConfig.name });

        const userProfile = buildUserProfile({
          uid: credential.user.uid,
          email: credential.user.email || adminConfig.email,
          role: 'admin',
          name: adminConfig.name,
          picture: credential.user.photoURL,
        });

        await syncUserProfile(userProfile);
        console.log('Admin user created successfully');
        return true;
      } else {
        throw signInError;
      }
    }
  } catch (error: any) {
    console.error('Failed to ensure default admin user:', error);
    return false;
  }
}
