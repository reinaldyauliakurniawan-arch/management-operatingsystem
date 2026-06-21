<?php

namespace App\Providers;

use Illuminate\Support\ServiceProvider;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Schema;
use Monolog\Handler\StreamHandler;
use Monolog\Logger;

/**
 * ponytail: integrates error reporting into the logging stack.
 *
 * Strategy:
 * - For all error-level logs (warning, error, critical, alert, emergency),
 *   send an email to the configured admin address. This gives ops visibility
 *   into production errors without needing Sentry.
 * - If a Sentry DSN is set in env, send an email that includes a note about
 *   Sentry being available (the Sentry SDK would auto-capture if installed).
 *
 * Implementation: a Monolog handler is added to the default log channel
 * that triggers an email when the level is >= warning. This keeps the
 * implementation zero-dependency — works with vanilla Laravel.
 */
class ErrorReportingServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        // ponytail: only enable in production + staging — local dev would
        // spam the inbox on every error during development.
        if (!app()->environment(['production', 'staging'])) {
            return;
        }

        $adminEmail = env('ERROR_REPORTING_EMAIL');
        if (!$adminEmail) {
            return;
        }

        // pigtail: register a callable that runs on every log record.
        // We use Log::getLogger() to attach a handler at boot time.
        try {
            $logger = Log::getLogger();
            $logger->pushHandler(new class($adminEmail) extends StreamHandler {
                private string $adminEmail;

                public function __construct(string $adminEmail)
                {
                    // ponytail: stream to /dev/null — we don't actually want
                    // StreamHandler to write anywhere; we just override handle()
                    // to send email instead. Level warning = 300 in Monolog.
                    parent::__construct('/dev/null', \Monolog\Logger::WARNING);
                    $this->adminEmail = $adminEmail;
                }

                public function handle(array $record): bool
                {
                    // ponytail: send email in-process. Laravel's Mail::raw
                    // uses the configured mail driver; for sync (default) the
                    // email is sent immediately. For queue driver it's queued.
                    $level = $record['level_name'] ?? 'UNKNOWN';
                    $message = $record['message'] ?? '(no message)';
                    $context = $record['context'] ?? [];
                    $contextStr = empty($context) ? '' : "\n\nContext: " . json_encode($context, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES);

                    try {
                        Mail::raw(
                            "[{$level}] {$message}{$contextStr}",
                            function ($mail) use ($level, $message) {
                                $mail->to($this->adminEmail)
                                    ->subject("[App Error] {$level}: " . substr($message, 0, 80));
                            }
                        );
                    } catch (\Throwable $e) {
                        // ponytail: don't break the log call if email fails —
                        // log the email error itself to stderr.
                        fwrite(STDERR, "Failed to send error email: {$e->getMessage()}\n");
                    }

                    return false; // don't bubble — we've handled it
                }
            });
        } catch (\Throwable $e) {
            // ponytail: if logger setup fails (e.g. during testing with array
            // driver), don't break the app.
            fwrite(STDERR, "ErrorReportingServiceProvider boot failed: {$e->getMessage()}\n");
        }
    }
}
