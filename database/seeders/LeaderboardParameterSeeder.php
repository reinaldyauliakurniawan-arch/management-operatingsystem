<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Modules\Leaderboard\Models\LeaderboardParameter;
use App\Modules\Teams\Models\Team;

class LeaderboardParameterSeeder extends Seeder
{
    public function run(): void
    {
        // Seed untuk semua team yang sudah ada
        // Ganti dengan team_id spesifik kalau perlu
        $teams = Team::all();

        foreach ($teams as $team) {
            $scheme = str_contains(strtolower($team->name), "tutor")
                ? "tutor"
                : "management";
            $this->seedScheme($team->id, $scheme);
        }
    }

    private function seedScheme(int $teamId, string $scheme): void
    {
        $params =
            $scheme === "tutor"
                ? $this->tutorParams()
                : $this->managementParams();

        foreach ($params as $i => $p) {
            LeaderboardParameter::firstOrCreate(
                [
                    "team_id" => $teamId,
                    "scheme" => $scheme,
                    "name" => $p["name"],
                ],
                [
                    ...$p,
                    "team_id" => $teamId,
                    "scheme" => $scheme,
                    "sort_order" => $i,
                ],
            );
        }
    }

    private function tutorParams(): array
    {
        return [
            [
                "name" => "Training",
                "input_type" => "per_unit",
                "config" => ["weight" => 100],
            ],
            [
                "name" => "Townhall",
                "input_type" => "per_unit",
                "config" => ["weight" => 200],
            ],
            [
                "name" => "Try Out",
                "input_type" => "tiered",
                "config" => [
                    "tiers" => [
                        ["min" => 550, "points" => 150],
                        ["min" => 500, "points" => 100],
                        ["min" => 400, "points" => 70],
                        ["min" => 0, "points" => 0],
                    ],
                ],
            ],
            [
                "name" => "Retention Murid",
                "input_type" => "per_unit",
                "config" => ["weight" => 200],
            ],
            [
                "name" => "Tag Sosmed JS",
                "input_type" => "per_unit",
                "config" => ["weight" => 5],
            ],
            [
                "name" => "Komen Sosmed JS",
                "input_type" => "per_unit",
                "config" => ["weight" => 2],
            ],
            [
                "name" => "Indikator Tambahan 1",
                "input_type" => "per_unit",
                "config" => ["weight" => 0],
            ],
            [
                "name" => "Indikator Tambahan 2",
                "input_type" => "per_unit",
                "config" => ["weight" => 0],
            ],
            [
                "name" => "Indikator Tambahan 3",
                "input_type" => "per_unit",
                "config" => ["weight" => 0],
            ],
            [
                "name" => "Keterlambatan",
                "input_type" => "per_unit",
                "config" => ["weight" => -10],
            ],
            [
                "name" => "Reschedule / Replace",
                "input_type" => "per_unit",
                "config" => ["weight" => -50],
            ],
        ];
    }

    private function managementParams(): array
    {
        return [
            [
                "name" => "Training Divisi",
                "input_type" => "normalized",
                "config" => ["max_points" => 100],
            ],
            [
                "name" => "Training All Division",
                "input_type" => "per_unit",
                "config" => ["weight" => 100],
            ],
            [
                "name" => "Townhall",
                "input_type" => "per_unit",
                "config" => ["weight" => 200],
            ],
            [
                "name" => "Tryout Bahasa",
                "input_type" => "tiered",
                "config" => [
                    "tiers" => [
                        ["min" => 550, "points" => 150],
                        ["min" => 450, "points" => 100],
                        ["min" => 350, "points" => 70],
                        ["min" => 0, "points" => 0],
                    ],
                ],
            ],
            [
                "name" => "Post-test Training Divisi",
                "input_type" => "per_unit",
                "config" => ["weight" => 150],
            ],
            [
                "name" => "Post-test Training All Division",
                "input_type" => "per_unit",
                "config" => ["weight" => 150],
            ],
            [
                "name" => "Scorecard",
                "input_type" => "auto",
                "config" => [
                    "source" => "scorecard",
                    "tiers" => [
                        ["min" => 100, "points" => 500],
                        ["min" => 80, "points" => 400],
                        ["min" => 60, "points" => 300],
                        ["min" => 0, "points" => 150],
                    ],
                ],
            ],
            [
                "name" => "Rocks / OKR",
                "input_type" => "auto",
                "config" => [
                    "source" => "rocks",
                    "tiers" => [
                        ["min" => 100, "points" => 500],
                        ["min" => 80, "points" => 400],
                        ["min" => 60, "points" => 300],
                        ["min" => 0, "points" => 150],
                    ],
                ],
            ],
            [
                "name" => "Leadership Pipeline",
                "input_type" => "auto",
                "config" => ["source" => "leadership", "max_points" => 200],
            ],
            [
                "name" => "Kontribusi Ide",
                "input_type" => "per_unit",
                "config" => ["weight" => 50],
            ],
        ];
    }
}
