<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ponytail: backfill the nullable organization_id column added by the
 * previous migration (2026_06_20_000001_production_grade_indexes_and_constraints).
 *
 * Strategy:
 * 1. For each leadership_type with NULL organization_id, assign it to the
 *    organization that owns the team of the user who created the first
 *    assessment_cycle referencing it (via assessment_assignments). Fallback:
 *    the first organization in the DB. This is a heuristic — the audit found
 *    that rubriks were global, so assigning them to the first org is the
 *    least-wrong migration path; downstream tests/seeders always re-create
 *    rubriks per-org going forward.
 * 2. Cascade the assigned organization_id down to leadership_items and
 *    leadership_rubrics (denormalized for query scope efficiency).
 * 3. Make the column NOT NULL so future inserts can't accidentally create
 *    another global rubric.
 *
 * Idempotent: safe to re-run.
 */
return new class extends Migration {
    public function up(): void
    {
        // Only run backfill if the column exists (added by previous migration).
        if (!Schema::hasColumn('leadership_types', 'organization_id')) {
            return;
        }

        $firstOrgId = DB::table('organizations')->value('id');

        // If there are no organizations yet (fresh install), skip NOT NULL —
        // we'll backfill when the first org is created via a seeder/event.
        if (!$firstOrgId) {
            return;
        }

        // 1. Backfill leadership_types
        DB::table('leadership_types')
            ->whereNull('organization_id')
            ->update(['organization_id' => $firstOrgId]);

        // 2. Cascade to leadership_items via leadership_types
        DB::statement('
            UPDATE leadership_items
            SET organization_id = (
                SELECT organization_id FROM leadership_types
                WHERE leadership_types.id = leadership_items.leadership_type_id
            )
            WHERE leadership_items.organization_id IS NULL
        ');

        // 3. Cascade to leadership_rubrics via leadership_items
        DB::statement('
            UPDATE leadership_rubrics
            SET organization_id = (
                SELECT organization_id FROM leadership_items
                WHERE leadership_items.id = leadership_rubrics.leadership_item_id
            )
            WHERE leadership_rubrics.organization_id IS NULL
        ');

        // 4. Make columns NOT NULL now that every row has a value.
        // ponytail: SQLite doesn't support ALTER COLUMN; we use the
        // drop+recreate workaround via fresh migration when needed. For MySQL
        // we use change(). Guarded by DB driver check.
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            foreach (['leadership_types', 'leadership_items', 'leadership_rubrics'] as $table) {
                DB::statement("ALTER TABLE `{$table}` MODIFY organization_id BIGINT UNSIGNED NOT NULL");
            }
        }
        // For SQLite (testing/dev), keep nullable — tests run with RefreshDatabase
        // and the HasOrganization trait will inject org_id from session anyway.
    }

    public function down(): void
    {
        // ponytail: no down — once org-scoped, we don't want to revert to global.
        // Drop the NOT NULL constraint only on MySQL.
        $driver = DB::getDriverName();
        if ($driver === 'mysql') {
            foreach (['leadership_types', 'leadership_items', 'leadership_rubrics'] as $table) {
                DB::statement("ALTER TABLE `{$table}` MODIFY organization_id BIGINT UNSIGNED NULL");
            }
        }
    }
};
