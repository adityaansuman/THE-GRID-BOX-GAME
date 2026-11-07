import React, { useState } from 'react';
import { GameRoom, Player } from '../types';
import { sound } from '../utils/audio';
import {
  Copy,
  Check,
  Crown,
  Play,
  Bot,
  Clock,
  Grid,
  Trash2,
  Users,
  Palette,
  Lock,
  ArrowLeft,
  AlertCircle
} from 'lucide-react';

interface LobbyViewProps {
  room: GameRoom;
  myPlayerId: string;
  onStartGame: () => void;
  onToggleReady: () => void;
  onSelectColor: (color: string) => void;
  onAddBot: (level: 'easy' | 'medium' | 'hard') => void;
  onRemoveBot: (botId: string) => void;
  onUpdateSettings: (rows: number, cols: number, turnTime: number, maxPlayers?: number) => void;
  onLeaveRoom: () => void;
}

export const PASTEL_COLOR_CHOICES = [
  { name: 'Sky', hex: '#5BBFEA' },
  { name: 'Strawberry', hex: '#FF8DA1' },
  { name: 'Mint', hex: '#58C99E' },
  { name: 'Peach', hex: '#FF9F68' },
  { name: 'Lavender', hex: '#A389D4' },
  { name: 'Butter', hex: '#F5B83D' },
  { name: 'Bubblegum', hex: '#E679B5' },
  { name: 'Sage', hex: '#82C29B' },
  { name: 'Teal', hex: '#4DB6AC' },
  { name: 'Periwinkle', hex: '#7E97E8' },
  { name: 'Coral', hex: '#E57373' },
  { name: 'Orchid', hex: '#BA68C8' },
  { name: 'Cyan', hex: '#4DD0E1' },
  { name: 'Gold', hex: '#FFD54F' },
  { name: 'Lime', hex: '#AED581' },
  { name: 'Slate', hex: '#90A4AE' }
];

const GRID_PRESETS = [
  { name: 'Quick 3×3', rows: 3, cols: 3, boxes: 9 },
  { name: 'Classic 4×4', rows: 4, cols: 4, boxes: 16 },
  { name: 'Standard 5×5', rows: 5, cols: 5, boxes: 25 },
  { name: 'Pro 6×6', rows: 6, cols: 6, boxes: 36 },
  { name: 'Epic 7×7', rows: 7, cols: 7, boxes: 49 },
  { name: 'Grandmaster 8×8', rows: 8, cols: 8, boxes: 64 },
];

const TURN_TIMES = [
  { label: '15s Blitz', val: 15 },
  { label: '30s Normal', val: 30 },
  { label: '45s Relaxed', val: 45 },
  { label: '60s Strategic', val: 60 },
  { label: 'Unlimited', val: 0 },
];

