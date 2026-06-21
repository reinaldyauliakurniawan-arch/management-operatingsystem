<?php

/**
 * ponytail: defensive polyfill for activity() function.
 * Only activates if spatie/laravel-activitylog is not loaded.
 */
if (!function_exists('activity')) {
    function activity($logName = 'default')
    {
        return new class {
            public function causedBy($model) { return $this; }
            public function performedOn($model) { return $this; }
            public function withProperties($props) { return $this; }
            public function withProperty($key, $value) { return $this; }
            public function log($description) { return $this; }
            public function event($event) { return $this; }
        };
    }
}
