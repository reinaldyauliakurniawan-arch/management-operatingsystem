<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('metrics', function (Blueprint $table) {
            $table->string('quarter', 2)->default('Q1')->after('frequency'); // Q1–Q4
            $table->unsignedSmallInteger('year')->default(2026)->after('quarter');
        });

        // Backfill: semua metric lama → Q1 tahun saat ini sebagai default
        // (lebih aman daripada Q aktif — admin bisa fix manual jika perlu)
        $currentYear = (int) date('Y');
        DB::table('metrics')->whereNull('deleted_at')->update([
            'quarter' => 'Q1',
            'year'    => $currentYear,
        ]);

        Schema::table('metrics', function (Blueprint $table) {
            $table->index(['team_id', 'quarter', 'year'], 'metrics_team_quarter_year_idx');
        });
    }

    public function down(): void
    {
        Schema::table('metrics', function (Blueprint $table) {
            $table->dropIndex('metrics_team_quarter_year_idx');
            $table->dropColumn(['quarter', 'year']);
        });
    }
};
