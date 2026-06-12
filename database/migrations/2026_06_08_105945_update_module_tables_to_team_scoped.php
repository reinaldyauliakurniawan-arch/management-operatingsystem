<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        $tables = ['seats', 'vto_plans', 'rocks', 'metrics', 'issues', 'to_dos', 'meetings'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('team_id')->after('id')->constrained('teams')->onDelete('cascade');
                $table->dropConstrainedForeignId('organization_id');
            });
        }

        // VTO Plan should be unique per team
        Schema::table('vto_plans', function (Blueprint $table) {
            $table->unique('team_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        $tables = ['seats', 'vto_plans', 'rocks', 'metrics', 'issues', 'to_dos', 'meetings'];

        foreach ($tables as $table) {
            Schema::table($table, function (Blueprint $table) {
                $table->foreignId('organization_id')->after('id')->constrained('organizations')->onDelete('cascade');
                $table->dropConstrainedForeignId('team_id');
            });
        }

        Schema::table('vto_plans', function (Blueprint $table) {
            $table->dropUnique(['team_id']);
        });
    }
};
