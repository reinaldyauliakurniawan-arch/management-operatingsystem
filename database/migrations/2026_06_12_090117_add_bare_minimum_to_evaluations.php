<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        // Tabel konfigurasi bare minimum per team
        Schema::create('people_analyzer_standards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->integer('min_plus')->default(3);        // minimum simbol +
            $table->integer('max_plus_minus')->default(2);  // maksimum +/-
            $table->integer('max_minus')->default(0);       // maksimum -
            $table->boolean('gwc_get')->default(true);      // Get it harus Y?
            $table->boolean('gwc_want')->default(true);     // Want it harus Y?
            $table->string('gwc_capacity')->default('Y');   // Y atau N (boleh N)
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->unique('team_id'); // satu standard per team
        });

        // Perbaiki tabel evaluations — tambah kolom yang kurang
        Schema::table('evaluations', function (Blueprint $table) {
            if (!Schema::hasColumn('evaluations', 'gwc_get')) {
                $table->boolean('gwc_get')->default(false)->after('evaluatee_id');
            }
            if (!Schema::hasColumn('evaluations', 'gwc_want')) {
                $table->boolean('gwc_want')->default(false)->after('gwc_get');
            }
            if (!Schema::hasColumn('evaluations', 'gwc_capacity')) {
                $table->boolean('gwc_capacity')->default(false)->after('gwc_want');
            }
            if (!Schema::hasColumn('evaluations', 'core_values_scores')) {
                // JSON: [{"value": "Integrity", "symbol": "+"}, ...]
                $table->json('core_values_scores')->nullable()->after('gwc_capacity');
            }
            if (!Schema::hasColumn('evaluations', 'period')) {
                $table->string('period')->nullable()->after('core_values_scores'); // e.g. "Q3 2025"
            }
            if (!Schema::hasColumn('evaluations', 'seat_fit')) {
                // computed/stored: right_person_right_seat, wrong_person_right_seat, etc.
                $table->string('seat_fit')->nullable()->after('period');
            }
            if (!Schema::hasColumn('evaluations', 'notes')) {
                $table->text('notes')->nullable()->after('seat_fit');
            }
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('people_analyzer_standards');
        Schema::table('evaluations', function (Blueprint $table) {
            $table->dropColumn(['gwc_get', 'gwc_want', 'gwc_capacity', 'core_values_scores', 'period', 'seat_fit', 'notes']);
        });
    }
};
