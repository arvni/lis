# CLAUDE.md — LIS (Laboratory Information System)

Project rules for AI-assisted work. These OVERRIDE generic defaults.

## Stack
- Backend: Laravel 13, PHP 8.4
- Frontend: Inertia.js 2 + React 19 (**JavaScript, not TypeScript**), Vite 6, Tailwind
- Auth: Sanctum + spatie/laravel-permission (roles/permissions)
- Infra: Docker (4-app topology; `api` + `lis` share one DB). Telescope for local debug.
- Tests: PHPUnit 11. Static: Larastan/PHPStan **level 6** + baseline. Format: Laravel Pint.

## Architecture — Domain-Driven (authoritative)
Code lives under `app/Domains/<Domain>/`. Domains include: Auth, Billing, Consultation,
Dashboard, Document, Inventory, Laboratory, Monitoring, Notification, Reception, Referrer,
Setting, Shared, System, User.

Each domain uses these building blocks (use the existing ones — do not invent new patterns):
- `Models/` — Eloquent models for the domain.
- `Repositories/` — all DB query logic. Controllers/Services MUST NOT write raw queries.
- `Services/` — business logic / orchestration. One responsibility per service.
- `DTOs/` — typed data transfer between layers. Build DTOs from validated requests.
- `Adapters/` — **the only way one domain talks to another.** e.g. `Reception/Adapters/BillingAdapter`.
  NEVER import another domain's Service/Repository/Model directly across domains — go through an Adapter.
- `Requests/` — FormRequest per action; all validation lives here.
- `Resources/` — API/Inertia response shaping.
- `Policies/` — authorization; register and use via `authorize()`/Gate.
- `Enums/` — PHP 8 enums (uses kongulov/interact-with-enum).
- `Events/` + `Listeners/` — domain side effects (invoicing, notifications, pricing) are event-driven.
- `Exceptions/`, `Factories/`, `Exports/`, `Traits/` — as already established.

### Layering rule (strict)
Controller → Service → Repository → Model. Cross-domain only via Adapter.
- Controllers stay thin: validate (FormRequest), authorize (Policy), call Service, return Resource/Inertia.
- No business logic in controllers, models, or blade/jsx.

