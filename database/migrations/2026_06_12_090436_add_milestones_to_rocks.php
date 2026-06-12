<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rock_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rock_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->date('due_date')->nullable();
            $table->boolean('is_done')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });

        // Tambah due_date ke rocks juga jika belum ada
        if (!Schema::hasColumn('rocks', 'due_date')) {
            Schema::table('rocks', function (Blueprint $table) {
                $table->date('due_date')->nullable()->after('year');
            });
        }
    }

    public function down(): void
    {
        Schema::dropIfExists('rock_milestones');
        if (Schema::hasColumn('rocks', 'due_date')) {
            Schema::table('rocks', function (Blueprint $table) {
                $table->dropColumn('due_date');
            });
        }
    }
};
