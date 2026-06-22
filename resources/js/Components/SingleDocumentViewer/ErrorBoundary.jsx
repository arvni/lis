import React from 'react';
import { Box, Typography, Paper, Button } from '@mui/material';
import { Error as ErrorIcon } from '@mui/icons-material';

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        console.error('Viewer Error:', error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{ p: 3, textAlign: 'center' }}>
                    <Paper elevation={3} sx={{ p: 3, maxWidth: 500, mx: 'auto' }}>
                        <ErrorIcon color="error" sx={{ fontSize: 48, mb: 2 }} />
                        <Typography variant="h6" color="error" gutterBottom>
                            Something went wrong loading this component
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                            {this.state.error?.message || 'Unknown error occurred'}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() =>
                                this.setState({ hasError: false, error: null, errorInfo: null })
                            }
                        >
                            Try Again
                        </Button>
                    </Paper>
                </Box>
            );
        }

        return this.props.children;
    }
}

export default ErrorBoundary;
