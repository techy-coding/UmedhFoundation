import { useState, useEffect } from 'react';
import type { FirebaseError } from 'firebase/app';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Eye, EyeOff, Mail, Lock, Heart, User, Phone } from 'lucide-react';
import { toast } from 'sonner';
import { isFirebaseConfigured } from '../../lib/firebase';
import {
  loginWithEmail,
  loginWithGoogle,
  registerWithEmail,
  sendResetLink,
  VolunteerPendingApprovalError,
  type AuthRole,
} from '../../services/auth';

function getFirebaseErrorMessage(error: unknown, isLogin: boolean) {
  const firebaseError = error as FirebaseError | undefined;
  const code = firebaseError?.code;

  switch (code) {
    case 'auth/configuration-not-found':
      return 'Firebase Authentication is not fully configured. Enable Email/Password and add localhost to Authorized Domains.';
    case 'auth/email-already-in-use':
      return 'That email is already registered. Try logging in instead.';
    case 'auth/invalid-email':
      return 'Please enter a valid email address.';
    case 'auth/weak-password':
      return 'Password is too weak. Use at least 6 characters.';
    case 'auth/operation-not-allowed':
      return 'Email/password sign-in is not enabled in Firebase yet.';
    case 'auth/network-request-failed':
      return 'Network error. Check your internet connection and try again.';
    case 'auth/invalid-credential':
    case 'auth/user-not-found':
    case 'auth/wrong-password':
      return isLogin ? 'Incorrect email or password.' : 'Could not verify your credentials.';
    case 'auth/popup-closed-by-user':
      return 'Google sign-in was closed before it finished.';
    case 'auth/popup-blocked':
      return 'Browser blocked the Google sign-in popup.';
    case 'auth/too-many-requests':
      return 'Too many attempts. Please wait a bit and try again.';
    default:
      return firebaseError?.message || (isLogin ? 'Failed to login. Please check your credentials.' : 'Failed to create account.');
  }
}

