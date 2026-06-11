<?php
namespace App\Modules\LeadershipAssessment\Models;
use Illuminate\Database\Eloquent\Model;
class AssessmentCycle extends Model {
    protected $fillable = ['name', 'status'];
}