## Coding standards (PHP)
- `declare(strict_types=1);` in every NEW file, and full type hints (params, returns, properties).
  Legacy files without it are frozen in `tests/Unit/CodeQuality/strict-types-legacy-allowlist.txt`
  (enforced by `StrictTypesTest`, ratchet — the list only shrinks). When you meaningfully touch a
  legacy file, add the declare + remove its allowlist line in the same commit; do NOT bulk-add it
  blindly (strict types change scalar coercion at call boundaries — verify the file's callers/tests).
- Must pass `composer analyse` (PHPStan lvl 6) with no NEW baseline entries — fix, don't append to baseline.
- Format with Pint before commit (`./vendor/bin/pint`).
- No N+1: eager-load in repositories. No queries in loops.
- Use enums over magic strings/ints. Use DTOs over loose arrays across layers.
- Reuse existing Services/Repositories/Adapters. **No duplication** — search before adding.

## Coding standards (Frontend)
- React 19 function components + hooks. Inertia for routing/data (`<Link>`, `router`, `usePage`).
- Pages in `resources/js/Pages/<Feature>/`, shared UI in `Components/`, layouts in `Layouts/`.
- Use Ziggy `route()` for URLs — no hardcoded paths.
- Must pass ESLint + Prettier (`npm run lint`, `npm run format`).
- It's JS — do not introduce TypeScript or `.ts/.tsx` without explicit approval.

## API / response design
- Validate via FormRequest, shape via Resource. Consistent JSON envelopes.
- Authorize every endpoint via Policy. Never trust client input.

## Testing rules
- Feature tests under `tests/Feature/<Domain>/`, unit under `tests/Unit/<Domain>/`.
- New behavior needs a test. Cover service/adapter logic and HTTP endpoints.
- Run `php artisan test` (or filtered) before commit. See `memory/` for the test DB setup
  (DB in docker; use CLI env overrides + `lis_test` DB; suite has known rot).

## Git rules
- Conventional commits: `feat(domain): …`, `fix(domain): …`, `refactor`, `test`, `ci`, `chore`.
- Branch off `main`; never commit straight to `main` without asking.
- Run Pint + PHPStan + relevant tests before committing. Stage logically grouped changes.
- Commit/push only when the user asks.

## Security
- Never commit secrets. `.env*` must stay gitignored and non-world-writable (600).
- No secrets in logs/output. Authorize via Policies, not ad-hoc checks.
- Validate dependencies: `composer audit`, `npm audit` before adding/upgrading deps.

## Notifications (project convention)
- Staff/internal notifications: **database channel only**, never email.
- Referrer report emails: link only (no attachment); subject = patient name.

## Performance
- Eager-load; paginate large lists; index hot columns; cache expensive reads.
- Push side effects to queued Events/Listeners, not request path.

## When unsure
- Mirror the nearest existing domain (Reception/Laboratory are the most complete references).
- Match surrounding code's style, naming, and density. Inspect before modifying.

<!-- rtk-instructions v2 -->
# RTK (Rust Token Killer) - Token-Optimized Commands

## Golden Rule

**Always prefix commands with `rtk`**. If RTK has a dedicated filter, it uses it. If not, it passes through unchanged. This means RTK is always safe to use.

**Important**: Even in command chains with `&&`, use `rtk`:
```bash
# ❌ Wrong
git add . && git commit -m "msg" && git push

# ✅ Correct
rtk git add . && rtk git commit -m "msg" && rtk git push
```

## RTK Commands by Workflow

### Build & Compile (80-90% savings)
```bash
rtk cargo build         # Cargo build output
rtk cargo check         # Cargo check output
rtk cargo clippy        # Clippy warnings grouped by file (80%)
rtk tsc                 # TypeScript errors grouped by file/code (83%)
rtk lint                # ESLint/Biome violations grouped (84%)
rtk prettier --check    # Files needing format only (70%)
rtk next build          # Next.js build with route metrics (87%)
```

### Test (60-99% savings)
```bash
rtk cargo test          # Cargo test failures only (90%)
rtk go test             # Go test failures only (90%)
rtk jest                # Jest failures only (99.5%)
rtk vitest              # Vitest failures only (99.5%)
rtk playwright test     # Playwright failures only (94%)
rtk pytest              # Python test failures only (90%)
rtk rake test           # Ruby test failures only (90%)
rtk rspec               # RSpec test failures only (60%)
rtk test <cmd>          # Generic test wrapper - failures only
```

### Git (59-80% savings)
```bash
rtk git status          # Compact status
rtk git log             # Compact log (works with all git flags)
rtk git diff            # Compact diff (80%)
rtk git show            # Compact show (80%)
rtk git add             # Ultra-compact confirmations (59%)
rtk git commit          # Ultra-compact confirmations (59%)
rtk git push            # Ultra-compact confirmations
rtk git pull            # Ultra-compact confirmations
rtk git branch          # Compact branch list
rtk git fetch           # Compact fetch
rtk git stash           # Compact stash
rtk git worktree        # Compact worktree
```

Note: Git passthrough works for ALL subcommands, even those not explicitly listed.

### GitHub (26-87% savings)
```bash
rtk gh pr view <num>    # Compact PR view (87%)
rtk gh pr checks        # Compact PR checks (79%)
rtk gh run list         # Compact workflow runs (82%)
rtk gh issue list       # Compact issue list (80%)
rtk gh api              # Compact API responses (26%)
```

### JavaScript/TypeScript Tooling (70-90% savings)
```bash
rtk pnpm list           # Compact dependency tree (70%)
rtk pnpm outdated       # Compact outdated packages (80%)
rtk pnpm install        # Compact install output (90%)
rtk npm run <script>    # Compact npm script output
rtk npx <cmd>           # Compact npx command output
rtk prisma              # Prisma without ASCII art (88%)
```

### Files & Search (60-75% savings)
```bash
rtk ls <path>           # Tree format, compact (65%)
rtk read <file>         # Code reading with filtering (60%)
rtk grep <pattern>      # Search grouped by file (75%). Format flags (-c, -l, -L, -o, -Z) run raw.
rtk find <pattern>      # Find grouped by directory (70%)
```

### Analysis & Debug (70-90% savings)
```bash
rtk err <cmd>           # Filter errors only from any command
rtk log <file>          # Deduplicated logs with counts
rtk json <file>         # JSON structure without values
rtk deps                # Dependency overview
rtk env                 # Environment variables compact
rtk summary <cmd>       # Smart summary of command output
rtk diff                # Ultra-compact diffs
```

### Infrastructure (85% savings)
```bash
rtk docker ps           # Compact container list
rtk docker images       # Compact image list
rtk docker logs <c>     # Deduplicated logs
rtk kubectl get         # Compact resource list
rtk kubectl logs        # Deduplicated pod logs
```

### Network (65-70% savings)
```bash
rtk curl <url>          # Compact HTTP responses (70%)
rtk wget <url>          # Compact download output (65%)
```

### Meta Commands
```bash
rtk gain                # View token savings statistics
rtk gain --history      # View command history with savings
rtk discover            # Analyze Claude Code sessions for missed RTK usage
rtk proxy <cmd>         # Run command without filtering (for debugging)
rtk init                # Add RTK instructions to CLAUDE.md
rtk init --global       # Add RTK to ~/.claude/CLAUDE.md
```

## Token Savings Overview

| Category | Commands | Typical Savings |
|----------|----------|-----------------|
| Tests | vitest, playwright, cargo test | 90-99% |
| Build | next, tsc, lint, prettier | 70-87% |
| Git | status, log, diff, add, commit | 59-80% |
| GitHub | gh pr, gh run, gh issue | 26-87% |
| Package Managers | pnpm, npm, npx | 70-90% |
| Files | ls, read, grep, find | 60-75% |
| Infrastructure | docker, kubectl | 85% |
| Network | curl, wget | 65-70% |

Overall average: **60-90% token reduction** on common development operations.
<!-- /rtk-instructions -->