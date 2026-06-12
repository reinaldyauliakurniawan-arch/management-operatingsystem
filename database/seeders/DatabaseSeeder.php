<?php

namespace Database\Seeders;

use App\Models\User;
use App\Models\Organization;
use App\Modules\Teams\Models\Team;
use App\Modules\Teams\Models\TeamMember;
use App\Modules\Rocks\Models\Rock;
use App\Modules\Scorecard\Models\Metric;
use App\Modules\Scorecard\Models\WeeklyScore;
use App\Modules\VTO\Models\VTOPlan;
use App\Modules\ToDo\Models\ToDo;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Carbon\Carbon;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // 1. Create Organization
        $org = Organization::create([
            'name' => 'Acme Corp',
            'slug' => 'acme-corp',
        ]);

        // 2. Create Users
        $alice = User::create([
            'name' => 'Alice',
            'email' => 'alice@acme.com',
            'password' => Hash::make('password'),
        ]);

        $bob = User::create([
            'name' => 'Bob',
            'email' => 'bob@acme.com',
            'password' => Hash::make('password'),
        ]);

        $carol = User::create([
            'name' => 'Carol',
            'email' => 'carol@acme.com',
            'password' => Hash::make('password'),
        ]);

        // 3. Create Teams
        $leadershipTeam = Team::create([
            'organization_id' => $org->id,
            'name' => 'Leadership Team',
            'type' => 'leadership',
            'created_by' => $alice->id,
        ]);

        $salesTeam = Team::create([
            'organization_id' => $org->id,
            'name' => 'Sales Team',
            'type' => 'departmental',
            'parent_team_id' => $leadershipTeam->id,
            'created_by' => $alice->id,
        ]);

        // 4. Team Memberships
        TeamMember::create([
            'team_id' => $leadershipTeam->id,
            'user_id' => $alice->id,
            'role' => 'leader',
            'is_integrator' => true,
        ]);

        TeamMember::create([
            'team_id' => $leadershipTeam->id,
            'user_id' => $bob->id,
            'role' => 'member',
        ]);

        TeamMember::create([
            'team_id' => $salesTeam->id,
            'user_id' => $bob->id,
            'role' => 'leader',
        ]);

        TeamMember::create([
            'team_id' => $salesTeam->id,
            'user_id' => $carol->id,
            'role' => 'member',
        ]);

        // 5. Seed Data for Leadership Team
        // Set context for seeding
        session(['active_team_id' => $leadershipTeam->id]);

        Rock::create([
            'team_id' => $leadershipTeam->id,
            'title' => 'Increase Revenue by 20%',
            'owner_id' => $alice->id,
            'quarter' => 'Q2',
            'year' => 2024,
            'status' => 'on_track',
        ]);

        Rock::create([
            'team_id' => $leadershipTeam->id,
            'title' => 'Launch New Product Line',
            'owner_id' => $bob->id,
            'quarter' => 'Q2',
            'year' => 2024,
            'status' => 'on_track',
        ]);

        $metric = Metric::create([
            'team_id' => $leadershipTeam->id,
            'title' => 'Weekly Sales',
            'owner_id' => $bob->id,
            'goal_value' => 50000,
            'comparison_operator' => '>=',
        ]);

        for ($i = 0; $i < 4; $i++) {
            WeeklyScore::create([
                'metric_id' => $metric->id,
                'week_start_date' => Carbon::now()->startOfWeek()->subWeeks($i),
                'actual_value' => rand(45000, 55000),
            ]);
        }

        VTOPlan::create([
            'team_id' => $leadershipTeam->id,
            'core_values' => ['Integrity', 'Innovation', 'Impact'],
            'ten_year_target' => 'Market Leader in SaaS',
        ]);

        ToDo::create([
            'team_id' => $leadershipTeam->id,
            'title' => 'Review quarterly financials',
            'owner_id' => $alice->id,
            'due_date' => Carbon::now()->addDays(3),
        ]);

        ToDo::create([
            'team_id' => $leadershipTeam->id,
            'title' => 'Update marketing strategy',
            'owner_id' => $bob->id,
            'due_date' => Carbon::now()->addDays(5),
        ]);

        $this->call(LeadershipDataSeeder::class);
    }
}
