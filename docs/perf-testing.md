# Performance benchmarking

This repository now includes a repeatable benchmarking flow for deployed API response times plus an optional staging-only seed step.

## Files

- `scripts/perf/bench.ts` - read-only benchmark runner
- `scripts/perf/seed.ts` - staging data seed utility
- `scripts/perf/run.ts` - optional seed + benchmark wrapper
- `.github/workflows/perf-benchmark.yml` - manual/scheduled GitHub Actions workflow

## Safety model

- `perf:bench` is read-only by default and can target a Vercel Preview or Production URL through `TARGET_API_URL`.
- `perf:seed` performs writes and must point at a staging/non-production database through `PERF_DATABASE_URL`.
- Mutating perf operations fail fast when `TARGET_API_URL` or `PERF_DATABASE_URL` looks production-like unless `ALLOW_PROD=true` is explicitly provided.
- The scheduled workflow does **not** seed by default.

If you want seeded data to influence benchmark results, point `TARGET_API_URL` at the preview/staging deployment that is backed by the same staging database.

## Environment variables

### Benchmark runner

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `TARGET_API_URL` | Yes | - | Base URL to benchmark, for example `https://impact-hub-git-main-destiny-brown.vercel.app` |
| `TOTAL_REQUESTS` | No | `100` | Total timed requests |
| `CONCURRENCY` | No | `10` | Number of concurrent requests |
| `WARMUP_REQUESTS` | No | `10` | Untimed warmup requests |
| `PERF_ENDPOINTS` | No | `/api/events,/api/activity` | Comma-separated endpoint paths |
| `PERF_P95_THRESHOLD_MS` | No | `600` | Fail `perf:run` when overall p95 latency exceeds this value |
| `PERF_MAX_ERRORS` | No | `0` | Fail `perf:run` when overall error count exceeds this value |
| `PERF_OUTPUT_DIR` | No | `perf-results/<timestamp>` | Output directory for artifacts |

### Seed runner

| Variable | Required | Default | Description |
| --- | --- | --- | --- |
| `PERF_DATABASE_URL` | Yes | Falls back to `DATABASE_URL` | Staging Postgres connection string used for seed writes |
| `SEED_COUNT` | No | `250` | Volunteers/requests to ensure |
| `SEED_EVENT_COUNT` | No | Derived from `SEED_COUNT` | Number of benchmark events to ensure |
| `ALLOW_PROD` | No | `false` | Explicit override for production-like URLs |
| `TARGET_API_URL` | No | - | Optional additional safety check when seeding |

## Local usage

Install dependencies first:

```bash
npm ci
```

Run the read-only benchmark:

```bash
TARGET_API_URL="https://your-preview-url.vercel.app" \
TOTAL_REQUESTS=200 \
CONCURRENCY=20 \
WARMUP_REQUESTS=20 \
npm run perf:bench
```

Seed staging data:

```bash
PERF_DATABASE_URL="******host:5432/dbname" \
SEED_COUNT=500 \
TARGET_API_URL="https://your-preview-url.vercel.app" \
npm run perf:seed
```

Run seed then benchmark in one command:

```bash
PERF_DATABASE_URL="******host:5432/dbname" \
TARGET_API_URL="https://your-preview-url.vercel.app" \
RUN_SEED=true \
SEED_COUNT=500 \
TOTAL_REQUESTS=200 \
CONCURRENCY=20 \
npm run perf:run
```

CLI flags are also supported for the main parameters, for example:

```bash
npm run perf:bench -- --url=https://your-preview-url.vercel.app --requests=200 --concurrency=20 --endpoint=/api/events --endpoint=/api/activity
```

## Artifact outputs

Each run writes artifacts under `perf-results/`:

- `benchmark-results.json`
- `benchmark-results.csv`
- `benchmark-summary.md`
- `seed-results.json` (when seeding)
- `seed-summary.md` (when seeding)

The JSON output includes:

- request totals
- success/error counts
- HTTP status distribution
- avg/min/max latency
- p50/p95/p99 latency
- per-endpoint summaries

## Workflow usage

The `perf-benchmark.yml` workflow runs:

- manually via `workflow_dispatch`
- on pull requests targeting `main`

For pull request runs, the workflow uses production-safe benchmark settings:

- `CONCURRENCY=3`
- `TOTAL_REQUESTS=60`
- `WARMUP_REQUESTS=10`
- `PERF_P95_THRESHOLD_MS=1200`
- `PERF_MAX_ERRORS=6`

### Required repository configuration

- `PERF_TARGET_API_URL` repository variable or secret for the default benchmark target
- `PERF_DATABASE_URL` secret for staging seeding when `run_seed=true`

### `workflow_dispatch` inputs

- `url`
- `concurrency`
- `requests`
- `warmup_requests`
- `seed_count`
- `run_seed`

The workflow uploads the entire `perf-results/` directory as an artifact and copies the markdown summaries into the GitHub Actions job summary.

## Interpreting the results

- Use `avg` for broad regression tracking.
- Use `p95` and `p99` to catch tail-latency spikes under concurrency.
- Compare endpoint rows to identify whether `/api/events` or `/api/activity` regressed.
- Review HTTP status breakdowns to separate latency regressions from outright failures.

For duplicate-request behavior, the current application already uses the `VolunteerRequest @@unique([volunteerId, eventId])` constraint in `prisma/schema.prisma`. That is consistent with an indexed/O(1)-style duplicate check pattern, but these scripts do not claim or measure internal database execution complexity directly.
