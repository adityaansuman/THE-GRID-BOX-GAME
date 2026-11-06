import React, { useState } from 'react';
import { api } from '../services/api';
import { UserProfile } from '../types';
import { sound } from '../utils/audio';
import { X, Lock, User, Palette, Check, Sparkles, ShieldCheck } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthenticated: (user: UserProfile) => void;
  initialMode?: 'login' | 'register';
}

const PASTEL_COLOR_PRESETS = [
  { name: 'Pastel Sky', hex: '#5BBFEA' },
  { name: 'Pastel Strawberry', hex: '#FF8DA1' },
  { name: 'Pastel Mint', hex: '#58C99E' },
  { name: 'Pastel Peach', hex: '#FF9F68' },
  { name: 'Pastel Lavender', hex: '#A389D4' },
  { name: 'Pastel Butter', hex: '#F5B83D' },
  { name: 'Pastel Bubblegum', hex: '#E679B5' },
  { name: 'Pastel Sage', hex: '#82C29B' },
  { name: 'Pastel Teal', hex: '#4DB6AC' },
  { name: 'Pastel Periwinkle', hex: '#7E97E8' }
];

const AVATAR_OPTIONS = ['🦊', '⚡', '🌸', '👑', '🎮', '🐱', '🚀', '🥑', '🧘‍♂️', '👾', '💎', '🍀', '🦄', '🎯', '🐻', '🌈'];

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onAuthenticated,
  initialMode = 'register'
}) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [color, setColor] = useState('#5BBFEA');
  const [avatar, setAvatar] = useState('🦊');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

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
          displayName: displayName || username,
          color,
          avatar
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
      setError(err.message || 'Authentication error. Please check credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-white border-2 border-[#EFEAE1] rounded-3xl shadow-xl overflow-hidden p-6 text-[#3D352E]">
        {/* Close Button */}
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 text-[#8C8074] hover:text-[#3D352E] p-1.5 rounded-xl hover:bg-[#FAF7F2] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="text-center mb-5">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-[#EAF6FD] border border-[#C5E7FA] text-[#5BBFEA] mb-2">
            <Sparkles className="w-6 h-6" />
          </div>
          <h2 className="font-bubbly font-bold text-xl text-[#3D352E]">
            {mode === 'register' ? 'Join GridBox' : 'Welcome Back'}
          </h2>
          <p className="font-bubbly text-xs text-[#8C8074] mt-0.5">
            {mode === 'register'
              ? 'Save your custom pastel lines, avatar, and career stats for your next visits!'
              : 'Log in to continue your career streak'}
          </p>
        </div>

        {/* Tab switch */}
        <div className="flex bg-[#FAF7F2] p-1 rounded-2xl mb-4 border border-[#EFEAE1]">
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bubbly font-bold rounded-xl transition-all ${
              mode === 'register'
                ? 'bg-white text-[#3D352E] shadow-xs'
                : 'text-[#8C8074] hover:text-[#3D352E]'
            }`}
          >
            Create Account
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2 text-xs font-bubbly font-bold rounded-xl transition-all ${
              mode === 'login'
                ? 'bg-white text-[#3D352E] shadow-xs'
                : 'text-[#8C8074] hover:text-[#3D352E]'
            }`}
          >
            Sign In
          </button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-[#FFF0F2] border border-[#FFCCD4] text-[#D93856] text-xs font-bubbly rounded-2xl flex items-center gap-2">
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
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
                placeholder="e.g. gridmaster"
                className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl pl-10 pr-4 py-2 text-sm text-[#3D352E] font-medium focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all"
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
                className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl pl-10 pr-4 py-2 text-sm text-[#3D352E] font-medium focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all"
              />
            </div>
          </div>

          {mode === 'register' && (
            <>
              <div>
                <label className="block text-[11px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1">
                  In-Game Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder={username || 'Display Name'}
                  maxLength={18}
                  className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl px-4 py-2 text-sm text-[#3D352E] font-medium focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all"
                />
              </div>

              {/* Avatar Selector */}
              <div>
                <label className="block text-[11px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1">
                  Pick Your Avatar
                </label>
                <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#FAF7F2] rounded-2xl border border-[#EFEAE1]">
                  {AVATAR_OPTIONS.map((item) => (
                    <button
                      type="button"
                      key={item}
                      onClick={() => setAvatar(item)}
                      className={`text-lg p-1.5 rounded-xl transition-all ${
                        avatar === item
                          ? 'bg-white border-2 border-[#5BBFEA] scale-110 shadow-xs'
                          : 'hover:bg-white/60'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Pastel Line Color */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-bubbly font-bold uppercase tracking-wider text-[#7A7067] flex items-center gap-1.5">
                    <Palette className="w-3.5 h-3.5 text-[#5BBFEA]" />
                    Custom Line Colour
                  </label>
                  <span className="text-[11px] font-mono text-[#8C8074]">
                    {color}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-2 mb-2.5">
                  {PASTEL_COLOR_PRESETS.map((p) => (
                    <button
                      key={p.hex}
                      type="button"
                      onClick={() => setColor(p.hex)}
                      className={`h-8 rounded-xl flex items-center justify-center transition-all ${
                        color.toLowerCase() === p.hex.toLowerCase()
                          ? 'ring-2 ring-[#3D352E] scale-105 shadow-sm'
                          : 'opacity-85 hover:opacity-100 hover:scale-102'
                      }`}
                      style={{ backgroundColor: p.hex }}
                      title={p.name}
                    >
                      {color.toLowerCase() === p.hex.toLowerCase() && (
                        <Check className="w-4 h-4 text-white font-black" />
                      )}
                    </button>
                  ))}
                </div>

                {/* Line Preview */}
                <div className="p-2.5 bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl flex items-center justify-between">
                  <span className="text-xs text-[#7A7067] font-bubbly">Your In-Game Line:</span>
                  <div className="flex items-center gap-2">
                    <div
                      className="w-24 h-2 rounded-full shadow-xs transition-colors"
                      style={{ backgroundColor: color }}
                    />
                    <div className="w-6 h-6 rounded-full flex items-center justify-center text-xs bg-white border border-[#EFEAE1]">
                      {avatar}
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3.5 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold text-sm rounded-2xl shadow-[0_4px_0_#3FA5D1,0_8px_16px_rgba(91,191,234,0.3)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                {mode === 'register' ? 'Register & Play' : 'Log In'}
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
