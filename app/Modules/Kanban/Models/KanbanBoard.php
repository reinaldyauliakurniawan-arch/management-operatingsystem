<?php

namespace App\Modules\Kanban\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class KanbanBoard extends Model
{
    use SoftDeletes, HasTeam;

    protected $fillable = [
        'team_id',
        'title',
        'created_by',
        'updated_by',
    ];

    public function columns()
    {
        return $this->hasMany(KanbanColumn::class, 'board_id')->orderBy('sort_order');
    }

    public function calendarEvents()
    {
        return $this->hasMany(KanbanCalendarEvent::class, 'board_id')->orderBy('start_date');
    }

    public function boardSeats()
    {
        return $this->hasMany(KanbanBoardSeat::class, 'board_id');
    }
}