export const LobbyView: React.FC<LobbyViewProps> = ({
  room,
  myPlayerId,
  onStartGame,
  onToggleReady,
  onSelectColor,
  onAddBot,
  onRemoveBot,
  onUpdateSettings,
  onLeaveRoom
}) => {
  const [copied, setCopied] = useState(false);
  const [botLevel, setBotLevel] = useState<'easy' | 'medium' | 'hard'>('medium');

  const isHost = room.hostId === myPlayerId;
  const myPlayer = room.players.find(p => p.id === myPlayerId);
  const canStart = room.players.length >= 2;
  const isLargeParty = room.players.length > 4;

  const copyCode = () => {
    sound.playClick();
    navigator.clipboard.writeText(room.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleColorClick = (hex: string) => {
    const isTaken = room.players.some(
      p => p.id !== myPlayerId && p.color.toLowerCase() === hex.toLowerCase()
    );
    if (isTaken) return;

    sound.playColorSelect();
    onSelectColor(hex);
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col gap-5 select-none animate-fade-in">
      {/* Top Banner / Room Code Pill */}
      <div className="flex flex-col sm:flex-row items-center justify-between p-4 bg-white border-2 border-[#EFEAE1] rounded-3xl shadow-[0_4px_16px_rgba(180,160,140,0.06)] gap-4">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#FFF0F2] border-2 border-[#EFEAE1] hover:border-[#FFB7C5] text-[#7A7067] hover:text-[#D93856] font-bubbly font-bold text-xs transition-all active:scale-95 shadow-xs"
            title="Back to Main Menu"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </button>

          <div className="w-11 h-11 rounded-2xl bg-[#EAF6FD] border border-[#C5E7FA] flex items-center justify-center text-[#5BBFEA] font-bubbly font-bold text-lg">
            #
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bubbly font-bold text-base text-[#3D352E]">{room.name}</h2>
              <span className="text-[10px] bg-[#FAF5EE] text-[#7A7067] px-2.5 py-0.5 rounded-full font-bubbly border border-[#E8DFC8]">
                {room.isPublic ? 'Public' : 'Private'}
              </span>
              <span className="text-[10px] bg-[#EAF6FD] text-[#24485D] px-2.5 py-0.5 rounded-full font-bubbly border border-[#C5E7FA]">
                Up to {room.maxPlayers} Players
              </span>
            </div>
            <p className="text-xs text-[#8C8074]">
              Share room code to invite friends · Max 8 players
            </p>
          </div>
        </div>

        {/* Room Code Badge */}
        <button
          onClick={copyCode}
          className="flex items-center gap-2 px-4 py-2 bg-[#FAF7F2] border-2 border-[#EFEAE1] hover:border-[#5BBFEA] rounded-2xl transition-all active:scale-95 shadow-xs"
        >
          <span className="text-xs text-[#8C8074] font-bubbly">ROOM:</span>
          <span className="text-sm font-bubbly font-bold tracking-widest text-[#5BBFEA]">
            {room.code}
          </span>
          {copied ? (
            <Check className="w-4 h-4 text-[#58C99E]" />
          ) : (
            <Copy className="w-4 h-4 text-[#8C8074]" />
          )}
        </button>
      </div>

      {/* 2-Column Balanced Center Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 items-stretch">
        {/* Left Column: Player Cards & Line Color Choice */}
        <div className="bg-white border-2 border-[#EFEAE1] rounded-3xl p-5 shadow-[0_4px_16px_rgba(180,160,140,0.06)] flex flex-col justify-between h-full space-y-4">
          <div>
            {/* Players Roster Header */}
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Users className="w-4 h-4 text-[#5BBFEA]" />
                <h3 className="font-bubbly font-bold text-sm text-[#3D352E]">
                  Players ({room.players.length}/{room.maxPlayers})
                </h3>
              </div>

              {isHost && room.players.length < room.maxPlayers && (
                <div className="flex items-center gap-2">
                  <select
                    value={botLevel}
                    onChange={(e) => setBotLevel(e.target.value as any)}
                    className="bg-[#FAF7F2] border border-[#EFEAE1] text-xs font-bubbly text-[#5C5248] rounded-xl px-2.5 py-1 focus:outline-none"
                  >
                    <option value="easy">Easy Bot</option>
                    <option value="medium">Medium Bot</option>
                    <option value="hard">Master Bot</option>
                  </select>
                  <button
                    onClick={() => {
                      sound.playClick();
                      onAddBot(botLevel);
                    }}
                    className="flex items-center gap-1 px-3 py-1 bg-[#EAF6FD] hover:bg-[#D5EEFA] text-[#5BBFEA] border border-[#C5E7FA] text-xs font-bubbly font-bold rounded-xl transition-all active:scale-95"
                  >
                    <Bot className="w-3.5 h-3.5" />
                    + Add Bot
                  </button>
                </div>
              )}
            </div>

            {/* Connected Players Cards (up to 8 players) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto no-scrollbar pr-0.5">
              {room.players.map((p) => {
                const isMe = p.id === myPlayerId;
                return (
                  <div
                    key={p.id}
                    className={`relative flex items-center justify-between p-2.5 rounded-2xl border-2 transition-all ${
                      isMe
                        ? 'bg-[#FFFDFB] border-[#5BBFEA] shadow-xs ring-1 ring-[#5BBFEA]/20'
                        : 'bg-[#FAF7F2] border-[#EFEAE1]'
                    }`}
                  >
                    <div className="flex items-center gap-2 overflow-hidden">
                      <div
                        className="w-8 h-8 rounded-xl flex items-center justify-center text-base border shadow-xs shrink-0"
                        style={{
                          borderColor: p.color,
                          backgroundColor: `${p.color}18`
                        }}
                      >
                        {p.avatar}
                      </div>

                      <div className="overflow-hidden">
                        <div className="flex items-center gap-1 font-bubbly font-bold text-xs text-[#3D352E] truncate">
                          <span className="truncate">{p.name}</span>
                          {p.isHost && (
                            <Crown className="w-3 h-3 text-[#F5B83D] shrink-0" />
                          )}
                          {p.isBot && (
                            <span className="text-[8px] bg-[#EFEAE1] text-[#7A7067] font-bubbly px-1 rounded-sm shrink-0">
                              BOT
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <div
                            className="w-4 h-1.5 rounded-full shadow-xs"
                            style={{ backgroundColor: p.color }}
                          />
                          <span className="text-[10px] text-[#8C8074]">
                            {isMe ? 'You' : p.isReady ? 'Ready' : 'In Lobby'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {p.isReady ? (
                        <span className="text-[10px] text-[#58C99E] font-bubbly font-bold flex items-center gap-0.5 bg-[#EAFBF3] px-2 py-0.5 rounded-lg border border-[#BCEEDA]">
                          <Check className="w-3 h-3" /> Ready
                        </span>
                      ) : (
                        <span className="text-[10px] text-[#A69B8F] font-bubbly">
                          Waiting
                        </span>
                      )}

                      {isHost && p.isBot && (
                        <button
                          onClick={() => {
                            sound.playClick();
                            onRemoveBot(p.id);
                          }}
                          className="text-[#A69B8F] hover:text-[#FF8DA1] p-1 rounded-lg transition-colors"
                          title="Remove Bot"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* EXCLUSIVE LINE COLOUR CHOICE BEFORE STARTING GAME */}
          <div className="pt-3 border-t border-[#F0EAE1]">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Palette className="w-4 h-4 text-[#5BBFEA]" />
                <h4 className="font-bubbly font-bold text-xs text-[#3D352E]">
                  Choose Your Line Colour
                </h4>
              </div>
              <span className="text-[10px] text-[#8C8074] font-bubbly">
                Unique · No two players share a colour
              </span>
            </div>

            {/* 16 Colour Swatches Grid */}
            <div className="grid grid-cols-8 gap-1.5">
              {PASTEL_COLOR_CHOICES.map((preset) => {
                const claimant = room.players.find(
                  p => p.color.toLowerCase() === preset.hex.toLowerCase()
                );
                const isTakenByOther = claimant && claimant.id !== myPlayerId;
                const isSelectedByMe = myPlayer?.color.toLowerCase() === preset.hex.toLowerCase();

                return (
                  <button
                    key={preset.hex}
                    type="button"
                    disabled={Boolean(isTakenByOther)}
                    onClick={() => handleColorClick(preset.hex)}
                    className={`relative h-8 rounded-xl flex items-center justify-center transition-all ${
                      isSelectedByMe
                        ? 'ring-2 ring-[#3D352E] shadow-sm scale-105 z-10'
                        : isTakenByOther
                        ? 'opacity-40 cursor-not-allowed border-2 border-solid border-[#D4C9BD]'
                        : 'hover:scale-105 active:scale-95 hover:shadow-xs cursor-pointer border border-black/10'
                    }`}
                    style={{ backgroundColor: preset.hex }}
                    title={
                      isTakenByOther
                        ? `Taken by ${claimant?.name}`
                        : isSelectedByMe
                        ? 'Selected by You'
                        : `Pick ${preset.name}`
                    }
                  >
                    {isSelectedByMe && (
                      <div className="w-4 h-4 rounded-full bg-white/90 flex items-center justify-center shadow-xs">
                        <Check className="w-3 h-3 text-[#3D352E] font-black" />
                      </div>
                    )}

                    {isTakenByOther && (
                      <div className="w-4 h-4 rounded-full bg-white/80 flex items-center justify-center text-[8px] shadow-xs">
                        {claimant?.avatar || <Lock className="w-2.5 h-2.5 text-[#5C5248]" />}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Current Chosen Line Display */}
            <div className="mt-2 p-2 bg-[#FAF7F2] border border-[#EFEAE1] rounded-2xl flex items-center justify-between">
              <span className="text-[11px] text-[#7A7067] font-bubbly">
                Your Line Appearance:
              </span>
              <div className="flex items-center gap-2">
                <div
                  className="w-16 h-2 rounded-full shadow-xs transition-colors"
                  style={{ backgroundColor: myPlayer?.color || '#5BBFEA' }}
                />
                <span className="text-sm">{myPlayer?.avatar || '🦊'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Grid Sizes & Timer */}
        <div className="bg-white border-2 border-[#EFEAE1] rounded-3xl p-5 shadow-[0_4px_16px_rgba(180,160,140,0.06)] flex flex-col justify-between h-full space-y-4">
          <div>
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Grid className="w-4 h-4 text-[#5BBFEA]" />
                <h3 className="font-bubbly font-bold text-sm text-[#3D352E]">
                  Grid Size
                </h3>
              </div>
              <span className="font-bubbly text-xs text-[#5BBFEA] font-bold">
                {room.gridRows}×{room.gridCols} ({room.gridRows * room.gridCols} Boxes)
              </span>
            </div>

            {/* Warning when more than 4 players: ONLY 7x7 or 8x8 permitted */}
            {isLargeParty && (
              <div className="mb-2.5 p-2 bg-[#FFF8EB] border border-[#FDE7B3] rounded-2xl text-[11px] font-bubbly text-[#B87A0B] flex items-center gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>5+ players active: 7×7 or 8×8 grid required!</span>
              </div>
            )}

            <div className="grid grid-cols-3 gap-2">
              {GRID_PRESETS.map((preset) => {
                const isSelected =
                  room.gridRows === preset.rows && room.gridCols === preset.cols;
                const isLockedForLargeParty = isLargeParty && preset.rows < 7;

                return (
                  <button
                    key={preset.name}
                    disabled={!isHost || isLockedForLargeParty}
                    onClick={() => {
                      sound.playClick();
                      onUpdateSettings(preset.rows, preset.cols, room.turnTimeLimit, room.maxPlayers);
                    }}
                    className={`relative flex flex-col items-center justify-center py-3 px-2 rounded-2xl border-2 text-center transition-all ${
                      isSelected
                        ? 'bg-[#EAF6FD] border-[#5BBFEA] text-[#24485D] shadow-xs'
                        : isLockedForLargeParty
                        ? 'bg-[#F5F2EB] border-[#E8DFC8] text-[#A69B8F] cursor-not-allowed opacity-50'
                        : 'bg-[#FAF7F2] border-[#EFEAE1] text-[#5C5248] hover:border-[#DFD7CB]'
                    } ${!isHost || isLockedForLargeParty ? 'cursor-default' : 'active:scale-95'}`}
                  >
                    <span className="font-bubbly font-bold text-sm">{preset.rows}×{preset.cols}</span>
                    <span className="text-[10px] text-[#8C8074] font-medium mt-0.5">
                      {isLockedForLargeParty ? '7×7+ req' : `${preset.boxes} boxes`}
                    </span>
                    {isLockedForLargeParty && (
                      <Lock className="w-3 h-3 text-[#A69B8F] absolute top-2 right-2" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* Room Max Players & Turn Timer Settings */}
            <div className="mt-4 pt-3 border-t border-[#F0EAE1] space-y-3">
              {/* Max Players Selector (2 to 8) */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Users className="w-3.5 h-3.5 text-[#5BBFEA]" />
                    <span className="font-bubbly font-bold text-xs text-[#3D352E]">
                      Max Player Capacity (2–8)
                    </span>
                  </div>
                  <span className="text-xs font-bubbly font-bold text-[#5BBFEA]">
                    {room.maxPlayers} Max
                  </span>
                </div>

                <div className="grid grid-cols-7 gap-1">
                  {[2, 3, 4, 5, 6, 7, 8].map((num) => {
                    const isSelected = room.maxPlayers === num;
                    return (
                      <button
                        key={num}
                        type="button"
                        disabled={!isHost || room.players.length > num}
                        onClick={() => {
                          sound.playClick();
                          const nextRows = num > 4 && room.gridRows < 7 ? 7 : room.gridRows;
                          const nextCols = num > 4 && room.gridCols < 7 ? 7 : room.gridCols;
                          onUpdateSettings(nextRows, nextCols, room.turnTimeLimit, num);
                        }}
                        className={`py-1.5 rounded-xl border text-center text-xs font-bubbly font-bold transition-all ${
                          isSelected
                            ? 'bg-[#EAF6FD] border-[#5BBFEA] text-[#24485D] shadow-xs'
                            : room.players.length > num
                            ? 'opacity-30 cursor-not-allowed bg-[#FAF7F2] border-[#EFEAE1]'
                            : 'bg-[#FAF7F2] border-[#EFEAE1] text-[#7A7067] hover:text-[#3D352E]'
                        }`}
                      >
                        {num}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Turn Timer */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-[#5BBFEA]" />
                    <span className="font-bubbly font-bold text-xs text-[#3D352E]">
                      Turn Timer
                    </span>
                  </div>
                  <span className="text-[11px] font-bubbly text-[#8C8074]">
                    {room.turnTimeLimit > 0 ? `${room.turnTimeLimit}s per turn` : 'Unlimited'}
                  </span>
                </div>

                <div className="grid grid-cols-5 gap-1">
                  {TURN_TIMES.map((tt) => {
                    const isSelected = room.turnTimeLimit === tt.val;
                    return (
                      <button
                        key={tt.label}
                        disabled={!isHost}
                        onClick={() => {
                          sound.playClick();
                          onUpdateSettings(room.gridRows, room.gridCols, tt.val, room.maxPlayers);
                        }}
                        className={`py-1.5 px-1 rounded-xl border text-center text-[11px] font-bubbly font-bold transition-all ${
                          isSelected
                            ? 'bg-[#EAF6FD] border-[#5BBFEA] text-[#24485D]'
                            : 'bg-[#FAF7F2] border-[#EFEAE1] text-[#7A7067] hover:text-[#3D352E]'
                        } ${!isHost ? 'cursor-default' : 'active:scale-95'}`}
                      >
                        {tt.label.split(' ')[0]}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Full-Width Centered Action Footer */}
      <div className="flex items-center gap-3 w-full">
        {isHost ? (
          <button
            onClick={() => {
              sound.playClick();
              onStartGame();
            }}
            disabled={!canStart}
            className="flex-1 py-4 bg-[#5BBFEA] hover:bg-[#49B5E3] disabled:opacity-40 text-white font-bubbly font-bold text-base rounded-2xl shadow-[0_4px_0_#3FA5D1,0_8px_16px_rgba(91,191,234,0.3)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
          >
            <Play className="w-5 h-5 fill-current" />
            Start Game ({room.players.length} Players)
          </button>
        ) : (
          <button
            onClick={() => {
              sound.playClick();
              onToggleReady();
            }}
            className={`flex-1 py-4 font-bubbly font-bold text-base rounded-2xl transition-all shadow-sm flex items-center justify-center gap-2 ${
              myPlayer?.isReady
                ? 'bg-[#58C99E] text-white'
                : 'bg-[#5BBFEA] text-white'
            }`}
          >
            <Check className="w-5 h-5" />
            {myPlayer?.isReady ? 'Ready! (Click to cancel)' : "I'm Ready!"}
          </button>
        )}

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onLeaveRoom();
          }}
          className="flex items-center gap-2 px-6 py-4 bg-white hover:bg-[#FAF7F2] text-[#7A7067] hover:text-[#D93856] font-bubbly font-bold text-sm rounded-2xl border-2 border-[#EFEAE1] hover:border-[#FFB7C5] transition-colors shadow-xs"
          title="Return to Main Menu"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Menu</span>
        </button>
      </div>
    </div>
  );
};
