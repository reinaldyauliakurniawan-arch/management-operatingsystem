# PRD — Management Operating System

## Overview

Sistem manajemen operasional berbasis EOS (Entrepreneurial Operating System) untuk Just Speak English. Multi-tenant (Organization + Team), 13 modul bisnis, role-based access control per-team.

## Tech Stack

- **Backend:** Laravel 13 (PHP 8.3+), MySQL/SQLite
- **Frontend:** React 19, TypeScript, Tailwind CSS 4, Inertia.js 2
- **UI:** shadcn/ui (base-ui), Lucide icons
- **Auth:** Laravel Breeze (session-based)
- **Build:** Vite 8 (SSR enabled)
- **Testing:** Pest 4 + PHPUnit 12
- **CI/CD:** GitHub Actions

---

## ROLES

| Role | Deskripsi |
|---|---|
| `leader` | Visionary, Integrator, Finance, Marketing, HR — akses penuh manajemen team |
| `member` | Bawahan non-tutor (staff Finance, Marketing, HR) |
| `tutor` | Freelancer mitra di bawah HR |

> Role bersifat **per-team**, bukan global. Satu user bisa `leader` di Team A sekaligus `member` di Team B.

---

## ORG ADMIN

User dengan `is_admin = true` di pivot table `organization_user` (per-organization, bukan global):
- Satu-satunya yang bisa buat team baru, hapus team, assign leader ke team
- Biasanya Visionary atau Integrator
- Team Leader hanya bisa manage anggota & konten di dalam team-nya sendiri
- Org Admin di Org A TIDAK otomatis admin di Org B (closed C2 cross-tenant escalation)

> **Catatan:** Kolom `users.is_org_admin` telah dihapus. Admin status exclusively dari pivot `organization_user`.

---

## ACTIVE TEAM CONTEXT

- User hanya ada di 1 team → langsung masuk dashboard, tidak perlu pilih
- User ada di multiple team → muncul **team picker** saat login
- Setelah masuk, ada **team switcher di sidebar** untuk ganti active team kapan saja
- Semua data (Rocks, Scorecard, Leaderboard, dll) otomatis filter berdasarkan `active_team_id` di session
- `TenantContext` service resolve org/team dari session → fallback DB query (bukan Eloquent, untuk hindari recursion)

---

## MULTI-TENANCY

- **OrganizationScope:** global scope di model yang punya `organization_id` — filter otomik berdasarkan `active_organization_id` dari session
- **TeamScope:** global scope di model yang punya `team_id` — filter otomatis berdasarkan `active_team_id` dari session
- Scopes throw exception di production web request kalau tenant id gak bisa di-resolve (fail-closed)
- Scopes no-op di CLI/artisan (migrations, seeders, tinker)

---

## Module 0 — Dashboard

Halaman pertama setelah login. Konten role-aware, scoped ke active team. Read-only, semua data derived dari modul lain.

**Leader lihat:**
- Active team indicator + team switcher
- Rocks summary: total, on-track, off-track, done
- Scorecard: jumlah metric merah minggu ini
- Issues: jumlah open issues
- To-Do: jumlah overdue across team
- Upcoming L10 Meeting terdekat (tanggal + countdown)
- Top 3 leaderboard team (semua role)
- Upcoming events (training/townhall dalam 7 hari)

**Member lihat:**
- Active team indicator + team switcher
- Rocks milik sendiri: progress per Rock
- To-Do milik sendiri yang overdue/due today
- Scorecard milik sendiri yang merah
- Top 3 leaderboard team
- Upcoming events

---

## Module 1 — VTO (Vision/Traction Organizer)

**Access:** Org Admin atau Team Leader (edit), semua member (view)

Satu VTO per organisasi. Semua leader dalam org yang sama melihat VTO yang sama.

**Tab Vision:**
- Core Values — nilai-nilai organisasi (array, bisa tambah/hapus)
- Core Focus — Purpose/Cause/Passion + Niche
- 10-Year Target — target besar 10 tahun
- Marketing Strategy — Target Market, 3 Uniques, Proven Process, Guarantee
- 3-Year Picture — target date, revenue, profit, measurables, look-like bullets

**Tab Traction:**
- 1-Year Plan — target date, revenue, profit, measurables, goals
- Rocks — link ke modul Rocks
- Issues — link ke modul IDS

**Rich text fields** (Core Focus, Target Market, 3 Uniques, Proven Process) disanitize server-side (strip tags + strip all attributes + strip javascript: URLs) dan client-side (DOMParser + attribute removal + comment removal).

**Race condition prevention:** VTO upsert pakai `DB::transaction` + `lockForUpdate` (sebelumnya `firstOrCreate` bisa 500 pada concurrent request).

---

## Module 2 — Rocks (90-Day Priorities)

**Access:** Semua member (view), Leader (create/delete/update status)

**CRUD:**
- Create: title, description (opsional), owner (must be team member), quarter, year, due date
- Update: title, description, owner (leader only), due date
- Update status: On Track, Off Track, Done (leader only, validated enum)
- Delete: leader only

