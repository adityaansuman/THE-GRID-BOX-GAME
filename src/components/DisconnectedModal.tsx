import React from 'react';
import { WifiOff, RefreshCw, Home } from 'lucide-react';
import { sound } from '../utils/audio';

interface DisconnectedModalProps {
  isOpen: boolean;
  onReconnect: () => void;
  onReturnToMenu: () => void;
}

export const DisconnectedModal: React.FC<DisconnectedModalProps> = ({
  isOpen,
  onReconnect,
  onReturnToMenu,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-sm bg-white border-2 border-[#EFEAE1] rounded-3xl p-6 text-[#3D352E] shadow-2xl text-center">
        {/* Offline Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#FFF0F2] border-2 border-[#FFCCD4] text-[#D93856] mb-3 shadow-xs animate-pulse">
          <WifiOff className="w-8 h-8" />
        </div>

        <h3 className="font-bubbly font-bold text-xl text-[#3D352E] mb-1">
          Connection Interrupted
        </h3>

        <p className="font-bubbly text-xs text-[#8C8074] leading-relaxed mb-5">
          Your network connection was interrupted. The match is continuing for remaining players. You can reconnect or head back to the main menu.
        </p>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onReconnect();
            }}
            className="w-full py-3.5 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold text-sm rounded-2xl shadow-[0_4px_0_#3FA5D1,0_8px_16px_rgba(91,191,234,0.3)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
          >
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span>Reconnect Now</span>
          </button>

          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onReturnToMenu();
            }}
            className="w-full py-3 bg-[#FAF7F2] hover:bg-[#F2ECE3] text-[#7A7067] hover:text-[#3D352E] font-bubbly font-bold text-xs rounded-2xl border-2 border-[#EFEAE1] transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Return to Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};
