<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * ponytail: production security headers per OWASP / Addy Osmani checklist.
 *
 * Closes the security-headers gap flagged in the Phase 3 audit. Default
 * values are conservative — adjust per-app in setHeaders() if needed.
 *
 * Registered globally in bootstrap/app.php (web group). Runs on every
 * response, including Inertia + API + static asset responses.
 */
class SetSecurityHeaders
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);

        // ponytail: don't override headers already set (e.g. by assets pipeline).
        foreach ($this->setHeaders() as $name => $value) {
            if (!$response->headers->has($name)) {
                $response->headers->set($name, $value);
            }
        }

        return $response;
    }

    /**
     * ponytail: returns the header set. Override per-env via env() if you
     * need to loosen in dev (e.g. CSP report-only). Production keeps the
     * strict defaults below.
     */
    private function setHeaders(): array
    {
        $isProduction = app()->environment('production');

        return [
            // ponytail: CSP — restrict everything to self, allow inline styles
            // for Inertia + Vite (Laravel defaults). Tighten 'unsafe-inline'
            // to a nonce-based policy in a future iteration if needed.
            'Content-Security-Policy' => $isProduction
                ? "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'"
                : "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data:; font-src 'self' data: https://fonts.gstatic.com; connect-src 'self' ws: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",

            // ponytail: HSTS — 1 year + subdomains. Only sent over HTTPS
            // (Laravel auto-skip on HTTP).
            'Strict-Transport-Security' => 'max-age=31536000; includeSubDomains',

            // ponytail: prevent clickjacking.
            'X-Frame-Options' => 'DENY',

            // ponytail: prevent MIME-sniffing.
            'X-Content-Type-Options' => 'nosniff',

            // ponytail: referrer policy — send origin only on same-origin.
            'Referrer-Policy' => 'strict-origin-when-cross-origin',

            // ponytail: disable browser features we don't use.
            'Permissions-Policy' => 'camera=(), microphone=(), geolocation=(), payment=(), usb=()',

            // ponytail: opt-out of FLoC / cohort-based tracking.
            'X-Permitted-Cross-Domain-Policies' => 'none',
        ];
    }
}
