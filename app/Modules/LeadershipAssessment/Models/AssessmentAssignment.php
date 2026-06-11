<?php
namespace App\Modules\LeadershipAssessment\Models;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
class AssessmentAssignment extends Model {
    protected $fillable = ['cycle_id', 'user_id', 'leadership_type_id'];
    public function user() { return $this->belongsTo(User::class); }
    public function type() { return $this->belongsTo(LeadershipType::class, 'leadership_type_id'); }
}
