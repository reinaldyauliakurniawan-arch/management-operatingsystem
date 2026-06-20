import '../css/app.css';
import './bootstrap';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { createRoot, hydrateRoot } from 'react-dom/client';
import React, { Component, ReactNode } from 'react';

const appName = import.meta.env.VITE_APP_NAME || 'Laravel';

// ponytail: minimal ErrorBoundary so a render-time throw shows a recoverable
// fallback instead of a white screen. Inertia handles 5xx server-side, this
// catches client-side only.
class ErrorBoundary extends Component<{ children: ReactNode }, { hasError: boolean }> {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    componentDidCatch(error: Error, info: unknown) {
        // eslint-disable-next-line no-console
        console.error('ErrorBoundary caught:', error, info);
    }

    render() {
        if (this.state.hasError) {
            return (
                <div className="min-h-screen flex items-center justify-center p-6 text-center">
                    <div>
                        <h1 className="text-xl font-semibold mb-2">Terjadi kesalahan</h1>
                        <p className="text-text-secondary mb-4">Halaman tidak bisa ditampilkan. Coba refresh.</p>
                        <button
                            onClick={() => window.location.reload()}
                            className="rounded-md bg-primary px-4 py-2 text-sm text-on-primary"
                        >
                            Refresh
                        </button>
                    </div>
                </div>
            );
        }
        return this.props.children;
    }
}

createInertiaApp({
    title: (title) => `${title} - ${appName}`,
    resolve: (name) =>
        resolvePageComponent(
            `./Pages/${name}.tsx`,
            import.meta.glob('./Pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const tree = (
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>
        );
        if (import.meta.env.SSR) {
            hydrateRoot(el, tree);
            return;
        }
        createRoot(el).render(tree);
    },
    progress: {
        color: '#4B5563',
    },
});
