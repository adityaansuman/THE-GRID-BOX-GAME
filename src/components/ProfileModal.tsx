import React, { useState } from 'react';
import { UserProfile } from '../types';
import { api } from '../services/api';
import { sound } from '../utils/audio';
import { X, Palette, User, Trophy, Zap, Check, Flame } from 'lucide-react';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  onUserUpdated: (user: UserProfile) => void;
  onLogout: () => void;
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

const AVATARS = ['🦊', '⚡', '🌸', '👑', '🎮', '🐱', '🚀', '🥑', '🧘‍♂️', '👾', '💎', '🍀', '🦄', '🎯', '🐻', '🌈'];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUserUpdated,
  onLogout
}) => {
  const [displayName, setDisplayName] = useState(user.displayName);
  const [color, setColor] = useState(user.color);
  const [avatar, setAvatar] = useState(user.avatar);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    sound.playClick();
    try {
      const updated = await api.updateProfile({
        displayName,
        color,
        avatar
      });
      onUserUpdated(updated);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const winRate =
    user.stats.gamesPlayed > 0
      ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 100)
      : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-lg bg-white border-2 border-[#EFEAE1] rounded-3xl shadow-xl p-6 text-[#3D352E] max-h-[90vh] overflow-y-auto">
        <button
          onClick={() => {
            sound.playClick();
            onClose();
          }}
          className="absolute top-5 right-5 text-[#8C8074] hover:text-[#3D352E] p-1.5 rounded-xl hover:bg-[#FAF7F2] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-4 mb-5">
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl border-2 shadow-xs"
            style={{
              borderColor: color,
              backgroundColor: `${color}18`
            }}
          >
            {avatar}
          </div>
          <div>
            <h2 className="font-bubbly font-bold text-xl text-[#3D352E] flex items-center gap-2">
              {user.displayName}
              <span className="text-xs px-2.5 py-0.5 rounded-full bg-[#FAF7F2] text-[#8C8074] font-bubbly border border-[#EFEAE1]">
                @{user.username}
              </span>
            </h2>
            <p className="text-xs text-[#8C8074] font-bubbly mt-0.5">
              Member since {new Date(user.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <div className="bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[#F5B83D] text-xs font-bubbly font-bold mb-0.5">
              <Trophy className="w-3.5 h-3.5" /> Wins
            </div>
            <div className="font-bubbly font-bold text-lg text-[#3D352E]">{user.stats.wins}</div>
            <div className="text-[10px] text-[#8C8074] font-mono">{winRate}% Win Rate</div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[#5BBFEA] text-xs font-bubbly font-bold mb-0.5">
              <Zap className="w-3.5 h-3.5" /> Boxes
            </div>
            <div className="font-bubbly font-bold text-lg text-[#3D352E]">{user.stats.boxesClaimed}</div>
            <div className="text-[10px] text-[#8C8074] font-mono">Claimed Total</div>
          </div>

          <div className="bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl p-3 text-center">
            <div className="flex items-center justify-center gap-1 text-[#FF8DA1] text-xs font-bubbly font-bold mb-0.5">
              <Flame className="w-3.5 h-3.5" /> Streak
            </div>
            <div className="font-bubbly font-bold text-lg text-[#3D352E]">{user.stats.bestWinStreak}</div>
            <div className="text-[10px] text-[#8C8074] font-mono">Best Streak</div>
          </div>
        </div>

        {/* Customization Form */}
        <form onSubmit={handleSave} className="space-y-4">
          <div>
            <label className="block text-xs font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1 flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-[#5BBFEA]" />
              Display Name
            </label>
            <input
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              maxLength={18}
              className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl px-4 py-2 text-sm text-[#3D352E] font-medium focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-bubbly font-bold uppercase tracking-wider text-[#7A7067] mb-1.5">
              Avatar Icon
            </label>
            <div className="grid grid-cols-8 gap-1.5 p-2 bg-[#FAF7F2] rounded-2xl border border-[#EFEAE1]">
              {AVATARS.map((item) => (
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

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bubbly font-bold uppercase tracking-wider text-[#7A7067] flex items-center gap-1.5">
                <Palette className="w-3.5 h-3.5 text-[#5BBFEA]" />
                Custom Line Colour
              </label>
              <span className="text-[11px] font-mono text-[#8C8074]">{color}</span>
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
                      : 'opacity-85 hover:opacity-100'
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
              <span className="text-xs text-[#7A7067] font-bubbly">In-Game Line Look:</span>
              <div className="flex items-center gap-2">
                <div
                  className="w-24 h-2 rounded-full shadow-xs transition-colors"
                  style={{ backgroundColor: color }}
                />
                <span className="text-base">{avatar}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-3 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold text-xs rounded-2xl shadow-[0_3px_0_#3FA5D1,0_6px_12px_rgba(91,191,234,0.3)] transition-all active:translate-y-0.5 active:shadow-none flex items-center justify-center gap-2"
            >
              {saving ? 'Saving...' : success ? '✓ Saved!' : 'Save Customizations'}
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onLogout();
                onClose();
              }}
              className="px-4 py-3 bg-[#FFF0F2] hover:bg-[#FFE4E8] text-[#D93856] border border-[#FFCCD4] text-xs font-bubbly font-bold rounded-2xl transition-colors"
            >
              Sign Out
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
