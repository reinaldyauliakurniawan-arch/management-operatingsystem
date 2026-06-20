<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * ponytail: one consolidated migration that adds the composite indexes and
 * unique constraints the audit (D8/I5/I6/I7) identified as missing.
 *
 * - leadership_{types,items,rubrics} gain organization_id so each tenant can
 *   own their own rubrik library instead of sharing one global copy.
 * - assessment_{assignments,responses} get unique constraints so the existing
 *   firstOrCreate/updateOrCreate calls don't race into duplicate rows.
 * - common query patterns (team_id + status, team_id + date, etc.) get
 *   composite indexes so the dashboard / list pages don't table-scan.
 *
 * Backward compatible: every change is additive.
 */
return new class extends Migration {
    public function up(): void
    {
        // 1. leadership_types / items / rubrics → scoped to organization.
        foreach (['leadership_types', 'leadership_items', 'leadership_rubrics'] as $table) {
            if (!Schema::hasColumn($table, 'organization_id')) {
                Schema::table($table, function (Blueprint $t) {
                    $t->foreignId('organization_id')
                        ->nullable()
                        ->after('id')
                        ->constrained()
                        ->cascadeOnDelete();
                    $t->index('organization_id');
                });
            }
        }

        // 2. Unique constraint on assessment_assignments (cycle_id, user_id, leadership_type_id)
        //    prevents the assignAssessee() firstOrCreate race.
        $this->addUniqueIfMissing('assessment_assignments', ['cycle_id', 'user_id', 'leadership_type_id'], 'asgn_cycle_user_type_uniq');

        // 3. Unique constraint on assessment_responses (cycle_id, assessor_id, assessee_id, item_id)
        //    prevents the submitResponse() updateOrCreate race.
        $this->addUniqueIfMissing('assessment_responses', ['cycle_id', 'assessor_id', 'assessee_id', 'item_id'], 'resp_cycle_pair_item_uniq');

        // 4. Unique on team_members — last line of defense against duplicate memberships.
        $this->addUniqueIfMissing('team_members', ['team_id', 'user_id'], 'team_members_team_user_uniq');

        // 5. Composite indexes for common list/dashboard queries.
        $this->addIndexIfMissing('rocks', ['team_id', 'quarter', 'year'], 'rocks_team_quarter_year_idx');
        $this->addIndexIfMissing('rocks', ['team_id', 'status'], 'rocks_team_status_idx');
        $this->addIndexIfMissing('issues', ['team_id', 'status'], 'issues_team_status_idx');
        $this->addIndexIfMissing('to_dos', ['team_id', 'is_completed', 'due_date'], 'todos_team_done_due_idx');
        $this->addIndexIfMissing('events', ['team_id', 'type', 'event_date'], 'events_team_type_date_idx');
        $this->addIndexIfMissing('meetings', ['team_id', 'scheduled_at'], 'meetings_team_scheduled_idx');
        $this->addIndexIfMissing('metrics', ['team_id', 'frequency'], 'metrics_team_freq_idx');
    }

    public function down(): void
    {
        foreach (['metrics', 'meetings', 'events', 'to_dos', 'issues', 'rocks'] as $table) {
            $indexes = [
                'metrics' => 'metrics_team_freq_idx',
                'meetings' => 'meetings_team_scheduled_idx',
                'events' => 'events_team_type_date_idx',
                'to_dos' => 'todos_team_done_due_idx',
                'issues' => 'issues_team_status_idx',
                'rocks' => ['rocks_team_status_idx', 'rocks_team_quarter_year_idx'],
            ];
            foreach ((array) $indexes[$table] as $idx) {
                $this->dropIndexIfExists($table, $idx);
            }
        }

        $this->dropUniqueIfExists('team_members', 'team_members_team_user_uniq');
        $this->dropUniqueIfExists('assessment_responses', 'resp_cycle_pair_item_uniq');
        $this->dropUniqueIfExists('assessment_assignments', 'asgn_cycle_user_type_uniq');

        foreach (['leadership_rubrics', 'leadership_items', 'leadership_types'] as $table) {
            if (Schema::hasColumn($table, 'organization_id')) {
                Schema::table($table, function (Blueprint $t) use ($table) {
                    // Drop FK by Laravel's convention.
                    try { $t->dropForeign("{$table}_organization_id_foreign"); } catch (\Throwable) {}
                    $t->dropIndex('organization_id');
                    $t->dropColumn('organization_id');
                });
            }
        }
    }

    private function addUniqueIfMissing(string $table, array $cols, string $idxName): void
    {
        if (!$this->indexExists($table, $idxName)) {
            Schema::table($table, fn(Blueprint $t) => $t->unique($cols, $idxName));
        }
    }

    private function addIndexIfMissing(string $table, array $cols, string $idxName): void
    {
        if (!$this->indexExists($table, $idxName)) {
            Schema::table($table, fn(Blueprint $t) => $t->index($cols, $idxName));
        }
    }

    private function dropUniqueIfExists(string $table, string $idxName): void
    {
        if ($this->indexExists($table, $idxName)) {
            Schema::table($table, fn(Blueprint $t) => $t->dropUnique($idxName));
        }
    }

    private function dropIndexIfExists(string $table, string $idxName): void
    {
        if ($this->indexExists($table, $idxName)) {
            Schema::table($table, fn(Blueprint $t) => $t->dropIndex($idxName));
        }
    }

    private function indexExists(string $table, string $idxName): bool
    {
        // ponytail: SQLite + MySQL compatible check.
        try {
            $rows = DB::select("PRAGMA index_list({$table})");
            foreach ($rows as $row) {
                if (isset($row->name) && $row->name === $idxName) return true;
            }
            return false;
        } catch (\Throwable) {
            // MySQL path
            return collect(DB::select("SHOW INDEXES FROM `{$table}` WHERE Key_name = ?", [$idxName]))->isNotEmpty();
        }
    }
};
