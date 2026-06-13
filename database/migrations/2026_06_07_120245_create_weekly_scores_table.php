<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('weekly_scores', function (Blueprint $table) {
            $table->id();
            $table->foreignId('metric_id')->constrained()->onDelete('cascade');
            $table->date('week_start_date');
            $table->decimal('actual_value', 15, 2);
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();

            $table->unique(['metric_id', 'week_start_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('weekly_scores');
    }
};
