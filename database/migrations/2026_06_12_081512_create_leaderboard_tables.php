<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create("leaderboard_parameters", function (Blueprint $table) {
            $table->id();
            $table->foreignId("team_id")->constrained()->onDelete("cascade");
            $table->string("scheme")->default("management"); // 'tutor' | 'management'
            $table->string("name");
            $table->string("input_type")->default("per_unit"); // 'per_unit' | 'tiered' | 'normalized' | 'auto'
            $table->json("config")->nullable();
            // per_unit:   { weight: 100 }              — negatif = penalti
            // tiered:     { tiers: [{min, points}] }
            // normalized: { max_points: 100 }
            // auto:       { source: 'rocks|scorecard|leadership|events', tiers: [...] }
            $table->unsignedSmallInteger("sort_order")->default(0);
            $table->foreignId("created_by")->nullable()->constrained("users");
            $table->foreignId("updated_by")->nullable()->constrained("users");
            $table->softDeletes();
            $table->timestamps();
        });

        Schema::create("leaderboard_entries", function (Blueprint $table) {
            $table->id();
            $table->foreignId("team_id")->constrained()->onDelete("cascade");
            $table
                ->foreignId("parameter_id")
                ->constrained("leaderboard_parameters")
                ->onDelete("cascade");
            $table->foreignId("user_id")->constrained()->onDelete("cascade");
            $table->string("quarter"); // 'Q1' | 'Q2' | 'Q3' | 'Q4'
            $table->unsignedSmallInteger("year");
            $table->decimal("raw_value", 10, 2)->default(0); // angka mentah yang HR input
            $table->decimal("points", 10, 2)->default(0); // hasil kalkulasi — disimpan saat save
            $table->string("notes")->nullable();
            $table->foreignId("created_by")->nullable()->constrained("users");
            $table->foreignId("updated_by")->nullable()->constrained("users");
            $table->softDeletes();
            $table->timestamps();

            $table->unique(
                ["team_id", "parameter_id", "user_id", "quarter", "year"],
                "lb_entry_unique",
            );
        });
    }

    public function down(): void
    {
        Schema::dropIfExists("leaderboard_entries");
        Schema::dropIfExists("leaderboard_parameters");
    }
};
