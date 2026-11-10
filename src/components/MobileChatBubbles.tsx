import React, { useState, useEffect, useRef } from 'react';
import { ChatMessage, Player } from '../types';
import { sound } from '../utils/audio';
import { Send, MessageSquare, X, Smile, Sparkles } from 'lucide-react';

interface MobileChatBubblesProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, type?: 'chat' | 'reaction') => void;
  players: Player[];
  myPlayerId: string;
  isInputOpen?: boolean;
  onToggleInput?: (open: boolean) => void;
}

const QUICK_REACTIONS = [
  { emoji: '👏', text: 'GG!' },
  { emoji: '✨', text: 'Nice move!' },
  { emoji: '🔥', text: 'On fire!' },
  { emoji: '😮', text: 'Whoa!' },
  { emoji: '🎯', text: 'Calculated!' },
  { emoji: '🤝', text: 'Good luck!' },
  { emoji: '💀', text: 'Oof!' },
  { emoji: '🧠', text: 'Big brain!' },
];

export const MobileChatBubbles: React.FC<MobileChatBubblesProps> = ({
  messages,
  onSendMessage,
  players,
  myPlayerId,
  isInputOpen: externalInputOpen,
  onToggleInput,
}) => {
  const [internalInputOpen, setInternalInputOpen] = useState(false);
  const isInputOpen = externalInputOpen !== undefined ? externalInputOpen : internalInputOpen;
  const setInputOpen = (val: boolean) => {
    setInternalInputOpen(val);
    onToggleInput?.(val);
  };

  const [inputText, setInputText] = useState('');
  const [showQuickReactions, setShowQuickReactions] = useState(false);
  // Keep track of active recent floating bubbles with timestamps
  const [activeBubbles, setActiveBubbles] = useState<Array<ChatMessage & { expiresAt: number }>>([]);
  const prevMsgCountRef = useRef(messages.length);

  // When a new message arrives, add it to the active floating bubble stack
  useEffect(() => {
    if (messages.length > prevMsgCountRef.current) {
      const newMessages = messages.slice(prevMsgCountRef.current);
      const now = Date.now();
      const newBubbles = newMessages
        .filter(m => !m.isSystem)
        .map(m => ({
          ...m,
          expiresAt: now + 4500 // Bubble stays visible for 4.5 seconds
        }));

      if (newBubbles.length > 0) {
        setActiveBubbles(prev => [...prev.slice(-2), ...newBubbles]);
      }
    }
    prevMsgCountRef.current = messages.length;
  }, [messages]);

  // Clean up expired bubbles every 400ms
  useEffect(() => {
    const timer = setInterval(() => {
      const now = Date.now();
      setActiveBubbles(prev => prev.filter(b => b.expiresAt > now));
    }, 400);

    return () => clearInterval(timer);
  }, []);

  const handleSend = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const clean = inputText.trim();
    if (!clean) return;
    sound.playClick();
    onSendMessage(clean, 'chat');
    setInputText('');
    setInputOpen(false);
    setShowQuickReactions(false);
  };

  const handleSendReaction = (text: string) => {
    sound.playClick();
    onSendMessage(text, 'reaction');
    setShowQuickReactions(false);
  };

  const dismissBubble = (id: string) => {
    setActiveBubbles(prev => prev.filter(b => b.id !== id));
  };

  return (
    <>
      {/* 1. Floating Speech Bubbles Stack (Anchored top-left over board, non-intrusive) */}
      <div className="md:hidden pointer-events-none fixed top-16 left-3 z-40 flex flex-col gap-2 max-w-[85%] sm:max-w-xs">
        {activeBubbles.map((bubble) => {
          const isMe = bubble.senderId === myPlayerId;
          const sender = players.find(p => p.id === bubble.senderId);
          const color = sender?.color || bubble.senderColor || '#5BBFEA';

          return (
            <div
              key={bubble.id}
              onClick={() => dismissBubble(bubble.id)}
              className={`pointer-events-auto flex items-end gap-2 animate-slide-up transition-all duration-300 cursor-pointer ${
                isMe ? 'self-end flex-row-reverse' : 'self-start'
              }`}
              title="Tap to dismiss"
            >
              {/* Sender Avatar */}
              <div
                className="w-8 h-8 rounded-2xl flex items-center justify-center text-sm border-2 shadow-xs bg-white shrink-0"
                style={{ borderColor: color }}
              >
                {bubble.senderAvatar || '🎮'}
              </div>

              {/* Speech Bubble */}
              <div
                className="px-3.5 py-2 rounded-2xl shadow-lg backdrop-blur-md text-xs font-bubbly max-w-[220px] break-words transition-all border"
                style={{
                  backgroundColor: isMe ? `${color}25` : 'rgba(255, 255, 255, 0.95)',
                  borderColor: isMe ? color : '#EFEAE1',
                  color: '#2C241E',
                }}
              >
                {!isMe && (
                  <div
                    className="font-bold text-[10px] leading-tight mb-0.5 truncate"
                    style={{ color }}
                  >
                    {bubble.senderName}
                  </div>
                )}
                <div className="leading-snug">{bubble.text}</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 2. Floating Bottom Quick Chat Composer Bar (Sits right above bottom nav, keeps grid visible) */}
      <div className="md:hidden pointer-events-none fixed inset-x-0 bottom-14 z-40 flex flex-col justify-end p-2.5">
        {/* Quick Reaction Chips Bar */}
        {showQuickReactions && (
          <div className="pointer-events-auto mb-2 p-2 bg-white/95 backdrop-blur-md border-2 border-[#EFEAE1] rounded-2xl shadow-xl flex items-center gap-1.5 overflow-x-auto no-scrollbar animate-fade-in">
            {QUICK_REACTIONS.map((r) => (
              <button
                key={r.text}
                type="button"
                onClick={() => handleSendReaction(`${r.emoji} ${r.text}`)}
                className="px-2.5 py-1.5 bg-[#FAF7F2] hover:bg-[#EAF6FD] text-[#3D352E] rounded-xl text-xs font-bubbly font-bold border border-[#EFEAE1] hover:border-[#5BBFEA] transition-all whitespace-nowrap active:scale-95 flex items-center gap-1"
              >
                <span>{r.emoji}</span>
                <span>{r.text}</span>
              </button>
            ))}
            <button
              type="button"
              onClick={() => setShowQuickReactions(false)}
              className="p-1.5 text-[#8C8074] hover:text-[#3D352E] rounded-xl hover:bg-[#FAF7F2]"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* Text Input / Quick Action Pills */}
        <div className="pointer-events-auto flex items-center gap-2">
          {isInputOpen ? (
            <form
              onSubmit={handleSend}
              className="flex-1 flex items-center gap-1.5 p-1.5 bg-white/95 backdrop-blur-md border-2 border-[#5BBFEA] rounded-2xl shadow-xl animate-fade-in"
            >
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                placeholder="Send quick chat..."
                maxLength={70}
                autoFocus
                className="flex-1 bg-transparent px-3 py-1.5 text-xs text-[#3D352E] font-bubbly focus:outline-none placeholder-[#A69B8F]"
              />
              <button
                type="button"
                onClick={() => setShowQuickReactions(!showQuickReactions)}
                className="p-1.5 text-[#FF9F68] hover:bg-[#FAF7F2] rounded-xl transition-colors"
                title="Reactions"
              >
                <Smile className="w-4 h-4" />
              </button>
              <button
                type="submit"
                disabled={!inputText.trim()}
                className="px-3.5 py-1.5 bg-[#5BBFEA] text-white rounded-xl text-xs font-bubbly font-bold disabled:opacity-40 shadow-xs active:scale-95 transition-all flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setInputOpen(false)}
                className="p-1.5 text-[#8C8074] hover:text-[#3D352E] rounded-xl hover:bg-[#FAF7F2]"
              >
                <X className="w-4 h-4" />
              </button>
            </form>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setInputOpen(true);
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/90 hover:bg-white backdrop-blur-md border-2 border-[#EFEAE1] hover:border-[#5BBFEA] rounded-2xl text-xs font-bubbly font-bold text-[#5C5248] shadow-md transition-all active:scale-95"
              >
                <MessageSquare className="w-3.5 h-3.5 text-[#5BBFEA]" />
                <span>Chat</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setShowQuickReactions(!showQuickReactions);
                }}
                className="flex items-center gap-1 px-3 py-1.5 bg-white/90 hover:bg-white backdrop-blur-md border-2 border-[#EFEAE1] hover:border-[#FF9F68] rounded-2xl text-xs font-bubbly font-bold text-[#5C5248] shadow-md transition-all active:scale-95"
                title="Quick Reactions"
              >
                <Smile className="w-3.5 h-3.5 text-[#FF9F68]" />
                <span>Quick Emojis</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};
