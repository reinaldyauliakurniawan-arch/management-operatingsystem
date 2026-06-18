<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('rocks', function (Blueprint $table) {
            $table->id();
            $table->foreignId('team_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->text('description')->nullable();
            $table->foreignId('owner_id')->constrained('users');
            $table->string('quarter');
            $table->integer('year');
            $table->date('due_date')->nullable();
            $table->string('status')->default('on_track'); // on_track, off_track, done
            $table->foreignId('created_by')->nullable()->constrained('users');
            $table->foreignId('updated_by')->nullable()->constrained('users');
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create('rock_milestones', function (Blueprint $table) {
            $table->id();
            $table->foreignId('rock_id')->constrained()->onDelete('cascade');
            $table->string('title');
            $table->date('due_date')->nullable();
            $table->boolean('is_done')->default(false);
            $table->integer('sort_order')->default(0);
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('rock_milestones');
        Schema::dropIfExists('rocks');
    }
};
