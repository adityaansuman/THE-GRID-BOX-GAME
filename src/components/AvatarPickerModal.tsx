import React, { useState } from 'react';
import { AVATAR_CATEGORIES, ALL_AVATARS } from '../utils/avatars';
import { sound } from '../utils/audio';
import { X, Check, Sparkles } from 'lucide-react';

interface AvatarPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedAvatar: string;
  onSelectAvatar: (avatar: string) => void;
  accentColor?: string;
}

export const AvatarPickerModal: React.FC<AvatarPickerModalProps> = ({
  isOpen,
  onClose,
  selectedAvatar,
  onSelectAvatar,
  accentColor = '#5BBFEA'
}) => {
  const [activeCategory, setActiveCategory] = useState<string>(AVATAR_CATEGORIES[0].category);

  if (!isOpen) return null;

  const currentCategory = AVATAR_CATEGORIES.find(c => c.category === activeCategory) || AVATAR_CATEGORIES[0];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-md bg-white border-2 border-[#EFEAE1] rounded-3xl p-5 shadow-2xl text-[#3D352E]">
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

        {/* Header */}
        <div className="flex items-center gap-2.5 mb-4">
          <div className="w-10 h-10 rounded-2xl bg-[#EAF6FD] border border-[#C5E7FA] flex items-center justify-center text-[#5BBFEA]">
            <Sparkles className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-bubbly font-bold text-base text-[#3D352E]">
              Choose Your Avatar
            </h3>
            <p className="font-bubbly text-xs text-[#8C8074]">
              Pick your signature icon shown on captured boxes!
            </p>
          </div>
        </div>

        {/* Category Tabs */}
        <div className="flex bg-[#FAF7F2] p-1 rounded-2xl border border-[#EFEAE1] gap-1 mb-4">
          {AVATAR_CATEGORIES.map(c => (
            <button
              key={c.category}
              type="button"
              onClick={() => {
                sound.playClick();
                setActiveCategory(c.category);
              }}
              className={`flex-1 py-1.5 px-2 rounded-xl text-xs font-bubbly font-bold transition-all ${
                activeCategory === c.category
                  ? 'bg-white text-[#3D352E] shadow-xs'
                  : 'text-[#8C8074] hover:text-[#3D352E]'
              }`}
            >
              {c.category}
            </button>
          ))}
        </div>

        {/* Avatar Grid */}
        <div className="grid grid-cols-4 gap-2.5 max-h-64 overflow-y-auto no-scrollbar p-1">
          {currentCategory.items.map(item => {
            const isSelected = selectedAvatar === item.emoji;

            return (
              <button
                key={item.emoji}
                type="button"
                onClick={() => {
                  sound.playClick();
                  onSelectAvatar(item.emoji);
                  onClose();
                }}
                className={`flex flex-col items-center justify-center p-3 rounded-2xl border-2 transition-all group ${
                  isSelected
                    ? 'bg-[#FFFDFB] border-[#5BBFEA] shadow-md scale-105 ring-2 ring-[#5BBFEA]/20'
                    : 'bg-[#FAF7F2] border-[#EFEAE1] hover:border-[#D4C9BD] hover:scale-105'
                }`}
              >
                <span className="text-2xl mb-1 group-hover:scale-110 transition-transform">
                  {item.emoji}
                </span>
                <span className="text-[10px] font-bubbly font-bold text-[#7A7067] truncate max-w-full">
                  {item.label}
                </span>
                {isSelected && (
                  <span className="mt-1 w-3 h-3 rounded-full bg-[#5BBFEA] flex items-center justify-center">
                    <Check className="w-2 h-2 text-white" />
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="mt-4 pt-3 border-t border-[#F0EAE1] flex items-center justify-between text-xs text-[#8C8074] font-bubbly">
          <span>Current: <span className="text-base ml-1">{selectedAvatar}</span></span>
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onClose();
            }}
            className="px-4 py-2 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold rounded-xl transition-all shadow-xs"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
