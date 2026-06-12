<?php

namespace App\Modules\Rocks\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Rock extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'title',
        'description',
        'owner_id',
        'quarter',
        'year',
        'due_date',
        'status',
        'created_by',
        'updated_by',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function milestones()
    {
        return $this->hasMany(RockMilestone::class)->orderBy('sort_order');
    }
}
