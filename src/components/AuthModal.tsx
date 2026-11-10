import React, { useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { X, Lock, User, Sparkles, ArrowRight } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
  defaultUsername?: string;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'login',
  defaultUsername = ''
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState(defaultUsername);
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [googleEmail, setGoogleEmail] = useState(() => {
    return localStorage.getItem('gridbox_google_email') || '';
  });
  const [showGoogleInput, setShowGoogleInput] = useState(true);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  // Sync default username if provided
  React.useEffect(() => {
    if (defaultUsername && !username) {
      setUsername(defaultUsername);
    }
  }, [defaultUsername, username]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.playClick();

    try {
      if (mode === 'register') {
        const res = await api.register({
          username: username.trim(),
          password,
          displayName: (displayName.trim() || username.trim()),
        });
        localStorage.setItem('gridbox_last_username', username.trim());
        sound.playVictoryFanfare();
        onAuthenticated(res.user);
        onClose();
      } else {
        const res = await api.login({
          username: username.trim(),
          password
        });
        localStorage.setItem('gridbox_last_username', username.trim());
        sound.playClick();
        onAuthenticated(res.user);
        onClose();
      }
    } catch (err: any) {
      setError(err.message || 'Authentication error. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError('');
    const targetEmail = googleEmail.trim().toLowerCase();
    
    if (!targetEmail) {
      setError('Please enter your Google account email so you can log into the same profile on all devices.');
      setShowGoogleInput(true);
      return;
    }

    if (!targetEmail.includes('@')) {
      setError('Please enter a valid Google email address (e.g. yourname@gmail.com).');
      return;
    }

    setGoogleLoading(true);
    sound.playClick();

    try {
      localStorage.setItem('gridbox_google_email', targetEmail);
      const rawName = targetEmail.split('@')[0];
      const name = rawName.charAt(0).toUpperCase() + rawName.slice(1);

      const res = await api.loginWithGoogle({
        email: targetEmail,
        name,
        avatar: '🦊',
      });
      sound.playVictoryFanfare();
      onAuthenticated(res.user);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Google Sign-in failed. Please try again.');
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-white border-2 border-[#EFEAE1] rounded-3xl shadow-2xl p-6 text-[#3D352E] max-h-[95vh] overflow-y-auto">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-4 right-4 p-2 rounded-2xl bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[#8C8074] hover:text-[#3D352E] transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EAF6FD] border border-[#C5E7FA] text-[#5BBFEA] mb-2 shadow-xs">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-bubbly font-bold text-xl text-[#3D352E]">
            {mode === 'register' ? 'Create GridBox Account' : 'Sign In to GridBox'}
          </h2>
          <p className="font-bubbly text-xs text-[#8C8074] mt-1 leading-snug">
            {mode === 'register'
              ? 'Your profile, wins & ranking will sync across every phone and PC you log in from!'
              : 'Log in with your existing details to restore your stats, rank & wins on this device.'}
          </p>
        </div>

        {/* Google Sign In Card */}
        <div className="space-y-2 mb-4 bg-[#FAF7F2] p-3 rounded-2xl border border-[#EFEAE1]">
          <div className="space-y-1">
            <label className="block text-[10px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067]">
              Google Account Email
            </label>
            <input
              type="email"
              value={googleEmail}
              onChange={(e) => setGoogleEmail(e.target.value)}
              placeholder="e.g. yourname@gmail.com"
              className="w-full bg-white border border-[#E5DDD2] rounded-xl px-3 py-1.5 text-xs text-[#3D352E] font-medium focus:outline-none focus:border-[#4285F4] transition-all"
            />
          </div>

          <button
            type="button"
            onClick={handleGoogleSignIn}
            disabled={googleLoading || loading}
            className="w-full py-2 px-3 bg-white hover:bg-[#F8F5EE] border-2 border-[#E5DDD2] hover:border-[#4285F4] text-[#3D352E] font-bubbly font-bold text-xs rounded-xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-2"
          >
            {/* Official Google G Logo */}
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            <span>{googleLoading ? 'Syncing...' : 'Continue with Google'}</span>
          </button>
          <div className="text-[10px] text-center text-[#8C8074] font-bubbly">
            Sign in with the same email on any device to access this account.
          </div>
        </div>

        {/* Divider */}
        <div className="flex items-center gap-3 my-3">
          <div className="flex-1 h-px bg-[#EFEAE1]" />
          <span className="font-bubbly text-[10px] text-[#A69B8F] uppercase tracking-wider">
            or with username & password
          </span>
          <div className="flex-1 h-px bg-[#EFEAE1]" />
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#FAF7F2] p-1 rounded-2xl mb-3 border border-[#EFEAE1]">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-bubbly font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-[#3D352E] shadow-xs'
                : 'text-[#8C8074] hover:text-[#3D352E]'
            }`}
          >
            Sign In (Existing)
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-1.5 text-xs font-bubbly font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-[#3D352E] shadow-xs'
                : 'text-[#8C8074] hover:text-[#3D352E]'
            }`}
          >
            New Account
          </button>
        </div>

        {error && (
          <div className="mb-3 p-2.5 bg-[#FFF0F2] border border-[#FFCCD4] text-[#D93856] text-xs font-bubbly rounded-2xl flex flex-col gap-1.5">
            <div className="flex items-center gap-1.5">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
            {error.includes('already exists') && mode === 'register' && (
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setError('');
                }}
                className="self-start text-[11px] underline font-bold text-[#5BBFEA] hover:text-[#3FA5D1]"
              >
                Click here to Sign In with this account →
              </button>
            )}
            {error.includes('No account found') && mode === 'login' && (
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setError('');
                }}
                className="self-start text-[11px] underline font-bold text-[#5BBFEA] hover:text-[#3FA5D1]"
              >
                Click here to create this account now →
              </button>
            )}
          </div>
        )}

        {/* Simplified Form: Username & Password */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1">
              {mode === 'login' ? 'Username, Email, or Nickname' : 'Username'}
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89D91]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={mode === 'login' ? 'Enter username or nickname' : 'e.g. gridpro'}
                className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#3D352E] font-medium focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89D91]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl pl-10 pr-4 py-2 text-xs text-[#3D352E] font-medium focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1">
                Display Name (Optional)
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder={username || 'Display Name'}
                maxLength={18}
                className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl px-4 py-2 text-xs text-[#3D352E] font-medium focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all"
              />
            </div>
          )}

          <button
            type="submit"
            disabled={loading || googleLoading}
            className="w-full mt-2 py-3 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold text-xs rounded-2xl shadow-[0_4px_0_#3FA5D1,0_6px_12px_rgba(91,191,234,0.3)] transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-1.5"
          >
            <span>{loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In to Profile'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
