<?php
namespace App\Modules\LeadershipAssessment\Models;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;
class AssessmentResponse extends Model {
    protected $fillable = ['cycle_id', 'assessor_id', 'assessee_id', 'item_id', 'rubric_level'];
    public function assessor() { return $this->belongsTo(User::class, 'assessor_id'); }
    public function assessee() { return $this->belongsTo(User::class, 'assessee_id'); }
    public function item() { return $this->belongsTo(LeadershipItem::class, 'item_id'); }
}
