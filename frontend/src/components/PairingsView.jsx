import React, { useState } from 'react';
import { ArrowRight, Check, AlertCircle, Play, ChevronRight, ShieldAlert } from 'lucide-react';
import { updateMatchResult, generateNextRound } from '../api';

export default function PairingsView({
  tournament,
  rounds,
  onRefresh,
  onSelectPlayer,
}) {
  const [selectedRoundNum, setSelectedRoundNum] = useState(
    tournament?.currentRound || 1
  );
  const [updatingMatchId, setUpdatingMatchId] = useState(null);
  const [advancing, setAdvancing] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  if (!rounds || rounds.length === 0) {
    return (
      <div className="bg-white p-12 text-center rounded-xl border border-slate-200 shadow-sm text-slate-500">
        <p className="text-sm font-semibold">Tournament has not started yet.</p>
        <p className="text-xs text-slate-400 mt-1">
          Add players and click "Start Tournament" in the header to generate Round 1 pairings.
        </p>
      </div>
    );
  }

  // Active round or selected round
  const activeRound = rounds.find((r) => r.roundNumber === selectedRoundNum) || rounds[rounds.length - 1];
  const isLatestRound = activeRound?.roundNumber === rounds.length;
  const isTournamentActive = tournament?.status === 'ACTIVE';

  const pendingMatches = activeRound?.matches.filter(
    (m) => m.status !== 'COMPLETED' || !m.result
  ) || [];

  const allCompleted = pendingMatches.length === 0;

  async function handleSetResult(matchId, result) {
    try {
      setUpdatingMatchId(matchId);
      setErrorMsg(null);
      await updateMatchResult(matchId, result);
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setUpdatingMatchId(null);
    }
  }

  async function handleGenerateNextRound() {
    try {
      setAdvancing(true);
      setErrorMsg(null);
      const newRound = await generateNextRound(tournament.id);
      setSelectedRoundNum(newRound.roundNumber);
      onRefresh();
    } catch (err) {
      setErrorMsg(err.message);
    } finally {
      setAdvancing(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Round Selection Tabs & Round Status */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-3 rounded-xl border border-slate-200 shadow-sm">
        {/* Round Tabs */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 sm:pb-0">
          {rounds.map((r) => {
            const isDone = r.matches.every((m) => m.status === 'COMPLETED' && m.result);
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRoundNum(r.roundNumber)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center space-x-1 whitespace-nowrap ${
                  selectedRoundNum === r.roundNumber
                    ? 'bg-slate-900 text-white shadow-sm'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>Round {r.roundNumber}</span>
                {isDone && <Check className="w-3 h-3 text-emerald-400 inline" />}
              </button>
            );
          })}
        </div>

        {/* Advance Next Round Button */}
        {isTournamentActive && isLatestRound && (
          <div>
            {tournament.currentRound < tournament.numberOfRounds ? (
              <button
                onClick={handleGenerateNextRound}
                disabled={!allCompleted || advancing}
                className="flex items-center space-x-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-xs font-bold rounded-lg transition shadow-sm"
              >
                <span>{advancing ? 'Generating...' : `Generate Round ${activeRound.roundNumber + 1} Pairings`}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                All {tournament.numberOfRounds} rounds generated! Complete all matches and click Finalize.
              </span>
            )}
          </div>
        )}
      </div>

      {errorMsg && (
        <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded-lg flex items-center space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Round Header & Pending count */}
      <div className="flex items-center justify-between px-2">
        <h3 className="text-sm font-extrabold text-slate-800 uppercase tracking-wide">
          Round {activeRound?.roundNumber} Pairings & Results
        </h3>
        <span className="text-xs text-slate-500">
          {pendingMatches.length === 0 ? (
            <span className="text-emerald-600 font-bold">✓ All matches finished</span>
          ) : (
            <span className="text-amber-600 font-bold">
              {pendingMatches.length} match{pendingMatches.length > 1 ? 'es' : ''} in progress
            </span>
          )}
        </span>
      </div>

      {/* Pairings Cards / Boards */}
      <div className="space-y-2.5">
        {activeRound?.matches.map((m) => {
          const isBye = m.isBye;
          const isCompleted = m.status === 'COMPLETED' && m.result;

          return (
            <div
              key={m.id}
              className={`p-3.5 sm:p-4 rounded-xl border transition shadow-sm ${
                isCompleted
                  ? 'bg-white border-slate-200'
                  : 'bg-white border-blue-200 ring-1 ring-blue-100'
              }`}
            >
              <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                {/* Board # & Match Info */}
                <div className="flex items-center space-x-3 min-w-[100px]">
                  <div className="w-8 h-8 rounded-lg bg-slate-100 border border-slate-200 flex items-center justify-center font-black text-xs text-slate-700 shrink-0">
                    B{m.boardNumber}
                  </div>
                  {m.bracketNode && (
                    <span className="px-2 py-0.5 bg-purple-50 text-purple-700 font-bold text-[10px] rounded border border-purple-200">
                      {m.bracketNode}
                    </span>
                  )}
                </div>

                {/* Players Matchup: White vs Black */}
                <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-4 items-center">
                  {/* White Player */}
                  <div className="flex items-center space-x-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-base select-none">⚪</span>
                    <div className="min-w-0 flex-1">
                      <button
                        onClick={() => m.whitePlayerId && onSelectPlayer(m.whitePlayerId)}
                        className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline truncate block text-left"
                      >
                        {m.whitePlayer?.name || 'Unassigned'}
                      </button>
                      <div className="text-[10px] text-slate-500">
                        Rating: <strong>{m.whitePlayer?.rating || '—'}</strong>
                        {m.whitePlayer?.federation && ` • ${m.whitePlayer.federation}`}
                      </div>
                    </div>
                  </div>

                  {/* Black Player / Bye */}
                  <div className="flex items-center space-x-2.5 bg-slate-50 p-2 rounded-lg border border-slate-200">
                    <span className="text-base select-none">{isBye ? '★' : '⚫'}</span>
                    <div className="min-w-0 flex-1">
                      {isBye ? (
                        <div>
                          <span className="text-xs font-bold text-slate-600 italic">BYE (Unpaired)</span>
                          <div className="text-[10px] text-slate-400">+1.0 point awarded</div>
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => m.blackPlayerId && onSelectPlayer(m.blackPlayerId)}
                            className="text-xs font-bold text-slate-900 hover:text-blue-600 hover:underline truncate block text-left"
                          >
                            {m.blackPlayer?.name || 'Unassigned'}
                          </button>
                          <div className="text-[10px] text-slate-500">
                            Rating: <strong>{m.blackPlayer?.rating || '—'}</strong>
                            {m.blackPlayer?.federation && ` • ${m.blackPlayer.federation}`}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Result Entry / Badges */}
                <div className="flex items-center justify-end space-x-1.5 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-slate-100">
                  {isBye ? (
                    <span className="px-3 py-1 bg-emerald-50 text-emerald-700 font-black text-xs rounded-lg border border-emerald-200">
                      1-0 BYE
                    </span>
                  ) : (
                    <div className="flex items-center space-x-1">
                      {/* 1-0 White Win */}
                      <button
                        onClick={() => handleSetResult(m.id, '1-0')}
                        disabled={updatingMatchId === m.id}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                          m.result === '1-0'
                            ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
                        }`}
                        title="White Wins"
                      >
                        1 - 0
                      </button>

                      {/* 1/2-1/2 Draw */}
                      <button
                        onClick={() => handleSetResult(m.id, '1/2-1/2')}
                        disabled={updatingMatchId === m.id}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                          m.result === '1/2-1/2' || m.result === '½-½'
                            ? 'bg-amber-500 text-white border-amber-500 shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
                        }`}
                        title="Draw"
                      >
                        ½ - ½
                      </button>

                      {/* 0-1 Black Win */}
                      <button
                        onClick={() => handleSetResult(m.id, '0-1')}
                        disabled={updatingMatchId === m.id}
                        className={`px-3 py-1.5 text-xs font-bold rounded-lg transition border ${
                          m.result === '0-1'
                            ? 'bg-slate-800 text-white border-slate-800 shadow-sm'
                            : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-300'
                        }`}
                        title="Black Wins"
                      >
                        0 - 1
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
