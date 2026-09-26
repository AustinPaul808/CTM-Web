import React, { useState } from 'react';
import { X, Trophy, Layers, Clock, Users, MapPin, User } from 'lucide-react';

export default function CreateTournamentModal({ isOpen, onClose, onCreate }) {
  const [formData, setFormData] = useState({
    name: 'FRCRCE Chess Championship 2026',
    location: 'Mumbai',
    organizer: 'Chess Club Organizer',
    type: 'SWISS',
    numberOfRounds: 7,
    timeControl: '10+0 Rapid',
    ratingSystem: 'FIDE'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Please provide a tournament name.');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      await onCreate(formData);
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-xl shadow-2xl border border-slate-200 max-w-lg w-full overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="bg-slate-900 px-6 py-4 flex items-center justify-between text-white">
          <div className="flex items-center space-x-2">
            <Trophy className="w-5 h-5 text-blue-400" />
            <h2 className="text-base font-bold tracking-wide">Create Tournament</h2>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition rounded p-1"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded">
              {error}
            </div>
          )}

          {/* Tournament Name */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
              Tournament Name *
            </label>
            <div className="relative">
              <input
                type="text"
                required
                className="w-full pl-3 pr-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. FRCRCE Chess Championship"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>
          </div>

          {/* Location & Organizer */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Location
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. Mumbai"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value })}
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Organizer
              </label>
              <input
                type="text"
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                placeholder="e.g. College Chess Committee"
                value={formData.organizer}
                onChange={(e) => setFormData({ ...formData, organizer: e.target.value })}
              />
            </div>
          </div>

          {/* Tournament Type & Number of Rounds */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Tournament Format *
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.type}
                onChange={(e) => {
                  const type = e.target.value;
                  let rounds = formData.numberOfRounds;
                  if (type === 'ROUND_ROBIN') rounds = 7;
                  if (type === 'KNOCKOUT') rounds = 4;
                  setFormData({ ...formData, type, numberOfRounds: rounds });
                }}
              >
                <option value="SWISS">Swiss System (Standard)</option>
                <option value="ROUND_ROBIN">Round Robin (All-play-All)</option>
                <option value="KNOCKOUT">Knockout (Bracket)</option>
                <option value="ARENA">Arena (Continuous)</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Number of Rounds *
              </label>
              <input
                type="number"
                min="1"
                max="50"
                required
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.numberOfRounds}
                onChange={(e) => setFormData({ ...formData, numberOfRounds: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          {/* Time Control & Rating System */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Time Control
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.timeControl}
                onChange={(e) => setFormData({ ...formData, timeControl: e.target.value })}
              >
                <option value="10+0 Rapid">10+0 Rapid</option>
                <option value="15+10 Rapid">15+10 Rapid</option>
                <option value="3+2 Blitz">3+2 Blitz</option>
                <option value="5+3 Blitz">5+3 Blitz</option>
                <option value="90+30 Classical">90+30 Classical</option>
                <option value="Custom">Custom</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1">
                Rating System
              </label>
              <select
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 focus:outline-none"
                value={formData.ratingSystem}
                onChange={(e) => setFormData({ ...formData, ratingSystem: e.target.value })}
              >
                <option value="FIDE">FIDE Rating System</option>
                <option value="Custom">Custom / Local Rating</option>
              </select>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="pt-3 border-t border-slate-200 flex justify-end space-x-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white rounded-lg transition shadow-sm disabled:opacity-50"
            >
              {loading ? 'Creating...' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
