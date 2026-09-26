import React from 'react';
import { Trophy, Plus, ChevronDown, CheckCircle2, PlayCircle, Award } from 'lucide-react';

export default function Navbar({
  tournaments,
  activeTournament,
  onSelectTournament,
  onOpenCreateModal,
}) {
  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center shadow-inner">
            <span className="text-2xl select-none">♟</span>
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="font-bold text-base tracking-wide text-white">
                CHESS TOURNAMENT MANAGER
              </h1>
              <span className="hidden sm:inline-block px-2 py-0.5 text-[10px] font-bold bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded">
                MVP v1.0
              </span>
            </div>
            <p className="text-xs text-slate-400">Pairings • Results • FIDE Tiebreaks</p>
          </div>
        </div>

        {/* Right Actions: Tournament Switcher + Create Button */}
        <div className="flex items-center space-x-3">
          {/* Active Tournament Dropdown */}
          {tournaments.length > 0 && (
            <div className="relative">
              <select
                className="bg-slate-800 text-slate-200 text-xs rounded-md border border-slate-700 px-3 py-1.5 pr-8 appearance-none focus:outline-none focus:ring-1 focus:ring-blue-500 cursor-pointer max-w-[200px] truncate"
                value={activeTournament?.id || ''}
                onChange={(e) => onSelectTournament(e.target.value)}
              >
                {tournaments.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name} ({t.type})
                  </option>
                ))}
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-2.5 pointer-events-none" />
            </div>
          )}

          {/* Create Tournament Button */}
          <button
            onClick={onOpenCreateModal}
            className="flex items-center space-x-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold px-3 py-1.5 rounded-md transition shadow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Tournament</span>
          </button>
        </div>
      </div>
    </header>
  );
}
