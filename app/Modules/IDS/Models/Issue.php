<?php

namespace App\Modules\IDS\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Issue extends Model
{
    use SoftDeletes, HasOrganization;

    protected $fillable = [
        'organization_id',
        'title',
        'description',
        'priority',
        'status',
        'owner_id',
        'created_by',
        'updated_by',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
