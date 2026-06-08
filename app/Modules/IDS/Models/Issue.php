<?php

namespace App\Modules\IDS\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Issue extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'title',
        'description',
        'priority',
        'status',
        'owner_id',
        'created_by',
        'updated_by',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
