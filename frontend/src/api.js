const API_BASE = '/api';

export async function fetchTournaments() {
  const res = await fetch(`${API_BASE}/tournaments`);
  if (!res.ok) throw new Error('Failed to load tournaments');
  return res.json();
}

export async function fetchTournament(id) {
  const res = await fetch(`${API_BASE}/tournaments/${id}`);
  if (!res.ok) throw new Error('Failed to load tournament details');
  return res.json();
}

export async function createTournament(data) {
  const res = await fetch(`${API_BASE}/tournaments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to create tournament');
  }
  return res.json();
}

export async function startTournament(id) {
  const res = await fetch(`${API_BASE}/tournaments/${id}/start`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to start tournament');
  }
  return res.json();
}

export async function finishTournament(id) {
  const res = await fetch(`${API_BASE}/tournaments/${id}/finish`, { method: 'POST' });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to finalize tournament');
  }
  return res.json();
}

export async function deleteTournament(id) {
  const res = await fetch(`${API_BASE}/tournaments/${id}`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete tournament');
  return res.json();
}

export async function addPlayer(tournamentId, data) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/players`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to add player');
  }
  return res.json();
}

export async function loadSamplePlayers(tournamentId, count = 8) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/sample-players?count=${count}`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to load sample players');
  }
  return res.json();
}

export async function removePlayer(tournamentId, playerId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/players/${playerId}`, {
    method: 'DELETE'
  });
  if (!res.ok) throw new Error('Failed to remove player');
  return res.json();
}

export async function fetchPlayerProfile(tournamentId, playerId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/players/${playerId}/profile`);
  if (!res.ok) throw new Error('Failed to load player profile');
  return res.json();
}

export async function fetchRounds(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/rounds`);
  if (!res.ok) throw new Error('Failed to load rounds');
  return res.json();
}

export async function generateNextRound(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/rounds/next`, {
    method: 'POST'
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to generate next round');
  }
  return res.json();
}

export async function updateMatchResult(matchId, result) {
  const res = await fetch(`${API_BASE}/matches/${matchId}/result`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ result })
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error || 'Failed to update result');
  }
  return res.json();
}

export async function fetchStandings(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/standings`);
  if (!res.ok) throw new Error('Failed to load standings');
  return res.json();
}

export async function fetchPodium(tournamentId) {
  const res = await fetch(`${API_BASE}/tournaments/${tournamentId}/podium`);
  if (!res.ok) throw new Error('Failed to load podium');
  return res.json();
}
