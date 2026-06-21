<?php

/**
 * ponytail: no-op polyfill for spatie/activitylog's activity() function.
 *
 * spatie/laravel-activitylog was removed due to Laravel 13 incompatibility.
 * All activity() calls in controllers will silently no-op until a compatible
 * version is released. This prevents fatal "function not found" errors.
 *
 * To re-enable real audit logging:
 * 1. composer require spatie/laravel-activitylog (when L13-compatible version exists)
 * 2. Delete this file
 * 3. php artisan migrate (to create activity_log table)
 */
if (!function_exists('activity')) {
    function activity($logName = 'default')
    {
        return new class {
            private $data = [];

            public function causedBy($model) { return $this; }
            public function performedOn($model) { return $this; }
            public function withProperties($props) { return $this; }
            public function withProperty($key, $value) { return $this; }
            public function log($description) { return $this; }
            public function event($event) { return $this; }
        };
    }
}
