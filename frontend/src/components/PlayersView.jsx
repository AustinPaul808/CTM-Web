import React, { useState } from 'react';
import { UserPlus, Sparkles, Trash2, Search } from 'lucide-react';
import { addPlayer, loadSamplePlayers, removePlayer } from '../api';

export default function PlayersView({
  tournament,
  players,
  onRefresh,
  onSelectPlayer,
}) {
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [newPlayer, setNewPlayer] = useState({
    name: '',
    fideId: '',
    rating: 1800,
    age: 24,
    federation: 'IND',
    club: '',
    title: ''
  });

  const isRegistration = tournament?.status === 'REGISTRATION';

  async function handleAdd(e) {
    e.preventDefault();
    if (!newPlayer.name.trim()) return;

    try {
      setLoading(true);
      await addPlayer(tournament.id, newPlayer);
      setShowAddModal(false);
      setNewPlayer({
        name: '',
        fideId: '',
        rating: 1800,
        age: 24,
        federation: 'IND',
        club: '',
        title: ''
      });
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleLoadSample(count) {
    try {
      setLoading(true);
      await loadSamplePlayers(tournament.id, count);
      onRefresh();
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(playerId) {
    if (!confirm('Remove this player from tournament?')) return;
    try {
      await removePlayer(tournament.id, playerId);
      onRefresh();
    } catch (err) {
      alert(err.message);
    }
  }

  const filtered = players.filter((tp) =>
    (tp.player.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tp.player.club || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
    (tp.player.federation || '').toLowerCase().includes(searchTerm.toLowerCase())
  );

  const avgRating = players.length > 0
    ? Math.round(players.reduce((sum, p) => sum + p.player.rating, 0) / players.length)
    : 0;

  return (
    <div className="space-y-4">
      {/* Top Banner & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
        <div>
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
            Player Roster ({players.length})
          </h3>
          <p className="text-xs text-slate-500">
            Avg Rating: <strong className="text-slate-700">{avgRating || '—'}</strong> • Top Seed: <strong className="text-slate-700">{players[0]?.player.name || '—'}</strong>
          </p>
        </div>

        {isRegistration && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => handleLoadSample(8)}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 text-xs font-bold rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-600" />
              <span>Load 8 GMs</span>
            </button>
            <button
              onClick={() => handleLoadSample(16)}
              disabled={loading}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-800 text-xs font-bold rounded-lg transition"
            >
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Load 16 GMs</span>
            </button>
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center space-x-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg transition shadow-sm"
            >
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Player</span>
            </button>
          </div>
        )}
      </div>

      {/* Search Input */}
      <div className="relative">
        <input
          type="text"
          placeholder="Search by name, club, or federation..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
      </div>

      {/* Roster Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-100/75 text-slate-600 font-bold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-4 w-12 text-center"># Seed</th>
                <th className="py-2.5 px-4">Player Name</th>
                <th className="py-2.5 px-3">FIDE ID</th>
                <th className="py-2.5 px-3">Rating</th>
                <th className="py-2.5 px-3">Age</th>
                <th className="py-2.5 px-3">Federation</th>
                <th className="py-2.5 px-3">Club / Institution</th>
                {isRegistration && <th className="py-2.5 px-3 text-right">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan="8" className="py-12 text-center text-slate-400">
                    {players.length === 0
                      ? 'No players registered yet. Add players or click "Load 8 GMs".'
                      : 'No players match your search filter.'}
                  </td>
                </tr>
              ) : (
                filtered.map((tp) => (
                  <tr key={tp.id} className="hover:bg-slate-50 transition">
                    <td className="py-2.5 px-4 text-center font-bold text-slate-500">
                      {tp.startingSeed}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-slate-900">
                      <button
                        onClick={() => onSelectPlayer(tp.playerId)}
                        className="text-blue-600 hover:text-blue-800 hover:underline flex items-center space-x-1.5 text-left"
                      >
                        <span>{tp.player.name}</span>
                        {tp.player.title && (
                          <span className="text-[10px] font-bold bg-amber-100 text-amber-800 px-1 py-0.2 rounded border border-amber-300">
                            {tp.player.title}
                          </span>
                        )}
                      </button>
                    </td>
                    <td className="py-2.5 px-3 text-slate-500">{tp.player.fideId || '—'}</td>
                    <td className="py-2.5 px-3 font-bold text-slate-800">{tp.player.rating}</td>
                    <td className="py-2.5 px-3 text-slate-600">{tp.player.age || '—'}</td>
                    <td className="py-2.5 px-3 font-medium text-slate-700">{tp.player.federation || '—'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{tp.player.club || '—'}</td>
                    {isRegistration && (
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => handleDelete(tp.playerId)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Remove player"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Player Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-md w-full p-6 animate-in fade-in zoom-in-95 duration-150">
            <h3 className="text-base font-bold text-slate-900 mb-4">Add Player to Tournament</h3>
            <form onSubmit={handleAdd} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Player Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Magnus Carlsen"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPlayer.name}
                  onChange={(e) => setNewPlayer({ ...newPlayer, name: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">FIDE Rating *</label>
                  <input
                    type="number"
                    required
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPlayer.rating}
                    onChange={(e) => setNewPlayer({ ...newPlayer, rating: parseInt(e.target.value, 10) || 1500 })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">FIDE ID</label>
                  <input
                    type="text"
                    placeholder="e.g. 1503014"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPlayer.fideId}
                    onChange={(e) => setNewPlayer({ ...newPlayer, fideId: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Federation</label>
                  <input
                    type="text"
                    placeholder="e.g. IND"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                    value={newPlayer.federation}
                    onChange={(e) => setNewPlayer({ ...newPlayer, federation: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Age</label>
                  <input
                    type="number"
                    className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPlayer.age}
                    onChange={(e) => setNewPlayer({ ...newPlayer, age: parseInt(e.target.value, 10) || 18 })}
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 uppercase mb-1">Title</label>
                  <select
                    className="w-full px-3 py-2 border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    value={newPlayer.title}
                    onChange={(e) => setNewPlayer({ ...newPlayer, title: e.target.value })}
                  >
                    <option value="">None</option>
                    <option value="GM">GM</option>
                    <option value="IM">IM</option>
                    <option value="FM">FM</option>
                    <option value="CM">CM</option>
                    <option value="WGM">WGM</option>
                    <option value="WIM">WIM</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 uppercase mb-1">Club / Institution</label>
                <input
                  type="text"
                  placeholder="e.g. Offerspill / Mumbai CC"
                  className="w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={newPlayer.club}
                  onChange={(e) => setNewPlayer({ ...newPlayer, club: e.target.value })}
                />
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border rounded-lg text-slate-600 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-lg transition"
                >
                  Add Player
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
