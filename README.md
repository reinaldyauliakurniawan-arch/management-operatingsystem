# Management Operating System (Just Speak)

A Laravel 13 + Inertia 2 + React 19 + TypeScript + Tailwind 4 web application implementing the EOS (Entrepreneurial Operating System) framework for organizational management.

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Laravel 13 (PHP 8.3+), MySQL/SQLite |
| Frontend | React 19, TypeScript, Tailwind CSS 4, Inertia.js 2 |
| UI Components | shadcn/ui (base-ui), Lucide icons |
| Auth | Laravel Breeze (session-based) |
| Build | Vite 8, SSR enabled |
| Testing | Pest 4 (backend), PHPUnit 12 |
| CI/CD | GitHub Actions (PHP 8.3/8.4 + Node 20/22) |

## Quick Start

```bash
# Clone
git clone https://github.com/reinaldyauliakurniakan-arch/management-operatingsystem.git
cd management-operatingsystem

# Backend
composer install
cp .env.example .env
php artisan key:generate
touch database/database.sqlite  # or configure MySQL in .env
php artisan migrate --force
php artisan db:seed --force

# Frontend
npm install
npm run build

# Serve
php artisan serve
# Open http://localhost:8000
```

## Default Credentials (after seed)

| User | Email | Password | Role |
|------|-------|----------|------|
| Alice | alice@acme.com | password | Org Admin + Leader |
| Bob | bob@acme.com | password | Leader (Sales) + Member (Leadership) |
| Carol | carol@acme.com | password | Member (Sales) |

---

## Modules

### 1. Dashboard
Role-aware summary: rocks stats, scorecard reds, open issues, overdue todos, upcoming L10 meeting, leaderboard top 3, upcoming events.

### 2. VTO (Vision/Traction Organizer)
**Access:** Org Admin or Team Leader (edit), all members (view)

Two tabs:
- **Vision:** Core Values, Core Focus (Purpose + Niche), 10-Year Target, Marketing Strategy (Target Market, 3 Uniques, Proven Process, Guarantee), 3-Year Picture
- **Traction:** 1-Year Plan, Rocks (link to Rocks module), Issues (link to IDS module)

One VTO per organization — all leaders in the same org see the same VTO.

### 3. Rocks (90-Day Priorities)
**Access:** All team members (view), Leader (create/delete/update status)

- Create rock with title, description, owner, quarter, year, due date
- Status: On Track, Off Track, Done
- Milestones: add, toggle complete, delete
- Owner can update own rocks; leader can update all + change owner

### 4. Scorecard
**Access:** All team members (view + input own metrics), Leader (create/delete metrics + settings)

- Metrics with goal value, comparison operator (>=, <=, ==), owner, frequency
- Weekly score input per metric
- Auto status: green (on track) / red (off track)
- Settings: Q1 start date + weekly evaluation day
- Auto-issue creation: 2 consecutive red weeks → Issue auto-created in IDS

### 5. To-Do
**Access:** All team members

- Create to-do with title, assignee, due date
- Link to meeting or issue
- Toggle complete/incomplete
- Edit title, owner, due date
- Carry Forward: leader moves all incomplete to-dos to next week

### 6. IDS (Issues — Identify, Discuss, Solve)
**Access:** All team members (identify + resolve), Leader (delete), Tutor (view only)

- Create issue with title, description, root cause, solution, priority (0-10), owner
- Priority levels: High (7-10), Medium (4-6), Low (0-3)
- Resolve issues (mark as resolved)
- Auto-created issues from Scorecard repeated reds

### 7. L10 Meeting
**Access:** Leader (create/delete/finish), all members (workspace)

- Create meeting with title, schedule, attendees
- Workspace with 7 sections: Segue, Scorecard, Rock Review, Headlines, To-Do Review, IDS, Conclude
- Start meeting (set started_at)
- Add To-Do or Issue from within meeting
- Finish meeting (lock data, set rating 1-10)
- Read-only after finish

### 8. Teams & User Management
**Access:** Org Admin

- **Teams tab:** Create team (name, type, leader, parent team), view members, switch team
- **Users tab:** Create user, edit user, reset password, delete user, toggle org admin
- Roles: leader, member, tutor (per-team, not global)
- Org Admin: per-organization via `organization_user` pivot (not global flag)

### 9. Accountability Chart
**Access:** Leader or Org Admin

- Visual org chart with seats (positions) and reporting lines
- Create seat: assign existing user or create new user
- Edit/delete seats (seat deletion does NOT delete user account)
- Generate chart from team structure (auto-create seats for all teams + leaders)

