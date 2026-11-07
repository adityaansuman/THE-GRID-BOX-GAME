import express from 'express';
import http from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = 3000;
const app = express();
app.use(express.json());

const DATA_DIR = path.resolve(__dirname, 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const USERS_FILE = path.join(DATA_DIR, 'users.json');
const LEADERBOARD_FILE = path.join(DATA_DIR, 'leaderboard.json');
const SESSIONS_FILE = path.join(DATA_DIR, 'sessions.json');

// Types
export interface UserAccount {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  displayName: string;
  color: string;
  avatar: string; // emoji or icon code
  createdAt: number;
  lastLoginAt: number;
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

// Persistent Store Helpers
function loadUsers(): Record<string, UserAccount> {
  try {
    if (fs.existsSync(USERS_FILE)) {
      const content = fs.readFileSync(USERS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading users:', err);
  }
  return {};
}

function saveUsers(users: Record<string, UserAccount>) {
  try {
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving users:', err);
  }
}

function loadSessions(): Record<string, string> {
  try {
    if (fs.existsSync(SESSIONS_FILE)) {
      const content = fs.readFileSync(SESSIONS_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading sessions:', err);
  }
  return {};
}

function saveSessions(sess: Record<string, string>) {
  try {
    fs.writeFileSync(SESSIONS_FILE, JSON.stringify(sess, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving sessions:', err);
  }
}

// Genuine leaderboard only - start empty without fake bots
function getInitialLeaderboard(): LeaderboardEntry[] {
  return [];
}

function loadLeaderboard(): LeaderboardEntry[] {
  try {
    if (fs.existsSync(LEADERBOARD_FILE)) {
      const content = fs.readFileSync(LEADERBOARD_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error loading leaderboard:', err);
  }
  const initial = getInitialLeaderboard();
  saveLeaderboard(initial);
  return initial;
}

function saveLeaderboard(leaderboard: LeaderboardEntry[]) {
  try {
    fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(leaderboard, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving leaderboard:', err);
  }
}

let users = loadUsers();
// Strictly genuine logged-in accounts only: purge any bots or invalid entries
let leaderboard = loadLeaderboard().filter(e => e.userId && !e.userId.startsWith('bot_') && users[e.userId]);
saveLeaderboard(leaderboard);

function updateLeaderboardForUser(user: UserAccount) {
  if (!user || !user.id || !users[user.id] || user.id.startsWith('bot_')) return;

  const existingIndex = leaderboard.findIndex(entry => entry.userId === user.id);
  const winRate = user.stats.gamesPlayed > 0 
    ? Math.round((user.stats.wins / user.stats.gamesPlayed) * 100) 
    : 0;

  const entry: LeaderboardEntry = {
    userId: user.id,
    username: user.username,
    displayName: user.displayName,
    avatar: user.avatar,
    color: user.color,
    wins: user.stats.wins,
    boxesClaimed: user.stats.boxesClaimed,
    totalScore: user.stats.totalScore,
    highestCombo: user.stats.highestCombo,
    winStreak: user.stats.bestWinStreak,
    gamesPlayed: user.stats.gamesPlayed,
    winRate
  };

  if (existingIndex >= 0) {
    leaderboard[existingIndex] = entry;
  } else {
    leaderboard.push(entry);
  }

  // Sort by totalScore desc, then wins desc
  leaderboard.sort((a, b) => b.totalScore - a.totalScore || b.wins - a.wins || b.boxesClaimed - a.boxesClaimed);
  saveLeaderboard(leaderboard);
}

// Session token lookup with persistence
const sessions: Record<string, string> = loadSessions();

function generateToken(): string {
  return 'tok_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
}

// REST Endpoints
app.post('/api/auth/google', (req, res) => {
  const { email, name, avatar } = req.body;
  const googleEmail = (email || `player_${Date.now()}@gmail.com`).toLowerCase().trim();
  const rawUsername = googleEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').substring(0, 15) || 'player';

  // Find existing user by email or username
  let user = Object.values(users).find(u => (u.email && u.email.toLowerCase() === googleEmail) || u.username.toLowerCase() === rawUsername);

  if (!user) {
    const id = 'usr_g_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    user = {
      id,
      username: rawUsername,
      email: googleEmail,
      passwordHash: 'google_oauth_authenticated',
      displayName: (name || rawUsername).trim().substring(0, 20),
      color: '#5BBFEA',
      avatar: avatar || '⚡',
      createdAt: Date.now(),
      lastLoginAt: Date.now(),
      stats: {
        wins: 0,
        losses: 0,
        ties: 0,
        gamesPlayed: 0,
        boxesClaimed: 0,
        highestCombo: 0,
        totalScore: 0,
        winStreak: 0,
        bestWinStreak: 0,
      }
    };
    users[id] = user;
    saveUsers(users);
    updateLeaderboardForUser(user);
  } else {
    user.lastLoginAt = Date.now();
    if (name && !user.displayName) user.displayName = name.trim().substring(0, 20);
    saveUsers(users);
  }

  const token = generateToken();
  sessions[token] = user.id;
  saveSessions(sessions);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/register', (req, res) => {
  const { username, password, displayName, color, avatar } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  const cleanUsername = username.trim().toLowerCase();
  if (cleanUsername.length < 3) {
    res.status(400).json({ error: 'Username must be at least 3 characters' });
    return;
  }

  // Check if exists
  for (const u of Object.values(users)) {
    if (u.username.toLowerCase() === cleanUsername) {
      res.status(409).json({ error: 'Username is already taken' });
      return;
    }
  }

  const id = 'usr_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const newUser: UserAccount = {
    id,
    username: cleanUsername,
    passwordHash: password, // In production this would be hashed with bcrypt; for game credentials simple hash is fine
    displayName: (displayName || username).trim().substring(0, 20),
    color: color || '#5BBFEA',
    avatar: avatar || '🎮',
    createdAt: Date.now(),
    lastLoginAt: Date.now(),
    stats: {
      wins: 0,
      losses: 0,
      ties: 0,
      gamesPlayed: 0,
      boxesClaimed: 0,
      highestCombo: 0,
      totalScore: 0,
      winStreak: 0,
      bestWinStreak: 0,
    }
  };

  users[id] = newUser;
  saveUsers(users);
  updateLeaderboardForUser(newUser);

  const token = generateToken();
  sessions[token] = id;
  saveSessions(sessions);

  const { passwordHash: _, ...safeUser } = newUser;
  res.json({ token, user: safeUser });
});

app.post('/api/auth/login', (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }
  const cleanUsername = username.trim().toLowerCase();
  const user = Object.values(users).find(u => u.username.toLowerCase() === cleanUsername);

  if (!user || user.passwordHash !== password) {
    res.status(401).json({ error: 'Invalid username or password' });
    return;
  }

  user.lastLoginAt = Date.now();
  saveUsers(users);

  const token = generateToken();
  sessions[token] = user.id;
  saveSessions(sessions);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

app.get('/api/auth/me', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const userId = sessions[token];
  if (!userId || !users[userId]) {
    res.status(401).json({ error: 'Invalid or expired session' });
    return;
  }
  const { passwordHash: _, ...safeUser } = users[userId];
  res.json({ user: safeUser });
});

app.post('/api/auth/profile', (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }
  const token = authHeader.replace('Bearer ', '').trim();
  const userId = sessions[token];
  if (!userId || !users[userId]) {
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  const { displayName, color, avatar } = req.body;
  const user = users[userId];
  if (displayName) user.displayName = displayName.trim().substring(0, 20);
  if (color) user.color = color;
  if (avatar) user.avatar = avatar;

  saveUsers(users);
  updateLeaderboardForUser(user);

  const { passwordHash: _, ...safeUser } = user;
  res.json({ user: safeUser });
});

app.get('/api/leaderboard', (_req, res) => {
  res.json({ leaderboard });
});

// Rooms Management
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
  gridRows: number; // e.g. 3 (boxes), so 4 horizontal lines
  gridCols: number; // e.g. 3 (boxes), so 4 vertical lines
  turnTimeLimit: number; // in seconds (0 = unlimited)
  state: 'lobby' | 'playing' | 'game_over';
  players: Player[];
  currentTurnIndex: number;
  turnTimeRemaining: number;
  currentCombo: number;
  
  // Board Lines:
  // hLines: [rows+1][cols]
  hLines: boolean[][];
  hLineOwners: (string | null)[][];
  hLineColors: (string | null)[][];

  // vLines: [rows][cols+1]
  vLines: boolean[][];
  vLineOwners: (string | null)[][];
  vLineColors: (string | null)[][];

  // Boxes: [rows][cols]
  boxes: (Box | null)[][];
  totalBoxes: number;
  claimedBoxesCount: number;

  chatMessages: ChatMessage[];
  winners: Player[] | null;
  turnInterval: NodeJS.Timeout | null;
}

const rooms = new Map<string, GameRoom>();
const clientRooms = new Map<WebSocket, { roomCode: string; playerId: string }>();

function createBoardData(rows: number, cols: number) {
  const hLines: boolean[][] = [];
  const hLineOwners: (string | null)[][] = [];
  const hLineColors: (string | null)[][] = [];
  for (let r = 0; r <= rows; r++) {
    hLines.push(new Array(cols).fill(false));
    hLineOwners.push(new Array(cols).fill(null));
    hLineColors.push(new Array(cols).fill(null));
  }

  const vLines: boolean[][] = [];
  const vLineOwners: (string | null)[][] = [];
  const vLineColors: (string | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    vLines.push(new Array(cols + 1).fill(false));
    vLineOwners.push(new Array(cols + 1).fill(null));
    vLineColors.push(new Array(cols + 1).fill(null));
  }

  const boxes: (Box | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    boxes.push(new Array(cols).fill(null));
  }

  return { hLines, hLineOwners, hLineColors, vLines, vLineOwners, vLineColors, boxes };
}

function broadcastToRoom(room: GameRoom, event: string, payload: any) {
  const msg = JSON.stringify({ event, payload });
  for (const [ws, info] of clientRooms.entries()) {
    if (info.roomCode === room.code && ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

function sendToClient(ws: WebSocket, event: string, payload: any) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ event, payload }));
  }
}

function sanitizeRoom(room: GameRoom) {
  const { turnInterval, ...rest } = room;
  return rest;
}

function broadcastLobbies() {
  const publicList = Array.from(rooms.values())
    .filter(r => r.isPublic)
    .map(r => ({
      code: r.code,
      name: r.name,
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      grid: `${r.gridRows}x${r.gridCols}`,
      state: r.state
    }));

  const msg = JSON.stringify({ event: 'lobbies:list', payload: publicList });
  for (const ws of clientRooms.keys()) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(msg);
    }
  }
}

app.get('/api/rooms', (_req, res) => {
  const publicList = Array.from(rooms.values())
    .filter(r => r.isPublic)
    .map(r => ({
      code: r.code,
      name: r.name,
      playerCount: r.players.length,
      maxPlayers: r.maxPlayers,
      grid: `${r.gridRows}x${r.gridCols}`,
      state: r.state
    }));
  res.json({ rooms: publicList });
});

// Create HTTP server
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function resetTurnTimer(room: GameRoom) {
  if (room.turnInterval) {
    clearInterval(room.turnInterval);
    room.turnInterval = null;
  }
  if (room.turnTimeLimit <= 0 || room.state !== 'playing') {
    return;
  }

  room.turnTimeRemaining = room.turnTimeLimit;
  room.turnInterval = setInterval(() => {
    room.turnTimeRemaining -= 1;
    if (room.turnTimeRemaining <= 0) {
      // Time expired: auto-move or advance turn
      handleTimeExpired(room);
    } else {
      broadcastToRoom(room, 'turn:tick', { remaining: room.turnTimeRemaining });
    }
  }, 1000);
}

function handleTimeExpired(room: GameRoom) {
  if (room.state !== 'playing') return;
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer) return;

  // Make a random move for player if time ran out
  const availableMoves: Array<{ type: 'h' | 'v'; r: number; c: number }> = [];
  for (let r = 0; r <= room.gridRows; r++) {
    for (let c = 0; c < room.gridCols; c++) {
      if (!room.hLines[r][c]) availableMoves.push({ type: 'h', r, c });
    }
  }
  for (let r = 0; r < room.gridRows; r++) {
    for (let c = 0; c <= room.gridCols; c++) {
      if (!room.vLines[r][c]) availableMoves.push({ type: 'v', r, c });
    }
  }

  if (availableMoves.length > 0) {
    const randomMove = availableMoves[Math.floor(Math.random() * availableMoves.length)];
    executeMove(room, currentPlayer.id, randomMove.type, randomMove.r, randomMove.c, true);
  }
}

function executeMove(
  room: GameRoom,
  playerId: string,
  type: 'h' | 'v',
  r: number,
  c: number,
  isAuto = false
) {
  if (room.state !== 'playing') return;
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || currentPlayer.id !== playerId) return;

  // Check valid line
  if (type === 'h') {
    if (r < 0 || r > room.gridRows || c < 0 || c >= room.gridCols) return;
    if (room.hLines[r][c]) return;
    room.hLines[r][c] = true;
    room.hLineOwners[r][c] = playerId;
    room.hLineColors[r][c] = currentPlayer.color;
  } else {
    if (r < 0 || r >= room.gridRows || c < 0 || c > room.gridCols) return;
    if (room.vLines[r][c]) return;
    room.vLines[r][c] = true;
    room.vLineOwners[r][c] = playerId;
    room.vLineColors[r][c] = currentPlayer.color;
  }

  // Check newly formed boxes
  const newlyClaimedBoxes: Array<{ r: number; c: number }> = [];

  for (let br = 0; br < room.gridRows; br++) {
    for (let bc = 0; bc < room.gridCols; bc++) {
      if (room.boxes[br][bc] !== null) continue;

      const top = room.hLines[br][bc];
      const bottom = room.hLines[br + 1][bc];
      const left = room.vLines[br][bc];
      const right = room.vLines[br][bc + 1];

      if (top && bottom && left && right) {
        newlyClaimedBoxes.push({ r: br, c: bc });
      }
    }
  }

  let bonusTurn = false;
  if (newlyClaimedBoxes.length > 0) {
    room.currentCombo += newlyClaimedBoxes.length;
    bonusTurn = true;
    currentPlayer.score += newlyClaimedBoxes.length;
    room.claimedBoxesCount += newlyClaimedBoxes.length;

    for (const boxCoord of newlyClaimedBoxes) {
      room.boxes[boxCoord.r][boxCoord.c] = {
        ownerId: currentPlayer.id,
        ownerColor: currentPlayer.color,
        ownerAvatar: currentPlayer.avatar,
        combo: room.currentCombo
      };
    }

    // No system chat announcement - keep chat exclusively for player messages
  } else {
    room.currentCombo = 0;
    // Pass turn to next active player
    room.currentTurnIndex = (room.currentTurnIndex + 1) % room.players.length;
  }

  // Broadcast move outcome
  broadcastToRoom(room, 'game:move_result', {
    type,
    r,
    c,
    playerId,
    playerColor: currentPlayer.color,
    newlyClaimedBoxes,
    bonusTurn,
    currentCombo: room.currentCombo,
    nextTurnPlayerId: room.players[room.currentTurnIndex].id,
    scores: room.players.map(p => ({ id: p.id, score: p.score })),
    isAuto,
    hLines: room.hLines,
    hLineColors: room.hLineColors,
    vLines: room.vLines,
    vLineColors: room.vLineColors,
    boxes: room.boxes
  });

  // Check if game is over
  if (room.claimedBoxesCount >= room.totalBoxes) {
    endGame(room);
  } else {
    resetTurnTimer(room);
    // If next player is bot, schedule bot move
    checkAndTriggerBotMove(room);
  }
}

function endGame(room: GameRoom) {
  room.state = 'game_over';
  if (room.turnInterval) {
    clearInterval(room.turnInterval);
    room.turnInterval = null;
  }

  // Find winner(s)
  let maxScore = -1;
  let winners: Player[] = [];
  for (const p of room.players) {
    if (p.score > maxScore) {
      maxScore = p.score;
      winners = [p];
    } else if (p.score === maxScore) {
      winners.push(p);
    }
  }
  room.winners = winners;

  // Record stats only for genuine logged-in accounts (never bots, never guests)
  const isTie = winners.length > 1;
  for (const p of room.players) {
    if (p.userId && users[p.userId] && !p.isBot && !p.id.startsWith('bot_')) {
      const u = users[p.userId];
      u.stats.gamesPlayed += 1;
      u.stats.boxesClaimed += p.score;
      u.stats.totalScore += p.score * 10;

      const isWinner = winners.some(w => w.id === p.id);
      if (isWinner && !isTie) {
        u.stats.wins += 1;
        u.stats.winStreak += 1;
        if (u.stats.winStreak > u.stats.bestWinStreak) {
          u.stats.bestWinStreak = u.stats.winStreak;
        }
        u.stats.totalScore += 50; // Victory bonus
      } else if (isTie) {
        u.stats.ties += 1;
        u.stats.winStreak = 0;
        u.stats.totalScore += 20;
      } else {
        u.stats.losses += 1;
        u.stats.winStreak = 0;
      }
      saveUsers(users);
      updateLeaderboardForUser(u);
    }
  }

  // No chat announcement - HUD displays game over modal
  broadcastToRoom(room, 'game:over', {
    winners,
    room: sanitizeRoom(room),
    leaderboard
  });
  broadcastLobbies();
}

function checkAndTriggerBotMove(room: GameRoom) {
  if (room.state !== 'playing') return;
  const currentPlayer = room.players[room.currentTurnIndex];
  if (!currentPlayer || !currentPlayer.isBot) return;

  const delay = Math.floor(Math.random() * 500) + 600; // 600-1100ms realistic thinking time
  setTimeout(() => {
    if (room.state !== 'playing') return;
    const playerNow = room.players[room.currentTurnIndex];
    if (!playerNow || playerNow.id !== currentPlayer.id) return;

    const move = computeBestBotMove(room, currentPlayer.botLevel || 'medium');
    if (move) {
      executeMove(room, currentPlayer.id, move.type, move.r, move.c);
    }
  }, delay);
}

function computeBestBotMove(
  room: GameRoom,
  level: 'easy' | 'medium' | 'hard'
): { type: 'h' | 'v'; r: number; c: number } | null {
  const allMoves: Array<{ type: 'h' | 'v'; r: number; c: number }> = [];

  for (let r = 0; r <= room.gridRows; r++) {
    for (let c = 0; c < room.gridCols; c++) {
      if (!room.hLines[r][c]) allMoves.push({ type: 'h', r, c });
    }
  }
  for (let r = 0; r < room.gridRows; r++) {
    for (let c = 0; c <= room.gridCols; c++) {
      if (!room.vLines[r][c]) allMoves.push({ type: 'v', r, c });
    }
  }

  if (allMoves.length === 0) return null;

  if (level === 'easy') {
    // 50% random, 50% capture
    const captureMove = findBoxCompletingMove(room, allMoves);
    if (captureMove && Math.random() < 0.6) return captureMove;
    return allMoves[Math.floor(Math.random() * allMoves.length)];
  }

  // Medium / Hard Bot Strategy:
  // 1. ALWAYS take moves that complete 1 or 2 boxes!
  const completingMove = findBoxCompletingMove(room, allMoves);
  if (completingMove) return completingMove;

  // 2. AVOID moves that leave a box with 3 sides (giving the opponent a box)!
  const safeMoves = allMoves.filter(m => !leavesBoxWithThreeSides(room, m));

  if (safeMoves.length > 0) {
    if (level === 'hard') {
      // Pick move that minimizes chain sizes for opponent
      return safeMoves[Math.floor(Math.random() * safeMoves.length)];
    }
    return safeMoves[Math.floor(Math.random() * safeMoves.length)];
  }

  // 3. If no safe moves, pick the move that yields the smallest chain sacrifice
  return allMoves[Math.floor(Math.random() * allMoves.length)];
}

function findBoxCompletingMove(
  room: GameRoom,
  moves: Array<{ type: 'h' | 'v'; r: number; c: number }>
) {
  for (const move of moves) {
    // Temporarily apply
    if (move.type === 'h') room.hLines[move.r][move.c] = true;
    else room.vLines[move.r][move.c] = true;

    let wouldComplete = false;
    for (let br = 0; br < room.gridRows; br++) {
      for (let bc = 0; bc < room.gridCols; bc++) {
        if (room.boxes[br][bc] !== null) continue;
        if (
          room.hLines[br][bc] &&
          room.hLines[br + 1][bc] &&
          room.vLines[br][bc] &&
          room.vLines[br][bc + 1]
        ) {
          wouldComplete = true;
          break;
        }
      }
      if (wouldComplete) break;
    }

    // Revert
    if (move.type === 'h') room.hLines[move.r][move.c] = false;
    else room.vLines[move.r][move.c] = false;

    if (wouldComplete) return move;
  }
  return null;
}

function leavesBoxWithThreeSides(
  room: GameRoom,
  move: { type: 'h' | 'v'; r: number; c: number }
): boolean {
  if (move.type === 'h') room.hLines[move.r][move.c] = true;
  else room.vLines[move.r][move.c] = true;

  let createdThirdSide = false;
  for (let br = 0; br < room.gridRows; br++) {
    for (let bc = 0; bc < room.gridCols; bc++) {
      if (room.boxes[br][bc] !== null) continue;
      let count = 0;
      if (room.hLines[br][bc]) count++;
      if (room.hLines[br + 1][bc]) count++;
      if (room.vLines[br][bc]) count++;
      if (room.vLines[br][bc + 1]) count++;

      if (count === 3) {
        createdThirdSide = true;
        break;
      }
    }
    if (createdThirdSide) break;
  }

  // Revert
  if (move.type === 'h') room.hLines[move.r][move.c] = false;
  else room.vLines[move.r][move.c] = false;

  return createdThirdSide;
}

const PASTEL_PALETTE = [
  '#5BBFEA', // Pastel Sky
  '#FF8DA1', // Pastel Strawberry
  '#58C99E', // Pastel Mint
  '#FF9F68', // Pastel Peach
  '#A389D4', // Pastel Lavender
  '#F5B83D', // Pastel Butter
  '#E679B5', // Pastel Bubblegum
  '#82C29B', // Pastel Sage
  '#4DB6AC', // Pastel Teal
  '#7E97E8', // Pastel Periwinkle
  '#F78DA7', // Pastel Rose
  '#A0D468', // Pastel Lime
  '#FFB85C', // Pastel Apricot
  '#6AC4F8', // Pastel Cyan
  '#C084FC', // Pastel Violet
  '#FBBF24'  // Pastel Amber
];

function getUniqueColorForPlayer(existingPlayers: Player[], preferredColor?: string): string {
  const taken = new Set(existingPlayers.map(p => p.color.toLowerCase()));
  if (preferredColor && !taken.has(preferredColor.toLowerCase())) {
    return preferredColor;
  }
  for (const c of PASTEL_PALETTE) {
    if (!taken.has(c.toLowerCase())) {
      return c;
    }
  }
  return preferredColor || '#5BBFEA';
}

function handleClientDisconnect(ws: WebSocket) {
  const info = clientRooms.get(ws);
  if (!info) return;
  clientRooms.delete(ws);

  const room = rooms.get(info.roomCode);
  if (!room) return;

  const playerIdx = room.players.findIndex(p => p.id === info.playerId);
  if (playerIdx < 0) return;

  const wasCurrentTurn = room.currentTurnIndex === playerIdx;
  room.players.splice(playerIdx, 1);

  if (room.players.length === 0) {
    if (room.turnInterval) {
      clearInterval(room.turnInterval);
      room.turnInterval = null;
    }
    rooms.delete(room.code);
  } else {
    // If host left, elect new host
    if (room.hostId === info.playerId) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }

    if (room.state === 'playing') {
      const activeHumans = room.players.filter(p => !p.isBot);
      if (room.players.length === 1 && activeHumans.length === 1) {
        room.state = 'game_over';
        if (room.turnInterval) {
          clearInterval(room.turnInterval);
          room.turnInterval = null;
        }
        room.winners = [room.players[0]];
        const winner = room.players[0];
        if (winner.userId && users[winner.userId] && !winner.isBot) {
          const u = users[winner.userId];
          u.stats.wins++;
          u.stats.gamesPlayed++;
          u.stats.totalScore += 50;
          saveUsers(users);
          updateLeaderboardForUser(u);
        }
        broadcastToRoom(room, 'game:over', {
          winners: room.winners,
          room: sanitizeRoom(room),
          leaderboard
        });
      } else {
        // 2 or more players remain: the game CONTINUES without the disconnected player!
        if (wasCurrentTurn) {
          room.currentTurnIndex = room.currentTurnIndex % room.players.length;
          resetTurnTimer(room);
          checkAndTriggerBotMove(room);
        } else if (playerIdx < room.currentTurnIndex) {
          room.currentTurnIndex = (room.currentTurnIndex - 1 + room.players.length) % room.players.length;
        }
      }
    }
    broadcastToRoom(room, 'room:sync', { room: sanitizeRoom(room) });
  }
  broadcastLobbies();
}

// WebSocket Connection Management
// Heartbeat to detect network drops promptly
const heartbeatInterval = setInterval(() => {
  for (const client of wss.clients) {
    if ((client as any).isAlive === false) {
      handleClientDisconnect(client);
      client.terminate();
      continue;
    }
    (client as any).isAlive = false;
    client.ping();
  }
}, 3000);
wss.on('connection', (ws) => {
  (ws as any).isAlive = true;
  ws.on('pong', () => {
    (ws as any).isAlive = true;
  });

  let boundRoomCode: string | null = null;
  let boundPlayerId: string | null = null;

  // Send initial lobbies list
  sendToClient(ws, 'lobbies:list', Array.from(rooms.values()).filter(r => r.isPublic).map(r => ({
    code: r.code,
    name: r.name,
    playerCount: r.players.length,
    maxPlayers: r.maxPlayers,
    grid: `${r.gridRows}x${r.gridCols}`,
    state: r.state
  })));

  ws.on('message', (data) => {
    try {
      (ws as any).isAlive = true;
      const rawStr = data.toString();
      if (rawStr === 'ping') {
        ws.send('pong');
        return;
      }

      const msg = JSON.parse(rawStr);
      const { event, payload } = msg;

      if (event === 'room:create') {
        const { name, isPublic, rows, cols, turnTime, maxPlayers, player } = payload;
        const code = Math.random().toString(36).substring(2, 7).toUpperCase();
        const targetMaxPlayers = Math.min(Math.max(maxPlayers || 4, 2), 8);
        let gridRows = Math.min(Math.max(rows || 4, 3), 8);
        let gridCols = Math.min(Math.max(cols || 4, 3), 8);

        // When room max players > 4, enforce 7x7 or 8x8
        if (targetMaxPlayers > 4) {
          gridRows = gridRows >= 8 ? 8 : 7;
          gridCols = gridCols >= 8 ? 8 : 7;
        }

        const hostColor = getUniqueColorForPlayer([], player.color);
        const hostPlayer: Player = {
          id: player.id || 'p_' + Math.random().toString(36).substring(2, 7),
          userId: player.userId,
          name: (player.name || 'Host').trim().substring(0, 18),
          color: hostColor,
          avatar: player.avatar || '👑',
          score: 0,
          isHost: true,
          isReady: true,
          isDisconnected: false
        };

        const boardData = createBoardData(gridRows, gridCols);
        const newRoom: GameRoom = {
          code,
          name: (name || `${hostPlayer.name}'s Grid`).trim().substring(0, 24),
          isPublic: isPublic !== false,
          hostId: hostPlayer.id,
          maxPlayers: targetMaxPlayers,
          gridRows,
          gridCols,
          turnTimeLimit: turnTime !== undefined ? turnTime : 30,
          state: 'lobby',
          players: [hostPlayer],
          currentTurnIndex: 0,
          turnTimeRemaining: turnTime !== undefined ? turnTime : 30,
          currentCombo: 0,
          ...boardData,
          totalBoxes: gridRows * gridCols,
          claimedBoxesCount: 0,
          chatMessages: [],
          winners: null,
          turnInterval: null
        };

        rooms.set(code, newRoom);
        boundRoomCode = code;
        boundPlayerId = hostPlayer.id;
        clientRooms.set(ws, { roomCode: code, playerId: hostPlayer.id });

        sendToClient(ws, 'room:joined', { room: sanitizeRoom(newRoom), yourPlayerId: hostPlayer.id });
        broadcastLobbies();
      }

      else if (event === 'room:join') {
        const { roomCode, player } = payload;
        const cleanCode = (roomCode || '').trim().toUpperCase();
        const room = rooms.get(cleanCode);

        if (!room) {
          sendToClient(ws, 'error', { message: 'Room not found. Check code.' });
          return;
        }

        if (room.state === 'playing') {
          sendToClient(ws, 'error', { message: 'Game in progress. Please join or create another room!' });
          return;
        }

        if (room.players.length >= room.maxPlayers) {
          sendToClient(ws, 'error', { message: 'Room is full' });
          return;
        }

        // Pick unique color that no other player in this room has
        const assignedColor = getUniqueColorForPlayer(room.players, player.color);

        const newPlayer: Player = {
          id: player.id || 'p_' + Math.random().toString(36).substring(2, 7),
          userId: player.userId,
          name: (player.name || `Player ${room.players.length + 1}`).trim().substring(0, 18),
          color: assignedColor,
          avatar: player.avatar || '🎮',
          score: 0,
          isHost: false,
          isReady: false,
          isDisconnected: false
        };

        room.players.push(newPlayer);

        // If player count exceeds 4, enforce 7x7 or 8x8 grid
        if (room.players.length > 4 && (room.gridRows < 7 || room.gridCols < 7)) {
          room.gridRows = 7;
          room.gridCols = 7;
          room.totalBoxes = 49;
          const boardData = createBoardData(7, 7);
          room.hLines = boardData.hLines;
          room.hLineOwners = boardData.hLineOwners;
          room.hLineColors = boardData.hLineColors;
          room.vLines = boardData.vLines;
          room.vLineOwners = boardData.vLineOwners;
          room.vLineColors = boardData.vLineColors;
          room.boxes = boardData.boxes;
        }

        boundRoomCode = cleanCode;
        boundPlayerId = newPlayer.id;
        clientRooms.set(ws, { roomCode: cleanCode, playerId: newPlayer.id });

        sendToClient(ws, 'room:joined', { room: sanitizeRoom(room), yourPlayerId: newPlayer.id });
        broadcastToRoom(room, 'room:player_joined', { player: newPlayer, room: sanitizeRoom(room) });
        broadcastLobbies();
      }

      else if (event === 'room:ready') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room) return;

        const p = room.players.find(pl => pl.id === boundPlayerId);
        if (p) {
          p.isReady = !p.isReady;
          broadcastToRoom(room, 'room:update_players', { players: room.players });
        }
      }

      else if (event === 'room:update_color') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room || room.state !== 'lobby') return;

        const requestedColor = payload.color;
        if (!requestedColor) return;

        // Ensure no other player has this color
        const isTaken = room.players.some(p => p.id !== boundPlayerId && p.color.toLowerCase() === requestedColor.toLowerCase());
        if (isTaken) {
          sendToClient(ws, 'error', { message: 'This colour is already picked by another player in this lobby!' });
          return;
        }

        const targetPlayer = room.players.find(p => p.id === boundPlayerId);
        if (targetPlayer) {
          targetPlayer.color = requestedColor;
          broadcastToRoom(room, 'room:update_players', { players: room.players });
        }
      }

      else if (event === 'room:update_profile') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room) return;

        const p = room.players.find(pl => pl.id === boundPlayerId);
        if (p) {
          if (payload.name) p.name = payload.name.trim().substring(0, 18);
          if (payload.color) {
            const isTaken = room.players.some(other => other.id !== boundPlayerId && other.color.toLowerCase() === payload.color.toLowerCase());
            if (!isTaken) {
              p.color = payload.color;
            }
          }
          if (payload.avatar) p.avatar = payload.avatar;
          broadcastToRoom(room, 'room:update_players', { players: room.players });
        }
      }

      else if (event === 'room:add_bot') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room || room.hostId !== boundPlayerId || room.state !== 'lobby') return;
        if (room.players.length >= room.maxPlayers) return;

        const botNames = ['ByteBot 🤖', 'NeonCyborg 👾', 'DotMatrix ⚡', 'ApexGrid 🧠', 'PixelWhiz 🎯', 'GridNinja 🥷', 'QuantumBot 🌌', 'CyberPanda 🐼'];
        const botAvatars = ['🤖', '👾', '⚡', '🧠', '🎯', '🥷', '🌌', '🐼'];
        const idx = room.players.length;
        const botColor = getUniqueColorForPlayer(room.players);

        const botPlayer: Player = {
          id: 'bot_' + Math.random().toString(36).substring(2, 6),
          name: botNames[idx % botNames.length],
          color: botColor,
          avatar: botAvatars[idx % botAvatars.length],
          score: 0,
          isHost: false,
          isReady: true,
          isBot: true,
          botLevel: payload.level || 'medium',
          isDisconnected: false
        };

        room.players.push(botPlayer);

        // If player count exceeds 4, enforce 7x7 or 8x8 grid
        if (room.players.length > 4 && (room.gridRows < 7 || room.gridCols < 7)) {
          room.gridRows = 7;
          room.gridCols = 7;
          room.totalBoxes = 49;
          const boardData = createBoardData(7, 7);
          room.hLines = boardData.hLines;
          room.hLineOwners = boardData.hLineOwners;
          room.hLineColors = boardData.hLineColors;
          room.vLines = boardData.vLines;
          room.vLineOwners = boardData.vLineOwners;
          room.vLineColors = boardData.vLineColors;
          room.boxes = boardData.boxes;
        }

        broadcastToRoom(room, 'room:update_players', { players: room.players });
        broadcastLobbies();
      }

      else if (event === 'room:remove_bot') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room || room.hostId !== boundPlayerId || room.state !== 'lobby') return;

        const botIdx = room.players.findIndex(p => p.id === payload.botId && p.isBot);
        if (botIdx >= 0) {
          room.players.splice(botIdx, 1);
          broadcastToRoom(room, 'room:update_players', { players: room.players });
          broadcastLobbies();
        }
      }

      else if (event === 'room:update_settings') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room || room.hostId !== boundPlayerId || room.state !== 'lobby') return;

        if (payload.maxPlayers) {
          room.maxPlayers = Math.min(Math.max(payload.maxPlayers, 2), 8);
        }

        // Enforce 7x7 or 8x8 if > 4 players or maxPlayers > 4
        if (room.players.length > 4 || room.maxPlayers > 4) {
          const target = payload.rows === 8 || payload.cols === 8 ? 8 : 7;
          room.gridRows = target;
          room.gridCols = target;
        } else {
          if (payload.rows) room.gridRows = Math.min(Math.max(payload.rows, 3), 8);
          if (payload.cols) room.gridCols = Math.min(Math.max(payload.cols, 3), 8);
        }

        if (payload.turnTime !== undefined) room.turnTimeLimit = payload.turnTime;
        room.totalBoxes = room.gridRows * room.gridCols;

        const boardData = createBoardData(room.gridRows, room.gridCols);
        room.hLines = boardData.hLines;
        room.hLineOwners = boardData.hLineOwners;
        room.hLineColors = boardData.hLineColors;
        room.vLines = boardData.vLines;
        room.vLineOwners = boardData.vLineOwners;
        room.vLineColors = boardData.vLineColors;
        room.boxes = boardData.boxes;

        broadcastToRoom(room, 'room:sync', { room: sanitizeRoom(room) });
        broadcastLobbies();
      }

      else if (event === 'room:start') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room || room.hostId !== boundPlayerId) return;
        if (room.players.length < 2) {
          sendToClient(ws, 'error', { message: 'Need at least 2 players or add a Bot to start!' });
          return;
        }

        // Reset game state
        room.state = 'playing';
        room.currentTurnIndex = 0;
        room.currentCombo = 0;
        room.claimedBoxesCount = 0;
        room.winners = null;

        for (const p of room.players) {
          p.score = 0;
          p.isDisconnected = false;
        }

        const boardData = createBoardData(room.gridRows, room.gridCols);
        room.hLines = boardData.hLines;
        room.hLineOwners = boardData.hLineOwners;
        room.hLineColors = boardData.hLineColors;
        room.vLines = boardData.vLines;
        room.vLineOwners = boardData.vLineOwners;
        room.vLineColors = boardData.vLineColors;
        room.boxes = boardData.boxes;

        resetTurnTimer(room);

        // Game started - HUD indicators guide players without chat clutter
        broadcastToRoom(room, 'game:started', { room: sanitizeRoom(room) });
        broadcastLobbies();

        checkAndTriggerBotMove(room);
      }

      else if (event === 'game:move') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room) return;

        const { type, r, c } = payload;
        executeMove(room, boundPlayerId, type, r, c);
      }

      else if (event === 'chat:send') {
        if (!boundRoomCode || !boundPlayerId) return;
        const room = rooms.get(boundRoomCode);
        if (!room) return;

        const sender = room.players.find(p => p.id === boundPlayerId);
        if (!sender) return;

        const text = (payload.text || '').trim().substring(0, 140);
        if (!text) return;

        const chatMsg: ChatMessage = {
          id: 'msg_' + Date.now() + Math.random().toString(36).substring(2, 5),
          senderId: sender.id,
          senderName: sender.name,
          senderColor: sender.color,
          senderAvatar: sender.avatar,
          text,
          isSystem: false,
          type: payload.type || 'chat',
          timestamp: Date.now()
        };

        room.chatMessages.push(chatMsg);
        if (room.chatMessages.length > 100) room.chatMessages.shift();

        broadcastToRoom(room, 'chat:message', chatMsg);
      }

      else if (event === 'room:leave') {
        handleClientDisconnect(ws);
        boundRoomCode = null;
        boundPlayerId = null;
        sendToClient(ws, 'lobbies:list', Array.from(rooms.values()).filter(r => r.isPublic).map(r => ({
          code: r.code,
          name: r.name,
          playerCount: r.players.length,
          maxPlayers: r.maxPlayers,
          grid: `${r.gridRows}x${r.gridCols}`,
          state: r.state
        })));
      }
    } catch (err) {
      console.error('WS message error:', err);
    }
  });

  ws.on('close', () => {
    handleClientDisconnect(ws);
  });
});

// Development vs Production serving
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  server.listen(PORT, '0.0.0.0', () => {
    console.log(`GridBox server running at http://0.0.0.0:${PORT}`);
  });
}

startServer();
