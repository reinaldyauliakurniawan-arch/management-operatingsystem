<?php

namespace App\Modules\PeopleAnalyzer\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Evaluation extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'evaluator_id',
        'evaluatee_id',
        'is_candidate',
        'candidate_name',
        'seat_id',
        'gwc_get',
        'gwc_want',
        'gwc_capacity',
        'core_values_scores',
        'period',
        'seat_fit',
        'notes',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'gwc_get'            => 'boolean',
        'gwc_want'           => 'boolean',
        'gwc_capacity'       => 'boolean',
        'is_candidate'       => 'boolean',
        'core_values_scores' => 'array',
    ];

    public function evaluator()
    {
        return $this->belongsTo(User::class, 'evaluator_id');
    }

    public function evaluatee()
    {
        return $this->belongsTo(User::class, 'evaluatee_id');
    }

    public function seat()
    {
        return $this->belongsTo(\App\Modules\AccountabilityChart\Models\Seat::class, 'seat_id');
    }

    /**
     * Compute seat_fit based on GWC + core values vs standard.
     * standard = instance of PeopleAnalyzerStandard
     */
    public function computeSeatFit(?PeopleAnalyzerStandard $standard = null): string
    {
        $standard = $standard ?? PeopleAnalyzerStandard::where('team_id', $this->team_id)->first();

        $gwcPass = $this->gwcPasses($standard);

        $scores  = $this->core_values_scores ?? [];
        $plus    = count(array_filter($scores, fn ($s) => $s['symbol'] === '+'));
        $plusMin = count(array_filter($scores, fn ($s) => $s['symbol'] === '+/-'));
        $minus   = count(array_filter($scores, fn ($s) => $s['symbol'] === '-'));

        $minPlus      = $standard?->min_plus ?? 3;
        $maxPlusMinus = $standard?->max_plus_minus ?? 2;
        $maxMinus     = $standard?->max_minus ?? 0;

        $cvPass = $plus >= $minPlus && $plusMin <= $maxPlusMinus && $minus <= $maxMinus;

        return match (true) {
            $gwcPass && $cvPass   => 'right_person_right_seat',
            $gwcPass && ! $cvPass => 'wrong_person_right_seat',
            ! $gwcPass && $cvPass => 'right_person_wrong_seat',
            default               => 'wrong_person_wrong_seat',
        };
    }

    private function gwcPasses(?PeopleAnalyzerStandard $standard): bool
    {
        $requireGet      = $standard?->gwc_get ?? true;
        $requireWant     = $standard?->gwc_want ?? true;
        $requireCapacity = ($standard?->gwc_capacity ?? 'Y') === 'Y';

        if ($requireGet && ! $this->gwc_get) {
            return false;
        }

        if ($requireWant && ! $this->gwc_want) {
            return false;
        }

        if ($requireCapacity && ! $this->gwc_capacity) {
            return false;
        }

        return true;
    }
}
