import React, { useState, useEffect, useRef } from 'react';
import { GameRoom } from '../types';
import { sound } from '../utils/audio';

interface BoardProps {
  room: GameRoom;
  myPlayerId: string;
  onMakeMove: (type: 'h' | 'v', r: number, c: number) => void;
  shakeTrigger?: number;
  isExpanded?: boolean;
  expansionLevel?: 0 | 1 | 2;
}

interface FloatingScore {
  id: string;
  text: string;
  color: string;
  x: number;
  y: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  alpha: number;
  size: number;
}

export const Board: React.FC<BoardProps> = ({
  room,
  myPlayerId,
  onMakeMove,
  shakeTrigger = 0,
  isExpanded = false,
  expansionLevel = 0
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [floatingScores, setFloatingScores] = useState<FloatingScore[]>([]);
  const particlesRef = useRef<Particle[]>([]);
  const prevBoxesCountRef = useRef(room.claimedBoxesCount);

  const isMyTurn =
    room.state === 'playing' &&
    room.players[room.currentTurnIndex]?.id === myPlayerId;

  const myPlayer = room.players.find(p => p.id === myPlayerId);
  const myColor = myPlayer?.color || '#5BBFEA';

  const rows = room.gridRows;
  const cols = room.gridCols;

  // Perfectly uniform square sizing
  const [gridSize, setGridSize] = useState({
    boardSize: 520,
    padding: 40,
    cellSize: 100
  });

  useEffect(() => {
    const updateSize = () => {
      if (!containerRef.current) return;
      const { clientWidth, clientHeight } = containerRef.current;
      // Scales dynamically when one or both sidebars (participants, chat) are minimized!
      const maxCap = expansionLevel === 2 ? 940 : expansionLevel === 1 || isExpanded ? 820 : 660;
      const maxAvailable = Math.min(clientWidth - 28, clientHeight - 28, maxCap);
      const safeSize = Math.max(maxAvailable, 300);

      const padding = Math.max(36, safeSize * 0.075);
      const usable = safeSize - padding * 2;
      const cells = Math.max(rows, cols);
      const cellSize = usable / cells;
      const actualBoardSize = cellSize * cells + padding * 2;

      setGridSize({
        boardSize: actualBoardSize,
        padding,
        cellSize
      });
    };

    updateSize();
    window.addEventListener('resize', updateSize);

    let ro: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined' && containerRef.current) {
      ro = new ResizeObserver(() => {
        updateSize();
      });
      ro.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', updateSize);
      ro?.disconnect();
    };
  }, [rows, cols, isExpanded, expansionLevel]);

  const getDotCoords = (r: number, c: number) => {
    const x = gridSize.padding + c * gridSize.cellSize;
    const y = gridSize.padding + r * gridSize.cellSize;
    return { x, y };
  };

  // Watch for newly claimed boxes and spawn smooth visual HUD notifications over the box!
  useEffect(() => {
    if (room.claimedBoxesCount > prevBoxesCountRef.current) {
      // Find newly completed boxes
      room.boxes.forEach((row, r) => {
        row.forEach((box, c) => {
          if (box) {
            const p1 = getDotCoords(r, c);
            const midX = p1.x + gridSize.cellSize / 2;
            const midY = p1.y + gridSize.cellSize / 2;
            const label = box.combo > 1 ? `COMBO x${box.combo}! 🔥` : `+1 BOX! ⭐`;
            spawnFloatingScore(label, box.ownerColor || '#5BBFEA', midX, midY);
            spawnParticles(midX, midY, box.ownerColor || '#5BBFEA', 16);
          }
        });
      });
    }
    prevBoxesCountRef.current = room.claimedBoxesCount;
  }, [room.claimedBoxesCount]);

  // Particle explosion loop for smooth animations
  useEffect(() => {
    let animId: number;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const renderParticles = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const list = particlesRef.current;
      for (let i = list.length - 1; i >= 0; i--) {
        const p = list[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.05;
        p.alpha -= 0.02;

        if (p.alpha <= 0) {
          list.splice(i, 1);
          continue;
        }

        ctx.save();
        ctx.globalAlpha = p.alpha;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      if (list.length > 0) {
        animId = requestAnimationFrame(renderParticles);
      }
    };

    if (particlesRef.current.length > 0) {
      animId = requestAnimationFrame(renderParticles);
    }
    return () => cancelAnimationFrame(animId);
  }, [floatingScores]);

  const spawnParticles = (x: number, y: number, color: string, count = 12) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * 3.8 + 1.2;
      particlesRef.current.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color,
        alpha: 1,
        size: Math.random() * 3 + 2.5
      });
    }
  };

  const spawnFloatingScore = (text: string, color: string, x: number, y: number) => {
    const id = 'score_' + Math.random().toString(36).substring(2, 7);
    setFloatingScores(prev => [...prev, { id, text, color, x, y }]);
    setTimeout(() => {
      setFloatingScores(prev => prev.filter(s => s.id !== id));
    }, 1500);
  };

  const handleLineClick = (type: 'h' | 'v', r: number, c: number) => {
    if (!isMyTurn) return;

    if (type === 'h' && room.hLines[r]?.[c]) return;
    if (type === 'v' && room.vLines[r]?.[c]) return;

    sound.playLineDraw();

    let px = 0;
    let py = 0;
    if (type === 'h') {
      const p1 = getDotCoords(r, c);
      const p2 = getDotCoords(r, c + 1);
      px = (p1.x + p2.x) / 2;
      py = p1.y;
    } else {
      const p1 = getDotCoords(r, c);
      const p2 = getDotCoords(r + 1, c);
      px = p1.x;
      py = (p1.y + p2.y) / 2;
    }
    spawnParticles(px, py, myColor, 10);

    onMakeMove(type, r, c);
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden transition-transform duration-100 ${
        shakeTrigger > 0 ? 'animate-[shake_0.25s_ease-in-out]' : ''
      }`}
    >
      <style>{`
        @keyframes shake {
          0%, 100% { transform: translate(0, 0); }
          20% { transform: translate(-3px, 2px); }
          40% { transform: translate(3px, -2px); }
          60% { transform: translate(-2px, -2px); }
          80% { transform: translate(2px, 2px); }
        }
        @keyframes floatScoreSmooth {
          0% { transform: translate(-50%, -40%) scale(0.6); opacity: 0; }
          20% { transform: translate(-50%, -60%) scale(1.15); opacity: 1; }
          75% { transform: translate(-50%, -100%) scale(1); opacity: 0.95; }
          100% { transform: translate(-50%, -140%) scale(0.9); opacity: 0; }
        }
        @keyframes boxBloom {
          0% { transform: scale(0.3); opacity: 0; }
          65% { transform: scale(1.05); opacity: 1; }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes avatarPop {
          0% { transform: scale(0) rotate(-15deg); opacity: 0; }
          70% { transform: scale(1.2) rotate(6deg); opacity: 1; }
          100% { transform: scale(1) rotate(0deg); opacity: 1; }
        }
        @keyframes linePopIn {
          0% { stroke-width: 4px; opacity: 0.5; }
          60% { stroke-width: 14px; opacity: 1; }
          100% { stroke-width: 11px; opacity: 1; }
        }
      `}</style>

      {/* Particle Canvas */}
      <canvas
        ref={canvasRef}
        width={gridSize.boardSize}
        height={gridSize.boardSize}
        className="absolute inset-0 pointer-events-none z-20 m-auto"
      />

      {/* Floating Smooth Score Badges */}
      <div
        className="absolute inset-0 pointer-events-none z-30 m-auto"
        style={{ width: gridSize.boardSize, height: gridSize.boardSize }}
      >
        {floatingScores.map(fs => (
          <div
            key={fs.id}
            className="absolute font-bubbly font-bold text-xs tracking-wider uppercase px-3.5 py-1.5 rounded-full text-white shadow-lg"
            style={{
              left: fs.x,
              top: fs.y,
              backgroundColor: fs.color,
              animation: 'floatScoreSmooth 1.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards',
              transform: 'translate(-50%, -50%)',
              boxShadow: `0 6px 16px ${fs.color}60`
            }}
          >
            {fs.text}
          </div>
        ))}
      </div>

      {/* Clean Uniform White Minimal Board Card */}
      <div
        className="relative z-10 bg-white rounded-3xl p-3 border-2 border-[#EAE3D6] shadow-[0_8px_28px_rgba(180,160,140,0.12)] flex items-center justify-center transition-all duration-300"
        style={{ width: gridSize.boardSize, height: gridSize.boardSize }}
      >
        <svg
          width={gridSize.boardSize - 24}
          height={gridSize.boardSize - 24}
          className="w-full h-full"
          viewBox={`0 0 ${gridSize.boardSize} ${gridSize.boardSize}`}
        >
          {/* 1. Captured Boxes (Pastel Fill with Smooth Pop) */}
          {room.boxes.map((row, r) =>
            row.map((box, c) => {
              if (!box) return null;
              const p1 = getDotCoords(r, c);
              const cell = gridSize.cellSize;
              const color = box.ownerColor || '#5BBFEA';

              return (
                <g key={`box-${r}-${c}`}>
                  {/* Soft Pastel Box Fill with spring pop */}
                  <rect
                    x={p1.x + 4}
                    y={p1.y + 4}
                    width={cell - 8}
                    height={cell - 8}
                    rx="14"
                    fill={color}
                    fillOpacity="0.25"
                    stroke={color}
                    strokeWidth="2.5"
                    strokeOpacity="0.7"
                    className="transition-all"
                    style={{
                      transformOrigin: `${p1.x + cell / 2}px ${p1.y + cell / 2}px`,
                      animation: 'boxBloom 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                    }}
                  />

                  {/* Centered Avatar Stamp with bouncy rotation */}
                  <text
                    x={p1.x + cell / 2}
                    y={p1.y + cell / 2 + 1}
                    textAnchor="middle"
                    dominantBaseline="central"
                    fontSize={cell * 0.45}
                    className="select-none filter drop-shadow-sm"
                    style={{
                      transformOrigin: `${p1.x + cell / 2}px ${p1.y + cell / 2}px`,
                      animation: 'avatarPop 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                    }}
                  >
                    {box.ownerAvatar || '⭐'}
                  </text>

                  {/* Combo badge */}
                  {box.combo > 1 && (
                    <g transform={`translate(${p1.x + cell - 12}, ${p1.y + 12})`}>
                      <circle r="9" fill={color} />
                      <text
                        textAnchor="middle"
                        dominantBaseline="central"
                        fontSize="9"
                        fontWeight="bold"
                        fill="#ffffff"
                        fontFamily="'Fredoka', sans-serif"
                      >
                        {box.combo}
                      </text>
                    </g>
                  )}
                </g>
              );
            })
          )}

          {/* 2. Horizontal Lines */}
          {room.hLines.map((row, r) =>
            row.map((isDrawn, c) => {
              const p1 = getDotCoords(r, c);
              const p2 = getDotCoords(r, c + 1);
              const ownerColor = room.hLineColors[r]?.[c] || '#5BBFEA';

              return (
                <g key={`hline-${r}-${c}`}>
                  {/* Click hit area: NO distracting hover preview lines */}
                  {!isDrawn && isMyTurn && (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="transparent"
                      strokeWidth="32"
                      strokeLinecap="round"
                      className="cursor-pointer"
                      onClick={() => handleLineClick('h', r, c)}
                    />
                  )}

                  {/* Placed Line - BOLD, THICK & ULTRA-VISIBLE */}
                  {isDrawn && (
                    <>
                      {/* Under-shadow line for contrast */}
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#E8DFC8"
                        strokeWidth="15"
                        strokeLinecap="round"
                      />
                      {/* Main thick vibrant colored line */}
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={ownerColor}
                        strokeWidth="11"
                        strokeLinecap="round"
                        style={{
                          animation: 'linePopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                        }}
                      />
                    </>
                  )}
                </g>
              );
            })
          )}

          {/* 3. Vertical Lines */}
          {room.vLines.map((row, r) =>
            row.map((isDrawn, c) => {
              const p1 = getDotCoords(r, c);
              const p2 = getDotCoords(r + 1, c);
              const ownerColor = room.vLineColors[r]?.[c] || '#5BBFEA';

              return (
                <g key={`vline-${r}-${c}`}>
                  {/* Click hit area: NO distracting hover preview lines */}
                  {!isDrawn && isMyTurn && (
                    <line
                      x1={p1.x}
                      y1={p1.y}
                      x2={p2.x}
                      y2={p2.y}
                      stroke="transparent"
                      strokeWidth="32"
                      strokeLinecap="round"
                      className="cursor-pointer"
                      onClick={() => handleLineClick('v', r, c)}
                    />
                  )}

                  {/* Placed Line - BOLD, THICK & ULTRA-VISIBLE */}
                  {isDrawn && (
                    <>
                      {/* Under-shadow line for contrast */}
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke="#E8DFC8"
                        strokeWidth="15"
                        strokeLinecap="round"
                      />
                      {/* Main thick vibrant colored line */}
                      <line
                        x1={p1.x}
                        y1={p1.y}
                        x2={p2.x}
                        y2={p2.y}
                        stroke={ownerColor}
                        strokeWidth="11"
                        strokeLinecap="round"
                        style={{
                          animation: 'linePopIn 0.25s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
                        }}
                      />
                    </>
                  )}
                </g>
              );
            })
          )}

          {/* 4. Dots (Crisp rounded pegs) */}
          {Array.from({ length: rows + 1 }).map((_, r) =>
            Array.from({ length: cols + 1 }).map((__, c) => {
              const { x, y } = getDotCoords(r, c);
              const isTurn = isMyTurn;

              return (
                <g key={`dot-${r}-${c}`}>
                  {/* Subtle outer halo */}
                  <circle
                    cx={x}
                    cy={y}
                    r="8"
                    fill={isTurn ? myColor : '#EAE3D6'}
                    fillOpacity={isTurn ? '0.3' : '0.4'}
                  />
                  {/* Peg Dot Core */}
                  <circle
                    cx={x}
                    cy={y}
                    r="5.5"
                    fill="#FFFFFF"
                    stroke={isTurn ? myColor : '#9C8F82'}
                    strokeWidth="3"
                  />
                </g>
              );
            })
          )}
        </svg>
      </div>
    </div>
  );
};
