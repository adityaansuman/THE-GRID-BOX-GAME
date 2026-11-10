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
import { DisconnectedModal } from './components/DisconnectedModal';
import { MobileChatBubbles } from './components/MobileChatBubbles';
import { Volume2, VolumeX, LogOut, Clock, MessageSquare, Users, ArrowLeft, Grid, RefreshCw, WifiOff } from 'lucide-react';

export default function App() {
  // Auth & Profile state - Synchronously initialize from stored account
  const [user, setUser] = useState<UserProfile | null>(() => api.getUser());
  const [isMobileChatOpen, setIsMobileChatOpen] = useState(false);
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
  const [authModalMode, setAuthModalMode] = useState<'login' | 'register'>('login');
  const [authModalDefaultUsername, setAuthModalDefaultUsername] = useState('');
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [isMuted, setIsMuted] = useState(sound.getMuted());

  // Game & Network states
  const [room, setRoom] = useState<GameRoom | null>(null);
  const [myPlayerId, setMyPlayerId] = useState<string>('');
  const [lobbies, setLobbies] = useState<PublicLobbyInfo[]>([]);
  const [screenShake, setScreenShake] = useState(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isWsDisconnected, setIsWsDisconnected] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectCountdown, setReconnectCountdown] = useState(7);
  const reconnectIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const missedPingsRef = useRef(0);

  // Mobile layout tab switcher (for narrow screens)
  const [mobileTab, setMobileTab] = useState<'board' | 'players' | 'chat'>('board');
  const [isChatMinimized, setIsChatMinimized] = useState(false);
  const [isParticipantsMinimized, setIsParticipantsMinimized] = useState(false);

  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const roomRef = useRef<GameRoom | null>(null);
  roomRef.current = room;
  const myPlayerIdRef = useRef<string>('');
  myPlayerIdRef.current = myPlayerId;
  const userRef = useRef<UserProfile | null>(null);
  userRef.current = user;

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const startDisconnectGraceBuffer = useCallback(() => {
    if (!roomRef.current) return;
    if (reconnectIntervalRef.current) return; // already active countdown

    setIsReconnecting(true);
    setReconnectCountdown(7);

    reconnectIntervalRef.current = setInterval(() => {
      setReconnectCountdown(prev => {
        if (prev <= 1) {
          if (reconnectIntervalRef.current) {
            clearInterval(reconnectIntervalRef.current);
            reconnectIntervalRef.current = null;
          }
          setIsReconnecting(false);
          setIsWsDisconnected(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, []);

  const clearDisconnectGraceBuffer = useCallback(() => {
    if (reconnectIntervalRef.current) {
      clearInterval(reconnectIntervalRef.current);
      reconnectIntervalRef.current = null;
    }
    setIsReconnecting(false);
    setIsWsDisconnected(false);
    setReconnectCountdown(7);
    missedPingsRef.current = 0;
  }, []);

  // Persistent login check - load immediately from cache and sync with server
  useEffect(() => {
    const cachedUser = api.getUser();
    if (cachedUser) {
      setUser(cachedUser);
      setGuestName(cachedUser.displayName || cachedUser.username);
      setGuestAvatar(cachedUser.avatar);
      setGuestColor(cachedUser.color);
    }
    api.getMe().then((loggedInUser) => {
      if (loggedInUser) {
        setUser(loggedInUser);
        setGuestName(loggedInUser.displayName || loggedInUser.username);
        setGuestAvatar(loggedInUser.avatar);
        setGuestColor(loggedInUser.color);
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
      if (event.data === 'pong') {
        missedPingsRef.current = 0;
        clearDisconnectGraceBuffer();
        return;
      }
      try {
        const { event: evt, payload } = JSON.parse(event.data);

        if (evt === 'lobbies:list') {
          setLobbies(payload);
        } else if (evt === 'room:joined') {
          setRoom(payload.room);
          setMyPlayerId(payload.yourPlayerId);
          clearDisconnectGraceBuffer();
        } else if (evt === 'room:reconnected') {
          setRoom(payload.room);
          setMyPlayerId(payload.yourPlayerId);
          clearDisconnectGraceBuffer();
          showToast('✓ Reconnected to match!');
        } else if (evt === 'room:reconnect_failed') {
          clearDisconnectGraceBuffer();
          setIsWsDisconnected(true);
          showToast(payload.message || 'Match session ended.');
        } else if (evt === 'player:disconnected_grace') {
          setRoom(prev => {
            if (!prev) return null;
            return {
              ...prev,
              players: prev.players.map(p => p.id === payload.playerId ? { ...p, isDisconnected: true } : p)
            };
          });
          showToast(`⚠️ ${payload.playerName} disconnected (holding match for ${payload.bufferSeconds}s)...`);
        } else if (evt === 'player:reconnected') {
          setRoom(prev => {
            if (!prev) return null;
            return {
              ...prev,
              players: prev.players.map(p => p.id === payload.playerId ? { ...p, isDisconnected: false } : p)
            };
          });
          showToast(`✓ ${payload.playerName} reconnected!`);
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
          api.getMe().then(freshUser => {
            if (freshUser) setUser(freshUser);
          });
        } else if (evt === 'error') {
          showToast(payload.message || 'Action error');
        }
      } catch (err) {
        console.error('Error handling WS message:', err);
      }
    };

    ws.onopen = () => {
      missedPingsRef.current = 0;
      if (roomRef.current && myPlayerIdRef.current) {
        // Automatic transparent reconnection within the 7s grace period
        ws.send(JSON.stringify({
          event: 'room:reconnect',
          payload: {
            roomCode: roomRef.current.code,
            playerId: myPlayerIdRef.current,
            userId: userRef.current?.id
          }
        }));
      } else {
        clearDisconnectGraceBuffer();
      }
    };

    ws.onerror = () => {
      if (roomRef.current) {
        startDisconnectGraceBuffer();
      }
    };

    ws.onclose = () => {
      if (roomRef.current) {
        startDisconnectGraceBuffer();
      }
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = setTimeout(connectWebSocket, 800);
    };
  }, [clearDisconnectGraceBuffer, startDisconnectGraceBuffer]);

  // Instant browser-level network drop detection
  useEffect(() => {
    const handleOffline = () => {
      if (roomRef.current) {
        startDisconnectGraceBuffer();
      }
    };
    const handleOnline = () => {
      connectWebSocket();
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online', handleOnline);

    return () => {
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online', handleOnline);
    };
  }, [connectWebSocket, startDisconnectGraceBuffer]);

  // Active client heartbeat to detect genuine network drops (6s interval)
  useEffect(() => {
    const pingInterval = setInterval(() => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        missedPingsRef.current++;
        if (missedPingsRef.current >= 2 && roomRef.current) {
          startDisconnectGraceBuffer();
        }
        return;
      }
      try {
        wsRef.current.send('ping');
      } catch {
        missedPingsRef.current++;
        if (missedPingsRef.current >= 2 && roomRef.current) {
          startDisconnectGraceBuffer();
        }
      }
    }, 6000);

    return () => clearInterval(pingInterval);
  }, [startDisconnectGraceBuffer]);

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

  const getActivePlayerPayload = () => {
    const effective = user || api.getUser();
    return {
      userId: effective?.id,
      name: effective ? (effective.displayName || effective.username) : guestName,
      color: effective ? (effective.color || '#5BBFEA') : guestColor,
      avatar: effective ? (effective.avatar || '🎮') : guestAvatar,
    };
  };

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

  const handleUpdateSettings = (rows: number, cols: number, turnTime: number, maxPlayers?: number) => {
    sendWs('room:update_settings', { rows, cols, turnTime, maxPlayers });
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
    setGuestName('Player');
    setGuestAvatar('🦊');
    setGuestColor('#5BBFEA');
    localStorage.removeItem('dotgrid_guest_name');
    localStorage.removeItem('dotgrid_guest_avatar');
    localStorage.removeItem('dotgrid_guest_color');
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

      {/* 7-Second Network Grace Buffer Banner */}
      {isReconnecting && room && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-50 bg-[#FFF7ED] border-2 border-[#FDBA74] text-[#C2410C] font-bubbly font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2.5 animate-bounce">
          <RefreshCw className="w-4 h-4 animate-spin text-[#EA580C]" />
          <span>Wi-Fi signal blip! Reconnecting in background ({reconnectCountdown}s remaining)...</span>
        </div>
      )}

      {/* Friend Disconnection Buffer Notice */}
      {room && room.players.some(p => p.id !== myPlayerId && p.isDisconnected) && !isReconnecting && (
        <div className="fixed top-3 left-1/2 -translate-x-1/2 z-40 bg-[#FEF2F2] border-2 border-[#FECACA] text-[#DC2626] font-bubbly font-bold text-xs px-4 py-2.5 rounded-2xl shadow-xl flex items-center gap-2 animate-fade-in">
          <WifiOff className="w-4 h-4 text-[#DC2626] animate-pulse" />
          <span>
            {room.players.find(p => p.id !== myPlayerId && p.isDisconnected)?.name} disconnected. Holding match for 7s...
          </span>
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
          onOpenAuth={(mode, defaultUsername) => {
            setAuthModalMode(mode || 'login');
            setAuthModalDefaultUsername(defaultUsername || '');
            setShowAuthModal(true);
          }}
          onOpenProfile={() => setShowProfileModal(true)}
          onOpenLeaderboard={() => setShowLeaderboardModal(true)}
          onQuickPlay={handleQuickPlay}
          onCreateRoom={() => handleCreateRoom(true)}
          onJoinRoom={handleJoinRoom}
          onPlayVsBot={handlePlayVsBot}
          lobbies={lobbies}
          isMuted={isMuted}
          onToggleMute={handleToggleMute}
          onLogout={handleLogout}
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
        <div className="fixed inset-0 h-[100dvh] max-h-[100dvh] w-full flex flex-col justify-between overflow-hidden bg-[#FAF7F2]">
          {/* Aesthetic Cream White Minimal Top Header */}
          <header className="relative z-30 px-3 sm:px-5 py-2 sm:py-2.5 bg-white/95 backdrop-blur-md border-b-2 border-[#EFEAE1] flex items-center justify-between gap-2 sm:gap-4 shadow-[0_2px_12px_rgba(180,160,140,0.06)] shrink-0">
            {/* Left: Leave & Room Info */}
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => {
                  sound.playClick();
                  handleLeaveRoom();
                }}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-2xl bg-[#FAF7F2] hover:bg-[#FFF0F2] border-2 border-[#EFEAE1] hover:border-[#FFB7C5] text-[#8C8074] hover:text-[#D93856] font-bubbly font-bold text-xs transition-all active:scale-95 shadow-xs shrink-0"
                title="Leave match"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">Leave</span>
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

            {/* Center: Sleek Compact Turn Badge with Player Color & Timer (Replaces verbose text with color badge) */}
            <div className="flex items-center gap-1.5 sm:gap-3">
              <div
                className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-2xl border-2 text-xs font-bubbly font-bold flex items-center gap-1.5 sm:gap-2 transition-all shadow-xs ${
                  isMyTurn
                    ? 'bg-[#EAF6FD] text-[#24485D] animate-pulse ring-2 ring-offset-1'
                    : 'bg-[#FAF7F2] border-[#EFEAE1] text-[#7A7067]'
                }`}
                style={{
                  borderColor: isMyTurn ? (activePlayer?.color || '#5BBFEA') : '#EFEAE1',
                  ['--tw-ring-color' as any]: isMyTurn ? (activePlayer?.color || '#5BBFEA') : undefined
                }}
                title={isMyTurn ? 'Your Turn' : `${activePlayer?.name}'s Turn`}
              >
                {/* Active Player Avatar */}
                <span className="text-sm sm:text-base leading-none">{activePlayer?.avatar}</span>

                {/* Vibrant Line Color Bar indicator */}
                <div
                  className="w-5 sm:w-8 h-2 sm:h-2.5 rounded-full border border-black/10 shadow-xs shrink-0 transition-colors"
                  style={{ backgroundColor: activePlayer?.color || '#5BBFEA' }}
                  title={`${activePlayer?.name}'s line color`}
                />

                {/* Compact Turn Tag */}
                {isMyTurn ? (
                  <span
                    className="text-[10px] sm:text-xs font-bubbly font-bold px-1.5 py-0.2 rounded-md tracking-wide"
                    style={{
                      color: activePlayer?.color || '#5BBFEA',
                      backgroundColor: `${activePlayer?.color || '#5BBFEA'}22`
                    }}
                  >
                    You
                  </span>
                ) : (
                  <span className="hidden sm:inline text-xs text-[#7A7067] font-bubbly truncate max-w-[80px]">
                    {activePlayer?.name}
                  </span>
                )}
              </div>

              {room.turnTimeLimit > 0 && (
                <div
                  className={`flex items-center gap-1 font-mono text-[11px] sm:text-xs font-bold px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-2xl border-2 shrink-0 ${
                    room.turnTimeRemaining <= 5
                      ? 'bg-[#FFF0F2] border-[#FF8DA1] text-[#D93856] animate-ping'
                      : 'bg-white border-[#EFEAE1] text-[#7A7067]'
                  }`}
                >
                  <Clock className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                  <span className="tabular-nums">{room.turnTimeRemaining}s</span>
                </div>
              )}
            </div>

            {/* Right: Sound Toggle & Desktop Sidebar Toggles */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              {/* Desktop-only Sidebar Toggles */}
              <button
                type="button"
                onClick={() => {
                  sound.playClick();
                  setIsParticipantsMinimized(!isParticipantsMinimized);
                }}
                className={`hidden md:flex p-2 rounded-2xl border-2 transition-all shadow-xs items-center gap-1.5 font-bubbly text-xs font-bold ${
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
                className={`hidden md:flex p-2 rounded-2xl border-2 transition-all shadow-xs items-center gap-1.5 font-bubbly text-xs font-bold ${
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
                title={isMuted ? 'Unmute' : 'Mute'}
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
          <main className="relative flex-1 min-h-0 w-full flex items-center justify-between p-1 sm:p-4 gap-2 sm:gap-4 overflow-hidden">
            {/* 1. PARTICIPANT LIST (DESKTOP SIDEBAR) */}
            <div className="hidden md:flex h-full min-h-0 transition-all duration-300 ease-out">
              <ParticipantList
                room={room}
                myPlayerId={myPlayerId}
                isMinimized={isParticipantsMinimized}
                onToggleMinimize={() => setIsParticipantsMinimized(!isParticipantsMinimized)}
              />
            </div>

            {/* 2. GRID IN THE CENTRE (ALWAYS VISIBLE & PLAYABLE ON MOBILE & DESKTOP) */}
            <div className="flex-1 h-full min-h-0 flex items-center justify-center relative overflow-hidden transition-all duration-300 ease-out">
              <Board
                room={room}
                myPlayerId={myPlayerId}
                onMakeMove={handleMakeMove}
                shakeTrigger={screenShake}
                isExpanded={isChatMinimized || isParticipantsMinimized}
                expansionLevel={((isChatMinimized ? 1 : 0) + (isParticipantsMinimized ? 1 : 0)) as 0 | 1 | 2}
              />
            </div>

            {/* 3. CHATBOX (DESKTOP SIDEBAR) */}
            <div className="hidden md:flex h-full transition-all duration-300 ease-out">
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

            {/* MOBILE FLOATING CHAT BUBBLES & QUICK COMPOSER (Play and chat simultaneously) */}
            <MobileChatBubbles
              messages={room.chatMessages}
              onSendMessage={handleSendChat}
              players={room.players}
              myPlayerId={myPlayerId}
              isInputOpen={isMobileChatOpen}
              onToggleInput={setIsMobileChatOpen}
            />

            {/* MOBILE PARTICIPANTS DRAWER / OVERLAY */}
            {mobileTab === 'players' && (
              <div className="md:hidden fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex flex-col justify-end p-3 animate-fade-in">
                <div className="bg-white border-2 border-[#EFEAE1] rounded-3xl p-4 max-h-[75vh] flex flex-col shadow-2xl">
                  <div className="flex items-center justify-between pb-3 mb-2 border-b border-[#F0EAE1]">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-[#5BBFEA]" />
                      <span className="font-bubbly font-bold text-sm text-[#3D352E]">
                        Room Players ({room.players.length}/{room.maxPlayers})
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        sound.playClick();
                        setMobileTab('board');
                      }}
                      className="px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#EAF6FD] text-[#5BBFEA] font-bubbly font-bold text-xs rounded-xl border border-[#EFEAE1]"
                    >
                      Close Roster
                    </button>
                  </div>
                  <div className="overflow-y-auto max-h-[60vh]">
                    <ParticipantList
                      room={room}
                      myPlayerId={myPlayerId}
                      isMinimized={false}
                    />
                  </div>
                </div>
              </div>
            )}
          </main>

          {/* Mobile Bottom Navigation Bar (Non-intrusive) */}
          <nav className="flex md:hidden items-center justify-around px-3 py-1.5 bg-white/95 backdrop-blur-md border-t-2 border-[#EFEAE1] shadow-[0_-2px_12px_rgba(180,160,140,0.06)] shrink-0 z-40">
            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setMobileTab(mobileTab === 'players' ? 'board' : 'players');
              }}
              className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
                mobileTab === 'players'
                  ? 'text-[#5BBFEA] font-bold bg-[#EAF6FD]'
                  : 'text-[#8C8074] hover:text-[#3D352E]'
              }`}
            >
              <div className="relative">
                <Users className="w-5 h-5" />
                <span className="absolute -top-1 -right-2 text-[9px] font-mono bg-[#5BBFEA] text-white px-1 rounded-full font-bold">
                  {room.players.length}
                </span>
              </div>
              <span className="font-bubbly text-[10px]">Players</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setMobileTab('board');
                setIsMobileChatOpen(false);
              }}
              className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
                mobileTab === 'board' && !isMobileChatOpen
                  ? 'text-[#5BBFEA] font-bold bg-[#EAF6FD]'
                  : 'text-[#8C8074] hover:text-[#3D352E]'
              }`}
            >
              <Grid className="w-5 h-5" />
              <span className="font-bubbly text-[10px]">Grid ({room.gridRows}×{room.gridCols})</span>
            </button>

            <button
              type="button"
              onClick={() => {
                sound.playClick();
                setIsMobileChatOpen(!isMobileChatOpen);
                setMobileTab('board');
              }}
              className={`flex-1 py-1.5 flex flex-col items-center gap-0.5 rounded-2xl transition-all active:scale-95 ${
                isMobileChatOpen
                  ? 'text-[#5BBFEA] font-bold bg-[#EAF6FD]'
                  : 'text-[#8C8074] hover:text-[#3D352E]'
              }`}
            >
              <div className="relative">
                <MessageSquare className="w-5 h-5" />
                {room.chatMessages.filter(m => !m.isSystem).length > 0 && (
                  <span className="absolute -top-1 -right-2 text-[9px] font-mono bg-[#FF8DA1] text-white px-1 rounded-full font-bold">
                    {room.chatMessages.filter(m => !m.isSystem).length}
                  </span>
                )}
              </div>
              <span className="font-bubbly text-[10px]">{isMobileChatOpen ? 'Close Chat' : 'Quick Chat'}</span>
            </button>
          </nav>

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
        initialMode={authModalMode}
        defaultUsername={authModalDefaultUsername}
        onClose={() => setShowAuthModal(false)}
        onAuthenticated={(loggedInUser) => {
          setUser(loggedInUser);
          setGuestName(loggedInUser.displayName || loggedInUser.username);
          setGuestAvatar(loggedInUser.avatar);
          setGuestColor(loggedInUser.color);
          localStorage.setItem('dotgrid_guest_name', loggedInUser.displayName || loggedInUser.username);
          localStorage.setItem('dotgrid_guest_avatar', loggedInUser.avatar);
          localStorage.setItem('dotgrid_guest_color', loggedInUser.color);
          if (roomRef.current) {
            sendWs('room:update_profile', {
              userId: loggedInUser.id,
              name: loggedInUser.displayName,
              color: loggedInUser.color,
              avatar: loggedInUser.avatar
            });
          }
        }}
      />

      {user && (
        <ProfileModal
          isOpen={showProfileModal}
          onClose={() => setShowProfileModal(false)}
          user={user}
          onUserUpdated={(updated) => {
            setUser(updated);
            if (roomRef.current) {
              sendWs('room:update_profile', {
                userId: updated.id,
                name: updated.displayName,
                color: updated.color,
                avatar: updated.avatar
              });
            }
          }}
          onLogout={handleLogout}
        />
      )}

      <LeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
        currentUserId={user?.id}
      />

      {/* Network Disconnection Pop-up Screen */}
      <DisconnectedModal
        isOpen={isWsDisconnected && !!room}
        onReconnect={() => {
          setIsWsDisconnected(false);
          connectWebSocket();
        }}
        onReturnToMenu={() => {
          setIsWsDisconnected(false);
          handleLeaveRoom();
        }}
      />
    </div>
  );
}
