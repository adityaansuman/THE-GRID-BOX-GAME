import React, { useState } from 'react';
import { UserProfile, PublicLobbyInfo } from '../types';
import { sound } from '../utils/audio';
import {
  Play,
  Users,
  Trophy,
  Bot,
  User,
  Hash,
  Volume2,
  VolumeX,
  PlusCircle,
  HelpCircle,
  Sparkles
} from 'lucide-react';
import { AvatarPickerModal } from './AvatarPickerModal';

interface TitleScreenProps {
  user: UserProfile | null;
  guestName: string;
  guestColor: string;
  guestAvatar: string;
  onUpdateGuest: (name: string, color: string, avatar: string) => void;
  onOpenAuth: () => void;
  onOpenProfile: () => void;
  onOpenLeaderboard: () => void;
  onQuickPlay: () => void;
  onCreateRoom: () => void;
  onJoinRoom: (code: string) => void;
  onPlayVsBot: () => void;
  lobbies: PublicLobbyInfo[];
  isMuted: boolean;
  onToggleMute: () => void;
}

export const TitleScreen: React.FC<TitleScreenProps> = ({
  user,
  guestName,
  guestColor,
  guestAvatar,
  onUpdateGuest,
  onOpenAuth,
  onOpenProfile,
  onOpenLeaderboard,
  onQuickPlay,
  onCreateRoom,
  onJoinRoom,
  onPlayVsBot,
  lobbies,
  isMuted,
  onToggleMute
}) => {
  const [joinCode, setJoinCode] = useState('');
  const [showHowToPlay, setShowHowToPlay] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  const handleJoinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) return;
    sound.playClick();
    onJoinRoom(joinCode.trim().toUpperCase());
  };

  return (
    <div className="relative min-h-screen w-full bg-[#FAF7F2] text-[#3D352E] flex flex-col justify-between p-4 md:p-8 overflow-hidden select-none font-sans">
      {/* Top Bar Header */}
      <header className="relative z-10 flex items-center justify-between w-full max-w-5xl mx-auto">
        {/* Left: User Profile / Sign in */}
        <div className="flex items-center gap-2.5">
          {user ? (
            <button
              onClick={() => {
                sound.playClick();
                onOpenProfile();
              }}
              className="flex items-center gap-2.5 px-4 py-2 rounded-2xl bg-white border-2 border-[#EFEAE1] hover:border-[#5BBFEA] shadow-sm transition-all group active:scale-95"
            >
              <div
                className="w-8 h-8 rounded-xl flex items-center justify-center text-base border"
                style={{
                  borderColor: user.color,
                  backgroundColor: `${user.color}20`
                }}
              >
                {user.avatar}
              </div>
              <div className="text-left">
                <div className="font-bubbly font-bold text-xs text-[#3D352E] flex items-center gap-1.5">
                  <span>{user.displayName}</span>
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: user.color }}
                  />
                </div>
                <div className="text-[10px] text-[#5BBFEA] font-bubbly">
                  {user.stats.wins} Wins · {user.stats.totalScore} pts
                </div>
              </div>
            </button>
          ) : (
            <button
              onClick={() => {
                sound.playClick();
                onOpenAuth();
              }}
              className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-white hover:bg-[#F8F5EE] border-2 border-[#EFEAE1] text-[#3D352E] font-bubbly font-bold text-xs transition-all shadow-sm active:scale-95"
            >
              <User className="w-4 h-4 text-[#5BBFEA]" />
              <span>Log In / Sign Up</span>
            </button>
          )}

          {/* Leaderboard Button */}
          <button
            onClick={() => {
              sound.playClick();
              onOpenLeaderboard();
            }}
            className="flex items-center gap-1.5 px-4 py-2 rounded-2xl bg-white hover:bg-[#F8F5EE] border-2 border-[#EFEAE1] text-[#E09A1E] font-bubbly font-bold text-xs transition-all shadow-sm active:scale-95"
          >
            <Trophy className="w-4 h-4 text-[#F5B83D]" />
            <span className="hidden sm:inline">Leaderboard</span>
          </button>
        </div>

        {/* Right: Audio toggle & How to Play */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => {
              sound.playClick();
              setShowHowToPlay(true);
            }}
            className="p-2.5 rounded-2xl bg-white hover:bg-[#F8F5EE] border-2 border-[#EFEAE1] text-[#7A7067] hover:text-[#3D352E] transition-all shadow-sm active:scale-95"
            title="How to Play"
          >
            <HelpCircle className="w-4 h-4" />
          </button>

          <button
            onClick={onToggleMute}
            className="p-2.5 rounded-2xl bg-white hover:bg-[#F8F5EE] border-2 border-[#EFEAE1] text-[#7A7067] hover:text-[#3D352E] transition-all shadow-sm active:scale-95"
            title={isMuted ? 'Unmute Audio' : 'Mute Audio'}
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-[#FF8DA1]" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#5BBFEA]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Center Minimal Hero */}
      <main className="relative z-10 w-full max-w-lg mx-auto my-auto flex flex-col items-center text-center">
        {/* Bubbly Pastel GridBox Logo Lockup (Clean, Solid, NO dotted lines) */}
        <div className="mb-6 animate-float-gentle flex flex-col items-center">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#5BBFEA] via-[#A389D4] to-[#FF8DA1] p-1 shadow-sm flex items-center justify-center">
              <div className="w-full h-full bg-white rounded-xl flex items-center justify-center p-1.5">
                <div className="grid grid-cols-2 gap-1 w-full h-full">
                  <div className="bg-[#5BBFEA] rounded-md opacity-90" />
                  <div className="bg-[#FF8DA1] rounded-md opacity-90" />
                  <div className="bg-[#58C99E] rounded-md opacity-90" />
                  <div className="bg-[#F5B83D] rounded-md opacity-90" />
                </div>
              </div>
            </div>

            <h1 className="font-bubbly font-bold text-4xl sm:text-5xl tracking-wide bg-gradient-to-r from-[#5BBFEA] via-[#A389D4] to-[#FF8DA1] bg-clip-text text-transparent drop-shadow-xs">
              GridBox
            </h1>
          </div>

          <p className="font-bubbly text-xs text-[#8C8074] tracking-widest uppercase mt-2">
            Minimal & Aesthetic Multiplayer Grid Game
          </p>
        </div>

        {/* Guest Nickname & Pastel Color Quick Customizer */}
        {!user && (
          <div className="w-full bg-white border-2 border-[#EFEAE1] rounded-3xl p-4 mb-4 shadow-[0_4px_16px_rgba(180,160,140,0.06)] flex items-center justify-between gap-3 text-left">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowAvatarPicker(true);
                }}
                className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl border shadow-xs hover:scale-105 active:scale-95 transition-all group relative cursor-pointer"
                style={{
                  borderColor: guestColor,
                  backgroundColor: `${guestColor}22`
                }}
                title="Change Avatar Icon"
              >
                {guestAvatar}
                <span className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 border border-[#EFEAE1] text-[10px]">
                  ✨
                </span>
              </button>
              <div>
                <label className="text-[10px] text-[#A69B8F] uppercase font-bubbly font-bold block">
                  Your Nickname
                </label>
                <input
                  type="text"
                  value={guestName}
                  onChange={(e) => onUpdateGuest(e.target.value, guestColor, guestAvatar)}
                  maxLength={16}
                  className="bg-transparent border-b-2 border-[#EFEAE1] focus:border-[#5BBFEA] text-sm font-bubbly font-bold text-[#3D352E] focus:outline-none py-0.5"
                  placeholder="Enter Nickname"
                />
              </div>
            </div>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setShowAvatarPicker(true);
              }}
              className="font-bubbly text-xs font-bold text-[#5BBFEA] hover:text-[#49B5E3] flex items-center gap-1.5 px-3 py-1.5 bg-[#EAF6FD] hover:bg-[#DDF1FC] rounded-xl border border-[#C5E7FA] transition-all"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Change Avatar</span>
            </button>
          </div>
        )}

        {/* Action Button Stack */}
        <div className="w-full space-y-3">
          {/* Primary Quick Play CTA */}
          <button
            onClick={() => {
              sound.playClick();
              onQuickPlay();
            }}
            className="w-full py-4 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold text-base rounded-2xl shadow-[0_4px_0_#3FA5D1,0_8px_16px_rgba(91,191,234,0.3)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2.5"
          >
            <Play className="w-5 h-5 fill-current" />
            Quick Play (Online)
          </button>

          {/* Secondary 2-column: Create Room / Play vs Bot */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => {
                sound.playClick();
                onCreateRoom();
              }}
              className="py-3.5 px-4 bg-white hover:bg-[#F8F5EE] border-2 border-[#EFEAE1] hover:border-[#DED5C7] text-[#3D352E] font-bubbly font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-[#FF8DA1]" />
              Create Room
            </button>

            <button
              onClick={() => {
                sound.playClick();
                onPlayVsBot();
              }}
              className="py-3.5 px-4 bg-white hover:bg-[#F8F5EE] border-2 border-[#EFEAE1] hover:border-[#DED5C7] text-[#3D352E] font-bubbly font-bold text-xs rounded-2xl shadow-sm transition-all active:scale-98 flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-[#58C99E]" />
              Solo vs AI Bot
            </button>
          </div>

          {/* Join with Room Code Form */}
          <form
            onSubmit={handleJoinSubmit}
            className="flex items-center gap-2 p-1.5 bg-white border-2 border-[#EFEAE1] rounded-2xl shadow-sm"
          >
            <div className="relative flex-1">
              <Hash className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[#A89D91]" />
              <input
                type="text"
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                placeholder="ENTER 5-LETTER ROOM CODE"
                maxLength={7}
                className="w-full bg-[#FAF7F2] border border-[#EFEAE1] rounded-xl pl-9 pr-3 py-2.5 text-xs text-[#3D352E] uppercase font-bubbly font-bold placeholder-[#A69B8E] focus:outline-none focus:border-[#5BBFEA]"
              />
            </div>
            <button
              type="submit"
              disabled={!joinCode.trim()}
              className="px-5 py-2.5 bg-[#5BBFEA] hover:bg-[#49B5E3] disabled:opacity-40 text-white font-bubbly font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              Join
            </button>
          </form>
        </div>

        {/* Public Lobbies List */}
        {lobbies.length > 0 && (
          <div className="w-full mt-6 text-left">
            <h4 className="font-bubbly text-xs font-bold text-[#8C8074] uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <Users className="w-3.5 h-3.5 text-[#5BBFEA]" />
              Active Public Lobbies ({lobbies.length})
            </h4>
            <div className="space-y-2 max-h-36 overflow-y-auto pr-1 no-scrollbar">
              {lobbies.map((lob) => (
                <div
                  key={lob.code}
                  className="flex items-center justify-between p-3 rounded-2xl bg-white border-2 border-[#EFEAE1] text-xs hover:border-[#D4C9BC] transition-colors shadow-xs"
                >
                  <div>
                    <span className="font-bubbly font-bold text-[#3D352E]">{lob.name}</span>
                    <span className="ml-2 text-[10px] text-[#A69B8F] font-mono">
                      Grid: {lob.grid}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-[11px] font-bubbly font-bold text-[#5BBFEA]">
                      {lob.playerCount}/{lob.maxPlayers}
                    </span>
                    <button
                      onClick={() => {
                        sound.playClick();
                        onJoinRoom(lob.code);
                      }}
                      className="px-3 py-1 bg-[#EAF6FD] hover:bg-[#D5EEFA] text-[#5BBFEA] border border-[#C5E7FA] rounded-xl text-[10px] font-bubbly font-bold transition-all"
                    >
                      Join
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Flat Minimal Control Hint */}
      <footer className="relative z-10 w-full text-center py-2 text-xs text-[#9E9387] font-bubbly">
        Click adjacent dots to draw line · Capture 4th side for bonus turn · Chain combos for high scores
      </footer>

      {/* How to Play Modal */}
      {showHowToPlay && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-in">
          <div className="relative w-full max-w-md bg-white border-2 border-[#EFEAE1] rounded-3xl p-6 text-[#3D352E] shadow-xl">
            <h3 className="font-bubbly font-bold text-lg text-[#3D352E] mb-3 flex items-center gap-2">
              <HelpCircle className="w-5 h-5 text-[#5BBFEA]" />
              How to Play GridBox
            </h3>

            <div className="space-y-3 text-xs leading-relaxed text-[#5C5248] font-medium">
              <p>
                <strong>1. Take Turns:</strong> Click between two adjacent dots to connect them with a pastel line in your signature color.
              </p>
              <p>
                <strong>2. Claim Boxes:</strong> Closing the 4th side of any 1x1 box claims it for you! Your avatar stamps the box and awards you points.
              </p>
              <p>
                <strong>3. Extra Bonus Turns:</strong> Capturing a box gives you an immediate extra turn! Chain multiple boxes together in one move for combo multipliers.
              </p>
              <p>
                <strong>4. Win:</strong> Once every box is captured, the player with the highest score wins the match and climbs the global leaderboard!
              </p>
            </div>

            <button
              onClick={() => {
                sound.playClick();
                setShowHowToPlay(false);
              }}
              className="w-full mt-6 py-3 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold text-xs rounded-2xl shadow-sm"
            >
              Got it! Let's Play
            </button>
          </div>
        </div>
      )}

      {/* Avatar Picker for Guest Player */}
      <AvatarPickerModal
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        selectedAvatar={guestAvatar}
        onSelectAvatar={(chosen) => {
          onUpdateGuest(guestName, guestColor, chosen);
        }}
        accentColor={guestColor}
      />
    </div>
  );
};
