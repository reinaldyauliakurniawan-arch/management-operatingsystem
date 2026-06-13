<?php

namespace App\Modules\Rocks\Models;

use Illuminate\Database\Eloquent\Model;

class RockMilestone extends Model
{
    protected $fillable = [
        'rock_id',
        'title',
        'due_date',
        'is_done',
        'sort_order',
    ];

    protected $casts = [
        'due_date' => 'date',
        'is_done'  => 'boolean',
    ];

    public function rock()
    {
        return $this->belongsTo(Rock::class);
    }
}
