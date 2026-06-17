<?php

namespace App\Modules\AccountabilityChart\Models;

use App\Traits\HasTeam;
use Illuminate\Database\Eloquent\Model;
use App\Models\User;

class Seat extends Model
{
    use HasTeam;

    protected $fillable = [
        'team_id',
        'title',
        'parent_id',
        'responsibilities',
        'user_id',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'responsibilities' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function parent()
    {
        return $this->belongsTo(Seat::class, 'parent_id');
    }

    public function children()
    {
        return $this->hasMany(Seat::class, 'parent_id');
    }

    public function resolveRouteBinding($value, $field = null)
    {
        return $this->withoutGlobalScopes()->where($field ?? $this->getRouteKeyName(), $value)->firstOrFail();
    }
}
