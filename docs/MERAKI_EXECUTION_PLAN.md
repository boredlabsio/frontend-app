# Meraki Execution Plan (Slice 0)

_Last updated: 2026-07-17 (UTC)_

## 0. Purpose & North Star
- **North Star Journey**: Launch Token → Trade on Bonding Curve → Reach Bonding Threshold → Migrate → Continue Trading via Meraki → Continue Earning Points/Rewards.
- **Scope of this document**: locked execution contract for all teams; defines milestones, dependencies, canonical schemas, environments, database plan, security gates, and readiness criteria **before** Slice 1 begins.

---

## 1. Product Milestones & Success Criteria
| Milestone | Success Criteria |
|-----------|-----------------| 
| **M1 – First Token Creation & Registration** | LaunchFactory deployed on Sepolia; admin (or CLI) deploys token + registers in LaunchRegistry; indexer ingests factory events and surfacing token in `/discover` within 60s (live API). |
| **M2 – First Bonding-Curve Buy** | A wallet executes `buy` through Meraki UI using live quote API (no mocks). Tx succeeds on Sepolia; TradePanel shows tx hash + explorer link; bonding state updates. |
| **M3 – First Bonding-Curve Sell** | Wallet executes `sell` (once enabled) via UI; position reduced; UI/ledger reflect sell event; guard rails ensure sell disabled in production until ready. |
| **M4 – First Token Reaches Bonding Threshold** | A token hits configured bonding liquidity/volume threshold as tracked by indexer; UI displays “Migration ready” with proof (block number, liquidity). |
| **M5 – First Successful Migration** | MigrationAdapter executes for threshold token; bonding curve halts; migration tx confirmed; frontend shows Uniswap/ASTER pool details & disable curve trading. |
| **M6 – First Post-Migration Trade Initiated via Meraki** | A user initiates a post-migration trade from Meraki UI (embedded swap/ router or guided flow) and trade executes on the target DEX. Meraki indexes the trade and applies rewards. |
| **M7 – First Reward Points from Bonding-Curve Trading** | Rewards ledger consumes bonding-curve trade events, emits points, and surfaces them in `/rewards/dashboard`. |
| **M8 – First Reward Points from Post-Migration Trading** | Same as M7 but triggered from post-migration DEX trades routed via Meraki. |
| **M9 – First Verified Test Claim** | Claim service produces a Merkle proof for accumulated points; user verifies claim tx on Sepolia (or staging ASTER). |
| **M10 – Public Beta** | Gated staging environment with full North Star journey, observability + runbooks, at least one friendly-user cohort completes end-to-end flow. |
| **M11 – Production Launch** | ASTER deployment with governance controls, CI/CD, security sign-off, migration + rewards stable, and rollback plan exercised. |

---

## 2. Dependency Graph (Subsystem Snapshot)
| Subsystem | Prerequisites | Downstream Dependencies | Opportunistic Parallelism |
|-----------|---------------|-------------------------|---------------------------|
| Contracts (Factory, Bonding Curve, Rewards, Migration) | Specs, audits | Trading engine, rewards ledger, migration workflow | Contract hardening can proceed while API/frontend work targets latest ABI. |
| Database Layer (PostgreSQL) | Infra decision | Indexer, rewards, analytics, admin tooling | Schema design + tooling begin immediately; staging/prod infra stands up alongside S1. |
| Indexer + API | Contracts, DB | Frontend live data, rewards ingestion | Worker dev can start once DB connection string + schema agreed (defined below). |
| Trading Engine (Quote svc + UI) | Indexer API, wallet provider, contract addresses | Rewards ledger, migration readiness | UI scaffolding continues in parallel; API integration waits on endpoints. |
| Migration Workflow | Bonding threshold metrics, admin tooling | Post-migration trading, rewards | Simulation + UI design can start while adapter finalized. |
| Rewards + Leaderboard | DB, indexer trades, trading engine | Beta/public milestones | Data model defined here to unblock parallel development. |
| Post-Migration Trading Surface | Migration plan, target DEX decision | Rewards, analytics | Implementation approach defined in §3; UI can start on placeholder link while router integration built. |
| Security/Observability | Access list, logging stack | All milestones | Gates apply to every slice—see §7. |
| CI/CD & Deployment | Test suites, infra accounts | Production readiness | Build pipelines while S1–S3 develop. |

