<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->date('q1_start_date')->nullable()->after('type');
            $table->tinyInteger('scorecard_day')->default(1)->after('q1_start_date'); // 0=Minggu,1=Senin,...,6=Sabtu
        });
    }

    public function down(): void
    {
        Schema::table('teams', function (Blueprint $table) {
            $table->dropColumn(['q1_start_date', 'scorecard_day']);
        });
    }
};
