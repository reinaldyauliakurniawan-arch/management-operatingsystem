<?php

namespace App\Modules\PeopleAnalyzer\Models;

use App\Traits\HasOrganization;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use App\Models\User;

class Evaluation extends Model
{
    use SoftDeletes, HasOrganization;

    protected $fillable = [
        'organization_id',
        'user_id',
        'core_value_ratings',
        'gets_it',
        'wants_it',
        'capacity',
        'created_by',
        'updated_by',
    ];

    protected $casts = [
        'core_value_ratings' => 'array',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