---

## 3. Network & Environment Matrix
| Environment | Chain | Chain ID | RPC | Explorer | Bonding Venue | Migration/Post-migration Venue | Wallet Gating | Status |
|-------------|-------|---------|-----|---------|---------------|-------------------------------|---------------|--------|
| **Local Dev** | Hardhat/Anvil fork | 31337 | `http://127.0.0.1:8545` | N/A | Local BondingCurveMarket | Local Uniswap V3 fork | Unrestricted | Fully controllable; used for contract/unit tests. |
| **Testnet (Sepolia)** | Ethereum Sepolia | 11155111 | `https://ethereum-sepolia-rpc.publicnode.com` (plus Infura/Alchemy backups) | `https://sepolia.etherscan.io` | BondingCurveMarket (deployed) | Uniswap V3 Sepolia or custom adapter | Allow-listed wallets during beta | Verified + currently used. |
| **Staging (ASTER Test/Staging)** | ASTER test environment (TBD) | TBD (await chain docs) | RPC TBD (must support archive) | Explorer TBD | Bonding curve redeploy | Chosen ASTER DEX (likely Uniswap V3-compatible fork) | Allow-listed + beta invites | Needs confirmation with ASTER team. |
| **Production (ASTER Mainnet)** | ASTER Mainnet | TBD | RPC from ASTER + fallback provider | Explorer from ASTER | Production bonding curve | ASTER Uniswap V3-compatible venue | Full access w/ rate limiting + monitoring | Target launch env; wallet gating for compliance. |

**Post-Migration Trading Definition**
- **Routing**: Meraki UI will embed an ASTER-compatible swap module (initial target: Uniswap V3 router). Beta may temporarily offer an instrumented external link while recording telemetry, but production requires in-app routing (either embedded swap or Meraki-hosted router call).
- **Initiation**: All user actions originate in Meraki (TradePanel switches to “Migrated Pool” mode). We will not rely solely on external explorers.
- **Indexing**: Indexer subscribes to Uniswap pool events; trades are normalized into the same `RecentTradeV1` schema with `trade_stage = 'post_migration'` and pool metadata.
- **Rewards Eligibility**: Post-migration trades routed via Meraki (same wallet session) yield points per §6. Direct external trades are not rewarded unless we later ingest them and flag as off-platform.
- **UI Transition**: When `migration_status = 'migrated'`, the token page hides bonding inputs, shows pool stats, provides router UI (beta: link fallback). Production requirement: embedded trading path plus info cards.

---

## 4. Database Decision & Minimal Schema
- **Technology**: PostgreSQL 15 (managed on Supabase or RDS). Reasoning: relational integrity for trades/rewards, mature tooling, easy event replay.
- **Local Dev**: Dockerized Postgres (`docker compose up db`). Migrations via Prisma or knex (decision pending—recommend Prisma for TS alignment).
- **Staging/Prod**: Managed Postgres with PITR backups, automated daily snapshots, retention ≥14 days.
- **Backup/Recovery**: PITR + nightly logical dump stored in encrypted bucket. Disaster drills before M10.
- **Idempotency & Replays**: Indexer stores `chain_id + tx_hash + log_index` as unique key; workers can replay from block height. Rewards ledger references trade IDs.
- **Canonical IDs**:
  - `chain_id` (int)
  - `token_id` (numeric from registry)
  - `token_address` (checksum string)
  - `market_address`, `pool_address`
  - `wallet_address`
  - `tx_hash`
  - `trade_id` (UUID) derived from `chain_id:tx_hash:log_index`
  - `migration_id`
  - `reward_event_id`

