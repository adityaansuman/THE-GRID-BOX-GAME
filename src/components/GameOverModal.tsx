import React, { useState, useEffect } from 'react';
import { Player, GameRoom } from '../types';
import { sound } from '../utils/audio';
import confetti from 'canvas-confetti';
import { Trophy, RotateCcw, Home, Crown } from 'lucide-react';

interface GameOverModalProps {
  room: GameRoom;
  myPlayerId: string;
  onPlayAgain: () => void;
  onLeaveRoom: () => void;
}

export const GameOverModal: React.FC<GameOverModalProps> = ({
  room,
  myPlayerId,
  onPlayAgain,
  onLeaveRoom
}) => {
  const [showModal, setShowModal] = useState(false);
  const isGameOver = room.state === 'game_over';

  const sortedPlayers = [...room.players].sort((a, b) => b.score - a.score);
  const winners = room.winners || [sortedPlayers[0]];
  const isWinner = winners.some(w => w.id === myPlayerId);
  const isHost = room.hostId === myPlayerId;

  useEffect(() => {
    if (!isGameOver) {
      setShowModal(false);
      return;
    }

    // 1. Immediately begin celebration sound and confetti rain
    sound.playVictoryFanfare();

    const end = Date.now() + 5 * 1000;
    const colors = ['#5BBFEA', '#FF8DA1', '#58C99E', '#FF9F68', '#A389D4', '#F5B83D'];

    let frameId: number;
    function frame() {
      confetti({
        particleCount: 3,
        angle: 60,
        spread: 60,
        origin: { x: 0 },
        colors
      });
      confetti({
        particleCount: 3,
        angle: 120,
        spread: 60,
        origin: { x: 1 },
        colors
      });

      if (Date.now() < end) {
        frameId = requestAnimationFrame(frame);
      }
    }
    frame();

    // 2. Delay the winning pop out screen by 2.5 seconds (2-3s after celebration starts)
    const modalTimer = setTimeout(() => {
      setShowModal(true);
      // Secondary celebration burst when the podium pop out opens
      confetti({
        particleCount: 45,
        spread: 75,
        origin: { y: 0.6 },
        colors
      });
    }, 2500);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(modalTimer);
    };
  }, [isGameOver, room.code]);

  if (!isGameOver) return null;

  // Unobscured 2.5-second celebratory window allowing players to view the completed board
  if (!showModal) {
    return (
      <div className="fixed top-6 left-1/2 -translate-x-1/2 z-50 pointer-events-none animate-bounce select-none">
        <div className="px-5 py-2.5 bg-white/95 backdrop-blur-md rounded-2xl border-2 border-[#FDE7B3] shadow-[0_8px_30px_rgba(245,184,61,0.25)] flex items-center gap-3">
          <span className="text-2xl">🏆</span>
          <div className="text-left">
            <div className="font-bubbly font-bold text-sm text-[#3D352E]">
              {winners.length > 1
                ? "It's a Tie Game!"
                : isWinner
                ? 'Victory! You Won!'
                : `${winners[0]?.name} Won!`}
            </div>
            <div className="text-[10px] font-bubbly text-[#8C8074]">
              Celebration in progress · Final scores in 2s
            </div>
          </div>
          <span className="text-2xl">🎉</span>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/35 backdrop-blur-xs animate-fade-in select-none">
      <style>{`
        @keyframes winnerPop {
          0% { transform: scale(0.75) translateY(24px); opacity: 0; }
          100% { transform: scale(1) translateY(0); opacity: 1; }
        }
      `}</style>
      <div className="relative w-full max-w-lg bg-white border-2 border-[#EFEAE1] rounded-3xl shadow-2xl p-6 text-[#3D352E] text-center animate-[winnerPop_0.4s_cubic-bezier(0.175,0.885,0.32,1.275)]">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-3xl bg-[#FFF9EC] border-2 border-[#FDE7B3] text-[#F5B83D] mb-3 shadow-xs">
          <Trophy className="w-8 h-8" />
        </div>

        <h2 className="font-bubbly font-bold text-2xl text-[#3D352E] mb-1">
          {winners.length > 1
            ? "It's a Tie Game!"
            : isWinner
            ? 'Victory! You Won!'
            : `${winners[0]?.name} Won!`}
        </h2>

        <p className="font-bubbly text-xs text-[#8C8074] mb-5">
          All {room.totalBoxes} boxes captured · Grid {room.gridRows}×{room.gridCols}
        </p>

        {/* Podium Standings */}
        <div className="space-y-2 mb-6">
          {sortedPlayers.map((player, idx) => {
            const isMe = player.id === myPlayerId;
            const rank = idx + 1;
            return (
              <div
                key={player.id}
                className={`flex items-center justify-between p-3.5 rounded-2xl border-2 transition-all ${
                  rank === 1
                    ? 'bg-[#FFF9EC] border-[#FDE7B3] shadow-xs'
                    : isMe
                    ? 'bg-[#EAF6FD] border-[#5BBFEA]'
                    : 'bg-[#FAF7F2] border-[#EFEAE1]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-7 text-center font-bubbly font-bold text-base">
                    {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
                  </div>

                  <div
                    className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl border shadow-xs"
                    style={{
                      borderColor: player.color,
                      backgroundColor: `${player.color}18`
                    }}
                  >
                    {player.avatar}
                  </div>

                  <div className="text-left">
                    <div className="flex items-center gap-1.5 font-bubbly font-bold text-sm text-[#3D352E]">
                      <span>{player.name}</span>
                      {rank === 1 && <Crown className="w-3.5 h-3.5 text-[#F5B83D]" />}
                      {isMe && (
                        <span className="text-[10px] text-[#5BBFEA] font-bubbly">(You)</span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#8C8074] font-bubbly">
                      {Math.round((player.score / room.totalBoxes) * 100)}% of the grid
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <div
                    className="font-bubbly font-bold text-base"
                    style={{ color: player.color }}
                  >
                    {player.score} Boxes
                  </div>
                  <div className="text-[10px] text-[#8C8074] font-mono">
                    +{player.score * 10 + (rank === 1 ? 50 : 0)} pts
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-3">
          {isHost ? (
            <button
              onClick={() => {
                sound.playClick();
                onPlayAgain();
              }}
              className="flex-1 py-3.5 bg-[#5BBFEA] hover:bg-[#49B5E3] text-white font-bubbly font-bold text-xs rounded-2xl shadow-[0_4px_0_#3FA5D1,0_8px_16px_rgba(91,191,234,0.3)] transition-all active:translate-y-1 active:shadow-none flex items-center justify-center gap-2"
            >
              <RotateCcw className="w-4 h-4" />
              Play Again / Rematch
            </button>
          ) : (
            <div className="flex-1 text-xs text-[#8C8074] py-3 font-bubbly">
              Waiting for host to start rematch...
            </div>
          )}

          <button
            onClick={() => {
              sound.playClick();
              onLeaveRoom();
            }}
            className="px-5 py-3.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-[#7A7067] font-bubbly font-bold text-xs rounded-2xl border-2 border-[#EFEAE1] transition-colors flex items-center gap-1.5"
          >
            <Home className="w-4 h-4" />
            Leave to Menu
          </button>
        </div>
      </div>
    </div>
  );
};