### 10. People Analyzer
**Access:** Leader or Org Admin

- Evaluate team members + external candidates using GWC (Get it, Want it, Capacity) + Core Values
- Core Values pulled from VTO
- Auto-compute Seat Fit: Right Person Right Seat, Wrong Person Right Seat, Right Person Wrong Seat, Wrong Person Wrong Seat
- Set Bare Minimum Standard (threshold for +, +/-, -, GWC)
- View evaluations org-wide (not just active team)
- Seat selection org-wide (cross-division candidates)

### 11. Leadership Assessment
**Access:** Leader (create cycles, assign, view results), all members (take assessment)

- 360° anonymous assessment: each member assesses others
- Create assessment cycle (name, period)
- Assign assessee + leadership type
- Take assessment: rate each item on rubric scale 1-5
- Submit is final (cannot re-submit)
- Results: average score per type + breakdown per item
- Rubrik admin: create/edit/delete leadership types, items, rubric levels (per-org scoped)

### 12. Events
**Access:** Leader (create/edit/delete), all members (view + mark attendance)

- Event types: Training, Townhall, L10, Quarterly, Annual, Custom
- Auto-generated L10/Quarterly/Annual events from Scorecard settings
- Mark attendance (self), override attendance (leader)
- View events from other teams in same org (read-only)
- Bulk event creation

### 13. Leaderboard
**Access:** All members (view), Leader (configure + input points)

- Views: All Management, Per Team, All Tutors
- Parameters: Per Unit, Tiered, Normalized, Auto (from Rocks/Scorecard/Events/Leadership)
- Configure parameters per scheme (tutor/management)
- Input points for any org member (not just active team)
- Recalculate all entries for a quarter
- Org-wide parameter + member queries (sinkronisasi antar team)

---

## Roles & Permissions

| Fitur | Member | Tutor | Leader | Org Admin |
|-------|--------|-------|--------|-----------|
| Lihat Dashboard | ✓ | ✓ | ✓ | ✓ |
| Edit VTO | ✗ | ✗ | ✓ | ✓ |
| Tambah Rock | ✓ | ✗ | ✓ | ✓ |
| Hapus Rock | ✗ | ✗ | ✓ | ✓ |
| Tambah Metrik Scorecard | ✗ | ✗ | ✓ | ✓ |
| Input nilai Scorecard | ✓ (milik sendiri) | ✓ (milik sendiri) | ✓ | ✓ |
| Tambah To-Do | ✓ | ✓ | ✓ | ✓ |
| Hapus To-Do | ✗ (milik sendiri) | ✗ | ✓ | ✓ |
| Identify Issue | ✓ | ✗ | ✓ | ✓ |
| Solve Issue | ✓ | ✗ | ✓ | ✓ |
| Buat L10 Meeting | ✗ | ✗ | ✓ | ✓ |
| Edit Accountability Chart | ✗ | ✗ | ✓ | ✓ |
| People Analyzer | ✗ | ✗ | ✓ | ✓ |
| Konfigurasi Leaderboard | ✗ | ✗ | ✓ | ✓ |
| Lihat Leaderboard | ✓ | ✓ | ✓ | ✓ |
| Manage Team & User | ✗ | ✗ | ✗ | ✓ |
| Rubrik Admin (Leadership Assessment) | ✗ | ✗ | ✓ | ✓ |

---

## Security Features

- **Per-organization admin** via `organization_user` pivot (no global admin flag)
- **Security headers:** CSP, HSTS, X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **CORS** explicit allowlist (no wildcard)
- **Rate limiting** on register (5/min), login (10/min), forgot/reset (5/min)
- **Session encryption** (SESSION_ENCRYPT=true)
- **Audit logging** via spatie/activitylog (password reset, user delete, admin toggle, seat delete, rubrik delete)
- **Session invalidation** on role change, password reset, account deletion
- **IDOR protection** on all entity operations (team_id check)
- **Multi-tenancy** via TenantContext + OrganizationScope + TeamScope
- **XSS sanitization** server-side + client-side (hardened for unquoted handlers, javascript: URLs, iframe/object/embed)

---

## Infrastructure

- **CI/CD:** GitHub Actions (PHP 8.3/8.4 + Node 20/22 matrix)
  - Backend: composer install, migrate, Pest tests with coverage (20% min), Pint lint
  - Frontend: npm ci, tsc --noEmit, Vite build
