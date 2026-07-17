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
}
