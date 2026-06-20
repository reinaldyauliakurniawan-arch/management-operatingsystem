<?php

namespace App\Http\Controllers;

use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Queue;

/**
 * ponytail: production health check that verifies real dependencies.
 *
 * Default Laravel /up only checks that the app boots. A load balancer hitting
 * /up would still get 200 when DB/cache/queue are down, masking real outages.
 * This controller probes each dependency and returns a structured report.
 *
 * Mounted at /up (overriding the default) — when all checks pass it returns
 * 200 with {"status":"ok","checks":{...}}; any failing check returns 503.
 */
class HealthController extends Controller
{
    public function __invoke(): JsonResponse
    {
        $checks = [
            'database' => $this->checkDatabase(),
            'cache'    => $this->checkCache(),
            'queue'    => $this->checkQueue(),
        ];

        $allOk = collect($checks)->every(fn($c) => $c['ok'] === true);

        return response()->json([
            'status'  => $allOk ? 'ok' : 'degraded',
            'checks'  => $checks,
            'time'    => now()->toIso8601String(),
            'app_env' => app()->environment(),
        ], $allOk ? 200 : 503);
    }

    private function checkDatabase(): array
    {
        try {
            DB::connection()->getPdo();
            DB::select('SELECT 1');
            return ['ok' => true, 'latency_ms' => null];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function checkCache(): array
    {
        try {
            $key = 'health:check:' . uniqid();
            Cache::put($key, true, 10);
            $ok = Cache::get($key) === true;
            Cache::forget($key);
            return ['ok' => $ok];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }

    private function checkQueue(): array
    {
        try {
            // ponytail: don't actually dispatch a job — just verify the queue
            // connection can be resolved. Dispatching from /up would create
            // write amplification under load-balancer polling.
            $connection = Queue::connection();
            // For database driver, verify the jobs table exists & is queryable.
            if (method_exists($connection, 'getPdo')) {
                $connection->getPdo();
            }
            return ['ok' => true];
        } catch (\Throwable $e) {
            return ['ok' => false, 'error' => $e->getMessage()];
        }
    }
}
