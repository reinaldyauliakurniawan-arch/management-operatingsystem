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
        Schema::table('evaluations', function (Blueprint $table) {
            $table->foreignId('team_id')->after('id')->constrained('teams')->onDelete('cascade');
            $table->dropConstrainedForeignId('organization_id');

            $table->foreignId('evaluatee_id')->after('team_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('evaluator_id')->after('evaluatee_id')->constrained('users')->onDelete('cascade');
            $table->dropConstrainedForeignId('user_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('evaluations', function (Blueprint $table) {
            $table->foreignId('organization_id')->after('id')->constrained('organizations')->onDelete('cascade');
            $table->dropConstrainedForeignId('team_id');

            $table->foreignId('user_id')->after('organization_id')->constrained('users')->onDelete('cascade');
            $table->dropConstrainedForeignId('evaluatee_id');
            $table->dropConstrainedForeignId('evaluator_id');
        });
    }
};
