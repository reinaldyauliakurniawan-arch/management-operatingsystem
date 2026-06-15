<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vto_plans', function (Blueprint $table) {
            $table->string('three_year_revenue', 100)->nullable()->change();
            $table->string('three_year_profit', 100)->nullable()->change();
            $table->string('three_year_measurables', 500)->nullable()->change();
            $table->string('one_year_revenue', 100)->nullable()->change();
            $table->string('one_year_profit', 100)->nullable()->change();
            $table->string('one_year_measurables', 500)->nullable()->change();
        });
    }

    public function down(): void
    {
        Schema::table('vto_plans', function (Blueprint $table) {
            $table->decimal('three_year_revenue', 15, 2)->nullable()->change();
            $table->decimal('three_year_profit', 15, 2)->nullable()->change();
            $table->integer('three_year_measurables')->nullable()->change();
            $table->decimal('one_year_revenue', 15, 2)->nullable()->change();
            $table->decimal('one_year_profit', 15, 2)->nullable()->change();
            $table->integer('one_year_measurables')->nullable()->change();
        });
    }
};
