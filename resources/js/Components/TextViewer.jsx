import React, {useEffect, useState} from "react";
import {Alert, AppBar, Box, CircularProgress, IconButton, Paper, Toolbar, Tooltip, Typography} from "@mui/material";
import {ContentCopy, ZoomIn, ZoomOut} from "@mui/icons-material";

const TextViewer = ({ fileUrl, fullScreen = false }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [fontSize, setFontSize] = useState(14);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        setContent('');

        const loadTextFile = async () => {
            try {
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const text = await response.text();

                if (isMounted) {
                    setContent(text);
                }
            } catch (err) {
                console.error("Text File Load Error:", err);
                if (isMounted) {
                    setError(`Failed to load text file: ${err.message || 'Unknown error'}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadTextFile();

        return () => {
            isMounted = false;
        };
    }, [fileUrl]);

    const increaseFontSize = () => setFontSize(prev => Math.min(prev + 2, 24));
    const decreaseFontSize = () => setFontSize(prev => Math.max(prev - 2, 10));

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: fullScreen ? 'calc(100vh - 48px)' : 500,
            width: '100%',
            overflow: 'hidden'
        }}>
            <AppBar position="static" color="default" elevation={0}>
                <Toolbar variant="dense">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%' }}>
                        <Typography variant="body2" sx={{ mr: 2 }}>Text View</Typography>

                        {/* Font size controls */}
                        <Tooltip title="Decrease font size">
                            <span>
                                <IconButton size="small" onClick={decreaseFontSize} disabled={loading || fontSize <= 10}>
                                    <ZoomOut />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center' }}>
                            {loading ? '...' : `${fontSize}px`}
                        </Typography>
                        <Tooltip title="Increase font size">
                            <span>
                                <IconButton size="small" onClick={increaseFontSize} disabled={loading || fontSize >= 24}>
                                    <ZoomIn />
                                </IconButton>
                            </span>
                        </Tooltip>

                        {/* Copy button */}
                        <Box sx={{ ml: 'auto' }}>
                            <Tooltip title="Copy text">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={() => {
                                            navigator.clipboard.writeText(content);
                                        }}
                                        disabled={loading || !content}
                                    >
                                        <ContentCopy />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    bgcolor: 'white',
                    p: 1,
                    position: 'relative'
                }}
            >
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
                        <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CircularProgress size={40} sx={{ mb: 2 }} />
                            <Typography variant="body2">Loading text file...</Typography>
                        </Paper>
                    </Box>
                )}
                {error && !loading && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}
                {!loading && !error && (
                    <Paper
                        elevation={0}
                        sx={{
                            p: 2,
                            fontFamily: 'monospace',
                            fontSize: `${fontSize}px`,
                            lineHeight: 1.5,
                            whiteSpace: 'pre-wrap',
                            wordBreak: 'break-all',
                            maxHeight: '100%',
                            overflow: 'auto'
                        }}
                    >
                        {content}
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default TextViewer;
