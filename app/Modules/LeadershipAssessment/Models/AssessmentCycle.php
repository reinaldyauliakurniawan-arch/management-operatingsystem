<?php
namespace App\Modules\LeadershipAssessment\Models;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Traits\HasTeam;

class AssessmentCycle extends Model {
    use SoftDeletes, HasTeam;

    protected $fillable = ['name', 'status', 'team_id', 'created_by'];
}
