<?php

namespace App\Modules\Kanban\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class KanbanCard extends Model
{
    use SoftDeletes;

    protected $casts = [
        'due_date' => 'date',
    ];

    protected $fillable = [
        'column_id',
        'title',
        'description',
        'responsible',
        'accountable',
        'consulted',
        'informed',
        'definition_of_done',
        'outcome',
        'due_date',
        'sort_order',
    ];

    public function column()
    {
        return $this->belongsTo(KanbanColumn::class, 'column_id');
    }

    public function steps()
    {
        return $this->hasMany(KanbanCardStep::class, 'card_id')->orderBy('sort_order');
    }
}
