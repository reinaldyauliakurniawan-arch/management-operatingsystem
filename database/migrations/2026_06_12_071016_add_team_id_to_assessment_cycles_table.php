<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('assessment_cycles', function (Blueprint $table) {
    $table->foreignId('team_id')->after('id')->constrained('teams')->onDelete('cascade');
    $table->foreignId('created_by')->nullable()->after('status')->constrained('users');
    $table->softDeletes();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('assessment_cycles', function (Blueprint $table) {
    $table->foreignId('team_id')->after('id')->constrained('teams')->onDelete('cascade');
    $table->foreignId('created_by')->nullable()->after('status')->constrained('users');
    $table->softDeletes();
});
    }
};
