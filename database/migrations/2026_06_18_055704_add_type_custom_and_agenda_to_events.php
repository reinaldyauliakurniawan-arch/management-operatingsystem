<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('events', function (Blueprint $table) {
            // Ganti kolom type dari string biasa ke nullable untuk custom
            // Tambah custom_type untuk tipe custom
            $table->string('custom_type')->nullable()->after('type');
            // Tambah agenda sebagai JSON array of steps
            $table->json('agenda')->nullable()->after('description');
            // Tandai event auto-generated
            $table->boolean('is_generated')->default(false)->after('agenda');
        });
    }

    public function down(): void
    {
        Schema::table('events', function (Blueprint $table) {
            $table->dropColumn(['custom_type', 'agenda', 'is_generated']);
        });
    }
};
