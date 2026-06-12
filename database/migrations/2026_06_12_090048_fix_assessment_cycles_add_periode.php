<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('assessment_cycles', function (Blueprint $table) {
            if (!Schema::hasColumn('assessment_cycles', 'periode_start')) {
                $table->date('periode_start')->nullable()->after('name');
            }
            if (!Schema::hasColumn('assessment_cycles', 'periode_end')) {
                $table->date('periode_end')->nullable()->after('periode_start');
            }
            if (!Schema::hasColumn('assessment_cycles', 'created_by')) {
                $table->foreignId('created_by')->nullable()->constrained('users');
            }
            if (!Schema::hasColumn('assessment_cycles', 'deleted_at')) {
                $table->softDeletes();
            }
        });
    }

    public function down(): void
    {
        Schema::table('assessment_cycles', function (Blueprint $table) {
            $table->dropColumn(['periode_start', 'periode_end', 'created_by', 'deleted_at']);
        });
    }
};
