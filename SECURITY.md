# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in this project, please report it responsibly.

**DO NOT open a public GitHub issue.**

### How to Report

1. Email: security@yourdomain.com (replace with actual contact)
2. Subject: `[SECURITY] Management Operating System - <brief description>`
3. Include:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)

### Response Timeline

- **Acknowledgment**: within 48 hours
- **Initial Assessment**: within 5 business days
- **Fix Release**: within 30 days (critical: within 7 days)

### Scope

- Production deployment of Management Operating System
- Authentication and authorization bypass
- Cross-tenant data leakage
- SQL injection
- XSS bypass of sanitizer
- IDOR vulnerabilities

### Out of Scope

- Vulnerabilities in third-party dependencies (report to upstream)
- Self-XSS (user tricks themselves)
- Issues requiring physical access to server
- DOS requiring >1000 requests/second

## Security Measures Already in Place

- Per-organization admin pivot (no global admin flag)
- Security headers: CSP, HSTS, X-Frame-Options, X-Content-Type-Options
- CORS allowlist (no wildcard)
- Rate limiting on auth endpoints
- Session encryption
- Audit logging on sensitive operations
- Input validation on all endpoints
- IDOR protection via tenant scoping
