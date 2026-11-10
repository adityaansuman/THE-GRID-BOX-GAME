import React from 'react';
import { Player, GameRoom } from '../types';
import { Crown, Bot, Sparkles, Grid, Layers, Flame, PanelLeftClose, PanelLeftOpen, ChevronRight, Users } from 'lucide-react';
import { sound } from '../utils/audio';

interface ParticipantListProps {
  room: GameRoom;
  myPlayerId: string;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

export const ParticipantList: React.FC<ParticipantListProps> = ({
  room,
  myPlayerId,
  isMinimized = false,
  onToggleMinimize
}) => {
  const activePlayer = room.players[room.currentTurnIndex];
  const remainingBoxes = room.totalBoxes - room.claimedBoxesCount;

  // Minimized Compact Rail: Participant Avatars, Custom Line Colours, and Live Scores REMAIN FULLY VISIBLE!
  if (isMinimized) {
    return (
      <aside
        className="w-14 lg:w-16 shrink-0 h-full flex flex-col items-center justify-between py-4 bg-white/95 backdrop-blur-md border-2 border-[#EFEAE1] rounded-3xl shadow-[0_4px_20px_rgba(180,160,140,0.08)] select-none transition-all duration-300 overflow-hidden"
        aria-label="Minimized participant list"
      >
        {/* Top Expand Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMinimize?.();
          }}
          className="p-2.5 rounded-2xl bg-[#FAF5EE] hover:bg-[#F2ECE3] text-[#7A7067] hover:text-[#3D352E] border border-[#E8DFC8] transition-all active:scale-95 shadow-xs"
          title="Expand Participants list (reduces grid view)"
        >
          <PanelLeftOpen className="w-4 h-4" />
        </button>

        {/* Vertical Stack of All Participants with Avatars, Line Colours & Scores */}
        <div className="flex-1 w-full flex flex-col items-center justify-center gap-3.5 my-2 overflow-y-auto no-scrollbar py-2">
          {room.players.map((p, idx) => {
            const isTurn = idx === room.currentTurnIndex;
            const isMe = p.id === myPlayerId;

            return (
              <div
                key={p.id}
                onClick={() => {
                  sound.playClick();
                  onToggleMinimize?.();
                }}
                className={`relative group cursor-pointer flex flex-col items-center transition-all ${
                  isTurn ? 'scale-110 z-10' : 'hover:scale-105 opacity-90 hover:opacity-100'
                }`}
              >
                {/* Avatar with Custom Color Border & Turn Glow */}
                <div
                  className={`w-10 h-10 rounded-2xl flex items-center justify-center text-lg border-2 shadow-xs transition-all relative ${
                    isTurn ? 'ring-2 ring-offset-1' : ''
                  }`}
                  style={{
                    borderColor: p.color,
                    backgroundColor: `${p.color}20`,
                    boxShadow: isTurn ? `0 0 12px ${p.color}80` : undefined,
                    ['--tw-ring-color' as any]: p.color,
                  }}
                >
                  <span>{p.avatar}</span>
                  {p.isHost && (
                    <Crown className="w-3.5 h-3.5 text-[#F5B83D] absolute -top-1.5 -right-1.5 fill-[#F5B83D]" />
                  )}
                  {isTurn && (
                    <span
                      className="absolute -top-1 -left-1 w-2.5 h-2.5 rounded-full animate-ping"
                      style={{ backgroundColor: p.color }}
                    />
                  )}
                </div>

                {/* VISIBLE CUSTOM PLAYER LINE COLOUR SWATCH PILL */}
                <div
                  className="w-6 h-2 rounded-full mt-1 border border-black/10 shadow-xs"
                  style={{ backgroundColor: p.color }}
                  title={`${p.name}'s line colour: ${p.color}`}
                />

                {/* Score Tag */}
                <span
                  className="mt-0.5 text-[10px] font-bubbly font-bold px-1.5 py-0.2 rounded-md border"
                  style={{
                    color: p.color,
                    borderColor: `${p.color}40`,
                    backgroundColor: `${p.color}15`,
                  }}
                >
                  {p.score}
                </span>

                {/* Popover Tooltip on Hover */}
                <div className="absolute left-full ml-3 px-3 py-1.5 bg-[#2C241E] text-white text-[11px] font-bubbly rounded-2xl shadow-xl whitespace-nowrap opacity-0 pointer-events-none group-hover:opacity-100 transition-opacity z-50">
                  <div className="font-bold flex items-center gap-1.5">
                    <span>{p.name}</span>
                    {isMe && <span className="text-[#5BBFEA]">(You)</span>}
                    {p.isHost && <span className="text-[#F5B83D]">👑</span>}
                    {p.isBot && <span className="text-[9px] bg-white/20 px-1 rounded">BOT</span>}
                  </div>
                  <div className="text-[10px] text-[#D8CFBF] flex items-center gap-2 mt-0.5">
                    <span>{p.score} boxes</span>
                    <span className="w-2.5 h-2.5 rounded-full inline-block" style={{ backgroundColor: p.color }} />
                    <span>{isTurn ? 'Drawing now' : 'Waiting'}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Bottom Expand Toggle Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMinimize?.();
          }}
          className="p-1.5 rounded-xl text-[#A69B8F] hover:text-[#5BBFEA] transition-colors"
          title="Expand Participants list"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // Expanded Full View
  return (
    <aside className="w-64 lg:w-72 shrink-0 h-full flex flex-col bg-white/90 backdrop-blur-md border-2 border-[#EFEAE1] rounded-3xl p-4 shadow-[0_4px_20px_rgba(180,160,140,0.08)] select-none overflow-hidden transition-all duration-300">
      {/* Title */}
      <div className="flex items-center justify-between pb-3 border-b border-[#F0EAE1] mb-3">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#FAF5EE] border border-[#E8DFC8] flex items-center justify-center text-xs">
            👥
          </div>
          <h3 className="font-bubbly font-bold text-sm text-[#3D352E]">
            Participants
          </h3>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bubbly text-xs bg-[#FAF5EE] text-[#7A7067] px-2.5 py-0.5 rounded-full border border-[#E8DFC8]">
            {room.players.length} Players
          </span>
          {onToggleMinimize && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onToggleMinimize();
              }}
              className="p-1.5 rounded-xl text-[#8C8074] hover:text-[#3D352E] hover:bg-[#F2ECE3] transition-colors"
              title="Minimize participant list (expands grid view)"
            >
              <PanelLeftClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Players list */}
      <div className="flex-1 overflow-y-auto space-y-2.5 pr-0.5 no-scrollbar">
        {room.players.map((p, idx) => {
          const isTurn = idx === room.currentTurnIndex;
          const isMe = p.id === myPlayerId;
          const percentage = Math.round((p.score / Math.max(room.totalBoxes, 1)) * 100);

          return (
            <div
              key={p.id}
              className={`p-3 rounded-2xl border-2 transition-all duration-200 ${
                isTurn
                  ? 'bg-[#FFFDFB] border-[#5BBFEA] shadow-[0_4px_16px_rgba(91,191,234,0.18)] scale-[1.01]'
                  : 'bg-[#FAFAF8] border-[#EFEAE1] hover:border-[#DFD7CB]'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2.5 overflow-hidden">
                  {/* Avatar Bubble with custom color */}
                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl shrink-0 border shadow-xs"
                    style={{
                      borderColor: p.color,
                      backgroundColor: `${p.color}18`,
                    }}
                  >
                    {p.avatar}
                  </div>

                  <div className="overflow-hidden">
                    <div className="flex items-center gap-1">
                      <span className="font-bubbly font-bold text-sm text-[#3D352E] truncate">
                        {p.name}
                      </span>
                      {p.isHost && (
                        <Crown className="w-3.5 h-3.5 text-[#F5B83D] shrink-0" />
                      )}
                      {p.isBot && (
                        <span className="text-[9px] bg-[#EFEAE1] text-[#7A7067] font-bubbly px-1.5 py-0.2 rounded-md">
                          BOT
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className="w-4 h-1.5 rounded-full shadow-xs"
                        style={{ backgroundColor: p.color }}
                        title={`Line colour: ${p.color}`}
                      />
                      <span className="text-[10px]">
                        {p.isDisconnected ? (
                          <span className="text-[#FF8DA1] font-bold animate-pulse">Disconnected (reconnecting...)</span>
                        ) : isMe ? (
                          <span className="text-[#5BBFEA] font-bold">You</span>
                        ) : isTurn ? (
                          <span className="text-[#5BBFEA] font-bold">Turn Active</span>
                        ) : (
                          <span className="text-[#8C8074]">Waiting</span>
                        )}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Score Pill */}
                <div className="text-right shrink-0">
                  <div
                    className="font-bubbly font-bold text-base px-2.5 py-0.5 rounded-xl border"
                    style={{
                      color: p.color,
                      borderColor: `${p.color}40`,
                      backgroundColor: `${p.color}10`
                    }}
                  >
                    {p.score}
                  </div>
                  <div className="text-[9px] text-[#A69B8F] font-mono mt-0.5">
                    {percentage}%
                  </div>
                </div>
              </div>

              {/* Turn indicator tag if current turn */}
              {isTurn && (
                <div className="mt-2 pt-1.5 border-t border-[#F0EAE1] flex items-center justify-between text-[11px] font-bubbly font-bold text-[#5BBFEA]">
                  <span className="flex items-center gap-1">
                    <span className="inline-block w-2 h-2 rounded-full bg-[#5BBFEA] animate-ping" />
                    {isMe ? 'Your turn to connect!' : 'Drawing next line...'}
                  </span>
                  {room.turnTimeLimit > 0 && (
                    <span className="text-[#8C8074] font-mono text-[10px]">
                      {room.turnTimeRemaining}s
                    </span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Match Overview Footer */}
      <div className="mt-3 pt-3 border-t border-[#F0EAE1] space-y-1.5 text-xs text-[#7A7067] font-bubbly">
        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px]">
            <Layers className="w-3.5 h-3.5 text-[#5BBFEA]" />
            Boxes Left:
          </span>
          <span className="font-bold text-[#3D352E] font-mono">
            {remainingBoxes} / {room.totalBoxes}
          </span>
        </div>

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px]">
            <Grid className="w-3.5 h-3.5 text-[#FF8DA1]" />
            Grid Size:
          </span>
          <span className="font-bold text-[#3D352E] font-mono">
            {room.gridRows}×{room.gridCols}
          </span>
        </div>

        {room.currentCombo > 1 && (
          <div className="flex items-center justify-between text-[#FF9F68] font-bold">
            <span className="flex items-center gap-1 text-[11px]">
              <Flame className="w-3.5 h-3.5" />
              Streak Combo:
            </span>
            <span className="font-mono">x{room.currentCombo}!</span>
          </div>
        )}
      </div>
    </aside>
  );
};
