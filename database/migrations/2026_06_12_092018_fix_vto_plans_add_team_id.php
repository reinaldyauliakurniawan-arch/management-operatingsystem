<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vto_plans', function (Blueprint $table) {
            if (!Schema::hasColumn('vto_plans', 'team_id')) {
                // Per PRD: "Scope: per organization (satu VTO untuk seluruh org)"
                // Tapi karena semua data sudah team-scoped, kita pakai team_id
                // VTOController sudah pakai firstOrCreate dengan team_id
                $table->foreignId('team_id')->nullable()->after('id')->constrained()->onDelete('cascade');
            }
        });
    }

    public function down(): void
    {
        Schema::table('vto_plans', function (Blueprint $table) {
            if (Schema::hasColumn('vto_plans', 'team_id')) {
                $table->dropConstrainedForeignId('team_id');
            }
        });
    }
};
