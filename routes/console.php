<?php

use Illuminate\Foundation\Inspiring;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Schedule;

Artisan::command('inspire', function () {
    $this->comment(Inspiring::quote());
})->purpose('Display an inspiring quote');

// ponytail: production schedules for backup + audit log cleanup.
// Run nightly at 02:00 local time. Override schedule:run via cron in prod:
//   * * * * * cd /path && php artisan schedule:run >> /dev/null 2>&1

// 9.10: daily full backup (DB + code, excluding storage/logs).
Schedule::command('backup:clean')->daily()->at('01:00')->onOneServer();
Schedule::command('backup:run')->daily()->at('02:00')->onOneServer();
Schedule::command('backup:monitor')->daily()->at('03:00')->onOneServer();

// 9.4: prune activity log entries older than 90 days (configurable).
Schedule::command('activitylog:clean')->daily()->at('04:00')->onOneServer();
