import '../css/app.css';
import './bootstrap';

import {createInertiaApp} from '@inertiajs/react';
import {resolvePageComponent} from 'laravel-vite-plugin/inertia-helpers';
import {createRoot} from 'react-dom/client';

// Import additional components
import ErrorBoundary from './Components/ErrorBoundary';

// App configuration
const appName = window.document.getElementsByTagName('title')[0]?.innerText || 'Bion Genetic LIS';

// Global error handler
window.onerror = function(message, source, lineno, colno, error) {
    console.error('Global error:', error);
    // You could implement client-side error logging here
};

createInertiaApp({
    title: (title) => `${title} - ${appName}`,

    resolve: async (name) => {
        try {
            return await resolvePageComponent(
                `./Pages/${name}.jsx`,
                import.meta.glob('./Pages/**/*.jsx')
            );
        } catch (error) {
            console.error(`Failed to load page: ${name}`, error);
            // Fallback to error page
            return resolvePageComponent(
                './Pages/Error.jsx',
                import.meta.glob('./Pages/**/*.jsx')
            );
        }
    },

    setup({ el, App, props }) {
        const root = createRoot(el);

        // Add a loading state to the app
        document.body.classList.add('loading');

        root.render(
            <ErrorBoundary>
                <App {...props} />
            </ErrorBoundary>
        );

        // Remove loading state once the app is rendered
        document.body.classList.remove('loading');
    },

    // Enhanced progress bar configuration
    progress: {
        // Modern teal color for better visibility
        color: '#10B981',
        // Make the progress bar slightly thicker
        size: 3,
        // Show the spinner for better loading feedback
        showSpinner: true,
        // Delay before showing the progress bar (prevents flicker for fast loads)
        delay: 250,
        // Add a custom class for additional styling
        className: 'inertia-progress-bar'
    },
});
