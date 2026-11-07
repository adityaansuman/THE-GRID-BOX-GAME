export interface UserProfile {
  id: string;
  username: string;
  email?: string;
  displayName: string;
  color: string;
  avatar: string;
  createdAt: number;
  stats: {
    wins: number;
    losses: number;
    ties: number;
    gamesPlayed: number;
    boxesClaimed: number;
    highestCombo: number;
    totalScore: number;
    winStreak: number;
    bestWinStreak: number;
  };
}

export interface Player {
  id: string;
  userId?: string;
  name: string;
  color: string;
  avatar: string;
  score: number;
  isHost: boolean;
  isReady: boolean;
  isBot?: boolean;
  botLevel?: 'easy' | 'medium' | 'hard';
  isDisconnected?: boolean;
}

export interface Box {
  ownerId: string | null;
  ownerColor: string | null;
  ownerAvatar: string | null;
  combo: number;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderColor: string;
  senderAvatar: string;
  text: string;
  isSystem: boolean;
  type: 'chat' | 'reaction' | 'system';
  timestamp: number;
}

export interface GameRoom {
  code: string;
  name: string;
  isPublic: boolean;
  hostId: string;
  maxPlayers: number;
  gridRows: number;
  gridCols: number;
  turnTimeLimit: number;
  state: 'lobby' | 'playing' | 'game_over';
  players: Player[];
  currentTurnIndex: number;
  turnTimeRemaining: number;
  currentCombo: number;
  
  hLines: boolean[][];
  hLineOwners: (string | null)[][];
  hLineColors: (string | null)[][];

  vLines: boolean[][];
  vLineOwners: (string | null)[][];
  vLineColors: (string | null)[][];

  boxes: (Box | null)[][];
  totalBoxes: number;
  claimedBoxesCount: number;

  chatMessages: ChatMessage[];
  winners: Player[] | null;
}

export interface LeaderboardEntry {
  userId: string;
  username: string;
  displayName: string;
  avatar: string;
  color: string;
  wins: number;
  boxesClaimed: number;
  totalScore: number;
  highestCombo: number;
  winStreak: number;
  gamesPlayed: number;
  winRate: number;
}

export interface PublicLobbyInfo {
  code: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  grid: string;
  state: 'lobby' | 'playing' | 'game_over';
}
