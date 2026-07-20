<?php

namespace App\Modules\Kanban\Models;

use App\Models\User;
use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;

class KanbanBoardSeat extends Model
{
    use HasTeam;

    protected $fillable = [
        'board_id',
        'team_id',
        'title',
        'parent_id',
        'user_id',
        'responsibilities',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'responsibilities' => 'array',
    ];

    public function board()
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(KanbanBoardSeat::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(KanbanBoardSeat::class, 'parent_id');
    }
}
