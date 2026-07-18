<?php

namespace App\Modules\Kanban\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class KanbanCalendarEvent extends Model
{
    use SoftDeletes;

    protected $casts = [
        'start_date' => 'date',
        'end_date'   => 'date',
    ];

    protected $fillable = [
        'board_id',
        'title',
        'description',
        'responsible',
        'start_date',
        'end_date',
        'created_by',
        'updated_by',
    ];

    public function board()
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }
}
