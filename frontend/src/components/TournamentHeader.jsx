import React from 'react';
import { Play, CheckCircle, Trash2, Calendar, MapPin, Award, Clock } from 'lucide-react';

export default function TournamentHeader({
  tournament,
  onStart,
  onFinish,
  onDelete,
  activeTab,
  onTabChange,
  playerCount = 0,
}) {
  if (!tournament) return null;

  const isRegistration = tournament.status === 'REGISTRATION';
  const isActive = tournament.status === 'ACTIVE';
  const isCompleted = tournament.status === 'COMPLETED';

  return (
    <div className="bg-white border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          {/* Tournament Info */}
          <div>
            <div className="flex items-center space-x-3">
              <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                {tournament.name}
              </h2>

              {/* Status Badge */}
              <span
                className={`px-2.5 py-0.5 text-xs font-bold rounded-full uppercase tracking-wider ${
                  isRegistration
                    ? 'bg-amber-100 text-amber-800 border border-amber-300'
                    : isActive
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300 animate-pulse'
                    : 'bg-purple-100 text-purple-800 border border-purple-300'
                }`}
              >
                {tournament.status}
              </span>
            </div>

            {/* Metadata Pills */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-slate-600">
              <span className="inline-flex items-center font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                {tournament.type} SYSTEM
              </span>
              <span className="inline-flex items-center font-medium bg-slate-100 px-2 py-0.5 rounded">
                <Clock className="w-3.5 h-3.5 mr-1 text-slate-500" />
                {tournament.timeControl || '10+0'}
              </span>
              <span className="inline-flex items-center font-medium bg-slate-100 px-2 py-0.5 rounded">
                Rounds: {tournament.currentRound || 0} / {tournament.numberOfRounds}
              </span>
              {tournament.location && (
                <span className="inline-flex items-center text-slate-500">
                  <MapPin className="w-3.5 h-3.5 mr-1 text-slate-400" />
                  {tournament.location}
                </span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center space-x-2">
            {isRegistration && (
              <button
                onClick={onStart}
                disabled={playerCount < 2}
                className="flex items-center space-x-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                <Play className="w-4 h-4 fill-white" />
                <span>Start Tournament</span>
              </button>
            )}

            {isActive && (
              <button
                onClick={onFinish}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold rounded-lg shadow-sm transition"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Finalize Tournament</span>
              </button>
            )}

            <button
              onClick={onDelete}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
              title="Delete Tournament"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-6 mt-6 border-b border-slate-200 text-xs font-bold tracking-wide">
          {[
            { id: 'dashboard', label: 'Dashboard' },
            { id: 'pairings', label: 'Pairings & Results' },
            { id: 'leaderboard', label: 'Leaderboard & Tiebreaks' },
            { id: 'players', label: `Players (${playerCount})` },
            ...(tournament.type === 'KNOCKOUT' ? [{ id: 'bracket', label: 'Bracket View' }] : []),
            ...(isCompleted ? [{ id: 'podium', label: '🏆 Final Podium' }] : [])
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`pb-3 border-b-2 transition uppercase ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
