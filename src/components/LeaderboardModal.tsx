import React, { useState, useEffect } from 'react';
import { LeaderboardEntry } from '../types';
import { api } from '../services/api';
import { sound } from '../utils/audio';
import { X, Trophy, Flame, Zap, RefreshCw, Crown } from 'lucide-react';

interface LeaderboardModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string;
}

export const LeaderboardModal: React.FC<LeaderboardModalProps> = ({
  isOpen,
  onClose,
  currentUserId
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'score' | 'wins' | 'boxes'>('score');

  const fetchBoard = async () => {
    setLoading(true);
    try {
      const data = await api.getLeaderboard();
      setEntries(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchBoard();
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const sortedEntries = [...entries].sort((a, b) => {
    if (filter === 'score') return b.totalScore - a.totalScore;
    if (filter === 'wins') return b.wins - a.wins;
    return b.boxesClaimed - a.boxesClaimed;
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-xs animate-fade-in select-none">
      <div className="relative w-full max-w-2xl bg-white border-2 border-[#EFEAE1] rounded-3xl shadow-xl p-6 text-[#3D352E] max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#F0EAE1]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#FFF9EC] border border-[#FDE7B3] flex items-center justify-center text-[#F5B83D]">
              <Trophy className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bubbly font-bold text-xl text-[#3D352E] flex items-center gap-1.5">
                Global Hall of Fame
                <Crown className="w-4 h-4 text-[#F5B83D]" />
              </h2>
              <p className="font-bubbly text-xs text-[#8C8074]">
                Top GridBox strategists ranked across all match rounds
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                sound.playClick();
                fetchBoard();
              }}
              disabled={loading}
              className="text-[#8C8074] hover:text-[#3D352E] p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => {
                sound.playClick();
                onClose();
              }}
              className="text-[#8C8074] hover:text-[#3D352E] p-2 rounded-xl hover:bg-[#FAF7F2] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-[#FAF7F2] p-1 rounded-2xl my-4 border border-[#EFEAE1] shrink-0">
          <button
            onClick={() => {
              sound.playClick();
              setFilter('score');
            }}
            className={`flex-1 py-1.5 text-xs font-bubbly font-bold rounded-xl transition-all ${
              filter === 'score'
                ? 'bg-white text-[#3D352E] shadow-xs'
                : 'text-[#8C8074] hover:text-[#3D352E]'
            }`}
          >
            Highest Score
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setFilter('wins');
            }}
            className={`flex-1 py-1.5 text-xs font-bubbly font-bold rounded-xl transition-all ${
              filter === 'wins'
                ? 'bg-white text-[#3D352E] shadow-xs'
                : 'text-[#8C8074] hover:text-[#3D352E]'
            }`}
          >
            Total Wins
          </button>
          <button
            onClick={() => {
              sound.playClick();
              setFilter('boxes');
            }}
            className={`flex-1 py-1.5 text-xs font-bubbly font-bold rounded-xl transition-all ${
              filter === 'boxes'
                ? 'bg-white text-[#3D352E] shadow-xs'
                : 'text-[#8C8074] hover:text-[#3D352E]'
            }`}
          >
            Boxes Claimed
          </button>
        </div>

        {/* Rankings Table */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1 no-scrollbar">
          {sortedEntries.length === 0 ? (
            <div className="py-12 text-center text-[#8C8074] text-sm font-bubbly">
              Loading champions...
            </div>
          ) : (
            sortedEntries.map((player, index) => {
              const isCurrentUser = player.userId === currentUserId;
              const rank = index + 1;

              return (
                <div
                  key={player.userId}
                  className={`flex items-center justify-between p-3 rounded-2xl border-2 transition-all ${
                    isCurrentUser
                      ? 'bg-[#EAF6FD] border-[#5BBFEA] shadow-xs'
                      : 'bg-[#FAF7F2] border-[#EFEAE1] hover:border-[#DFD7CB]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    {/* Rank Badge */}
                    <div className="w-7 text-center font-bubbly font-bold text-sm">
                      {rank === 1 ? (
                        <span className="text-[#F5B83D] text-base">🥇</span>
                      ) : rank === 2 ? (
                        <span className="text-[#A89D91] text-base">🥈</span>
                      ) : rank === 3 ? (
                        <span className="text-[#D49E72] text-base">🥉</span>
                      ) : (
                        <span className="text-[#8C8074]">#{rank}</span>
                      )}
                    </div>

                    {/* Avatar & Info */}
                    <div
                      className="w-10 h-10 rounded-2xl flex items-center justify-center text-xl border shadow-xs"
                      style={{
                        borderColor: player.color,
                        backgroundColor: `${player.color}18`
                      }}
                    >
                      {player.avatar}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bubbly font-bold text-sm text-[#3D352E]">
                          {player.displayName}
                        </span>
                        {isCurrentUser && (
                          <span className="text-[10px] bg-[#5BBFEA] text-white px-2 py-0.2 rounded-full font-bubbly font-bold">
                            YOU
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-[11px] text-[#8C8074] font-bubbly mt-0.5">
                        <span className="flex items-center gap-1">
                          <Trophy className="w-3 h-3 text-[#F5B83D]" />
                          {player.wins}W / {player.gamesPlayed - player.wins}L
                        </span>
                        <span className="text-[#A89D91] font-mono">
                          {player.winRate}% win rate
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* High Scores Readout */}
                  <div className="text-right">
                    <div
                      className="font-bubbly font-bold text-sm flex items-center justify-end gap-1"
                      style={{ color: player.color }}
                    >
                      {filter === 'score' && (
                        <>
                          <Zap className="w-3.5 h-3.5" />
                          {player.totalScore.toLocaleString()} pts
                        </>
                      )}
                      {filter === 'wins' && (
                        <>
                          <Trophy className="w-3.5 h-3.5" />
                          {player.wins} Wins
                        </>
                      )}
                      {filter === 'boxes' && (
                        <>
                          <Flame className="w-3.5 h-3.5" />
                          {player.boxesClaimed} Boxes
                        </>
                      )}
                    </div>
                    <div className="text-[10px] text-[#A69B8F] font-bubbly">
                      Streak: {player.winStreak} 🔥 · Max: {player.highestCombo}x
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
