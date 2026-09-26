import React from 'react';
import { Trophy, ChevronRight } from 'lucide-react';

export default function KnockoutBracketView({
  tournament,
  rounds,
  onSelectPlayer,
}) {
  if (!rounds || rounds.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm text-slate-500">
        <p className="text-sm font-semibold">No knockout bracket generated yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Start the tournament to initialize the elimination tree.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
          Single Elimination Bracket
        </h3>
        <p className="text-xs text-slate-500">
          Winners automatically advance to subsequent rounds upon completing all matches.
        </p>
      </div>

      <div className="overflow-x-auto pb-6">
        <div className="flex space-x-6 min-w-max p-2">
          {rounds.map((r, rIdx) => {
            const isFinal = r.roundNumber === tournament.numberOfRounds;
            const roundTitle = isFinal
              ? '🏆 Championship Final'
              : r.roundNumber === tournament.numberOfRounds - 1
              ? 'Semifinals'
              : r.roundNumber === tournament.numberOfRounds - 2
              ? 'Quarterfinals'
              : `Round ${r.roundNumber}`;

            return (
              <div key={r.id} className="w-64 space-y-4 flex flex-col">
                <div className="bg-slate-900 text-white text-xs font-bold py-2 px-3 rounded-lg text-center shadow-sm">
                  {roundTitle}
                </div>

                <div className="space-y-4 flex-1 flex flex-col justify-around">
                  {r.matches.map((m) => {
                    const whiteWon = m.result === '1-0' || m.result === '1-0 (FORFEIT)' || (m.isBye && m.whitePlayerId);
                    const blackWon = m.result === '0-1' || m.result === '0-1 (FORFEIT)';

                    return (
                      <div
                        key={m.id}
                        className="bg-white border border-slate-200 rounded-lg shadow-sm overflow-hidden text-xs"
                      >
                        <div className="bg-slate-50 px-2.5 py-1 text-[10px] font-bold text-slate-500 border-b border-slate-100 flex justify-between">
                          <span>Board {m.boardNumber}</span>
                          <span>{m.status}</span>
                        </div>

                        {/* White Player */}
                        <div
                          className={`px-3 py-2 flex items-center justify-between border-b border-slate-100 ${
                            whiteWon ? 'bg-emerald-50 font-bold text-emerald-900' : ''
                          }`}
                        >
                          <button
                            onClick={() => m.whitePlayerId && onSelectPlayer(m.whitePlayerId)}
                            className="truncate max-w-[140px] text-left hover:underline"
                          >
                            {m.whitePlayer?.name || 'BYE'}
                          </button>
                          <span className="font-mono text-xs font-black">
                            {whiteWon ? '1' : m.result ? '0' : '—'}
                          </span>
                        </div>

                        {/* Black Player */}
                        <div
                          className={`px-3 py-2 flex items-center justify-between ${
                            blackWon ? 'bg-emerald-50 font-bold text-emerald-900' : ''
                          }`}
                        >
                          <button
                            onClick={() => m.blackPlayerId && onSelectPlayer(m.blackPlayerId)}
                            className="truncate max-w-[140px] text-left hover:underline"
                          >
                            {m.isBye ? '—' : m.blackPlayer?.name || 'TBD'}
                          </button>
                          <span className="font-mono text-xs font-black">
                            {blackWon ? '1' : m.result ? '0' : '—'}
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