**Milestones:**
- Add milestone: title, due date (opsional), sort order
- Toggle milestone complete/incomplete (owner or leader)
- Delete milestone (leader only)

**Route ordering:** Milestone routes defined BEFORE `{rock}` param routes to prevent Laravel matching "milestones" as a rock ID.

---

## Module 3 — Scorecard

**Access:** Semua member (view + input own metrics), Leader (create/delete metrics + settings)

**Metric CRUD:**
- Create: title, owner (team member), goal_value, comparison_operator (>=, <=, ==), frequency (weekly/monthly)
- Update: leader only
- Delete: leader only

**Score input:**
- Member: hanya bisa input score untuk metric yang di-assign ke mereka
- Leader: bisa input score untuk semua metric
- Auto-compute status: green (meets goal) / red (misses goal)

**Settings (Leader/Org Admin):**
- Q1 Start Date — awal kuartal 1 (Q2-Q4 dihitung per 13 minggu)
- Scorecard Day — hari evaluasi mingguan (0=Sun, 1=Mon, ..., 6=Sat)

**Auto-issue creation:**
- 2 consecutive red weeks → Issue auto-created di IDS
- Race condition prevention: `DB::transaction` + `lockForUpdate` pada metric row

**Settings change → Event regeneration:**
- Scorecard settings change dispatches `RegenerateTeamEvents` queue job (async, no write-on-GET)

---

## Module 4 — To-Do

**Access:** Semua member

**CRUD:**
- Create: title, assignee (team member), due date, optional meeting_id + issue_id
- Update: title, owner (leader only), due date
- Toggle complete/incomplete (owner or leader)
- Delete: owner (own) or leader
- Carry Forward: leader moves all incomplete to-dos to next week

---

## Module 5 — IDS (Issues — Identify, Discuss, Solve)

**Access:** Semua member (identify + resolve), Tutor (view only), Leader (delete)

**CRUD:**
- Create: title, description, root_cause, solution, priority (0-10), owner
- Update: leader or member (tutor cannot)
- Resolve: leader or member (tutor cannot)
- Delete: leader only

**Priority levels:** High (7-10), Medium (4-6), Low (0-3)

---

## Module 6 — L10 Meeting

**Access:** Leader (create/delete/finish), all members (workspace)

**CRUD:**
- Create: title (opsional), scheduled_at (opsional), attendee_ids (team members)
- Start: set started_at = now (leader only, cannot start twice)
- Workspace: 7 sections (Segue, Scorecard, Rock Review, Headlines, To-Do Review, IDS, Conclude)
- Update section notes: segue_notes, headlines_notes, conclude_notes + rating (1-10)
- Create To-Do from meeting (linked to meeting_id)
- Create Issue from meeting (linked to team_id)
- Finish: set ended_at = now, lock all data (read-only after finish)
- Delete: leader only

**Workspace data:** Rocks (non-done), Metrics (+ latest score), To-Dos (incomplete), Issues (open) — all scoped to active team.

---

## Module 7 — Teams & User Management

**Access:** Org Admin (per-organization via pivot)

**Teams tab:**
- Create team: name, type (leadership/departmental/project), leader_user_id (must be org member), parent_team_id (opsional)
- View team members
- Switch active team
- Delete team (hard delete seats, soft delete team, clear session if active team deleted)

**Users tab:**
- Create user: name, email, password, optional is_org_admin, optional team assignment
- Edit user: name, email
- Toggle org admin: via `promoteToOrgAdmin()` / `demoteFromOrgAdmin()` (pivot table, not column)
- Reset password: set new password + invalidate all sessions
- Delete user: invalidate sessions + soft delete memberships + delete user (cannot delete self)

**Member management:**
- Add member to team (org admin or leader)
- Update member role (leader/admin only)
- Remove member from team (leader/admin only, cannot remove self)

**Session invalidation:** On role change, password reset, account deletion, org admin toggle — `SessionInvalidator::forUser()` clears all sessions for the target user.

---

## Module 8 — Accountability Chart

**Access:** Leader or Org Admin

**CRUD:**
- View chart (tree hierarchy: parent seats → child seats)
- Create seat: title, responsibilities (array), user_id (existing or new), parent_id
- Create new user via seat: name, email, role → random 24-char password + reset email link sent
- Update seat: title, parent_id, user_id, responsibilities
- Delete seat (does NOT delete user account)
- Generate from teams: auto-create seats for all teams + leaders + members

**IDOR protection:** All seat operations check `seat.team_id === active_team_id`. Removed `resolveRouteBinding` override that bypassed TeamScope.

---

## Module 9 — People Analyzer

**Access:** Leader or Org Admin

