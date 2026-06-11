<?php
namespace App\Modules\LeadershipAssessment\Models;
use Illuminate\Database\Eloquent\Model;
class LeadershipRubric extends Model {
    protected $fillable = ['leadership_item_id', 'level', 'description'];
}
