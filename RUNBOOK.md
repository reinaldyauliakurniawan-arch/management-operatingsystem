# Runbook — Management Operating System

## Common Operations

### Restart Queue Worker

```bash
# Stop existing worker
php artisan queue:restart

# Start new worker (use Supervisor in production)
php artisan queue:work --tries=3 --timeout=60

# Or via Supervisor config:
sudo supervisorctl restart management-os-worker
```

### Clear All Caches

```bash
php artisan optimize:clear
```

### Run Database Migration

```bash
# Normal migration
php artisan migrate

# Force (production)
php artisan migrate --force

# Rollback last batch
php artisan migrate:rollback

# Fresh + seed (DESTRUCTIVE — dev only)
php artisan migrate:fresh --seed
```

### Rollback organization_user Pivot Migration

If the backfill in `2026_06_20_000003_create_organization_user_pivot.php` fails:

```bash
# 1. Rollback the migration
php artisan migrate:rollback --step=1

# 2. Check if organization_user table exists
php artisan tinker
>>> DB::table('organization_user')->count();

# 3. If table exists but data is wrong, manual backfill:
>>> $admins = DB::table('users')->where('is_org_admin', true)->get();
>>> foreach ($admins as $a) {
>>>     $orgIds = DB::table('team_members')
>>>         ->join('teams', 'team_members.team_id', '=', 'teams.id')
>>>         ->where('team_members.user_id', $a->id)
>>>         ->pluck('teams.organization_id')
>>>         ->unique();
>>>     foreach ($orgIds as $orgId) {
>>>         DB::table('organization_user')->updateOrInsert(
>>>             ['organization_id' => $orgId, 'user_id' => $a->id],
>>>             ['is_admin' => true, 'created_at' => now(), 'updated_at' => now()]
>>>         );
>>>     }
>>> }
```

### Verify Session Invalidation After Password Reset

```bash
# 1. Reset a user's password via admin panel
# 2. Check their sessions are cleared:
php artisan tinker
>>> DB::table('sessions')->where('user_id', <user_id>)->count();
# Should return 0

# 3. If sessions still exist, manually clear:
>>> DB::table('sessions')->where('user_id', <user_id>)->delete();
```

### Run Backup Manually

```bash
php artisan backup:run
# Backup saved to storage/app/backups/backup-YYYY-MM-DD-HHMMSS.sql.gz
# Retains 14 days of backups
```

### Check Health

```bash
curl http://localhost:8000/up
# Returns 200 + JSON if healthy
# Returns 503 + JSON if any dependency is down
```

### View Audit Logs

```bash
php artisan tinker
>>> use Spatie\Activitylog\Models\Activity;
>>> Activity::latest()->take(20)->get(['log_name', 'description', 'created_at']);
```

## Troubleshooting

### Registration Hangs

**Symptom**: User clicks "Daftar", page loads forever.

**Cause**: TenantContext infinite recursion (fixed in commit 70850e8).

**Verify fix**: Check `app/Services/TenantContext.php` uses `DB::table()` not `Auth::user()->teams()`.

### Inertia Page Blank

**Symptom**: Page loads but content is blank.

**Cause**: Usually a PHP error hidden by `APP_DEBUG=false`.

**Fix**: Set `APP_DEBUG=true` in `.env`, check `storage/logs/laravel.log`.

### "Table organization_user doesn't exist"

**Cause**: Migration not run.

**Fix**: `php artisan migrate --force`