export function LoginPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [role, setRole] = useState<AuthRole>('donor');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordStrength, setPasswordStrength] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (!isFirebaseConfigured) {
      toast.info('Firebase is not configured, so login and register are still using demo mode.');
    }
  }, []);

  const calculatePasswordStrength = (pass: string) => {
    let strength = 0;
    if (pass.length >= 8) strength++;
    if (/[A-Z]/.test(pass)) strength++;
    if (/[0-9]/.test(pass)) strength++;
    if (/[^A-Za-z0-9]/.test(pass)) strength++;
    return strength;
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const pass = e.target.value;
    setPassword(pass);
    setPasswordStrength(calculatePasswordStrength(pass));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setIsSubmitting(true);

      if (!isLogin) {
        if (!firstName.trim() || !lastName.trim()) {
          toast.error('Please enter your first and last name.');
          return;
        }
        if (!phone.trim()) {
          toast.error('Please enter your phone number.');
          return;
        }
      }

      if (!isFirebaseConfigured) {
        const combinedName = `${firstName.trim()} ${lastName.trim()}`.trim();
        const displayName = combinedName || email.split('@')[0];
        const savedUser = localStorage.getItem('user');
        let parsedUser: Record<string, unknown> = {};
        try {
          parsedUser = savedUser ? JSON.parse(savedUser) : {};
        } catch {
          parsedUser = {};
        }

        localStorage.setItem('userRole', role);
        localStorage.setItem('userName', displayName);
        localStorage.setItem('userEmail', email);
        localStorage.setItem(
          'user',
          JSON.stringify({
            ...parsedUser,
            name: displayName,
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            phone: phone.trim(),
            email,
            role,
          })
        );
        toast.success(isLogin ? 'Login successful!' : 'Account created successfully!');
        setTimeout(() => navigate('/dashboard'), 500);
        return;
      }

      if (isLogin) {
        await loginWithEmail(email, password);
        toast.success('Login successful!');
        navigate('/dashboard');
      } else {
        const result = await registerWithEmail(email, password, role, {
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        });
        if (result.requiresApproval) {
          toast.success(
            'Volunteer application submitted. An admin will review your request — you can log in once approved.'
          );
          // Reset the form and flip to login tab so the user knows the next step.
          setIsLogin(true);
          setPassword('');
          setFirstName('');
          setLastName('');
          setPhone('');
        } else {
          toast.success('Account created successfully!');
          navigate('/dashboard');
        }
      }
    } catch (error) {
      console.error('Authentication error:', error);
      if (error instanceof VolunteerPendingApprovalError) {
        toast.info(error.message);
      } else {
        toast.error(getFirebaseErrorMessage(error, isLogin));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const triggerGoogleSignIn = async () => {
    try {
      setIsSubmitting(true);

      if (!isFirebaseConfigured) {
        const mockUser = {
          name: 'Google User',
          email: 'user@gmail.com',
          picture: 'https://lh3.googleusercontent.com/a/default-user',
        };

        localStorage.setItem('userRole', 'donor');
        localStorage.setItem('userName', mockUser.name);
        localStorage.setItem('userEmail', mockUser.email);
        localStorage.setItem('userPicture', mockUser.picture);

        toast.success('Signed in with Google successfully!');
        navigate('/dashboard');
        return;
      }

      await loginWithGoogle(role);
      toast.success('Signed in with Google successfully!');
      navigate('/dashboard');
    } catch (error) {
      console.error('Google Sign-In error:', error);
      toast.error(getFirebaseErrorMessage(error, true));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      toast.error('Enter your email address first.');
      return;
    }

    try {
      if (!isFirebaseConfigured) {
        toast.info('Password reset requires Firebase configuration.');
        return;
      }

      await sendResetLink(email);
      toast.success('Password reset email sent.');
    } catch (error) {
      console.error('Password reset error:', error);
      toast.error(getFirebaseErrorMessage(error, true));
    }
  };

  return (
    <div className="min-h-screen flex">
      <motion.div
        initial={{ x: -50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-[#FF6B35] via-[#6C5CE7] to-[#FFD93D] p-12 flex-col justify-between relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48cGF0dGVybiBpZD0iZ3JpZCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIiBwYXR0ZXJuVW5pdHM9InVzZXJTcGFjZU9uVXNlIj48cGF0aCBkPSJNIDQwIDAgTCAwIDAgMCA0MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSJ3aGl0ZSIgc3Ryb2tlLW9wYWNpdHk9IjAuMSIgc3Ryb2tlLXdpZHRoPSIxIi8+PC9wYXR0ZXJuPjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSJ1cmwoI2dyaWQpIi8+PC9zdmc+')] opacity-30"></div>

        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <Heart className="w-7 h-7 text-white" />
            </div>
            <Link to="/" className="text-3xl font-heading font-bold text-white hover:text-gray-200 transition-colors">Umedh Foundation</Link>
          </div>
          <h1 className="text-5xl font-heading font-bold text-white mb-6 leading-tight">
            Empowering Lives,<br />Building Hope
          </h1>
          <p className="text-white/90 text-lg">
            Join thousands of donors and volunteers making a difference in the lives of orphans and elderly across India.
          </p>
        </div>

        <div className="relative z-10 bg-white/10 backdrop-blur-md rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-3xl font-bold text-white">₹2.5Cr+</p>
              <p className="text-white/80 text-sm mt-1">Total Donations</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">5000+</p>
              <p className="text-white/80 text-sm mt-1">Children Helped</p>
            </div>
            <div>
              <p className="text-3xl font-bold text-white">1200+</p>
              <p className="text-white/80 text-sm mt-1">Volunteers</p>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ x: 50, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
        className="flex-1 flex items-center justify-center p-8 bg-background"
      >
        <div className="w-full max-w-md">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-heading font-bold mb-2">
              {isLogin ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-muted-foreground">
              {isLogin ? 'Login to access your dashboard' : 'Join us in making a difference'}
            </p>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setIsLogin(true)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                isLogin
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Login
            </button>
            <button
              onClick={() => setIsLogin(false)}
              className={`flex-1 py-3 rounded-xl font-medium transition-all ${
                !isLogin
                  ? 'bg-primary text-white shadow-lg shadow-primary/30'
                  : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium mb-2">I want to be a</label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Donor', 'Volunteer', 'Staff', 'Admin'].map((r) => (
                      <button
                        key={r}
                        type="button"
                        onClick={() => setRole(r.toLowerCase() as AuthRole)}
                        className={`py-2 px-4 rounded-xl font-medium transition-all ${
                          role === r.toLowerCase()
                            ? 'bg-secondary text-white'
                            : 'bg-muted text-muted-foreground hover:bg-muted/80'
                        }`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium mb-2">First Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        placeholder="Jane"
                        autoComplete="given-name"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Last Name</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                      <input
                        type="text"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        placeholder="Doe"
                        autoComplete="family-name"
                        className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                        required
                      />
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+91 98765 43210"
                      autoComplete="tel"
                      className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                      required
                    />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-11 pr-4 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={handlePasswordChange}
                  placeholder="••••••••"
                  className="w-full pl-11 pr-12 py-3 rounded-xl bg-muted/50 border border-transparent focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {!isLogin && password && (
                <div className="mt-2">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          passwordStrength >= level ? 'bg-primary' : 'bg-muted'
                        }`}
                      ></div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {passwordStrength === 0 && 'Weak password'}
                    {passwordStrength === 1 && 'Fair password'}
                    {passwordStrength === 2 && 'Good password'}
                    {passwordStrength === 3 && 'Strong password'}
                    {passwordStrength === 4 && 'Very strong password'}
                  </p>
                </div>
              )}
            </div>

            {isLogin && (
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" className="w-4 h-4 rounded border-gray-300" />
                  <span className="text-sm text-muted-foreground">Remember me</span>
                </label>
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="text-sm text-primary hover:underline"
                >
                  Forgot password?
                </button>
              </div>
            )}

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-gradient-to-r from-[#FF6B35] to-[#FF8B35] text-white rounded-xl font-medium shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 transition-all"
            >
              {isSubmitting ? 'Please wait...' : isLogin ? 'Login' : 'Create Account'}
            </motion.button>

            <div className="relative my-6">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 bg-background text-muted-foreground">Or continue with</span>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              type="button"
              onClick={triggerGoogleSignIn}
              disabled={isSubmitting}
              className="w-full py-3 border border-border rounded-xl font-medium flex items-center justify-center gap-2 hover:bg-muted/50 transition-colors"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Sign in with Google
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
