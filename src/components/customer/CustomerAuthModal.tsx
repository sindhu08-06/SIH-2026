import React, { useState } from 'react';
import {
  User,
  Mail,
  Lock,
  Phone,
  ArrowRight,
  ShieldCheck,
  X,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Loader2,
  KeyRound,
} from 'lucide-react';
import { GoogleIcon } from '../common/GoogleIcon';
import { signInWithGoogle, formatFirebaseAuthError } from '../../services/firebase';
import { FirebaseDomainHelper } from '../common/FirebaseDomainHelper';
import { api, AuthUser, setAuthToken } from '../../services/api';
import { Language } from '../../types';

interface CustomerAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: (user: AuthUser) => void;
  lang: Language;
}

export const CustomerAuthModal: React.FC<CustomerAuthModalProps> = ({
  isOpen,
  onClose,
  onAuthSuccess,
  lang,
}) => {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [showDomainHelper, setShowDomainHelper] = useState(false);

  if (!isOpen) return null;

  const handleGoogleSignIn = async () => {
    setIsGoogleLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);
    setShowDomainHelper(false);
    try {
      const res = await signInWithGoogle('customer', {
        role: 'customer',
      });
      if (res && res.user) {
        const customerUser: AuthUser = {
          id: res.user.uid,
          name: res.profile?.name || res.user.displayName || 'Co-op Customer',
          email: res.user.email || '',
          phone: res.user.phoneNumber || '',
          role: 'customer',
          createdAt: new Date().toISOString(),
        };
        localStorage.setItem('sahakar_customer_user', JSON.stringify(customerUser));
        setSuccessMsg(`Welcome, ${customerUser.name}! Signed in via Google.`);
        setTimeout(() => {
          onAuthSuccess(customerUser);
          onClose();
        }, 500);
      }
    } catch (err: any) {
      console.warn('Google Sign In notice:', err);
      const friendly = formatFirebaseAuthError(err);
      if (friendly.isUnauthorizedDomain) {
        setShowDomainHelper(true);
        setErrorMsg(null);
      } else {
        setErrorMsg(friendly.message);
      }
    } finally {
      setIsGoogleLoading(false);
    }
  };

  const handleFillDemo = () => {
    setMode('login');
    setEmailOrPhone('customer@sahakar.coop');
    setPassword('customer123');
    setErrorMsg(null);
    setShowDomainHelper(false);
  };

  const handleEmailPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      if (mode === 'register') {
        if (!name.trim()) {
          setErrorMsg('Please provide your full name.');
          setIsLoading(false);
          return;
        }
        if (!emailOrPhone.trim() || !password.trim()) {
          setErrorMsg('Email/phone and password are required.');
          setIsLoading(false);
          return;
        }

        const res = await api.register({
          name: name.trim(),
          email: emailOrPhone.includes('@') ? emailOrPhone.trim() : `${Date.now()}@customer.coop`,
          phone: phone.trim() || (!emailOrPhone.includes('@') ? emailOrPhone.trim() : ''),
          password: password.trim(),
          role: 'customer',
        });

        if (res && res.token) {
          setAuthToken(res.token);
          localStorage.setItem('sahakar_customer_user', JSON.stringify(res.user));
          setSuccessMsg('Customer account created successfully!');
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 600);
        }
      } else {
        // Login
        if (!emailOrPhone.trim() || !password.trim()) {
          setErrorMsg('Please enter your email or phone and password.');
          setIsLoading(false);
          return;
        }

        const res = await api.login(emailOrPhone.trim(), password.trim());
        if (res && res.token) {
          setAuthToken(res.token);
          localStorage.setItem('sahakar_customer_user', JSON.stringify(res.user));
          setSuccessMsg(`Welcome back, ${res.user.name}!`);
          setTimeout(() => {
            onAuthSuccess(res.user);
            onClose();
          }, 600);
        }
      }
    } catch (err: any) {
      console.error('Auth error:', err);
      setErrorMsg(err.message || 'Authentication failed. Please check credentials or use Demo login.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-xs">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition cursor-pointer z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="p-6 pb-4 bg-gradient-to-b from-emerald-50/70 to-white border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-700 text-white flex items-center justify-center font-bold shadow-xs">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">
                {mode === 'login'
                  ? lang === 'hi'
                    ? 'ग्राहक खाता प्रवेश'
                    : lang === 'mr'
                    ? 'ग्राहक खाते प्रवेश'
                    : lang === 'te'
                    ? 'కస్టమర్ లాగిన్'
                    : 'Customer Account Access'
                  : lang === 'hi'
                  ? 'नया ग्राहक खाता'
                  : lang === 'mr'
                  ? 'नवीन ग्राहक नोंदणी'
                  : lang === 'te'
                  ? 'కొత్త కస్టమర్ ఖాతా'
                  : 'Create Customer Account'}
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {lang === 'hi'
                  ? 'सहकारी कारीगरों को बुक करें एवं लाइव ट्रैक करें'
                  : lang === 'mr'
                  ? 'सहकारी कारागिरांना बुक करा आणि थेट ट्रॅक करा'
                  : lang === 'te'
                  ? 'సహకార సేవల బుకింగ్ & లైవ్ ట్రాకింగ్'
                  : 'Instant booking, live radar tracking & invoice history'}
              </p>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 gap-1.5 p-1 mt-4 bg-slate-100/90 rounded-2xl">
            <button
              type="button"
              onClick={() => {
                setMode('login');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                mode === 'login'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setMode('register');
                setErrorMsg(null);
              }}
              className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer ${
                mode === 'register'
                  ? 'bg-white text-emerald-900 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Create Account
            </button>
          </div>
        </div>

        {/* Modal Content - Merged Single Section */}
        <div className="p-6 pt-4 space-y-4">
          {/* Notifications */}
          {showDomainHelper && (
            <FirebaseDomainHelper
              onBypass={handleFillDemo}
              bypassLabel="Sign in with Customer Demo Account"
            />
          )}
          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2 animate-in fade-in">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span className="font-medium">{errorMsg}</span>
            </div>
          )}
          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2 animate-in fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
              <span className="font-bold">{successMsg}</span>
            </div>
          )}

          {/* Unified Section 1: One-Click Google Authentication */}
          <div className="space-y-2">
            <button
              id="btn-customer-google-auth"
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isGoogleLoading || isLoading}
              className="w-full py-3 px-4 rounded-2xl border-2 border-slate-200 hover:border-emerald-600 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-xs flex items-center justify-center gap-3 transition shadow-2xs cursor-pointer disabled:opacity-60"
            >
              {isGoogleLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
                  <span>Connecting to Google Account...</span>
                </>
              ) : (
                <>
                  <GoogleIcon className="w-4 h-4" />
                  <span>
                    {mode === 'login' ? 'Continue with Google (1-Click)' : 'Register with Google Account'}
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-center text-slate-500 font-medium">
              Secure authentication synced with Firebase & local co-op records
            </p>
          </div>

          {/* Clean Divider */}
          <div className="relative flex items-center py-1">
            <div className="grow border-t border-slate-200"></div>
            <span className="shrink mx-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
              or use mobile / email
            </span>
            <div className="grow border-t border-slate-200"></div>
          </div>

          {/* Unified Section 2: Mobile / Email Credentials Form */}
          <form onSubmit={handleEmailPasswordSubmit} className="space-y-3">
            {mode === 'register' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="text"
                    required
                    placeholder="e.g. Teja Reddy"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Email Address or Mobile Number
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="text"
                  required
                  placeholder="customer@sahakar.coop or +91 98224 81092"
                  value={emailOrPhone}
                  onChange={(e) => setEmailOrPhone(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                />
              </div>
            </div>

            {mode === 'register' && emailOrPhone.includes('@') && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Contact Phone Number (Optional)
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                  <input
                    type="tel"
                    placeholder="+91 98224 81092"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                  />
                </div>
              </div>
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-bold text-slate-700">Password</label>
                {mode === 'login' && (
                  <button
                    type="button"
                    onClick={handleFillDemo}
                    className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                  >
                    Fill Demo Credentials
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
                <input
                  type="password"
                  required
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-3 py-2.5 rounded-xl border border-slate-200 text-xs text-slate-900 bg-slate-50/70 focus:bg-white focus:outline-emerald-600"
                />
              </div>
            </div>

            <button
              id="btn-customer-submit-auth"
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full py-3 px-4 rounded-2xl bg-emerald-700 hover:bg-emerald-800 text-white font-extrabold text-xs flex items-center justify-center gap-2 transition shadow-xs cursor-pointer disabled:opacity-60 mt-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Verifying credentials...</span>
                </>
              ) : mode === 'login' ? (
                <>
                  <span>Sign In as Customer</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              ) : (
                <>
                  <span>Complete Customer Registration</span>
                  <CheckCircle2 className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Demo Assist Card */}
          {mode === 'login' && (
            <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-slate-600 font-medium">Demo Customer:</span>
                <span className="font-bold text-slate-800">customer@sahakar.coop</span>
              </div>
              <button
                type="button"
                onClick={handleFillDemo}
                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-100 hover:bg-emerald-200 text-emerald-900 transition cursor-pointer"
              >
                Autofill
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

