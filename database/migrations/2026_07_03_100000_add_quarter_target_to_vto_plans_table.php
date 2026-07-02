<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('vto_plans', function (Blueprint $table) {
            $table->date('quarter_date')->nullable()->after('one_year_goals');
            $table->string('quarter_revenue', 100)->nullable()->after('quarter_date');
            $table->string('quarter_profit', 100)->nullable()->after('quarter_revenue');
            $table->string('quarter_measurables', 500)->nullable()->after('quarter_profit');
        });
    }

    public function down(): void
    {
        Schema::table('vto_plans', function (Blueprint $table) {
            $table->dropColumn(['quarter_date', 'quarter_revenue', 'quarter_profit', 'quarter_measurables']);
        });
    }
};
