<?php

namespace App\Modules\ToDo\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class ToDo extends Model
{
    use SoftDeletes, HasTeam;

    protected $table = 'to_dos';

    protected $fillable = [
        'team_id',
        'meeting_id',
        'issue_id',
        'title',
        'owner_id',
        'due_date',
        'is_completed',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'due_date' => 'date',
        'is_completed' => 'boolean',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }

    public function issue()
    {
        return $this->belongsTo(\App\Modules\IDS\Models\Issue::class, 'issue_id');
    }
}
