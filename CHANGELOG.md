# Changelog

All notable changes to this project are documented in this file.

## [Unreleased]

### Phase 3 (2026-06-21)
- Security headers middleware (CSP, HSTS, X-Frame-Options, etc.)
- CORS configuration with explicit allowlist
- CI/CD pipeline (GitHub Actions: PHP 8.3/8.4 + Node 20/22)
- Coverage config in phpunit.xml
- 8 module test files (~45 new test methods)
- Behavioral security tests (replaced string-matching)
- Fixed TS error in VTO/Index.tsx (editTarget.index)
- Fixed registration hang (TenantContext infinite recursion)
- Fixed composer.lock sync (spatie/activitylog v5 for Laravel 13)
- Custom BackupDatabase command (replaces spatie/laravel-backup)

### Phase 2 (2026-06-20)
- Per-org admin pivot (organization_user table, dropped global is_org_admin)
- Backfill rubrik organization_id + HasOrganization trait
- Leaderboard N×M query optimization (O(sources))
- VTO 18-state overwrite bug fix
- spatie/laravel-permission uninstalled (dead dependency)
- Error reporting (email alerting via Monolog)
- Session invalidation on role/password change
- Health check proper (DB + cache + queue)
- spatie/activitylog for audit logging
- HR feedback fixes (7 bugs): tab rename, assign assessee, input poin,
  dropdown user org-wide, People Analyzer org-wide, seat org-wide

### Phase 1 (2026-06-20)
- 17 critical security issues closed (IDOR, mass-assignment, XSS, etc.)
- 11 CRUD/race condition bugs fixed (transactions, lockForUpdate)
- 13 multi-tenancy isolation gaps closed (TenantContext, scoped queries)
- Frontend blockers fixed (ErrorBoundary, RichTextEditor, tsconfig, types)
- Security defaults flipped (APP_DEBUG=false, SESSION_ENCRYPT=true)
- Rate limiting on auth routes
- 9 security regression tests

### Pre-Phase 1 (before 2026-06-20)
- Initial codebase by Reinaldy
- 13 modules: VTO, Rocks, Scorecard, ToDo, IDS, L10Meeting, Teams,
  AccountabilityChart, PeopleAnalyzer, Event, Leaderboard,
  LeadershipAssessment, Organization
- Laravel 13 + Inertia 2 + React 19 + TypeScript + Tailwind 4
