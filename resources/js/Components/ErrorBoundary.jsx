import React, { Component } from 'react';
import { Box, Container, Paper, Typography, Button, Alert, Stack } from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutlined';
import RefreshIcon from '@mui/icons-material/Refresh';
import PropTypes from 'prop-types';

const isDev = process.env.NODE_ENV === 'development';

/**
 * Catches uncaught render errors in the React tree below it and shows a fallback
 * instead of white-screening the whole app (Inertia renders every page inside the
 * same root, so one page's throw would otherwise take the entire UI down).
 *
 * Variants:
 *  - `page`   full-viewport fallback — the app-root last-resort boundary (app.jsx).
 *  - `inline` fills the content region only — the layout page slot, so the nav/drawer
 *             stay usable and the user can navigate away.
 *  - `widget` compact card — an individual heavy/async widget (charts, canvas editors).
 *
 * Pass `resetKeys` (e.g. the current URL at the layout level) so the boundary clears
 * its error state when they change; without it a page error would stick across an
 * Inertia navigation.
 */
export default class ErrorBoundary extends Component {
    static propTypes = {
        children: PropTypes.node.isRequired,
        variant: PropTypes.oneOf(['page', 'inline', 'widget']),
        resetKeys: PropTypes.array,
        title: PropTypes.string,
        description: PropTypes.string,
    };

    static defaultProps = {
        variant: 'page',
        resetKeys: [],
    };

    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You could forward this to an error reporting service here.
        console.error('Uncaught error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    componentDidUpdate(prevProps) {
        // Recover automatically when a reset key changes (e.g. Inertia navigation
        // swaps the page under an `inline` boundary): clear the error and re-render
        // the new children instead of leaving the fallback stuck.
        if (!this.state.hasError) {
            return;
        }
        const prev = prevProps.resetKeys;
        const next = this.props.resetKeys;
        if (prev.length !== next.length || prev.some((key, i) => key !== next[i])) {
            this.reset();
        }
    }

    reset = () => {
        this.setState({ hasError: false, error: null, errorInfo: null });
    };

    renderDevDetails() {
        if (!isDev) {
            return null;
        }
        return (
            <Box
                sx={{
                    mt: 3,
                    width: '100%',
                    maxHeight: '200px',
                    overflow: 'auto',
                    bgcolor: 'grey.100',
                    borderRadius: 1,
                    p: 2,
                }}
            >
                <Alert severity="error" sx={{ mb: 1 }}>
                    {this.state.error && this.state.error.toString()}
                </Alert>
                <Stack
                    component="pre"
                    sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary', mt: 1 }}
                >
                    {this.state.errorInfo && this.state.errorInfo.componentStack}
                </Stack>
            </Box>
        );
    }

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const { variant, title, description } = this.props;

        if (variant === 'widget') {
            return (
                <Paper
                    variant="outlined"
                    sx={{
                        p: 3,
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    <ErrorOutlineIcon color="error" sx={{ fontSize: 40 }} />
                    <Typography variant="subtitle1" fontWeight="bold">
                        {title || "This section couldn't be displayed"}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                        {description || 'An unexpected error occurred while rendering this content.'}
                    </Typography>
                    <Button
                        size="small"
                        variant="outlined"
                        startIcon={<RefreshIcon />}
                        onClick={this.reset}
                        sx={{ mt: 1 }}
                    >
                        Try again
                    </Button>
                    {this.renderDevDetails()}
                </Paper>
            );
        }

        const isPage = variant === 'page';
        return (
            <Box
                sx={{
                    minHeight: isPage ? '100vh' : '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    bgcolor: isPage ? 'grey.50' : 'transparent',
                }}
            >
                <Container maxWidth="sm">
                    <Paper
                        elevation={isPage ? 3 : 0}
                        sx={{
                            p: 4,
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                        }}
                    >
                        <ErrorOutlineIcon color="error" sx={{ fontSize: 64, mb: 2 }} />

                        <Typography
                            variant="h5"
                            component="h1"
                            gutterBottom
                            align="center"
                            fontWeight="bold"
                        >
                            {title || 'Something went wrong'}
                        </Typography>

                        <Typography
                            variant="body1"
                            color="text.secondary"
                            align="center"
                            sx={{ mb: 4 }}
                        >
                            {description ||
                                'The application encountered an unexpected error. Please try refreshing the page.'}
                        </Typography>

                        <Stack direction="row" spacing={2}>
                            {!isPage && (
                                <Button
                                    variant="outlined"
                                    color="primary"
                                    startIcon={<RefreshIcon />}
                                    onClick={this.reset}
                                >
                                    Try again
                                </Button>
                            )}
                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Page
                            </Button>
                        </Stack>

                        {this.renderDevDetails()}
                    </Paper>
                </Container>
            </Box>
        );
    }
}
