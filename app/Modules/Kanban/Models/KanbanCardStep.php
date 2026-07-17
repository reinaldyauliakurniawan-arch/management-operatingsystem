<?php

namespace App\Modules\Kanban\Models;

use Illuminate\Database\Eloquent\Model;

class KanbanCardStep extends Model
{
    protected $fillable = [
        'card_id',
        'title',
        'is_done',
        'sort_order',
    ];

    protected $casts = [
        'is_done' => 'boolean',
    ];

    public function card()
    {
        return $this->belongsTo(KanbanCard::class, 'card_id');
    }
}
