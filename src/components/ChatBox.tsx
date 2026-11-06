import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Player } from '../types';
import { Send, MessageSquare, PanelRightClose, PanelRightOpen, ChevronLeft } from 'lucide-react';
import { sound } from '../utils/audio';

interface ChatBoxProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, type?: 'chat' | 'reaction') => void;
  players: Player[];
  myPlayerId: string;
  isGameActive?: boolean;
  isMinimized?: boolean;
  onToggleMinimize?: () => void;
}

const PASTEL_REACTIONS = [
  { label: '🔥 Fire', val: '🔥' },
  { label: '👏 Clap', val: '👏' },
  { label: '🧠 Brain', val: '🧠' },
  { label: '💀 Oof', val: '💀' },
  { label: '🎯 Nice', val: '🎯' },
  { label: '😱 Wow', val: '😱' },
  { label: 'GG WP!', val: 'GG WP! 🏆' },
];

export const ChatBox: React.FC<ChatBoxProps> = ({
  messages,
  onSendMessage,
  players,
  myPlayerId,
  isGameActive = false,
  isMinimized = false,
  onToggleMinimize,
}) => {
  const [inputText, setInputText] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const chatBottomRef = useRef<HTMLDivElement>(null);
  const prevMessagesCountRef = useRef(messages.length);

  const playerMessages = messages.filter(m => !m.isSystem);

  useEffect(() => {
    if (isMinimized) {
      const diff = messages.length - prevMessagesCountRef.current;
      if (diff > 0) {
        setUnreadCount(prev => prev + diff);
      }
    } else {
      setUnreadCount(0);
    }
    prevMessagesCountRef.current = messages.length;
  }, [messages.length, isMinimized]);

  useEffect(() => {
    if (!isMinimized) {
      chatBottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isMinimized]);

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim()) return;
    sound.playClick();
    onSendMessage(inputText.trim(), 'chat');
    setInputText('');
  };

  const handleQuickReaction = (val: string) => {
    sound.playClick();
    onSendMessage(val, 'reaction');
  };

  // Minimized Sleek Pill
  if (isMinimized) {
    return (
      <aside
        className="w-12 lg:w-14 shrink-0 h-full flex flex-col items-center justify-between py-4 bg-white/95 backdrop-blur-md border-2 border-[#EFEAE1] rounded-3xl shadow-[0_4px_20px_rgba(180,160,140,0.08)] select-none transition-all duration-300"
        aria-label="Minimized chat"
      >
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMinimize?.();
          }}
          className="relative p-2.5 rounded-2xl bg-[#EAF6FD] hover:bg-[#D5EEFA] text-[#5BBFEA] border border-[#C5E7FA] transition-all active:scale-95 shadow-xs"
          title="Expand Chat (reduces grid view)"
        >
          <PanelRightOpen className="w-4 h-4" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 px-1 min-w-4 h-4 rounded-full bg-[#FF8DA1] text-white text-[10px] font-bold font-mono flex items-center justify-center animate-bounce shadow-xs">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Center Vertical Button */}
        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMinimize?.();
          }}
          className="flex flex-col items-center gap-2 text-[#7A7067] hover:text-[#5BBFEA] transition-colors py-4 my-auto cursor-pointer group"
          title="Click to expand chat"
        >
          <MessageSquare className="w-4 h-4 group-hover:scale-110 transition-transform" />
          <span className="font-bubbly font-bold text-xs [writing-mode:vertical-rl] tracking-widest uppercase">
            Chat
          </span>
          {playerMessages.length > 0 && (
            <span className="text-[10px] font-mono bg-[#FAF7F2] text-[#8C8074] px-1.5 py-0.5 rounded-full border border-[#EFEAE1]">
              {playerMessages.length}
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={() => {
            sound.playClick();
            onToggleMinimize?.();
          }}
          className="p-2 rounded-xl text-[#A69B8F] hover:text-[#5BBFEA] transition-colors"
          title="Expand Chat"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
      </aside>
    );
  }

  // Expanded Full Chat View
  return (
    <aside className="w-72 lg:w-80 shrink-0 h-full flex flex-col bg-white/95 backdrop-blur-md border-2 border-[#EFEAE1] rounded-3xl shadow-[0_4px_20px_rgba(180,160,140,0.08)] select-none overflow-hidden transition-all duration-300">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-[#FCFAF7] border-b border-[#F0EAE1]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#EAF6FD] border border-[#C5E7FA] flex items-center justify-center text-[#5BBFEA]">
            <MessageSquare className="w-3.5 h-3.5" />
          </div>
          <span className="font-bubbly font-bold text-sm text-[#3D352E]">
            Room Chat
          </span>
        </div>

        <div className="flex items-center gap-2">
          <span className="font-bubbly text-xs bg-[#FAF5EE] text-[#7A7067] px-2.5 py-0.5 rounded-full border border-[#E8DFC8]">
            {playerMessages.length}
          </span>
          {onToggleMinimize && (
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                onToggleMinimize();
              }}
              className="p-1.5 rounded-xl text-[#8C8074] hover:text-[#3D352E] hover:bg-[#F2ECE3] transition-colors"
              title="Minimize chat (expands grid view)"
            >
              <PanelRightClose className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Messages Feed */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs no-scrollbar">
        {playerMessages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-[#9E9387] text-center px-4 font-bubbly">
            <span className="text-3xl mb-2 animate-bounce">💬</span>
            <p className="text-xs">Chat with opponents or send friendly reactions!</p>
          </div>
        ) : (
          playerMessages.map((msg) => {
            const isMe = msg.senderId === myPlayerId;

            return (
              <div
                key={msg.id}
                className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              >
                <div className="flex items-center gap-1.5 mb-1 px-1">
                  <span className="text-xs">{msg.senderAvatar}</span>
                  <span
                    className="font-bubbly font-bold text-[11px]"
                    style={{ color: msg.senderColor || '#5BBFEA' }}
                  >
                    {msg.senderName}
                  </span>
                  <span className="text-[9px] text-[#A89D91] font-mono">
                    {new Date(msg.timestamp).toLocaleTimeString([], {
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div
                  className={`max-w-[88%] px-3.5 py-2 text-xs font-medium break-words shadow-xs ${
                    isMe
                      ? 'bg-[#EAF6FD] border border-[#C5E7FA] text-[#24485D] rounded-2xl rounded-tr-xs'
                      : 'bg-[#F8F5EE] border border-[#EBE3D3] text-[#3D352E] rounded-2xl rounded-tl-xs'
                  } ${msg.type === 'reaction' ? 'text-base py-1 px-3' : ''}`}
                >
                  {msg.text}
                </div>
              </div>
            );
          })
        )}
        <div ref={chatBottomRef} />
      </div>

      {/* Quick Pastel Reaction Pills */}
      <div className="px-2.5 py-2 bg-[#FCFAF7] border-t border-[#F0EAE1] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
        {PASTEL_REACTIONS.map((r, i) => (
          <button
            key={i}
            type="button"
            onClick={() => handleQuickReaction(r.val)}
            className="shrink-0 px-2.5 py-1 rounded-full bg-[#FFFFFF] hover:bg-[#F2ECE3] text-[#5C5248] hover:text-[#2E2822] text-[11px] font-bubbly font-bold border border-[#E5DDD2] transition-all active:scale-95 shadow-xs"
          >
            {r.label}
          </button>
        ))}
      </div>

      {/* Chat Input Form */}
      <form
        onSubmit={handleSend}
        className="p-2.5 bg-[#FFFFFF] border-t border-[#F0EAE1] flex items-center gap-2"
      >
        <input
          type="text"
          placeholder="Send a bubbly message..."
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          maxLength={140}
          className="flex-1 bg-[#FAF7F2] border border-[#E8DFD3] rounded-2xl px-3.5 py-2 text-xs text-[#3D352E] placeholder-[#A69B8E] focus:outline-none focus:border-[#5BBFEA] focus:bg-white transition-all font-medium"
        />
        <button
          type="submit"
          disabled={!inputText.trim()}
          className="bg-[#5BBFEA] hover:bg-[#49B5E3] disabled:opacity-40 text-white p-2 rounded-2xl shadow-sm transition-all active:scale-95"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>
    </aside>
  );
};
