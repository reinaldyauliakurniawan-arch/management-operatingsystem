<?php

namespace App\Modules\Rocks\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Rock extends Model
{
    use SoftDeletes, HasOrganization;

    protected $fillable = [
        'organization_id',
        'title',
        'description',
        'owner_id',
        'quarter',
        'year',
        'status',
        'created_by',
        'updated_by',
    ];

    public function owner()
    {
        return $this->belongsTo(User::class, 'owner_id');
    }
}
