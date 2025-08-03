import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
    Box,
    AppBar,
    Toolbar,
    IconButton,
    Typography,
    Paper,
    CircularProgress,
    Tooltip,
    useTheme,
    useMediaQuery,
    Alert
} from '@mui/material';
import {
    ZoomIn,
    ZoomOut,
    Print,
    Refresh
} from '@mui/icons-material';

const SimplifiedPDFViewer = ({ fileUrl, fullScreen = false }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1.0);
    const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const iframeRef = useRef(null);
    const containerRef = useRef(null);
    const resizeObserverRef = useRef(null);

    // Use ResizeObserver to detect container size changes
    useEffect(() => {
        if (!containerRef.current) return;

        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                setContainerSize({ width, height });

                // Force iframe to recalculate its size
                if (iframeRef.current) {
                    // Temporarily hide and show to force refresh
                    iframeRef.current.style.visibility = 'hidden';
                    setTimeout(() => {
                        if (iframeRef.current) {
                            iframeRef.current.style.visibility = 'visible';
                        }
                    }, 10);
                }
            }
        });

        resizeObserver.observe(containerRef.current);
        resizeObserverRef.current = resizeObserver;

        return () => {
            if (resizeObserverRef.current) {
                resizeObserverRef.current.disconnect();
            }
        };
    }, []);

    useEffect(() => {
        // Reset state when fileUrl changes
        setLoading(true);
        setError(null);
        setScale(1.0);

        // Create a timeout to simulate loading and check if URL is valid
        const timer = setTimeout(() => {
            setLoading(false);
        }, 1500);

        return () => {
            clearTimeout(timer);
        };
    }, [fileUrl]);

    // Handle zoom actions with container size consideration
    const zoomIn = useCallback(() => {
        setScale(prevScale => {
            const newScale = Math.min(prevScale + 0.2, 3);
            updateIframeScale(newScale);
            return newScale;
        });
    }, []);

    const zoomOut = useCallback(() => {
        setScale(prevScale => {
            const newScale = Math.max(prevScale - 0.2, 0.6);
            updateIframeScale(newScale);
            return newScale;
        });
    }, []);

    // Update iframe scale with proper positioning
    const updateIframeScale = useCallback((newScale) => {
        if (iframeRef.current) {
            iframeRef.current.style.transform = `scale(${newScale})`;
            iframeRef.current.style.transformOrigin = 'top center';

            // Adjust container height based on scale to prevent scrolling issues
            const scaledHeight = containerSize.height * newScale;
            if (containerRef.current) {
                containerRef.current.style.minHeight = `${scaledHeight}px`;
            }
        }
    }, [containerSize.height]);

    // Force refresh of PDF
    const refreshPDF = useCallback(() => {
        if (iframeRef.current) {
            setLoading(true);
            const currentSrc = iframeRef.current.src;
            iframeRef.current.src = '';
            setTimeout(() => {
                if (iframeRef.current) {
                    iframeRef.current.src = currentSrc;
                }
            }, 100);
        }
    }, []);

    // Handle iframe load events
    const handleIframeLoad = useCallback(() => {
        setLoading(false);
        // Apply current scale after load
        updateIframeScale(scale);
    }, [scale, updateIframeScale]);

    const handleIframeError = useCallback(() => {
        setError('Failed to load PDF. The file might be corrupted or inaccessible.');
        setLoading(false);
    }, []);

    // Update scale when container size changes
    useEffect(() => {
        if (containerSize.width > 0 && containerSize.height > 0) {
            updateIframeScale(scale);
        }
    }, [containerSize, scale, updateIframeScale]);

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: fullScreen ? 'calc(100vh - 48px)' : '100%',
            width: '100%',
            overflow: 'hidden',
        }}>
            <AppBar position="static" color="default" elevation={0}>
                <Toolbar variant="dense">
                    <Box sx={{ display: 'flex', alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                        {/* Zoom Controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center', mr: 2 }}>
                            <Tooltip title="Zoom out">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={zoomOut}
                                        disabled={loading || scale <= 0.6}
                                        aria-label="Zoom out"
                                    >
                                        <ZoomOut />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center' }}>
                                {loading ? '...' : `${Math.round(scale * 100)}%`}
                            </Typography>
                            <Tooltip title="Zoom in">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={zoomIn}
                                        disabled={loading || scale >= 3}
                                        aria-label="Zoom in"
                                    >
                                        <ZoomIn />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>

                        {/* Refresh button */}
                        <Tooltip title="Refresh PDF">
                            <span>
                                <IconButton
                                    size="small"
                                    onClick={refreshPDF}
                                    disabled={loading}
                                    aria-label="Refresh PDF"
                                >
                                    <Refresh />
                                </IconButton>
                            </span>
                        </Tooltip>

                        {/* Print option */}
                        {!isMobile && (
                            <Tooltip title="Print document">
                                <span>
                                    <IconButton
                                        size="small"
                                        onClick={() => window.open(fileUrl, '_blank')}
                                        disabled={loading}
                                        aria-label="Print document"
                                    >
                                        <Print />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        )}

                        {/* Container size info (for debugging) */}
                        {containerSize.width > 0 && (
                            <Typography variant="caption" sx={{ ml: 'auto', color: 'text.secondary' }}>
                                {Math.round(containerSize.width)} × {Math.round(containerSize.height)}
                            </Typography>
                        )}
                    </Box>
                </Toolbar>
            </AppBar>

            <Box
                ref={containerRef}
                sx={{
                    flex: 1,
                    overflow: 'auto',
                    display: 'flex',
                    justifyContent: 'center',
                    bgcolor: '#f5f5f5',
                    p: 2,
                    position: 'relative'
                }}
            >
                {loading && (
                    <Box sx={{
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 10,
                        bgcolor: 'rgba(245, 245, 245, 0.8)'
                    }}>
                        <Paper sx={{ p: 3, borderRadius: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                            <CircularProgress size={40} sx={{ mb: 2 }} />
                            <Typography variant="body2">Loading PDF...</Typography>
                        </Paper>
                    </Box>
                )}

                {error && !loading && (
                    <Box sx={{ p: 2, position: 'absolute', top: 0, left: 0, right: 0, zIndex: 1 }}>
                        <Alert severity="error">{error}</Alert>
                    </Box>
                )}

                {/* PDF iframe container */}
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        overflow: 'auto',
                        position: 'relative'
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`}
                        title="PDF Viewer"
                        width="100%"
                        height="100%"
                        style={{
                            border: 'none',
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            display: loading ? 'none' : 'block',
                            transition: 'transform 0.2s ease-in-out'
                        }}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                        frameBorder="0"
                        scrolling="no"
                        allowFullScreen
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default SimplifiedPDFViewer;
