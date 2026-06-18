<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->foreignId('evaluatee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('evaluator_id')->constrained('users')->onDelete('cascade');
            $table->boolean('gwc_get')->default(false);
            $table->boolean('gwc_want')->default(false);
            $table->boolean('gwc_capacity')->default(false);
            $table->json('core_values_scores')->nullable(); // [{"value":"Integrity","symbol":"+"}, ...]
            $table->string('period')->nullable(); // e.g. "Q3 2025"
            $table->boolean('is_candidate')->default(false); // true = kandidat eksternal
            $table->string('candidate_name')->nullable(); // nama jika bukan user sistem
            $table->foreignId('seat_id')->nullable()->constrained('seats')->nullOnDelete();
            $table->string('seat_fit')->nullable(); // right_person_right_seat, dst
            $table->text('notes')->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('people_analyzer_standards', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->integer('min_plus')->default(3);
            $table->integer('max_plus_minus')->default(2);
            $table->integer('max_minus')->default(0);
            $table->boolean('gwc_get')->default(true);
            $table->boolean('gwc_want')->default(true);
            $table->string('gwc_capacity')->default('Y');
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->unique('team_id');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('people_analyzer_standards');
        Schema::dropIfExists('evaluations');
    }
};
