# ♟ Chess Tournament Manager (CTM)

A clean, responsive, and mathematically sound web application designed for tournament organizers conducting school, college, local club, and amateur FIDE-style chess tournaments.

---

## 🚀 Key Features

- **Tournament Formats**:
  - **FIDE Swiss System**: Complete score-bracket segmentation, non-repeat opponent constraints, strict color balance ($|W - B| \le 2$ and no 3 consecutive same colors), deterministic odd-player byes, and backtracking downfloat matching.
  - **Round Robin**: Berger tables (circle rotation) generating all $N-1$ or $N$ rounds with deterministic boards and colors.
  - **Knockout Bracket**: Seed-based direct elimination with interactive visual bracket trees and auto-advancement of winners.
  - **Continuous Arena**: Pool pairing based on current scores and minimal repeat cooldown.
- **Interactive Match Result Entry**:
  - `1 - 0` (White Win)
  - `½ - ½` (Draw)
  - `0 - 1` (Black Win)
  - `1 - 0 BYE` / `1 - 0 FORFEIT` / `0 - 1 FORFEIT`
  - Real-time standings, scores, and FIDE tiebreaks recalculated immediately upon entering each result.
- **FIDE Tiebreak Hierarchy**:
  1. **Direct Encounter**: Head-to-head result between tied players.
  2. **Buchholz Cut-1**: Sum of opponents' scores excluding the lowest.
  3. **Buchholz Total**: Total sum of opponents' scores.
  4. **Sonneborn-Berger (SB)**: Sum of beaten opponents' scores + 50% of drawn opponents' scores.
  5. **Performance Rating (Rp)**: FIDE $R_a + d_p$ estimation from opponent average rating and score percentage.
- **Podium & Final Rankings**:
  - 🥇 Champion (Gold card elevated)
  - 🥈 2nd Place (Silver)
  - 🥉 3rd Place (Bronze)
  - Downloadable Standings CSV report.
- **Detailed Player Profiles**: Click any player to view their identity metrics, performance ratings, and round-by-round match history.
- **1-Click Testing**: Instant "Load 8 GMs" or "Load 16 GMs" to populate real grandmasters (Carlsen, Nakamura, Caruana, Gukesh, Erigaisi, Vidit, etc.) and test the full tournament flow in seconds.

---

## 🛠 Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, Lucide Icons
- **Backend**: Node.js, Express.js, Prisma ORM
- **Database**: SQLite (default zero-config local file at `backend/prisma/dev.db`, easily switchable to PostgreSQL)
- **Decoupled Engines**:
  - `backend/src/services/swissPairing.js`
  - `backend/src/services/roundRobin.js`
  - `backend/src/services/knockout.js`
  - `backend/src/services/arena.js`
  - `backend/src/services/standings.js`
  - `backend/src/services/tiebreaks.js`
  - `backend/src/services/performanceRating.js`

---

## 🏁 Quick Start

### 1. Start Both Backend & Frontend
From the `D:\CTM Web` root directory:

```bash
npm start
```

Or run individually:
- **Backend** (Port 5000): `npm run dev:backend`
- **Frontend** (Port 5173): `npm run dev:frontend`

Open your browser at:
👉 **`http://localhost:5173`**

### 2. Run Algorithmic & Pairing Unit Tests
```bash
npm run test:backend
```

---

## 📄 Official PRD Specification
The PDF specification is located at:
`D:\CTM Web\Chess_Tournament_Manager_PRD.pdf`
