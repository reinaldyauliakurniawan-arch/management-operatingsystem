<?php

use Spatie\Backup\Tasks\Backup\BackupJobFactory;

// ponytail: spatie/laravel-backup config — production-grade defaults.
// Daily backup to local disk by default. Override BACKUP_DISK=s3 in
// production .env to push to S3 (configure filesystems.php s3 disk first).

return [
    'backup' => [
        'name' => env('APP_NAME', 'laravel-backup'),
        'source' => [
            'files' => [
                'include' => [
                    base_path(),
                ],
                'exclude' => [
                    base_path('vendor'),
                    base_path('node_modules'),
                    base_path('storage/app/public'),
                    base_path('storage/framework'),
                    base_path('storage/logs'),
                ],
                'follow_links' => false,
                'ignore_path_failures' => false,
            ],
            // ponytail: only back up the DB schema + data — exclude cache
            // and session tables (they're transient).
            'databases' => [
                'mysql',
                'sqlite',
            ],
        ],
        'destination' => [
            'filename_prefix' => '',
            'disk' => env('BACKUP_DISK', 'local'),
            'temporary_directory' => storage_path('app/backup-temp'),
            'password' => env('BACKUP_ARCHIVE_PASSWORD'),
            'encryption' => env('BACKUP_ARCHIVE_ENCRYPTION', 'default'),
        ],
        'temporary_directory' => storage_path('app/backup-temp'),
    ],
    'notifications' => [
        'notifications' => [
            \Spatie\Backup\Notifications\Notifications\BackupHasFailedNotification::class => ['mail'],
            \Spatie\Backup\Notifications\Notifications\UnhealthyBackupWasFoundNotification::class => ['mail'],
            \Spatie\Backup\Notifications\Notifications\CleanupHasFailedNotification::class => ['mail'],
            \Spatie\Backup\Notifications\Notifications\HealthyBackupWasFoundNotification::class => ['mail'],
            \Spatie\Backup\Notifications\Notifications\BackupWasSuccessfulNotification::class => ['mail'],
            \Spatie\Backup\Notifications\Notifications\CleanupWasSuccessfulNotification::class => ['mail'],
        ],
        'notifiable' => \Spatie\Backup\Notifications\Notifiable::class,
        // ponytail: route notifications to the configured admin email.
        'mail' => [
            'to' => env('BACKUP_NOTIFICATION_EMAIL', 'admin@example.com'),
        ],
    ],
    'cleanup' => [
        'strategy' => \Spatie\Backup\Tasks\Cleanup\Strategies\DefaultStrategy::class,
        'default_strategy' => [
            'keep_all_backups_for_days' => env('BACKUP_KEEP_ALL_DAYS', 7),
            'keep_daily_backups_for_days' => env('BACKUP_KEEP_DAILY_DAYS', 16),
            'keep_weekly_backups_for_weeks' => env('BACKUP_KEEP_WEEKLY_WEEKS', 8),
            'keep_monthly_backups_for_months' => env('BACKUP_KEEP_MONTHLY_MONTHS', 4),
            'delete_oldest_backups_when_using_more_megabytes_than' => env('BACKUP_DELETE_OLDEST_MB', 5000),
        ],
    ],
    'monitor' => [
        'health-checks' => [
            \Spatie\Backup\Tasks\Monitor\HealthChecks\MaximumAgeInDays::class => 1,
            \Spatie\Backup\Tasks\Monitor\HealthChecks\MaximumStorageInMegabytes::class => 5000,
        ],
    ],
];
