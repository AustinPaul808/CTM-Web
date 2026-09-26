import React from 'react';
import { Trophy, Award, Medal, Download } from 'lucide-react';

export default function PodiumView({
  tournament,
  podium,
  onSelectPlayer,
}) {
  if (!podium) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm text-slate-500">
        <Trophy className="w-10 h-10 text-slate-300 mx-auto mb-2" />
        <p className="text-sm font-semibold">Tournament podium is available once finalized.</p>
        <p className="text-xs text-slate-400 mt-1">
          Complete all rounds and click "Finalize Tournament" to crown the champion and lock standings.
        </p>
      </div>
    );
  }

  const { champion, second, third, allStandings } = podium;

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900 text-white p-6 rounded-xl border border-slate-800 text-center shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <span className="px-3 py-1 bg-amber-500/20 text-amber-400 border border-amber-500/30 rounded-full text-xs font-bold uppercase tracking-widest inline-block mb-2">
            🏆 Tournament Completed
          </span>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">{tournament.name}</h2>
          <p className="text-xs text-slate-400 mt-1">
            {tournament.type} • {tournament.numberOfRounds} Rounds • {allStandings?.length || 0} Players
          </p>
        </div>
      </div>

      {/* Podium Cards Graphic */}
      <div className="flex flex-col sm:flex-row items-center sm:items-end justify-center gap-4 py-4 max-w-2xl mx-auto">
        {/* 2nd Place (Silver) */}
        {second && (
          <div className="order-2 sm:order-1 w-full sm:w-48 bg-white border-2 border-slate-300 rounded-xl p-4 text-center shadow-sm flex flex-col items-center">
            <span className="text-3xl mb-1 select-none">🥈</span>
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">
              2nd Place
            </span>
            <button
              onClick={() => onSelectPlayer(second.playerId)}
              className="font-extrabold text-sm text-slate-900 hover:text-blue-600 truncate mt-1 max-w-[150px]"
            >
              {second.name}
            </button>
            <div className="text-lg font-black text-blue-600 mt-0.5">
              {second.score.toFixed(1)} Pts
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              BH-Cut1: <strong>{second.buchholzCut1}</strong>
            </div>
          </div>
        )}

        {/* 1st Place (Champion Gold - Elevated) */}
        {champion && (
          <div className="order-1 sm:order-2 w-full sm:w-56 bg-amber-50/70 border-2 border-amber-400 rounded-xl p-5 text-center shadow-md flex flex-col items-center sm:-translate-y-4">
            <span className="text-4xl mb-1 select-none">🥇</span>
            <span className="text-[11px] font-black text-amber-800 uppercase tracking-widest bg-amber-200/60 px-2 py-0.5 rounded-full border border-amber-300">
              CHAMPION
            </span>
            <button
              onClick={() => onSelectPlayer(champion.playerId)}
              className="font-black text-base text-slate-900 hover:text-blue-600 truncate mt-1.5 max-w-[180px]"
            >
              {champion.name}
            </button>
            <div className="text-2xl font-black text-amber-700 mt-0.5">
              {champion.score.toFixed(1)} Pts
            </div>
            <div className="text-[11px] text-amber-800 font-semibold mt-2">
              Perf Rating: <strong>{champion.performanceRating || '—'}</strong>
            </div>
          </div>
        )}

        {/* 3rd Place (Bronze) */}
        {third && (
          <div className="order-3 sm:order-3 w-full sm:w-48 bg-white border-2 border-orange-300 rounded-xl p-4 text-center shadow-sm flex flex-col items-center">
            <span className="text-3xl mb-1 select-none">🥉</span>
            <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest">
              3rd Place
            </span>
            <button
              onClick={() => onSelectPlayer(third.playerId)}
              className="font-extrabold text-sm text-slate-900 hover:text-blue-600 truncate mt-1 max-w-[150px]"
            >
              {third.name}
            </button>
            <div className="text-lg font-black text-blue-600 mt-0.5">
              {third.score.toFixed(1)} Pts
            </div>
            <div className="text-[10px] text-slate-500 mt-2">
              BH-Cut1: <strong>{third.buchholzCut1}</strong>
            </div>
          </div>
        )}
      </div>

      {/* Complete Final Ranking Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Official Final Rankings
          </h3>
          <button
            onClick={() => window.open(`/api/tournaments/${tournament.id}/standings/export`, '_blank')}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-lg transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download Standings CSV</span>
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3 w-14 text-center">Rank</th>
                <th className="py-2.5 px-4">Player Name</th>
                <th className="py-2.5 px-3">Federation</th>
                <th className="py-2.5 px-3">Initial Rating</th>
                <th className="py-2.5 px-3 text-center bg-blue-50/50 font-black text-blue-900">Total Points</th>
                <th className="py-2.5 px-3 text-right">BH-Cut1</th>
                <th className="py-2.5 px-3 text-right">Performance (Rp)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {allStandings?.map((s) => (
                <tr key={s.playerId} className="hover:bg-slate-50">
                  <td className="py-2.5 px-3 text-center font-bold">
                    {s.rank === 1 ? '🥇 1' : s.rank === 2 ? '🥈 2' : s.rank === 3 ? '🥉 3' : s.rank}
                  </td>
                  <td className="py-2.5 px-4 font-semibold text-slate-900">
                    <button
                      onClick={() => onSelectPlayer(s.playerId)}
                      className="text-blue-600 hover:text-blue-800 hover:underline"
                    >
                      {s.name}
                    </button>
                  </td>
                  <td className="py-2.5 px-3 text-slate-600">{s.federation || '—'}</td>
                  <td className="py-2.5 px-3 text-slate-600">{s.rating}</td>
                  <td className="py-2.5 px-3 text-center font-black text-blue-700 bg-blue-50/50">
                    {s.score.toFixed(1)}
                  </td>
                  <td className="py-2.5 px-3 text-right font-medium text-slate-700">
                    {s.buchholzCut1}
                  </td>
                  <td className="py-2.5 px-3 text-right font-bold text-amber-700">
                    {s.performanceRating || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
