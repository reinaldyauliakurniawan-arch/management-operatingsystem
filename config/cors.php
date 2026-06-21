<?php

/**
 * ponytail: CORS configuration — defaults to same-origin only.
 *
 * Override per-env via .env:
 *   - For a single-origin API: CORS_ALLOWED_ORIGINS=https://app.example.com
 *   - For multiple origins:    CORS_ALLOWED_ORIGINS=https://a.com,https://b.com
 *   - For local dev (Vite):    CORS_ALLOWED_ORIGINS=http://localhost:5173
 *
 * Never use '*' in production — set explicit origins.
 */

return [
    'paths' => ['api/*', 'sanctum/csrf-cookie', 'up'],

    'allowed_methods' => ['*'],

    // ponytail: split comma-separated env var into array; default to same-origin.
    'allowed_origins' => array_filter(array_map('trim', explode(',', env('CORS_ALLOWED_ORIGINS', '')))),

    // ponytail: explicit allowlist of origin patterns (regex). Empty by default.
    'allowed_origin_patterns' => [],

    'allowed_headers' => ['*'],

    'exposed_headers' => [],

    'max_age' => 0,

    'supports_credentials' => true,
];
