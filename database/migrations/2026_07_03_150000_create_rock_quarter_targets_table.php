<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rock_quarter_targets', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->string('quarter');
            $table->integer('year');
            $table->date('quarter_date')->nullable();
            $table->string('quarter_revenue', 100)->nullable();
            $table->string('quarter_profit', 100)->nullable();
            $table->string('quarter_measurables', 500)->nullable();
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->timestamps();
            $table->unique(['team_id', 'quarter', 'year']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rock_quarter_targets');
    }
};
