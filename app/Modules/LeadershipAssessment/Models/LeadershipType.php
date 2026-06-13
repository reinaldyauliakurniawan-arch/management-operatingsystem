<?php

namespace App\Modules\LeadershipAssessment\Models;

use Illuminate\Database\Eloquent\Model;

class LeadershipType extends Model
{
    protected $fillable = ['name'];

    public function items()
    {
        return $this->hasMany(LeadershipItem::class);
    }
}
