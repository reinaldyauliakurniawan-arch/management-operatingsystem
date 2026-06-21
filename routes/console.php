<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ponytail: backup + activitylog schedules temporarily disabled.
// spatie packages removed due to Laravel 13 incompatibility.
// Re-enable when compatible versions are released.
