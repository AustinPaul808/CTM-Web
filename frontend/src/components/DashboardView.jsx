import React from 'react';
import { Users, Layers, Award, Clock, ArrowRight, Play, CheckCircle } from 'lucide-react';

export default function DashboardView({
  tournament,
  players,
  rounds,
  standings,
  onNavigateTab,
  onSelectPlayer,
  onQuickResult,
}) {
  const currentRound = rounds[rounds.length - 1];
  const activeGamesCount = currentRound
    ? currentRound.matches.filter((m) => m.status === 'PENDING' && !m.isBye).length
    : 0;

  const topStandings = (standings || []).slice(0, 5);

  return (
    <div className="space-y-6">
      {/* 3 Metric Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Round Progress */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Current Round
          </div>
          <div className="text-2xl font-black text-slate-900 my-1">
            {tournament?.currentRound || 0}{' '}
            <span className="text-slate-400 font-normal text-sm">
              / {tournament?.numberOfRounds || 0}
            </span>
          </div>
          <div className="w-full bg-slate-100 rounded-full h-1.5 mt-1 overflow-hidden">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{
                width: `${
                  tournament?.numberOfRounds
                    ? ((tournament?.currentRound || 0) / tournament.numberOfRounds) * 100
                    : 0
                }%`,
              }}
            />
          </div>
        </div>

        {/* Metric 2: Players */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Players
          </div>
          <div className="text-2xl font-black text-slate-900 my-1">
            {players.length}
          </div>
          <div className="text-[10px] text-slate-500">
            {players.length >= 2 ? 'Roster Ready' : 'Add at least 2 players'}
          </div>
        </div>

        {/* Metric 3: Active Games */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Games In Progress
          </div>
          <div className="text-2xl font-black text-blue-600 my-1">
            {activeGamesCount}
          </div>
          <div className="text-[10px] text-slate-500">
            {currentRound ? `Round ${currentRound.roundNumber}` : 'No active round'}
          </div>
        </div>

        {/* Metric 4: Format & Time */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
            Format & Pace
          </div>
          <div className="text-base font-extrabold text-slate-800 my-1 truncate">
            {tournament?.type}
          </div>
          <div className="text-[10px] text-slate-500 truncate">
            {tournament?.timeControl} • {tournament?.ratingSystem}
          </div>
        </div>
      </div>

      {/* Main Grid: Left = Current Round Board, Right = Standings Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2/3): Current Round Pairings Preview */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Current Round Pairings
              </h3>
              <p className="text-xs text-slate-500">
                {currentRound ? `Round ${currentRound.roundNumber}` : 'Tournament not started'}
              </p>
            </div>
            <button
              onClick={() => onNavigateTab('pairings')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>View All Boards</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {!currentRound || currentRound.matches.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No matches generated yet. Start the tournament to begin Round 1.
            </div>
          ) : (
            <div className="space-y-2.5">
              {currentRound.matches.slice(0, 5).map((m) => (
                <div
                  key={m.id}
                  className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs"
                >
                  <div className="flex items-center space-x-2 w-10 shrink-0 font-bold text-slate-500">
                    B{m.boardNumber}
                  </div>

                  <div className="flex-1 flex items-center space-x-2 truncate">
                    <button
                      onClick={() => m.whitePlayerId && onSelectPlayer(m.whitePlayerId)}
                      className="font-bold text-slate-900 hover:underline truncate"
                    >
                      {m.whitePlayer?.name || 'BYE'}
                    </button>
                    <span className="text-slate-400 text-[10px]">vs</span>
                    <button
                      onClick={() => m.blackPlayerId && onSelectPlayer(m.blackPlayerId)}
                      className="font-bold text-slate-900 hover:underline truncate"
                    >
                      {m.isBye ? 'BYE' : m.blackPlayer?.name || 'BYE'}
                    </button>
                  </div>

                  {/* Outcome pill or action */}
                  <div className="shrink-0 pl-3">
                    {m.result ? (
                      <span className="px-2 py-0.5 font-bold rounded bg-slate-200 text-slate-800 text-[11px]">
                        {m.result}
                      </span>
                    ) : (
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => onQuickResult(m.id, '1-0')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-bold text-[11px]"
                          title="1-0"
                        >
                          1-0
                        </button>
                        <button
                          onClick={() => onQuickResult(m.id, '1/2-1/2')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-bold text-[11px]"
                          title="½-½"
                        >
                          ½
                        </button>
                        <button
                          onClick={() => onQuickResult(m.id, '0-1')}
                          className="px-2 py-1 bg-white hover:bg-slate-100 border border-slate-300 rounded font-bold text-[11px]"
                          title="0-1"
                        >
                          0-1
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {currentRound.matches.length > 5 && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => onNavigateTab('pairings')}
                    className="text-xs font-semibold text-blue-600 hover:underline"
                  >
                    + {currentRound.matches.length - 5} more boards
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Right Column (1/3): Top Standings Leaderboard Preview */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100">
            <div>
              <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wide">
                Current Standings
              </h3>
              <p className="text-xs text-slate-500">Top Leaders</p>
            </div>
            <button
              onClick={() => onNavigateTab('leaderboard')}
              className="text-xs font-bold text-blue-600 hover:text-blue-800 flex items-center space-x-1"
            >
              <span>Full Board</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {topStandings.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No results entered yet.
            </div>
          ) : (
            <div className="space-y-2">
              {topStandings.map((s, idx) => (
                <div
                  key={s.playerId}
                  className="flex items-center justify-between p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs hover:bg-slate-100 transition"
                >
                  <div className="flex items-center space-x-2.5 truncate">
                    <span className="font-extrabold text-slate-400 w-4 text-center">
                      {idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : idx + 1}
                    </span>
                    <button
                      onClick={() => onSelectPlayer(s.playerId)}
                      className="font-bold text-slate-900 hover:text-blue-600 truncate text-left"
                    >
                      {s.name}
                    </button>
                  </div>
                  <div className="text-right shrink-0 pl-2">
                    <span className="font-black text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                      {s.score.toFixed(1)} pts
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
