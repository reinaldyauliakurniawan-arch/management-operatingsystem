<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('vto_plans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('organization_id')->constrained()->onDelete('cascade');

            // Vision
            $table->json('core_values')->nullable();
            $table->text('core_focus_purpose')->nullable();
            $table->text('core_focus_niche')->nullable();
            $table->string('ten_year_target')->nullable();

            // Marketing Strategy
            $table->text('target_market')->nullable();
            $table->text('three_uniques')->nullable();
            $table->text('proven_process')->nullable();
            $table->string('guarantee')->nullable();

            // 3-Year Picture
            $table->date('three_year_date')->nullable();
            $table->decimal('three_year_revenue', 15, 2)->nullable();
            $table->decimal('three_year_profit', 15, 2)->nullable();
            $table->integer('three_year_measurables')->nullable();
            $table->json('three_year_look')->nullable();

            // 1-Year Plan
            $table->date('one_year_date')->nullable();
            $table->decimal('one_year_revenue', 15, 2)->nullable();
            $table->decimal('one_year_profit', 15, 2)->nullable();
            $table->integer('one_year_measurables')->nullable();
            $table->json('one_year_goals')->nullable();

            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('vto_plans');
    }
};
