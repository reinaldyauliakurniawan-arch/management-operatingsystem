<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            // Hapus kolom lama yang sudah digantikan oleh gwc_get/gwc_want/gwc_capacity
            if (Schema::hasColumn('evaluations', 'gets_it')) {
                $table->dropColumn('gets_it');
            }
            if (Schema::hasColumn('evaluations', 'wants_it')) {
                $table->dropColumn('wants_it');
            }
            if (Schema::hasColumn('evaluations', 'capacity')) {
                $table->dropColumn('capacity');
            }
            // core_value_ratings (lama) digantikan core_values_scores (baru)
            if (Schema::hasColumn('evaluations', 'core_value_ratings')) {
                $table->dropColumn('core_value_ratings');
            }
        });
    }

    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->string('gets_it')->nullable();
            $table->string('wants_it')->nullable();
            $table->string('capacity')->nullable();
            $table->json('core_value_ratings')->nullable();
        });
    }
};
