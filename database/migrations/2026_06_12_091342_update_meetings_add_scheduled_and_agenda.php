<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            if (!Schema::hasColumn('meetings', 'title')) {
                $table->string('title')->nullable()->after('type');
            }
            if (!Schema::hasColumn('meetings', 'scheduled_at')) {
                $table->timestamp('scheduled_at')->nullable()->after('title');
            }
        });
    }

    public function down(): void
    {
        Schema::table('meetings', function (Blueprint $table) {
            $table->dropColumn(['title', 'scheduled_at']);
        });
    }
};
