<?php

namespace App\Modules\AccountabilityChart\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Seat extends Model
{
    use SoftDeletes, HasOrganization;

    protected $fillable = [
        'organization_id',
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
}
