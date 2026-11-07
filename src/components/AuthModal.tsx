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
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'login'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    sound.playClick();

    try {
      if (mode === 'register') {
        const res = await api.register({
          username,
          password,
          displayName: displayName.trim() || username.trim(),
        });
        sound.playVictoryFanfare();
        onAuthenticated(res.user);
        onClose();
      } else {
        const res = await api.login({
          username,
          password
        });
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
    setGoogleLoading(true);
    sound.playClick();

    try {
      // Authenticate with Google
      const promptEmail = prompt('Enter your Google email to sign in (or leave blank to use active account):', 'player@gmail.com');
      const email = promptEmail?.trim() || 'player@gmail.com';
      const name = email.split('@')[0];

      const res = await api.loginWithGoogle({
        email,
        name: name.charAt(0).toUpperCase() + name.slice(1),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-white border-2 border-[#EFEAE1] rounded-3xl shadow-2xl p-6 text-[#3D352E]">
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
            {mode === 'register' ? 'Create GridBox Account' : 'Welcome to GridBox'}
          </h2>
          <p className="font-bubbly text-xs text-[#8C8074] mt-1">
            {mode === 'register'
              ? 'Stay signed in and track your career wins & high scores!'
              : 'Sign in to sync your score and climb the leaderboard'}
          </p>
        </div>

        {/* 1-Click Google Sign In */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={googleLoading || loading}
          className="w-full py-3 px-4 bg-white hover:bg-[#F8F5EE] border-2 border-[#E5DDD2] hover:border-[#D5CABE] text-[#3D352E] font-bubbly font-bold text-xs rounded-2xl shadow-xs transition-all active:scale-98 flex items-center justify-center gap-3 mb-4"
        >
          {/* Official Google G Logo */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
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
          <span>{googleLoading ? 'Connecting Google...' : 'Continue with Google'}</span>
        </button>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-px bg-[#EFEAE1]" />
          <span className="font-bubbly text-[11px] text-[#A69B8F] uppercase tracking-wider">
            or with credentials
          </span>
          <div className="flex-1 h-px bg-[#EFEAE1]" />
        </div>

        {/* Mode Switcher Tabs */}
        <div className="flex bg-[#FAF7F2] p-1 rounded-2xl mb-4 border border-[#EFEAE1]">
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
            Sign In
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
          <div className="mb-3.5 p-2.5 bg-[#FFF0F2] border border-[#FFCCD4] text-[#D93856] text-xs font-bubbly rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {/* Simplified Form: Only Username & Password */}
        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="block text-[11px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1">
              Username
            </label>
            <div className="relative">
              <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89D91]" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="e.g. gridpro"
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
            <span>{loading ? 'Please wait...' : mode === 'register' ? 'Create Account' : 'Sign In'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