**Minimal tables needed for S1** (DDL excerpt):
```sql
CREATE TABLE tokens (
  token_id         BIGINT PRIMARY KEY,
  chain_id         INTEGER NOT NULL,
  token_address    TEXT NOT NULL,
  launchpad_market TEXT,
  symbol           TEXT,
  name             TEXT,
  status           TEXT CHECK (status IN ('curve_live','migration_pending','migrated')),
  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE trades (
  trade_id     UUID PRIMARY KEY,
  chain_id     INTEGER NOT NULL,
  token_id     BIGINT NOT NULL,
  tx_hash      TEXT NOT NULL,
  log_index    INTEGER NOT NULL,
  direction    TEXT CHECK (direction IN ('buy','sell')),
  stage        TEXT CHECK (stage IN ('bonding_curve','post_migration')),
  wallet       TEXT NOT NULL,
  quote_symbol TEXT NOT NULL,
  quote_amount NUMERIC NOT NULL,
  base_amount  NUMERIC NOT NULL,
  price_native NUMERIC NOT NULL,
  block_time   TIMESTAMPTZ NOT NULL,
  UNIQUE (chain_id, tx_hash, log_index)
);
```
Additional tables for migrations, rewards, leaderboards follow similar pattern and can be expanded before S4.

**Readiness Decision**: S1 may run with Postgres available but only requiring `tokens` + `trades` tables (others optional). Database provisioning is therefore part of Slice 0 completion—connection strings + migrations ready before S1 kicks off.

---

## 5. Canonical Interfaces (Versioned)
Version tags use `V1`. Any breaking change increments suffix.

```ts
// Token summary served at canonical GET /tokens/:id
export interface TokenSummaryV1 {
  schema: 'TokenSummaryV1';
  token_id: string;              // canonical string id
  token_address: string;
  launchpad_market: string;
  symbol: string;
  name: string;
  status: 'curve_live' | 'migration_pending' | 'migrated';
  priceNative: string;           // decimal string ETH
  volume24h: string;             // decimal string ETH
  trades24h: number;
  last_trade_time: string | null;
  bonding_threshold: string;     // ETH
  bonding_progress: number;      // 0-1 float
  migration_status: 'not_ready' | 'ready' | 'migrated';
  migration_pool?: PostMigrationPoolStateV1;
  __source?: DataSourceTag;
}

export interface DiscoverySummaryV1 {
  schema: 'DiscoverySummaryV1';
  generatedAt: string;
  latestTokens: TokenSummaryV1[];
  mostActiveTokens: TokenSummaryV1[];
  recentTrades: RecentTradeV1[];
  stats: {
    hotCount: number;
    movingCount: number;
    migrationReadyCount: number;
  };
  __source?: DataSourceTag;
}

export interface RecentTradeV1 {
  schema: 'RecentTradeV1';
  trade_id: string;
  token_id: string;
  token_address: string;
  token_name: string;
  direction: 'buy' | 'sell';
  stage: 'bonding_curve' | 'post_migration';
  quote_token_address: string;
  quote_symbol: string;
  quote_amount: string;
  base_amount: string;
  execution_price_native: string;
  tx_hash: string;
  timestamp: string;
}

export interface QuoteResponseV1 {
  schema: 'QuoteResponseV1';
  quote_id: string;
  token_id: string;
  direction: 'buy' | 'sell';
  amount: string;
  quote_amount: string;
  expiresAt: string;
  source: 'bonding_curve' | 'uniswap_v3';
  market_address: string;
  gas_estimate: string;
  status: 'fresh' | 'stale';
}

export interface TxResultV1 {
  schema: 'TxResultV1';
  quote_id: string;
  tx_hash: string;
  status: 'submitted' | 'confirmed' | 'failed';
  explorer_url: string;
}

export interface BondingStateV1 {
  schema: 'BondingStateV1';
  token_id: string;
  liquidity_native: string;
  target_liquidity_native: string;
  holder_count: number;
  progress_pct: number;
}

export interface MigrationStateV1 {
  schema: 'MigrationStateV1';
  token_id: string;
  status: 'not_ready' | 'ready' | 'executing' | 'migrated';
  initiated_by: string;
  tx_hash?: string;
  pool_address?: string;
  executed_at?: string;
}

export interface PostMigrationPoolStateV1 {
  schema: 'PostMigrationPoolStateV1';
  pool_address: string;
  dex: 'uniswap_v3' | 'aster_router_v1';
  base_symbol: string;
  quote_symbol: string;
  price_native: string;
  volume24h: string;
  tvl_native: string;
}

export interface RewardEventV1 {
  schema: 'RewardEventV1';
  reward_event_id: string;
  wallet: string;
  token_id: string;
  stage: 'bonding_curve' | 'post_migration';
  action: 'buy' | 'sell' | 'provide_liquidity' | 'migrate';
  points: number;
  block_time: string;
  finalized: boolean;
}

export interface UserPointsV1 {
  schema: 'UserPointsV1';
  wallet: string;
  total_points: number;
  provisional_points: number;
  finalized_points: number;
  breakdown: Record<string, number>; // keyed by action
}

export interface LeaderboardEntryV1 {
  schema: 'LeaderboardEntryV1';
  wallet: string;
  rank: number;
  total_points: number;
  volume_native: string;
}

export interface ApiErrorV1 {
  schema: 'ApiErrorV1';
  error_code: string;
  message: string;
  correlation_id: string;
}

export interface DataSourceTag {
  chain_id: number;
  source: 'api' | 'snapshot' | 'mock';
  fetched_at: string;
}
```

