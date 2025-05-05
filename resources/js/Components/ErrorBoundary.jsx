import React, { Component } from 'react';
import {
    Box,
    Container,
    Paper,
    Typography,
    Button,
    Alert,
    Stack
} from '@mui/material';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';

export default class ErrorBoundary extends Component {
    constructor(props) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error) {
        // Update state so the next render will show the fallback UI
        return { hasError: true, error };
    }

    componentDidCatch(error, errorInfo) {
        // You can log the error to an error reporting service
        console.error("Uncaught error:", error, errorInfo);
        this.setState({ errorInfo });
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box
                    sx={{
                        minHeight: '100vh',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        bgcolor: 'grey.50'
                    }}
                >
                    <Container maxWidth="sm">
                        <Paper
                            elevation={3}
                            sx={{
                                p: 4,
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center'
                            }}
                        >
                            <ErrorOutlineIcon
                                color="error"
                                sx={{ fontSize: 64, mb: 2 }}
                            />

                            <Typography variant="h5" component="h1" gutterBottom align="center" fontWeight="bold">
                                Something went wrong
                            </Typography>

                            <Typography variant="body1" color="text.secondary" align="center" sx={{ mb: 4 }}>
                                The application encountered an unexpected error. Please try refreshing the page.
                            </Typography>

                            <Button
                                variant="contained"
                                color="primary"
                                onClick={() => window.location.reload()}
                            >
                                Refresh Page
                            </Button>

                            {process.env.NODE_ENV === 'development' && (
                                <Box
                                    sx={{
                                        mt: 3,
                                        width: '100%',
                                        maxHeight: '200px',
                                        overflow: 'auto',
                                        bgcolor: 'grey.100',
                                        borderRadius: 1,
                                        p: 2
                                    }}
                                >
                                    <Alert severity="error" sx={{ mb: 1 }}>
                                        {this.state.error && this.state.error.toString()}
                                    </Alert>

                                    <Stack
                                        component="pre"
                                        sx={{
                                            fontFamily: 'monospace',
                                            fontSize: 12,
                                            color: 'text.secondary',
                                            mt: 1
                                        }}
                                    >
                                        {this.state.errorInfo && this.state.errorInfo.componentStack}
                                    </Stack>
                                </Box>
                            )}
                        </Paper>
                    </Container>
                </Box>
            );
        }

        return this.props.children;
    }
}
