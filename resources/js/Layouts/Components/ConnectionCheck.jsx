import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import {
    Box, Typography, Button, CircularProgress, Paper, Fade
} from '@mui/material';
import { WifiOff, Refresh, CheckCircle } from '@mui/icons-material';

// Module-level flag: only check once per page load regardless of re-renders
const checkState = { done: false };

const ConnectionCheck = ({ children }) => {
    const [status, setStatus] = useState(checkState.done ? 'connected' : 'checking');
    const [errorMsg, setErrorMsg] = useState('');

    const check = useCallback(() => {
        setStatus('checking');
        setErrorMsg('');
        axios.get('/ping', { timeout: 10000 })
            .then(() => {
                checkState.done = true;
                setStatus('connected');
            })
            .catch((err) => {
                if (err.response) {
                    // Server responded but with an error (e.g. 401, 500)
                    setErrorMsg(`Server responded with status ${err.response.status}`);
                } else if (err.request) {
                    setErrorMsg('No response from server. Check your network connection.');
                } else {
                    setErrorMsg(err.message || 'Unknown error');
                }
                setStatus('error');
            });
    }, []);

    useEffect(() => {
        if (checkState.done) return;
        check();
    }, []);

    if (status === 'connected') return children;

    return (
        <Box
            sx={{
                position: 'fixed',
                inset: 0,
                zIndex: 9999,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                bgcolor: 'background.default',
            }}
        >
            <Fade in timeout={300}>
                <Paper
                    elevation={4}
                    sx={{
                        p: 5,
                        borderRadius: 3,
                        maxWidth: 400,
                        width: '90%',
                        textAlign: 'center',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    {status === 'checking' ? (
                        <>
                            <CircularProgress size={48} thickness={4} />
                            <Typography variant="h6" fontWeight={600}>
                                Connecting to server...
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                Please wait while we verify the connection.
                            </Typography>
                        </>
                    ) : (
                        <>
                            <WifiOff sx={{ fontSize: 56, color: 'error.main' }} />
                            <Typography variant="h6" fontWeight={600}>
                                Cannot connect to server
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                                {errorMsg || 'Unable to reach the server. Please check your network connection.'}
                            </Typography>
                            <Button
                                variant="contained"
                                startIcon={<Refresh />}
                                onClick={check}
                                sx={{ mt: 1 }}
                            >
                                Retry
                            </Button>
                        </>
                    )}
                </Paper>
            </Fade>
        </Box>
    );
};

export default ConnectionCheck;
