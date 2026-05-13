import '../css/app.css';
import './bootstrap';

import {createInertiaApp} from '@inertiajs/react';
import {resolvePageComponent} from 'laravel-vite-plugin/inertia-helpers';
import {createRoot} from 'react-dom/client';

// Import additional components
import ErrorBoundary from './Components/ErrorBoundary';
import {SnackbarProvider} from "notistack";

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
        // MUI v9's ModalManager still sets aria-hidden="true" on the app root
        // when a modal opens, which triggers browser warnings when a focused element
        // remains inside the root before the focus trap activates. Replace with
        // the `inert` attribute (the browser-recommended modern API) which proactively
        // prevents focus rather than describing it retroactively.
        //
        // We must also mirror the virtual aria-hidden state on get/has so MUI's
        // idempotent state checks (e.g. `getAttribute('aria-hidden') === 'true'`
        // before re-applying or removing) see a consistent value. Otherwise MUI
        // re-sets without matching removes and `inert` gets stuck on the root,
        // locking every click in the app.
        let ariaHiddenDepth = 0;
        const _setAttribute = el.setAttribute.bind(el);
        const _removeAttribute = el.removeAttribute.bind(el);
        const _getAttribute = el.getAttribute.bind(el);
        const _hasAttribute = el.hasAttribute.bind(el);
        el.setAttribute = (name, value) => {
            if (name === 'aria-hidden') {
                if (value === 'true' || value === true) {
                    if (++ariaHiddenDepth === 1) _setAttribute('inert', '');
                } else if (ariaHiddenDepth > 0) {
                    if (--ariaHiddenDepth <= 0) { ariaHiddenDepth = 0; _removeAttribute('inert'); }
                }
            } else {
                _setAttribute(name, value);
            }
        };
        el.removeAttribute = (name) => {
            if (name === 'aria-hidden') {
                if (ariaHiddenDepth > 0 && --ariaHiddenDepth <= 0) {
                    ariaHiddenDepth = 0;
                    _removeAttribute('inert');
                }
            } else {
                _removeAttribute(name);
            }
        };
        el.getAttribute = (name) => {
            if (name === 'aria-hidden') {
                return ariaHiddenDepth > 0 ? 'true' : null;
            }
            return _getAttribute(name);
        };
        el.hasAttribute = (name) => {
            if (name === 'aria-hidden') {
                return ariaHiddenDepth > 0;
            }
            return _hasAttribute(name);
        };

        const root = createRoot(el);

        // Add a loading state to the app
        document.body.classList.add('loading');

        root.render(
            <ErrorBoundary>
                <SnackbarProvider maxSnack={3}>
                <App {...props} />
                </SnackbarProvider>
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
