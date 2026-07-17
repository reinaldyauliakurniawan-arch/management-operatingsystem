<?php

namespace App\Modules\Kanban\Models;

use Illuminate\Database\Eloquent\Model;

class KanbanColumn extends Model
{
    protected $fillable = [
        'board_id',
        'title',
        'sort_order',
    ];

    public function board()
    {
        return $this->belongsTo(KanbanBoard::class, 'board_id');
    }

    public function cards()
    {
        return $this->hasMany(KanbanCard::class, 'column_id')->orderBy('sort_order');
    }
}