**Fixtures (added under `docs/fixtures/`):**
- `discovery-summary.v1.json`
- `recent-trade.v1.json`
- `quote-response.v1.json`
These act as shared truth for schema tests; see companion files for concrete examples.

---

## 6. Rewards Eligibility Model
| Stage | Action | Points Awarded | Notes |
|-------|--------|----------------|-------|
| Bonding curve | Buy | `k_buy * log(1 + quote_amount)` | Points provisional until block finalized (2 confirmations on Sepolia, TBD on ASTER). |
| Bonding curve | Sell | `k_sell * log(1 + quote_amount)` but < buy points to discourage churn; disabled until sell path live. |
| Bonding curve | Creator milestone | Fixed bonus when token reaches bonding threshold. |
| Post-migration | Buy via Meraki router | `k_migrate_buy` scaled by pool fee tier. |
| Post-migration | Sell via Meraki router | Lower weight than buy; ensures balanced incentives. |
| Migration executor | Bonus for executing migration tx (if not Meraki-managed). |
| Liquidity activity (future) | TBD once pool incentives defined. |
| Referrals (future) | Out of scope until mainnet. |

**Accounting Rules**
- **Finality**: Points provisional until `finalized_at` (after chain-specific confirmations). Reorgs trigger replay; provisional entries reversed automatically.
- **Duplicate handling**: Unique key on `reward_event_id` prevents double-count.
- **Sybil & wash-trade**: initial heuristic filters (self-trade detection, rapid in/out). Suspicious events flagged and excluded from `finalized_points` until manual review.
- **Ledger vs Claimable**: Points recorded in ledger; claim service periodically checkpoints totals into Merkle tree. Claims only enabled post-`M9` once verification process battle-tested.

---

## 7. Cross-Slice Security Gates
Every slice (S1+) must satisfy:
1. **Secrets hygiene**: No secrets in repo/logs; use `.env.local` + secret store.
2. **Least privilege**: APIs, DB users scoped to necessary operations.
3. **Input/Output validation**: Zod/TypeScript schema validation on ingress + egress.
4. **Idempotency**: Workers replay-safe via deterministic IDs.
5. **Replay/Duplicate protection**: Unique constraints + dedupe logic (see DB plan).
6. **Safe failure**: Feature flags disable incomplete financial flows; errors logged with correlation IDs.
7. **Feature flags**: Incomplete buy/sell/migrate/reward paths hidden behind env-gated flags.
8. **Audit logging**: All state or fund changes emit structured logs (JSON) with wallet + tx data.
9. **Approval gates**: No prod deploy without human approval + checklist sign-off.
10. **Testnet-first**: All features proven on local + Sepolia before staging/prod.
11. **Rollback plan**: Documented steps to revert code/config/contracts.
12. **Verification evidence**: Each PR attaches lint/build/test logs + manual test notes.
13. **Contracts-specific**: Forge invariant tests, Slither static checks, access-control review, pause coverage, economic edge-case tests before touching mainnet.

