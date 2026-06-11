<?php
namespace App\Modules\LeadershipAssessment\Models;
use Illuminate\Database\Eloquent\Model;
class LeadershipItem extends Model {
    protected $fillable = ['leadership_type_id', 'title'];
    public function rubrics() { return $this->hasMany(LeadershipRubric::class); }
}