**Features:**
- Evaluate team members + external candidates
- GWC Assessment: Get it (Y/N), Want it (Y/N), Capacity (Y/N)
- Core Values: pulled from VTO, score each (+, +/-, -)
- Auto-compute Seat Fit: Right Person Right Seat, Wrong Person Right Seat, Right Person Wrong Seat, Wrong Person Wrong Seat
- Set Bare Minimum Standard (min_plus, max_plus_minus, max_minus, gwc minimum)
- Evaluations scoped org-wide (leader can see all evaluations in org, not just active team)
- Seat selection org-wide (cross-division candidates, seat dropdown shows team name)
- Evaluation team_id follows seat's team_id (not session team_id)

---

## Module 10 — Leadership Assessment

**Access:** Leader (create cycles, assign, view results, rubrik admin), all members (take assessment)

**Cycle CRUD:**
- Create: name, periode_start, periode_end
- Update: name, periode (cannot update if closed)
- Close: set status = closed (no new submissions, results still viewable)
- Delete: only if no submissions

**Assignment:**
- Assign assessee + leadership type to cycle
- Validation: assessee must be team member, leadership_type_id valid

**Assessment:**
- Take assessment: rate each item on rubric scale 1-5
- All items must be answered before submit
- Submit is final (updateOrCreate, idempotent)
- Cannot assess self
- Cannot submit items outside assignment scope (validated)

**Results:**
- Average score per type + breakdown per item
- Viewable by leader or after cycle closed
- Anonymous (assessor identity not in results)

**Rubrik Admin (Leader/Org Admin):**
- Create/edit/delete leadership types, items, rubric levels
- Per-org scoped (organization_id on all rubrik tables via HasOrganization trait)
- All routes gated by `requireLeader()`

---

## Module 11 — Events

**Access:** Leader (create/edit/delete), all members (view + mark attendance)

**Event types:** Training, Townhall, L10, Quarterly, Annual, Custom

**CRUD:**
- Create: name, type (enum validated), custom_type (if custom), event_date, description, agenda, assigned_roles, assigned_user_ids
- Update: leader only (is_modified flag set for generated events)
- Delete: leader only
- Bulk create: multiple events at once (type enum validated)

**Attendance:**
- Self mark: member marks own attendance
- Override: leader overrides any member's attendance

**Auto-generation:**
- L10/Quarterly/Annual events auto-generated from Scorecard settings
- Regeneration via `RegenerateTeamEvents` queue job (async, no write-on-GET)
- Generated events that are edited (is_modified=true) are not overwritten

**Cross-team view:** Events from other teams in same org visible read-only in calendar.

---

## Module 12 — Leaderboard

**Access:** All members (view), Leader (configure + input points)

**Views:**
- All Management: all non-tutor members across org, sorted by total points
- Per Team: leaderboard for specific team
- All Tutors: all tutor members across org

**Parameters (Leader/Org Admin):**
- Scheme: tutor / management
- Input types:
  - Per Unit: raw_value × weight = points
  - Tiered: raw_value → bracket → points
  - Normalized: (raw_value / 100) × max_points = points
  - Auto: pulled from Rocks/Scorecard/Events/Leadership Assessment modules
- Org-wide queries (parameters shared across teams in same org)

**Entries (Leader/Org Admin):**
- Input points for ANY org member (not just active team — fix HR complaint #5)
- Entry team_id uses parameter's team_id (not session team_id — fix HR complaint #4)
- Recalculate: recompute all entries for a quarter using latest parameter config

**Performance:** O(sources) queries (was O(N×M)). Batch helpers: batchRocksRates, batchScorecardRates, batchEventsRates, batchLeadershipRates.

---

## SECURITY

- Per-org admin via `organization_user` pivot (no global `is_org_admin` column)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- CORS: explicit allowlist via `CORS_ALLOWED_ORIGINS` env (no wildcard)
- Rate limiting: register (5/min), login (10/min per email, not IP), forgot/reset (5/min)
- Session encryption (SESSION_ENCRYPT=true)
- Audit logging: spatie/activitylog v5 (password reset, user delete, admin toggle, seat delete, rubrik delete)
- Session invalidation on authz changes
- IDOR protection via team_id checks on all entity operations
- XSS sanitization: server-side (strip tags + attributes + javascript:) + client-side (DOMParser + attribute removal)
- Multi-tenancy: TenantContext + OrganizationScope + TeamScope (fail-closed in production)
- EnsureTeamRole middleware on all module route groups
- spatie/laravel-permission uninstalled (dead dependency, replaced by team_members.role enum + per-org pivot)

---

## INFRASTRUCTURE

- CI/CD: GitHub Actions (PHP 8.3/8.4 + Node 20/22)
- Health check: /up probes DB + cache + queue
- Backup: custom `backup:run` command (mysqldump/sqlite3, 14-day retention, nightly)
- Error reporting: email alerting via Monolog (ERROR_REPORTING_EMAIL)
- Audit log cleanup: 90-day retention (nightly)
- Dependabot: weekly composer + npm + GitHub Actions updates

---

## TESTING

- ~91 test methods across 20 test files
- Security regression tests (behavioral, not string-matching)
- Module tests for all 8 core modules (CRUD + authz + IDOR)
- CI enforces 20% coverage minimum
