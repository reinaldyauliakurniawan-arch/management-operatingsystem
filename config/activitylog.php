<?php

// ponytail: spatie/activitylog config — minimal defaults.
// Activity logs are stored in the DB (default) for queryability; rotate
// via cleanup command scheduled in routes/console.php.

return [
    'enabled' => env('ACTIVITYLOG_ENABLED', true),

    /*
     * When running the clean-command all recorder older than this date will be deleted.
     */
    'delete_records_older_than_days' => env('ACTIVITYLOG_DELETE_DAYS', 90),

    /*
     * If no log name is passed to the activity() helper the package will use this log name.
     */
    'default_log_name' => 'default',

    /*
     * The driver determines how the activities are stored.
     */
    'driver' => \Spatie\Activitylog\ActivitylogStatus::class,

    /*
     * Database connection used by the Activitylog model.
     */
    'database_connection' => env('ACTIVITYLOG_DB_CONNECTION', env('DB_CONNECTION', 'sqlite')),
];
