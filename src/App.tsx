import React, { useState, useEffect, useRef, useCallback } from 'react';
import { UserProfile, GameRoom, PublicLobbyInfo } from './types';
import { api } from './services/api';
import { sound } from './utils/audio';
import { TitleScreen } from './components/TitleScreen';
import { LobbyView } from './components/LobbyView';
import { Board } from './components/Board';
import { ParticipantList } from './components/ParticipantList';
import { ChatBox } from './components/ChatBox';
import { GameOverModal } from './components/GameOverModal';
import { AuthModal } from './components/AuthModal';
import { ProfileModal } from './components/ProfileModal';
import { LeaderboardModal } from './components/LeaderboardModal';
import { Volume2, VolumeX, LogOut, Clock, MessageSquare, Users, Grid, ArrowLeft } from 'lucide-react';

export default function App() {
  // Auth & Profile state
  const [user, setUser] = useState<UserProfile | null>(null);
  const [guestName, setGuestName] = useState(() => {
    return localStorage.getItem('dotgrid_guest_name') || `Player_${Math.floor(Math.random() * 899 + 100)}`;
  });
  const [guestColor, setGuestColor] = useState(() => {
    return localStorage.getItem('dotgrid_guest_color') || '#5BBFEA';
  });
  const [guestAvatar, setGuestAvatar] = useState(() => {
    return localStorage.getItem('dotgrid_guest_avatar') || '🦊';
  });

  // Modal states
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Game & Network states
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [lobbies, setLobbies] = useState<PublicLobbyInfo[]>([]);
  const [screenShake, setScreenShake] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile layout tab switcher (for narrow screens)
  const [mobileTab, setMobileTab] = useState<'board' | 'players' | 'chat'>('board');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isParticipantsMinimized, setIsParticipantsMinimized] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Persistent login check
  useEffect(() => {
    api.getMe().then((loggedInUser) => {
      if (loggedInUser) {
        setUser(loggedInUser);
      }
    });
  }, []);

  const handleUpdateGuest = (name: string, color: string, avatar: string) => {
    setGuestName(name);
    setGuestColor(color);
    setGuestAvatar(avatar);
    localStorage.setItem('dotgrid_guest_name', name);
    localStorage.setItem('dotgrid_guest_color', color);
    localStorage.setItem('dotgrid_guest_avatar', avatar);
  };

  const connectWebSocket = useCallback(() => {
    if (wsRef.current && (wsRef.current.readyState === WebSocket.OPEN || wsRef.current.readyState === WebSocket.CONNECTING)) {
      return;
    }

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      try {
        const { event: evt, payload } = JSON.parse(event.data);

        if (evt === 'lobbies:list') {
          setLobbies(payload);
        } else if (evt === 'room:joined') {
          setRoom(payload.room);
          setMyPlayerId(payload.yourPlayerId);
        } else if (evt === 'room:player_joined') {
          setRoom(payload.room);
        } else if (evt === 'room:update_players') {
          setRoom(prev => prev ? { ...prev, players: payload.players } : null);
        } else if (evt === 'room:sync') {
          setRoom(payload.room);
        } else if (evt === 'game:started') {
          setRoom(payload.room);
          sound.playTurnNotification();
        } else if (evt === 'game:move_result') {
          const { type, r, c, playerId, playerColor, newlyClaimedBoxes, bonusTurn, currentCombo, nextTurnPlayerId, scores, hLines, hLineColors, vLines, vLineColors, boxes } = payload;
          setRoom(prev => {
            if (!prev) return null;

            if (newlyClaimedBoxes && newlyClaimedBoxes.length > 0) {
              sound.playBoxClaim(currentCombo);
              setScreenShake(s => s + 1);
            }

            const updatedPlayers = prev.players.map(p => {
              const sc = scores?.find((s: any) => s.id === p.id);
              return sc ? { ...p, score: sc.score } : { ...p };
            });

            const nextIdx = updatedPlayers.findIndex(p => p.id === nextTurnPlayerId);

            // Deep clone board arrays so React detects state change
            const newHLines = hLines 
              ? hLines.map((row: any) => [...row]) 
              : prev.hLines.map((row, ri) => row.map((val, ci) => (type === 'h' && ri === r && ci === c ? true : val)));

            const newHColors = hLineColors 
              ? hLineColors.map((row: any) => [...row]) 
              : prev.hLineColors.map((row, ri) => row.map((val, ci) => (type === 'h' && ri === r && ci === c ? playerColor : val)));

            const newVLines = vLines 
              ? vLines.map((row: any) => [...row]) 
              : prev.vLines.map((row, ri) => row.map((val, ci) => (type === 'v' && ri === r && ci === c ? true : val)));

            const newVColors = vLineColors 
              ? vLineColors.map((row: any) => [...row]) 
              : prev.vLineColors.map((row, ri) => row.map((val, ci) => (type === 'v' && ri === r && ci === c ? playerColor : val)));

            const newBoxes = boxes 
              ? boxes.map((row: any) => row.map((b: any) => (b ? { ...b } : null)))
              : prev.boxes.map(row => [...row]);

            return {
              ...prev,
              hLines: newHLines,
              hLineColors: newHColors,
              vLines: newVLines,
              vLineColors: newVColors,
              boxes: newBoxes,
              players: updatedPlayers,
              currentTurnIndex: nextIdx >= 0 ? nextIdx : prev.currentTurnIndex,
              currentCombo
            };
          });
        } else if (evt === 'turn:tick') {
          setRoom(prev => prev ? { ...prev, turnTimeRemaining: payload.remaining } : null);
          if (payload.remaining <= 5) {
            sound.playTick();
          }
        } else if (evt === 'chat:message') {
          setRoom(prev => {
            if (!prev) return null;
            return {
              ...prev,
              chatMessages: [...prev.chatMessages, payload]
            };
          });
        } else if (evt === 'game:over') {
          setRoom(payload.room);
        } else if (evt === 'error') {
          showToast(payload.message || 'Action error');
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    };

    ws.onclose = () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 2000);
    };
  }, []);

  useEffect(() => {
    connectWebSocket();
    return () => {
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      wsRef.current?.close();
    };
  }, [connectWebSocket]);

  const sendWs = (event: string, payload: any) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ event, payload }));
    } else {
      connectWebSocket();
    }
  };

  const getActivePlayerPayload = () => ({
    userId: user?.id,
    name: user ? user.displayName : guestName,
    color: user ? user.color : guestColor,
    avatar: user ? user.avatar : guestAvatar,
  });

  const handleQuickPlay = () => {
    const openLobby = lobbies.find(l => l.state === 'lobby' && l.playerCount < l.maxPlayers);
    if (openLobby) {
      handleJoinRoom(openLobby.code);
    } else {
      handleCreateRoom(true);
    }
  };

  const handleCreateRoom = (isPublic = true) => {
    sendWs('room:create', {
      name: `${user ? user.displayName : guestName}'s Grid`,
      isPublic,
      rows: 4,
      cols: 4,
      turnTime: 30,
      maxPlayers: 4,
      player: getActivePlayerPayload(),
    });
  };

  const handleJoinRoom = (code: string) => {
    sendWs('room:join', {
      roomCode: code,
      player: getActivePlayerPayload(),
    });
  };

  const handlePlayVsBot = () => {
    sendWs('room:create', {
      name: 'Solo vs AI Practice',
      isPublic: false,
      rows: 4,
      cols: 4,
      turnTime: 0,
      maxPlayers: 2,
      player: getActivePlayerPayload(),
    });

    setTimeout(() => {
      sendWs('room:add_bot', { level: 'medium' });
    }, 400);
  };

  const handleStartGame = () => {
    sendWs('room:start', {});
  };

  const handleToggleReady = () => {
    sendWs('room:ready', {});
  };

  const handleAddBot = (level: 'easy' | 'medium' | 'hard') => {
    sendWs('room:add_bot', { level });
  };

  const handleRemoveBot = (botId: string) => {
    sendWs('room:remove_bot', { botId });
  };

  const handleSelectLobbyColor = (color: string) => {
    sendWs('room:update_color', { color });
    if (!user) {
      setGuestColor(color);
      localStorage.setItem('dotgrid_guest_color', color);
    }
  };

  const handleUpdateSettings = (rows: number, cols: number, turnTime: number) => {
    sendWs('room:update_settings', { rows, cols, turnTime });
  };

  const handleMakeMove = (type: 'h' | 'v', r: number, c: number) => {
    sendWs('game:move', { type, r, c });
  };

  const handleSendChat = (text: string, type: 'chat' | 'reaction' = 'chat') => {
    sendWs('chat:send', { text, type });
  };

  const handleLeaveRoom = () => {
    sendWs('room:leave', {});
    setRoom(null);
    setMyPlayerId('');
  };

  const handlePlayAgain = () => {
    sendWs('room:start', {});
  };

  const handleToggleMute = () => {
    const muted = sound.toggleMute();
    setIsMuted(muted);
  };

  const handleLogout = () => {
    api.clearToken();
    setUser(null);
  };

  const activePlayer = room?.players[room?.currentTurnIndex || 0];
  const isMyTurn = room?.state === 'playing' && activePlayer?.id === myPlayerId;

  return (
    <div className="relative min-h-screen w-full bg-[#FAF7F2] text-[#3D352E] flex flex-col font-sans select-none overflow-x-hidden">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 bg-[#FF8DA1] text-white font-bubbly font-bold text-xs px-4 py-2 rounded-2xl shadow-lg animate-bounce">
          {toastMessage}
        </div>
      )}

      {/* VIEW ROUTING */}
      {!room ? (
        /* Title Screen */
        <TitleScreen
          user={user}
          guestName={guestName}
          guestColor={guestColor}
          guestAvatar={guestAvatar}
          onUpdateGuest={handleUpdateGuest}
          onOpenAuth={() => setShowAuthModal(true)}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onQuickPlay={handleQuickPlay}
          onCreateRoom={() => handleCreateRoom(true)}
          onJoinRoom={handleJoinRoom}
          onPlayVsBot={handlePlayVsBot}
          lobbies={lobbies}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
        />
      ) : room.state === 'lobby' ? (
        /* In-Room Lobby (Second Screen) */
        <div className="min-h-screen w-full flex flex-col justify-center items-center p-4 md:p-8">
          <div className="w-full max-w-4xl flex items-center justify-between pb-4">
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  handleLeaveRoom();
                }}
                className="flex items-center gap-2 px-3.5 py-2 rounded-2xl bg-white border-2 border-[#EFEAE1] hover:border-[#FFB7C5] hover:bg-[#FFF0F2] text-[#7A7067] hover:text-[#D93856] font-bubbly font-bold text-xs transition-all active:scale-95 shadow-xs"
                title="Back to Main Menu"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Menu</span>
              </button>
              <span className="font-bubbly font-bold text-xl text-[#5BBFEA] tracking-wider hidden sm:inline">
                GridBox
              </span>
            </div>

            <button
              onClick={handleToggleMute}
              className="p-2.5 rounded-2xl bg-white border-2 border-[#EFEAE1] text-[#7A7067] hover:text-[#3D352E] transition-colors shadow-xs"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-[#FF8DA1]" /> : <Volume2 className="w-4 h-4 text-[#5BBFEA]" />}
            </button>
          </div>

          {/* Centered Lobby Content */}
          <div className="w-full max-w-4xl my-auto">
            <LobbyView
              room={room}
              myPlayerId={myPlayerId}
              onStartGame={handleStartGame}
              onToggleReady={handleToggleReady}
              onSelectColor={handleSelectLobbyColor}
              onAddBot={handleAddBot}
              onRemoveBot={handleRemoveBot}
              onUpdateSettings={handleUpdateSettings}
              onLeaveRoom={handleLeaveRoom}
            />
          </div>
        </div>
      ) : (
        /* Active Game Playfield with:
           - Participant List fixed towards the middle/left
           - Grid in the centre
           - Fixed Chatbox at the right
        */
        <div className="h-screen w-full flex flex-col justify-between overflow-hidden bg-[#FAF7F2]">
          {/* Aesthetic Cream White Minimal Top Header */}
          <header className="relative z-30 px-5 py-3 bg-white/95 backdrop-blur-md border-b-2 border-[#EFEAE1] flex items-center justify-between gap-4 shadow-[0_2px_12px_rgba(180,160,140,0.06)] shrink-0">
            {/* Left: Leave & Room Info */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  handleLeaveRoom();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#FFF0F2] border-2 border-[#EFEAE1] hover:border-[#FFB7C5] text-[#8C8074] hover:text-[#D93856] font-bubbly font-bold text-xs transition-all active:scale-95 shadow-xs"
                title="Leave match"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Leave</span>
              </button>

              <div className="hidden sm:flex items-center gap-2">
                <span className="font-bubbly text-xs text-[#8C8074]">ROOM:</span>
                <span className="font-bubbly font-bold text-xs text-[#5BBFEA]">
                  {room.code}
                </span>
                <span className="text-[10px] bg-[#FAF5EE] text-[#7A7067] px-2.5 py-0.5 rounded-full font-bubbly border border-[#E8DFC8]">
                  {room.gridRows}×{room.gridCols}
                </span>
              </div>
            </div>

            {/* Center: Turn Action Pill & Timer Readout */}
            <div className="flex items-center gap-3">
              <div
                className={`px-4 py-1.5 rounded-full border-2 text-xs font-bubbly font-bold flex items-center gap-2 transition-all shadow-xs ${
                  isMyTurn
                    ? 'bg-[#EAF6FD] border-[#5BBFEA] text-[#24485D] animate-pulse'
                    : 'bg-[#FAF7F2] border-[#EFEAE1] text-[#7A7067]'
                }`}
              >
                <span className="text-base">{activePlayer?.avatar}</span>
                <span>
                  {isMyTurn ? 'Your Turn! Draw a line' : `${activePlayer?.name}'s Turn`}
                </span>
              </div>

              {room.turnTimeLimit > 0 && (
                <div
                  className={`flex items-center gap-1 font-mono text-xs font-bold px-3 py-1.5 rounded-2xl border-2 ${
                    room.turnTimeRemaining <= 5
                      ? 'bg-[#FFF0F2] border-[#FF8DA1] text-[#D93856] animate-ping'
                      : 'bg-white border-[#EFEAE1] text-[#7A7067]'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span className="tabular-nums">{room.turnTimeRemaining}s</span>
                </div>
              )}
            </div>

            {/* Right: Sound Toggle & Mobile Tab Selector */}
            <div className="flex items-center gap-2">
              {/* Mobile View Switcher (visible on smaller screens) */}
              <div className="flex md:hidden bg-[#FAF7F2] p-1 rounded-2xl border border-[#EFEAE1]">
                <button
                  onClick={() => setMobileTab('players')}
                  className={`p-1.5 rounded-xl ${mobileTab === 'players' ? 'bg-white shadow-xs text-[#5BBFEA]' : 'text-[#8C8074]'}`}
                  title="Participants"
                >
                  <Users className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMobileTab('board')}
                  className={`p-1.5 rounded-xl ${mobileTab === 'board' ? 'bg-white shadow-xs text-[#5BBFEA]' : 'text-[#8C8074]'}`}
                  title="Grid"
                >
                  <Grid className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setMobileTab('chat')}
                  className={`p-1.5 rounded-xl ${mobileTab === 'chat' ? 'bg-white shadow-xs text-[#5BBFEA]' : 'text-[#8C8074]'}`}
                  title="Chat"
                >
                  <MessageSquare className="w-4 h-4" />
                </button>
              </div>

              {/* Quick Sidebar Toggles (Participants & Chat) */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsParticipantsMinimized(!isParticipantsMinimized);
                }}
                className={`p-2 rounded-2xl border-2 transition-all shadow-xs flex items-center gap-1.5 font-bubbly text-xs font-bold ${
                  isParticipantsMinimized
                    ? 'bg-[#EAF6FD] border-[#5BBFEA] text-[#24485D]'
                    : 'bg-[#FAF7F2] hover:bg-[#F2ECE3] border-[#EFEAE1] text-[#7A7067]'
                }`}
                title={isParticipantsMinimized ? 'Expand Players (reduces grid view)' : 'Minimize Players (Expands Grid View)'}
              >
                <Users className="w-4 h-4 text-[#5BBFEA]" />
                <span className="hidden xl:inline">
                  {isParticipantsMinimized ? 'Expand Players' : 'Players'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsChatMinimized(!isChatMinimized);
                }}
                className={`p-2 rounded-2xl border-2 transition-all shadow-xs flex items-center gap-1.5 font-bubbly text-xs font-bold ${
                  isChatMinimized
                    ? 'bg-[#EAF6FD] border-[#5BBFEA] text-[#24485D]'
                    : 'bg-[#FAF7F2] hover:bg-[#F2ECE3] border-[#EFEAE1] text-[#7A7067]'
                }`}
                title={isChatMinimized ? 'Expand Chat (reduces grid)' : 'Minimize Chat (Expands Grid)'}
              >
                <MessageSquare className="w-4 h-4 text-[#5BBFEA]" />
                <span className="hidden xl:inline">
                  {isChatMinimized ? 'Expand Chat' : 'Chat'}
                </span>
              </button>

              <button
                onClick={handleToggleMute}
                className="p-2 rounded-2xl bg-[#FAF7F2] hover:bg-[#F2ECE3] border-2 border-[#EFEAE1] text-[#8C8074] hover:text-[#3D352E] transition-colors shadow-xs"
              >
                {isMuted ? <VolumeX className="w-4 h-4 text-[#FF8DA1]" /> : <Volume2 className="w-4 h-4 text-[#5BBFEA]" />}
              </button>
            </div>
          </header>

          {/* Main 3-Column Layout:
              1. Participant List (fixed towards the middle/left, collapsible)
              2. Grid (in the centre, dynamically expands)
              3. Chatbox (fixed at the right, collapsible)
          */}
          <main className="relative flex-1 flex items-center justify-between p-3 sm:p-5 gap-4 overflow-hidden">
            {/* 1. PARTICIPANT LIST (COLLAPSIBLE / EXPANDABLE) */}
            <div
              className={`h-full transition-all duration-300 ease-out ${
                mobileTab === 'players' ? 'flex w-full absolute inset-3 z-30' : 'hidden md:flex'
              }`}
            >
              <ParticipantList
                room={room}
                myPlayerId={myPlayerId}
                isMinimized={isParticipantsMinimized}
                onToggleMinimize={() => setIsParticipantsMinimized(!isParticipantsMinimized)}
              />
            </div>

            {/* 2. GRID IN THE CENTRE (EXPANDS SMOOTHLY WHEN SIDEBARS ARE MINIMIZED) */}
            <div
              className={`flex-1 h-full flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-out ${
                mobileTab === 'board' ? 'flex' : 'hidden md:flex'
              }`}
            >
              <Board
                room={room}
                myPlayerId={myPlayerId}
                onMakeMove={handleMakeMove}
                shakeTrigger={screenShake}
                isExpanded={isChatMinimized || isParticipantsMinimized}
                expansionLevel={((isChatMinimized ? 1 : 0) + (isParticipantsMinimized ? 1 : 0)) as 0 | 1 | 2}
              />
            </div>

            {/* 3. CHATBOX AT THE RIGHT (COLLAPSIBLE / EXPANDABLE) */}
            <div
              className={`h-full transition-all duration-300 ease-out ${
                mobileTab === 'chat' ? 'flex w-full absolute inset-3 z-30' : 'hidden md:flex'
              }`}
            >
              <ChatBox
                messages={room.chatMessages}
                onSendMessage={handleSendChat}
                players={room.players}
                myPlayerId={myPlayerId}
                isGameActive={true}
                isMinimized={isChatMinimized}
                onToggleMinimize={() => setIsChatMinimized(!isChatMinimized)}
              />
            </div>
          </main>

          {/* Game Over Modal */}
          <GameOverModal
            room={room}
            myPlayerId={myPlayerId}
            onPlayAgain={handlePlayAgain}
            onLeaveRoom={handleLeaveRoom}
          />
        </div>
      )}

      {/* Global Modals */}
      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={(loggedInUser) => {
          setUser(loggedInUser);
        }}
      />

      {user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          onUserUpdated={(updated) => setUser(updated)}
          onLogout={handleLogout}
        />
      )}

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUserId={user?.id}
      />
    </div>
  );
}
