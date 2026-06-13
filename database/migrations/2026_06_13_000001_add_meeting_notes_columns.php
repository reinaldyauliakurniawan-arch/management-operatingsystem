<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            if (!Schema::hasColumn('meetings', 'segue_notes')) {
                $table->text('segue_notes')->nullable()->after('rating');
            }
            if (!Schema::hasColumn('meetings', 'conclude_notes')) {
                $table->text('conclude_notes')->nullable()->after('segue_notes');
            }
        });
    }

    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn(['segue_notes', 'conclude_notes']);
        });
    }
};
