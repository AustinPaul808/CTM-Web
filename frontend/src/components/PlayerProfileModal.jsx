import React, { useEffect, useState } from 'react';
import { X, User, Trophy, Shield, Award, Calendar } from 'lucide-react';
import { fetchPlayerProfile } from '../api';

export default function PlayerProfileModal({ tournamentId, playerId, onClose }) {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!tournamentId || !playerId) return;
    setLoading(true);
    fetchPlayerProfile(tournamentId, playerId)
      .then(setProfile)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [tournamentId, playerId]);

  if (!playerId) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <User className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold tracking-wide">Player Profile</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition rounded p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm">
            Loading player tournament statistics...
          </div>
        ) : error ? (
          <div className="p-6 text-center text-red-600 text-sm">{error}</div>
        ) : profile ? (
          <div className="p-6 space-y-5">
            {/* Top Identity Card */}
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div>
                <div className="flex items-center space-x-2">
                  <span className="font-extrabold text-xl text-slate-900">
                    {profile.player.name}
                  </span>
                  {profile.player.title && (
                    <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-1.5 py-0.5 rounded border border-amber-300">
                      {profile.player.title}
                    </span>
                  )}
                  {profile.tournamentStats.rank && (
                    <span className="bg-blue-100 text-blue-800 text-[10px] font-bold px-2 py-0.5 rounded-full">
                      Rank #{profile.tournamentStats.rank}
                    </span>
                  )}
                </div>
                <div className="text-xs text-slate-500 mt-1 flex flex-wrap gap-x-3 gap-y-1">
                  <span><strong>FIDE ID:</strong> {profile.player.fideId || '—'}</span>
                  <span><strong>Fed:</strong> {profile.player.federation || '—'}</span>
                  {profile.player.age && <span><strong>Age:</strong> {profile.player.age}</span>}
                  {profile.player.club && <span><strong>Club:</strong> {profile.player.club}</span>}
                </div>
              </div>

              {/* FIDE Rating Box */}
              <div className="text-right bg-slate-50 p-2.5 rounded-lg border border-slate-200">
                <div className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">
                  Initial Rating
                </div>
                <div className="text-lg font-black text-slate-800">
                  {profile.player.rating}
                </div>
              </div>
            </div>

            {/* Tournament Performance Stats Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
              <div className="bg-blue-50 border border-blue-200 p-2.5 rounded-lg text-center">
                <div className="text-[10px] font-bold text-blue-700 uppercase">Score</div>
                <div className="text-base font-extrabold text-blue-900">
                  {profile.tournamentStats.score}
                </div>
                <div className="text-[10px] text-blue-600">
                  {profile.tournamentStats.wins}W / {profile.tournamentStats.draws}D / {profile.tournamentStats.losses}L
                </div>
              </div>

              <div className="bg-amber-50 border border-amber-200 p-2.5 rounded-lg text-center">
                <div className="text-[10px] font-bold text-amber-700 uppercase">Performance</div>
                <div className="text-base font-extrabold text-amber-900">
                  {profile.tournamentStats.performanceRating || '—'}
                </div>
                <div className="text-[10px] text-amber-600">FIDE Rp Estimate</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center">
                <div className="text-[10px] font-bold text-slate-600 uppercase">Buchholz Cut-1</div>
                <div className="text-base font-bold text-slate-800">
                  {profile.tournamentStats.buchholzCut1}
                </div>
                <div className="text-[10px] text-slate-500">BH: {profile.tournamentStats.buchholz}</div>
              </div>

              <div className="bg-slate-50 border border-slate-200 p-2.5 rounded-lg text-center">
                <div className="text-[10px] font-bold text-slate-600 uppercase">Sonneborn-B.</div>
                <div className="text-base font-bold text-slate-800">
                  {profile.tournamentStats.sonnebornBerger}
                </div>
                <div className="text-[10px] text-slate-500">SB Tiebreak</div>
              </div>
            </div>

            {/* Tournament Match Record */}
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2 flex items-center space-x-1.5">
                <Calendar className="w-4 h-4 text-slate-500" />
                <span>Round-by-Round Match Record</span>
              </h3>

              {profile.matchHistory.length === 0 ? (
                <div className="text-xs text-slate-400 py-4 text-center border border-dashed rounded-lg">
                  No games played yet.
                </div>
              ) : (
                <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                      <tr>
                        <th className="py-2 px-3">Round</th>
                        <th className="py-2 px-2">Color</th>
                        <th className="py-2 px-3">Opponent</th>
                        <th className="py-2 px-2">Opp Rating</th>
                        <th className="py-2 px-2">Result</th>
                        <th className="py-2 px-3 text-right">Pts</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {profile.matchHistory.map((m, idx) => (
                        <tr key={idx} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-semibold text-slate-700">R{m.roundNumber}</td>
                          <td className="py-2 px-2">
                            {m.isBye ? (
                              <span className="text-slate-400">—</span>
                            ) : (
                              <span className="inline-flex items-center space-x-1">
                                <span className={m.isWhite ? 'text-slate-800' : 'text-slate-500'}>
                                  {m.isWhite ? '⚪ W' : '⚫ B'}
                                </span>
                              </span>
                            )}
                          </td>
                          <td className="py-2 px-3 font-medium text-slate-800">
                            {m.isBye ? (
                              <span className="italic text-slate-500">Unpaired Bye</span>
                            ) : (
                              m.opponent?.name || 'Unknown'
                            )}
                          </td>
                          <td className="py-2 px-2 text-slate-500">
                            {m.isBye ? '—' : m.opponent?.rating || '—'}
                          </td>
                          <td className="py-2 px-2">
                            {m.result ? (
                              <span className="px-1.5 py-0.5 rounded text-[11px] font-bold bg-slate-100 text-slate-800">
                                {m.result}
                              </span>
                            ) : (
                              <span className="text-slate-400">In Progress</span>
                            )}
                          </td>
                          <td className="py-2 px-3 text-right font-bold text-blue-600">
                            {m.playerScore !== null ? `+${m.playerScore}` : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        ) : null}

        {/* Footer */}
        <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-white rounded-lg transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
