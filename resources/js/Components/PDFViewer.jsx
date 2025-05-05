import React, { useState, useEffect } from 'react';
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
    Print
} from '@mui/icons-material';
const SimplifiedPDFViewer = ({ fileUrl, fullScreen = false }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [scale, setScale] = useState(1.0);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const iframeRef = React.useRef(null);

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

    // Handle zoom actions by modifying iframe styles
    const zoomIn = () => {
        setScale(prevScale => {
            const newScale = Math.min(prevScale + 0.2, 3);
            if (iframeRef.current) {
                iframeRef.current.style.transform = `scale(${newScale})`;
                iframeRef.current.style.transformOrigin = 'top center';
            }
            return newScale;
        });
    };

    const zoomOut = () => {
        setScale(prevScale => {
            const newScale = Math.max(prevScale - 0.2, 0.6);
            if (iframeRef.current) {
                iframeRef.current.style.transform = `scale(${newScale})`;
                iframeRef.current.style.transformOrigin = 'top center';
            }
            return newScale;
        });
    };

    // Handle iframe load events
    const handleIframeLoad = () => {
        setLoading(false);
    };

    const handleIframeError = () => {
        setError('Failed to load PDF. The file might be corrupted or inaccessible.');
        setLoading(false);
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: fullScreen ? 'calc(100vh - 48px)' : 500,
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
                    </Box>
                </Toolbar>
            </AppBar>

            <Box sx={{
                flex: 1,
                overflow: 'auto',
                display: 'flex',
                justifyContent: 'center',
                bgcolor: '#f5f5f5',
                p: 2,
                position: 'relative'
            }}>
                {loading && (
                    <Box sx={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, display: 'flex', justifyContent: 'center', alignItems: 'center', zIndex: 10 }}>
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

                {/* Using iframe for PDF display instead of PDF.js */}
                <Box
                    sx={{
                        width: '100%',
                        height: '100%',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'flex-start',
                        overflow: 'auto'
                    }}
                >
                    <iframe
                        ref={iframeRef}
                        src={`${fileUrl}#toolbar=0`}
                        title="PDF Viewer"
                        width="100%"
                        height="100%"
                        style={{
                            border: 'none',
                            transform: `scale(${scale})`,
                            transformOrigin: 'top center',
                            display: loading ? 'none' : 'block'
                        }}
                        onLoad={handleIframeLoad}
                        onError={handleIframeError}
                    />
                </Box>
            </Box>
        </Box>
    );
};

export default SimplifiedPDFViewer;
