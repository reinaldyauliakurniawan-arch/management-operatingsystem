<?php

namespace App\Modules\Leaderboard\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class LeaderboardParameter extends Model
{
    use SoftDeletes;

    protected $fillable = [
        "team_id",
        "scheme",
        "name",
        "input_type",
        "config",
        "sort_order",
        "created_by",
        "updated_by",
    ];

    protected $casts = [
        "config" => "array",
        "sort_order" => "integer",
    ];

    public function entries()
    {
        return $this->hasMany(LeaderboardEntry::class, "parameter_id");
    }

    // Hitung poin dari raw_value berdasarkan input_type + config
    public function calculatePoints(float $rawValue): float
    {
        $config = $this->config ?? [];

        return match ($this->input_type) {
            "per_unit" => $this->calcPerUnit($rawValue, $config),
            "tiered" => $this->calcTiered($rawValue, $config),
            "normalized" => $this->calcNormalized($rawValue, $config),
            default => 0,
        };
    }

    private function calcPerUnit(float $value, array $config): float
    {
        $weight = (float) ($config["weight"] ?? 0);
        return round($value * $weight, 2);
    }

    private function calcTiered(float $value, array $config): float
    {
        $tiers = $config["tiers"] ?? [];
        // Tiers diurutkan dari min terbesar ke terkecil
        usort($tiers, fn($a, $b) => $b["min"] <=> $a["min"]);
        foreach ($tiers as $tier) {
            if ($value >= (float) $tier["min"]) {
                return (float) $tier["points"];
            }
        }
        return 0;
    }

    private function calcNormalized(float $value, array $config): float
    {
        // value = persentase 0-100
        $max = (float) ($config["max_points"] ?? 0);
        return round(($value / 100) * $max, 2);
    }
}
