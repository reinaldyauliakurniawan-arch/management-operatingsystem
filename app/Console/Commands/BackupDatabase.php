<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class BackupDatabase extends Command
{
    protected $signature = 'backup:run';
    protected $description = 'Backup the database to storage/app/backups/';

    public function handle(): int
    {
        $driver = config('database.default');
        $backupDir = storage_path('app/backups');
        $timestamp = now()->format('Y-m-d-His');
        $filename = "backup-{$timestamp}.sql";
        $filepath = "{$backupDir}/{$filename}";

        if (!File::exists($backupDir)) {
            File::makeDirectory($backupDir, 0755, true);
        }

        $this->info("Starting backup...");

        if ($driver === 'sqlite') {
            $dbPath = config('database.connections.sqlite.database', database_path('database.sqlite'));
            exec("sqlite3 \"{$dbPath}\" .dump > \"{$filepath}\"", $output, $exitCode);
        } else {
            $conn = config("database.connections.{$driver}");
            $cmd = sprintf(
                'mysqldump --host=%s --port=%s --user=%s --password=%s %s > "%s" 2>&1',
                escapeshellarg($conn['host'] ?? '127.0.0.1'),
                escapeshellarg($conn['port'] ?? '3306'),
                escapeshellarg($conn['username'] ?? 'root'),
                escapeshellarg($conn['password'] ?? ''),
                escapeshellarg($conn['database'] ?? ''),
                $filepath
            );
            exec($cmd, $output, $exitCode);
        }

        if ($exitCode !== 0) {
            $this->error("Backup failed: " . implode("\n", $output));
            return 1;
        }

        if (file_exists($filepath)) {
            exec("gzip \"{$filepath}\"");
            $this->info("Backup created: {$filepath}.gz");
        }

        $this->cleanOldBackups($backupDir, 14);
        $this->info("Backup complete.");
        return 0;
    }

    private function cleanOldBackups(string $dir, int $keepDays): void
    {
        $files = glob("{$dir}/backup-*.sql.gz");
        $cutoff = now()->subDays($keepDays)->timestamp;
        $deleted = 0;
        foreach ($files as $file) {
            if (filemtime($file) < $cutoff) {
                unlink($file);
                $deleted++;
            }
        }
        if ($deleted > 0) {
            $this->info("Cleaned {$deleted} old backup(s).");
        }
    }
}
