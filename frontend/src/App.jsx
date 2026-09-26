import React, { useEffect, useState } from 'react';
import Navbar from './components/Navbar';
import TournamentHeader from './components/TournamentHeader';
import DashboardView from './components/DashboardView';
import PlayersView from './components/PlayersView';
import PairingsView from './components/PairingsView';
import LeaderboardView from './components/LeaderboardView';
import KnockoutBracketView from './components/KnockoutBracketView';
import PodiumView from './components/PodiumView';
import PlayerProfileModal from './components/PlayerProfileModal';
import CreateTournamentModal from './components/CreateTournamentModal';

import {
  fetchTournaments,
  fetchTournament,
  createTournament,
  startTournament,
  finishTournament,
  deleteTournament,
  fetchRounds,
  fetchStandings,
  fetchPodium,
  updateMatchResult,
  loadSamplePlayers
} from './api';

export default function App() {
  const [tournaments, setTournaments] = useState([]);
  const [activeTournament, setActiveTournament] = useState(null);
  const [players, setPlayers] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [standings, setStandings] = useState([]);
  const [podium, setPodium] = useState(null);

  const [activeTab, setActiveTab] = useState('dashboard');
  const [selectedPlayerId, setSelectedPlayerId] = useState(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  // Initialize data
  useEffect(() => {
    loadInitialData();
  }, []);

  async function loadInitialData() {
    try {
      setLoading(true);
      const list = await fetchTournaments();
      setTournaments(list);

      if (list.length > 0) {
        await loadTournamentDetails(list[0].id);
      } else {
        // Auto-seed initial demo tournament if empty
        const created = await createTournament({
          name: 'FRCRCE Chess Championship 2026',
          location: 'Mumbai',
          organizer: 'College Chess Committee',
          type: 'SWISS',
          numberOfRounds: 7,
          timeControl: '10+0 Rapid',
          ratingSystem: 'FIDE'
        });
        await loadSamplePlayers(created.id, 8);
        const updatedList = await fetchTournaments();
        setTournaments(updatedList);
        await loadTournamentDetails(created.id);
      }
    } catch (err) {
      console.error('Initialization error:', err);
    } finally {
      setLoading(false);
    }
  }

  async function loadTournamentDetails(tournamentId) {
    try {
      const tourney = await fetchTournament(tournamentId);
      setActiveTournament(tourney);
      setPlayers(tourney.players || []);

      const [rList, sList] = await Promise.all([
        fetchRounds(tournamentId).catch(() => []),
        fetchStandings(tournamentId).catch(() => [])
      ]);

      setRounds(rList);
      setStandings(sList);

      if (tourney.status === 'COMPLETED') {
        const pod = await fetchPodium(tournamentId).catch(() => null);
        setPodium(pod);
      } else {
        setPodium(null);
      }
    } catch (err) {
      console.error('Failed to load tournament details:', err);
    }
  }

  async function handleSelectTournament(id) {
    await loadTournamentDetails(id);
    setActiveTab('dashboard');
  }

  async function handleCreateTournament(formData) {
    const created = await createTournament(formData);
    const list = await fetchTournaments();
    setTournaments(list);
    await loadTournamentDetails(created.id);
    setActiveTab('players');
  }

  async function handleStartTournament() {
    if (!activeTournament) return;
    try {
      await startTournament(activeTournament.id);
      await loadTournamentDetails(activeTournament.id);
      setActiveTab('pairings');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleFinishTournament() {
    if (!activeTournament) return;
    if (!confirm('Finalize tournament? This will freeze the final standings and reveal the podium.')) return;
    try {
      await finishTournament(activeTournament.id);
      await loadTournamentDetails(activeTournament.id);
      setActiveTab('podium');
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleDeleteTournament() {
    if (!activeTournament) return;
    if (!confirm(`Delete tournament "${activeTournament.name}"? This cannot be undone.`)) return;
    try {
      await deleteTournament(activeTournament.id);
      const list = await fetchTournaments();
      setTournaments(list);
      if (list.length > 0) {
        await loadTournamentDetails(list[0].id);
      } else {
        setActiveTournament(null);
        setPlayers([]);
        setRounds([]);
        setStandings([]);
      }
    } catch (err) {
      alert(err.message);
    }
  }

  async function handleQuickResult(matchId, result) {
    try {
      await updateMatchResult(matchId, result);
      await loadTournamentDetails(activeTournament.id);
    } catch (err) {
      alert(err.message);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white">
        <div className="w-12 h-12 rounded-xl bg-blue-600 flex items-center justify-center text-3xl mb-4 animate-bounce">
          ♟
        </div>
        <h2 className="text-base font-bold tracking-wide">Loading Chess Tournament Manager...</h2>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans">
      {/* Top Navigation */}
      <Navbar
        tournaments={tournaments}
        activeTournament={activeTournament}
        onSelectTournament={handleSelectTournament}
        onOpenCreateModal={() => setIsCreateModalOpen(true)}
      />

      {/* Main Container */}
      {activeTournament ? (
        <main className="flex-1 pb-16">
          <TournamentHeader
            tournament={activeTournament}
            onStart={handleStartTournament}
            onFinish={handleFinishTournament}
            onDelete={handleDeleteTournament}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            playerCount={players.length}
          />

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
            {activeTab === 'dashboard' && (
              <DashboardView
                tournament={activeTournament}
                players={players}
                rounds={rounds}
                standings={standings}
                onNavigateTab={setActiveTab}
                onSelectPlayer={setSelectedPlayerId}
                onQuickResult={handleQuickResult}
              />
            )}

            {activeTab === 'players' && (
              <PlayersView
                tournament={activeTournament}
                players={players}
                onRefresh={() => loadTournamentDetails(activeTournament.id)}
                onSelectPlayer={setSelectedPlayerId}
              />
            )}

            {activeTab === 'pairings' && (
              <PairingsView
                tournament={activeTournament}
                rounds={rounds}
                onRefresh={() => loadTournamentDetails(activeTournament.id)}
                onSelectPlayer={setSelectedPlayerId}
              />
            )}

            {activeTab === 'leaderboard' && (
              <LeaderboardView
                tournament={activeTournament}
                standings={standings}
                onSelectPlayer={setSelectedPlayerId}
              />
            )}

            {activeTab === 'bracket' && (
              <KnockoutBracketView
                tournament={activeTournament}
                rounds={rounds}
                onSelectPlayer={setSelectedPlayerId}
              />
            )}

            {activeTab === 'podium' && (
              <PodiumView
                tournament={activeTournament}
                podium={podium}
                onSelectPlayer={setSelectedPlayerId}
              />
            )}
          </div>
        </main>
      ) : (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="w-16 h-16 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center text-4xl mb-4">
            ♟
          </div>
          <h2 className="text-xl font-bold text-slate-800">No Tournaments Found</h2>
          <p className="text-xs text-slate-500 max-w-sm mt-1 mb-4">
            Create your first chess tournament to start pairing players and tracking standings.
          </p>
          <button
            onClick={() => setIsCreateModalOpen(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold rounded-lg shadow transition"
          >
            Create Tournament
          </button>
        </div>
      )}

      {/* Modals */}
      <CreateTournamentModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={handleCreateTournament}
      />

      <PlayerProfileModal
        tournamentId={activeTournament?.id}
        playerId={selectedPlayerId}
        onClose={() => setSelectedPlayerId(null)}
      />
    </div>
  );
}
