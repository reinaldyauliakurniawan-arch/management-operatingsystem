<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('leadership_types', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->timestamps();
        });

        Schema::create('leadership_items', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leadership_type_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->timestamps();
        });

        Schema::create('leadership_rubrics', function (Blueprint $table) {
            $table->id();
            $table->foreignId('leadership_item_id')->constrained()->onDelete('cascade');
            $table->integer('level'); // 1-5
            $table->text('description');
            $table->timestamps();
        });

        Schema::create('assessment_cycles', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->string('name');
            $table->date('periode_start')->nullable();
            $table->date('periode_end')->nullable();
            $table->string('status')->default('open'); // open, closed
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('assessment_assignments', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained('assessment_cycles')->onDelete('cascade');
            $table->foreignId('user_id')->constrained()->onDelete('cascade');
            $table->foreignId('leadership_type_id')->constrained()->onDelete('cascade');
            $table->timestamps();
        });

        Schema::create('assessment_responses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('cycle_id')->constrained('assessment_cycles')->onDelete('cascade');
            $table->foreignId('assessor_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('assessee_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('item_id')->constrained('leadership_items')->onDelete('cascade');
            $table->integer('rubric_level');
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('assessment_responses');
        Schema::dropIfExists('assessment_assignments');
        Schema::dropIfExists('assessment_cycles');
        Schema::dropIfExists('leadership_rubrics');
        Schema::dropIfExists('leadership_items');
        Schema::dropIfExists('leadership_types');
    }
};
