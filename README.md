# Frontend App – Pump Launchpad Rewards

### Stack
- Next.js 16 (App Router)
- TypeScript
- Tailwind CSS (Next 13+ preset)
- wagmi + viem (wallet + RPC tooling)

### Getting started
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` for the dashboard. Rewards routes live under `/rewards/*`.

### Available routes
- `/` – dashboard landing w/ featured launch & rewards snapshot
- `/launch/[id]` – placeholder token detail page
- `/rewards/leaderboard`
- `/rewards/dashboard`
- `/rewards/activity`
- `/rewards/claim`

All data is mock/static until backend integration lands.
