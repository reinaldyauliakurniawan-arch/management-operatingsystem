<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Tandai event generated yang sudah diedit manual oleh user,
            // supaya tidak ikut terhapus saat regenerasi otomatis dari Scorecard Setting.
            $table->boolean('is_modified')->default(false)->after('is_generated');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn('is_modified');
        });
    }
};