---

## 8. Parallel Workstreams & Boundaries
| Track | Included Slices | Interfaces that must be stable |
|-------|-----------------|-------------------------------|
| **Data Plane** | S1, S4, S9 | `DiscoverySummaryV1`, `RecentTradeV1`, DB schema |
| **Trading UX** | S2, S3, S5 (UI), S6 for security prompts | `QuoteResponseV1`, `TxResultV1`, wallet provider contracts |
| **Rewards & Claims** | S4, S8 (admin tie-ins) | `RewardEventV1`, `UserPointsV1` |
| **Infra & Security** | S6, S7, S8 | Secrets policy, deployment scripts |
| **Post-Migration Trading** | S5, S9 | `MigrationStateV1`, `PostMigrationPoolStateV1` |

Workstreams must consume fixtures + schema tests to prevent drift.

---

## 9. Verification Commands & Readiness Gate (Pre-S1)
Before starting S1, the following must succeed and be documented:
1. `npm run lint` (frontend) ✅
2. `npm run build` (frontend) ✅
3. `npm run lint` / `npm test` (indexer/backend) — add placeholder script or document N/A.
4. Database migration: `pnpm db:migrate` (or `npm run db:migrate`) executes against local Postgres, creating `tokens` + `trades` tables.
5. Schema tests: `npm run test:schema` (new script to validate fixtures vs TypeScript interfaces) — to be implemented ahead of S1.
6. Documentation review: `docs/MERAKI_EXECUTION_PLAN.md` signed off (this step).
7. Environment sample: `.env.example` updated with DB + API vars (see fixtures folder for sample values).
8. Go/No-Go checklist (next subsection).

**Go/No-Go Criteria**
- ✅ Database technology + migrations finalized.
- ✅ Canonical schemas + fixtures committed.
- ✅ Network matrix confirmed or flagged w/ owner for ASTER data.
- ✅ Security gates acknowledged by all teams.
- ✅ Outstanding assumptions documented (see §11).
- ❌ If any unchecked, halt before S1.

---

## 10. Updated Slice 1 Scope
- **Objective**: Build **and deploy** the Live Indexer API backed by Postgres (`tokens`, `trades`).
- **In-Scope**: Event ingestion, REST endpoints `/discovery/summary`, `/tokens/:id`, `/tokens/:id/trades`, schema validation, API tests, Docker compose for DB, feature flag for frontend consumption.
- **Out-of-Scope**: Rewards, migration, analytics, buy/sell endpoints (covered later slices).
- **Dependencies satisfied**: Database decision, schema definitions, fixtures, env examples (Slice 0 deliverables). If ASTER staging RPC unresolved, S1 uses Sepolia only.

---

## 11. Outstanding Assumptions & Owner Decisions
1. **ASTER network details** (chain IDs, RPC endpoints, DEX venue) pending confirmation from chain partner. Blocker for Milestones M5+.
2. **Migration router implementation** (embedded swap vs custom router) requires product decision for beta vs production.
3. **DB hosting provider** (Supabase vs AWS RDS) – recommend Supabase for speed; owner approval needed.
4. **Rewards coefficient constants** (`k_buy`, `k_sell`, etc.) – to be finalized by product/finance before S4.
5. **Admin tooling auth provider** (e.g., Clerk, Auth0, wallet-based) – unresolved; affects S8.
6. **CI provider** (GitHub Actions vs others) – assumed GitHub Actions; confirm.

---

## 12. Parallel Work That Can Start Now
- **Schema Test Harness**: implement shared TypeScript tests ingesting fixtures to ensure interfaces stay stable.
- **Database Migration Scripts**: finalize `tokens` + `trades` DDL and Docker compose.
- **Security Playbooks**: draft secrets policy + logging format (can run parallel to S1).
- **Post-Migration UI copy/design**: UX work can begin with defined schemas.

---

_End of Slice 0 artifact._
