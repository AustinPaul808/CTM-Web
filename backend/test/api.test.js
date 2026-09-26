const test = require('node:test');
const assert = require('node:assert');
const http = require('http');
const app = require('../src/server');
const prisma = require('../src/db/prisma');

let server;
let baseUrl;

test.before(async () => {
  server = http.createServer(app);
  await new Promise(resolve => server.listen(0, resolve));
  const port = server.address().port;
  baseUrl = `http://localhost:${port}`;
});

test.after(async () => {
  if (server) {
    await new Promise(resolve => server.close(resolve));
  }
  await prisma.$disconnect();
});

async function api(method, path, body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const res = await fetch(`${baseUrl}${path}`, options);
  const data = await res.json().catch(() => ({}));
  return { status: res.status, body: data };
}

test('API End-to-End: Tournament lifecycle with Swiss Pairing', async () => {
  // 1. Create tournament
  const createRes = await api('POST', '/api/tournaments', {
    name: 'FRCRCE Test Championship',
    location: 'Mumbai',
    organizer: 'Organizer Test',
    type: 'SWISS',
    numberOfRounds: 3,
    timeControl: '10+0 Rapid'
  });
  assert.strictEqual(createRes.status, 201);
  const tournamentId = createRes.body.id;
  assert.ok(tournamentId);

  // 2. Load 4 sample Grandmasters
  const playersRes = await api('POST', `/api/tournaments/${tournamentId}/sample-players?count=4`);
  assert.strictEqual(playersRes.status, 200);
  assert.strictEqual(playersRes.body.length, 4);

  // 3. Start tournament (generates Round 1)
  const startRes = await api('POST', `/api/tournaments/${tournamentId}/start`);
  assert.strictEqual(startRes.status, 200);
  assert.strictEqual(startRes.body.status, 'ACTIVE');
  assert.strictEqual(startRes.body.currentRound, 1);

  // 4. Fetch Round 1 pairings
  const roundsRes = await api('GET', `/api/tournaments/${tournamentId}/rounds`);
  assert.strictEqual(roundsRes.status, 200);
  assert.strictEqual(roundsRes.body.length, 1);
  const round1 = roundsRes.body[0];
  assert.strictEqual(round1.matches.length, 2);

  // 5. Enter results for Round 1
  const m1 = round1.matches[0];
  const m2 = round1.matches[1];

  const res1 = await api('PUT', `/api/matches/${m1.id}/result`, { result: '1-0' });
  assert.strictEqual(res1.status, 200);
  assert.strictEqual(res1.body.match.status, 'COMPLETED');

  const res2 = await api('PUT', `/api/matches/${m2.id}/result`, { result: '1/2-1/2' });
  assert.strictEqual(res2.status, 200);

  // 6. Generate Round 2
  const nextRoundRes = await api('POST', `/api/tournaments/${tournamentId}/rounds/next`);
  assert.strictEqual(nextRoundRes.status, 201);
  assert.strictEqual(nextRoundRes.body.roundNumber, 2);
  assert.strictEqual(nextRoundRes.body.matches.length, 2);

  // 7. Verify Standings
  const standingsRes = await api('GET', `/api/tournaments/${tournamentId}/standings`);
  assert.strictEqual(standingsRes.status, 200);
  assert.strictEqual(standingsRes.body.length, 4);
  assert.strictEqual(standingsRes.body[0].score, 1.0);
  assert.strictEqual(standingsRes.body[0].rank, 1);

  // Clean up
  await api('DELETE', `/api/tournaments/${tournamentId}`);
});
