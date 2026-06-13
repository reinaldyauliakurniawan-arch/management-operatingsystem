<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (! Schema::hasColumn('vto_plans', 'organization_id')) {
            Schema::table('vto_plans', function (Blueprint $table) {
                $table->foreignId('organization_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            });
        }

        if (Schema::hasColumn('vto_plans', 'team_id')) {
            foreach (DB::table('vto_plans')->orderBy('id')->get() as $vto) {
                if (! $vto->team_id) {
                    continue;
                }

                $team = DB::table('teams')->where('id', $vto->team_id)->first();
                if ($team && ! $vto->organization_id) {
                    DB::table('vto_plans')
                        ->where('id', $vto->id)
                        ->update(['organization_id' => $team->organization_id]);
                }
            }

            $duplicateOrgIds = DB::table('vto_plans')
                ->select('organization_id', DB::raw('COUNT(*) as cnt'))
                ->whereNotNull('organization_id')
                ->groupBy('organization_id')
                ->having('cnt', '>', 1)
                ->pluck('organization_id');

            foreach ($duplicateOrgIds as $orgId) {
                $keepId = DB::table('vto_plans')
                    ->where('organization_id', $orgId)
                    ->orderBy('id')
                    ->value('id');

                DB::table('vto_plans')
                    ->where('organization_id', $orgId)
                    ->where('id', '!=', $keepId)
                    ->delete();
            }
        }

        Schema::table('vto_plans', function (Blueprint $table) {
            if (Schema::hasColumn('vto_plans', 'team_id')) {
                try {
                    $table->dropUnique(['team_id']);
                } catch (\Throwable) {
                }
                $table->dropConstrainedForeignId('team_id');
            }
        });

        Schema::table('vto_plans', function (Blueprint $table) {
            try {
                $table->unique('organization_id');
            } catch (\Throwable) {
            }
        });
    }

    public function down(): void
    {
        Schema::table('vto_plans', function (Blueprint $table) {
            try {
                $table->dropUnique(['organization_id']);
            } catch (\Throwable) {
            }

            if (! Schema::hasColumn('vto_plans', 'team_id')) {
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            }
        });
    }
};
