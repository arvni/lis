import React, {useEffect, useState} from "react";
import mammoth from "mammoth";
import {Alert, AppBar, Box, CircularProgress, IconButton, Paper, Toolbar, Tooltip, Typography} from "@mui/material";
import {FilterCenterFocus, ZoomIn, ZoomOut} from "@mui/icons-material";

const DOCXViewer = ({ fileUrl, fullScreen = false }) => {
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [zoom, setZoom] = useState(1.0);

    useEffect(() => {
        let isMounted = true;
        setLoading(true);
        setError(null);
        setContent('');
        setZoom(1.0);

        const loadDocx = async () => {
            try {
                const response = await fetch(fileUrl);
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                const arrayBuffer = await response.arrayBuffer();

                // Use mammoth to convert ArrayBuffer to HTML
                const result = await mammoth.convertToHtml({
                    arrayBuffer: arrayBuffer,
                    // Improved styling options
                    styleMap: [
                        "p[style-name='Heading 1'] => h1:fresh",
                        "p[style-name='Heading 2'] => h2:fresh",
                        "p[style-name='Heading 3'] => h3:fresh",
                        "p[style-name='Heading 4'] => h4:fresh",
                        "r[style-name='Strong'] => strong",
                        "r[style-name='Emphasis'] => em"
                    ]
                });

                if (isMounted) {
                    setContent(result.value);
                }
            } catch (err) {
                console.error("DOCX Load Error:", err);
                if (isMounted) {
                    setError(`Failed to load or parse DOCX file: ${err.message || 'Unknown error'}`);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        loadDocx();

        return () => {
            isMounted = false;
        };
    }, [fileUrl]);

    const zoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
    const zoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.7));
    const resetZoom = () => setZoom(1.0);

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
                        <Typography variant="body2" sx={{ mr: 2 }}>Document View</Typography>

                        {/* Zoom controls */}
                        <Tooltip title="Zoom out">
                            <span>
                                <IconButton size="small" onClick={zoomOut} disabled={loading || zoom <= 0.7}>
                                    <ZoomOut />
                                </IconButton>
                            </span>
                        </Tooltip>
                        <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center' }}>
                            {loading ? '...' : `${Math.round(zoom * 100)}%`}
                        </Typography>
                        <Tooltip title="Zoom in">
                            <span>
                                <IconButton size="small" onClick={zoomIn} disabled={loading || zoom >= 2.0}>
                                    <ZoomIn />
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Box sx={{ ml: 'auto' }}>
                            <Tooltip title="Reset zoom">
                                <span>
                                    <IconButton size="small" onClick={resetZoom} disabled={loading || zoom === 1.0}>
                                        <FilterCenterFocus />
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
                            <Typography variant="body2">Loading document...</Typography>
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
                            maxWidth: 800,
                            mx: 'auto',
                            p: { xs: 2, md: 3 },
                            transform: `scale(${zoom})`,
                            transformOrigin: 'top center',
                            transition: 'transform 0.2s ease',
                            // Enhanced styling for rendered HTML
                            '& h1': { mt: 3, mb: 2, color: 'primary.main', fontSize: '2rem', fontWeight: 500 },
                            '& h2': { mt: 2.5, mb: 1.5, color: 'primary.dark', fontSize: '1.5rem', fontWeight: 500 },
                            '& h3': { mt: 2, mb: 1, fontSize: '1.2rem', fontWeight: 500 },
                            '& p': { mb: 1.5, lineHeight: 1.6 },
                            '& ul, & ol': { pl: 3, mb: 1.5 },
                            '& li': { mb: 0.7 },
                            '& pre': { backgroundColor: '#f5f5f5', p: 1.5, borderRadius: 1, overflowX: 'auto', fontFamily: 'monospace' },
                            '& table': { width: '100%', borderCollapse: 'collapse', mb: 2 },
                            '& th, & td': { border: '1px solid #e0e0e0', p: 1 },
                            '& th': { backgroundColor: '#f5f5f5', fontWeight: 'bold' },
                            '& img': { maxWidth: '100%', height: 'auto' }
                        }}
                    >
                        <div dangerouslySetInnerHTML={{ __html: content }} />
                    </Paper>
                )}
            </Box>
        </Box>
    );
};

export default DOCXViewer;
