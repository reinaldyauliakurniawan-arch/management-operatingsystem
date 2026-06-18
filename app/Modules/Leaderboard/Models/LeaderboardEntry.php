<?php

namespace App\Modules\Leaderboard\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class LeaderboardEntry extends Model
{
    use SoftDeletes;

    protected $fillable = [
        "team_id",
        "parameter_id",
        "user_id",
        "quarter",
        "year",
        "raw_value",
        "points",
        "notes",
        "created_by",
        "updated_by",
    ];

    protected $casts = [
        "raw_value" => "float",
        "points" => "float",
        "year" => "integer",
    ];

    public function parameter()
    {
        return $this->belongsTo(LeaderboardParameter::class, "parameter_id");
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
