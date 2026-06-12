<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // ROCKS
        if (Schema::hasColumn('rocks', 'organization_id') && !Schema::hasColumn('rocks', 'team_id')) {
            Schema::table('rocks', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }

        // METRICS
        if (Schema::hasColumn('metrics', 'organization_id') && !Schema::hasColumn('metrics', 'team_id')) {
            Schema::table('metrics', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
                $table->string('frequency')->default('weekly')->after('comparison_operator'); // weekly, monthly
            });
        }

        // ISSUES
        if (Schema::hasColumn('issues', 'organization_id') && !Schema::hasColumn('issues', 'team_id')) {
            Schema::table('issues', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }

        // TO-DOS
        if (Schema::hasColumn('to_dos', 'organization_id') && !Schema::hasColumn('to_dos', 'team_id')) {
            Schema::table('to_dos', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
                $table->foreignId('meeting_id')->nullable()->after('owner_id')->constrained('meetings')->nullOnDelete();
            });
        }

        // MEETINGS
        if (!Schema::hasColumn('meetings', 'team_id')) {
            Schema::table('meetings', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }

        // EVALUATIONS (PeopleAnalyzer)
        if (!Schema::hasColumn('evaluations', 'team_id')) {
            Schema::table('evaluations', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }

        // SEATS (AccountabilityChart)
        if (!Schema::hasColumn('seats', 'team_id')) {
            Schema::table('seats', function (Blueprint $table) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }
    }

    public function down(): void
    {
        $drops = [
            'rocks'       => ['team_id'],
            'metrics'     => ['team_id', 'frequency'],
            'issues'      => ['team_id'],
            'to_dos'      => ['team_id', 'meeting_id'],
            'meetings'    => ['team_id'],
            'evaluations' => ['team_id'],
            'seats'       => ['team_id'],
        ];

        foreach ($drops as $table => $columns) {
            if (Schema::hasTable($table)) {
                Schema::table($table, function (Blueprint $t) use ($columns) {
                    foreach ($columns as $col) {
                        if (Schema::hasColumn($t->getTable(), $col)) {
                            $t->dropColumn($col);
                        }
                    }
                });
            }
        }
    }
};