- **Health check:** `/up` probes DB + cache + queue (200/503 JSON)
- **Backup:** Custom `php artisan backup:run` (mysqldump/sqlite3, 14-day retention, nightly schedule)
- **Error reporting:** Email alerting via Monolog (ERROR_REPORTING_EMAIL env)
- **Audit log cleanup:** Activity log pruned after 90 days (nightly schedule)
- **Dependabot:** Weekly composer + npm + GitHub Actions updates

---

## Testing

| Category | Files | Methods |
|----------|-------|---------|
| Security regression | `ProductionGradeSecurityTest.php` | 11 (behavioral: IDOR, authz, per-org admin, security headers, password, throttle) |
| Module tests | 8 files (Rocks, ToDo, IDS, AccountabilityChart, Event, Leaderboard, Teams, Scorecard) | ~45 (CRUD + authz + IDOR per module) |
| Existing tests | MultiTenancy, Organization, VTO, L10Meeting, LeadershipAssessment, ScorecardIntegration | ~20 |
| Auth tests | Breeze default (Registration, Login, PasswordReset, EmailVerification, Profile) | ~15 |

Total: ~91 test methods across 20 test files.

---

## Project Structure

```
app/
├── Http/
│   ├── Controllers/       # Auth, Dashboard, Profile, Health
│   └── Middleware/        # EnsureHasOrganization, EnsureTeamRole, HandleInertia, SetSecurityHeaders
├── Models/                # User, Organization
├── Services/              # TenantContext, SessionInvalidator
├── Modules/
│   ├── Auth/              # RegisterUser action
│   ├── Organization/      # CreateOrganization action + controller
│   ├── Teams/             # Team + TeamMember controllers, models
│   ├── VTO/               # VTOPlan model, UpdateVTO action
│   ├── Rocks/             # Rock + RockMilestone models, CRUD
│   ├── Scorecard/         # Metric + WeeklyScore models, LogWeeklyScore action
│   ├── ToDo/              # ToDo model, CarryForwardToDos action
│   ├── IDS/               # Issue model, CreateIssue action
│   ├── L10Meeting/        # Meeting model, CreateMeeting action
│   ├── AccountabilityChart/ # Seat model, CreateUserAndAddToTeam action
│   ├── PeopleAnalyzer/    # Evaluation + Standard models
│   ├── LeadershipAssessment/ # Cycle, Assignment, Response, Type, Item, Rubric models
│   ├── Event/             # Event + EventAttendance models
│   └── Leaderboard/       # Parameter + Entry models, CalculateLeaderboardScores action
├── Console/Commands/      # BackupDatabase
├── Providers/             # AppServiceProvider, ErrorReportingServiceProvider
└── Helpers/               # activity_polyfill.php (defensive)

database/
├── migrations/            # 24 migrations (including production-grade indexes + constraints)
├── seeders/               # DatabaseSeeder, LeadershipDataSeeder, LeaderboardParameterSeeder
└── factories/             # UserFactory

resources/js/
├── Pages/                 # 13 module pages + Auth + Profile + Dashboard + Welcome
├── Components/ui/         # shadcn-style UI primitives (button, card, dialog, etc.)
├── Layouts/               # AuthenticatedLayout, GuestLayout
└── Lib/                   # sanitize-html.ts, utils.ts

tests/
├── Feature/               # 20 test files (security + module + integration)
└── Unit/                  # ExampleTest
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| APP_DEBUG | false | Show stack traces (set true in dev) |
| SESSION_ENCRYPT | true | Encrypt session data |
| SESSION_SECURE_COOKIE | null | Set true in HTTPS production |
| CORS_ALLOWED_ORIGINS | (empty) | Comma-separated origins, no wildcard |
| ERROR_REPORTING_EMAIL | (empty) | Email for production error alerts |
| BACKUP_DISK | local | Storage disk for backups (or s3) |
| BACKUP_NOTIFICATION_EMAIL | (empty) | Email for backup success/failure alerts |
| ACTIVITYLOG_ENABLED | true | Enable/disable audit logging |
| ACTIVITYLOG_DELETE_DAYS | 90 | Days to retain audit logs |

---

## Documentation

- [PRODUCTION-GRADE-REPORT.md](PRODUCTION-GRADE-REPORT.md) — Full audit + hardening report
- [CHANGELOG.md](CHANGELOG.md) — Versioned changelog (Phase 1-3)
- [RUNBOOK.md](RUNBOOK.md) — Operations + troubleshooting guide
- [SECURITY.md](SECURITY.md) — Vulnerability disclosure policy
- [DESIGN.md](DESIGN.md) — Design decisions
- [PRD.md](PRD.md) — Product requirements document

---

## License

MIT
