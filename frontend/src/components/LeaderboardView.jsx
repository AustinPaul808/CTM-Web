import React from 'react';
import { Download, Award, HelpCircle } from 'lucide-react';

export default function LeaderboardView({
  tournament,
  standings,
  onSelectPlayer,
}) {
  if (!standings || standings.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm text-slate-500">
        <p className="text-sm font-semibold">No standings available yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Start the tournament and enter game results to view real-time standings and tiebreaks.
        </p>
      </div>
    );
  }

  function handleDownloadCsv() {
    window.open(`/api/tournaments/${tournament.id}/standings/export`, '_blank');
  }

  return (
    <div className="space-y-4">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Tournament Standings & FIDE Tiebreaks
          </h3>
          <p className="text-xs text-slate-500">
            Ranked by Score &rarr; Direct Encounter &rarr; Buchholz Cut-1 &rarr; Buchholz &rarr; Sonneborn-Berger
          </p>
        </div>

        <button
          onClick={handleDownloadCsv}
          className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg border border-slate-300 transition"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Export CSV</span>
        </button>
      </div>

      {/* Standings Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-12 text-center">Rank</th>
                <th className="py-2.5 px-4">Player</th>
                <th className="py-2.5 px-2">Fed</th>
                <th className="py-2.5 px-3">Rating</th>
                <th className="py-2.5 px-3 text-center bg-blue-50/50 font-black text-blue-900">Score</th>
                <th className="py-2.5 px-3 text-center">W - D - L</th>
                <th className="py-2.5 px-3 text-right" title="Buchholz Cut-1">BH-Cut1</th>
                <th className="py-2.5 px-3 text-right" title="Buchholz Total">Buchholz</th>
                <th className="py-2.5 px-3 text-right" title="Sonneborn-Berger">Sonn-B.</th>
                <th className="py-2.5 px-3 text-right text-amber-700 font-bold" title="Performance Rating">Perf (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {standings.map((s) => {
                const isFirst = s.rank === 1;
                const isSecond = s.rank === 2;
                const isThird = s.rank === 3;

                return (
                  <tr
                    key={s.playerId}
                    className={`hover:bg-slate-50 transition ${
                      isFirst
                        ? 'bg-amber-50/30'
                        : isSecond
                        ? 'bg-slate-50/40'
                        : isThird
                        ? 'bg-orange-50/30'
                        : ''
                    }`}
                  >
                    {/* Rank with Medal */}
                    <td className="py-2.5 px-3 text-center font-black">
                      {isFirst ? (
                        <span className="text-amber-500 font-extrabold flex items-center justify-center space-x-0.5">
                          <span>🥇</span>
                          <span>1</span>
                        </span>
                      ) : isSecond ? (
                        <span className="text-slate-400 font-extrabold flex items-center justify-center space-x-0.5">
                          <span>🥈</span>
                          <span>2</span>
                        </span>
                      ) : isThird ? (
                        <span className="text-orange-500 font-extrabold flex items-center justify-center space-x-0.5">
                          <span>🥉</span>
                          <span>3</span>
                        </span>
                      ) : (
                        <span className="text-slate-500">{s.rank}</span>
                      )}
                    </td>

                    {/* Player Name */}
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      <button
                        onClick={() => onSelectPlayer(s.playerId)}
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1.5 text-left"
                      >
                        <span>{s.name}</span>
                        {s.title && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-300">
                            {s.title}
                          </span>
                        )}
                      </button>
                    </td>

                    {/* Fed */}
                    <td className="py-2.5 px-2 font-medium text-slate-600">{s.federation || '—'}</td>

                    {/* Initial Rating */}
                    <td className="py-2.5 px-3 text-slate-700 font-medium">{s.rating}</td>

                    {/* Total Score */}
                    <td className="py-2.5 px-3 text-center font-black text-sm text-blue-700 bg-blue-50/50">
                      {s.score.toFixed(1)}
                    </td>

                    {/* W-D-L */}
                    <td className="py-2.5 px-3 text-center text-slate-600 font-mono text-[11px]">
                      {s.wins} - {s.draws} - {s.losses}
                    </td>

                    {/* BH Cut 1 */}
                    <td className="py-2.5 px-3 text-right font-semibold text-slate-800">
                      {s.buchholzCut1}
                    </td>

                    {/* Buchholz Full */}
                    <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                      {s.buchholz}
                    </td>

                    {/* Sonneborn Berger */}
                    <td className="py-2.5 px-3 text-right text-slate-600 font-mono text-[11px]">
                      {s.sonnebornBerger}
                    </td>

                    {/* Performance Rating */}
                    <td className="py-2.5 px-3 text-right font-extrabold text-amber-800">
                      {s.performanceRating || '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Tiebreak Explanations Footer */}
      <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-[11px] text-slate-500 flex flex-wrap gap-x-6 gap-y-1">
        <span><strong>BH-Cut1:</strong> Sum of opponents' scores excluding the lowest.</span>
        <span><strong>Buchholz:</strong> Total sum of all opponents' scores.</span>
        <span><strong>Sonn-B.:</strong> Scores of beaten opponents + 50% of drawn opponents.</span>
        <span><strong>Perf (Rp):</strong> FIDE estimated tournament performance rating strength.</span>
      </div>
    </div>
  );
}
