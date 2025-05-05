import React, {useEffect, useRef, useState} from "react";
import {Alert, AppBar, Box, CircularProgress, Divider, IconButton, Toolbar, Tooltip, Typography} from "@mui/material";
import {FilterCenterFocus, RotateLeft, RotateRight, ZoomIn, ZoomOut} from "@mui/icons-material";

const ImageViewer = ({ fileUrl, fullScreen = false }) => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [imageState, setImageState] = useState({
        scale: 1,
        rotation: 0,
        isLoaded: false
    });
    const imgRef = useRef(null);

    const handleImageLoad = () => {
        setLoading(false);
        setImageState(prev => ({ ...prev, isLoaded: true }));
    };

    const handleImageError = (err) => {
        console.error("Image Load Error:", err);
        setError(`Failed to load image. The file may be corrupted or in an unsupported format.`);
        setLoading(false);
    };

    const zoomIn = () => setImageState(prev => ({ ...prev, scale: Math.min(prev.scale + 0.2, 3) }));
    const zoomOut = () => setImageState(prev => ({ ...prev, scale: Math.max(prev.scale - 0.2, 0.3) }));
    const rotateLeft = () => setImageState(prev => ({ ...prev, rotation: prev.rotation - 90 }));
    const rotateRight = () => setImageState(prev => ({ ...prev, rotation: prev.rotation + 90 }));
    const resetView = () => setImageState({ scale: 1, rotation: 0, isLoaded: true });

    useEffect(() => {
        // Reset image state when fileUrl changes
        setLoading(true);
        setError(null);
        setImageState({ scale: 1, rotation: 0, isLoaded: false });
    }, [fileUrl]);

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
                        {/* Image Controls */}
                        <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Tooltip title="Rotate left">
                                <span>
                                    <IconButton size="small" onClick={rotateLeft} disabled={loading || !imageState.isLoaded}>
                                        <RotateLeft />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Tooltip title="Rotate right">
                                <span>
                                    <IconButton size="small" onClick={rotateRight} disabled={loading || !imageState.isLoaded}>
                                        <RotateRight />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
                            <Tooltip title="Zoom out">
                                <span>
                                    <IconButton size="small" onClick={zoomOut} disabled={loading || !imageState.isLoaded || imageState.scale <= 0.3}>
                                        <ZoomOut />
                                    </IconButton>
                                </span>
                            </Tooltip>
                            <Typography variant="body2" sx={{ mx: 1, minWidth: '40px', textAlign: 'center' }}>
                                {loading ? '...' : `${Math.round(imageState.scale * 100)}%`}
                            </Typography>
                            <Tooltip title="Zoom in">
                                <span>
                                    <IconButton size="small" onClick={zoomIn} disabled={loading || !imageState.isLoaded || imageState.scale >= 3}>
                                        <ZoomIn />
                                    </IconButton>
                                </span>
                            </Tooltip>
                        </Box>

                        {/* Reset View Button */}
                        <Box sx={{ ml: 'auto' }}>
                            <Tooltip title="Reset view">
                                <span>
                                    <IconButton size="small" onClick={resetView} disabled={loading || !imageState.isLoaded}>
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
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    bgcolor: '#f0f0f0',
                    p: 2,
                }}
            >
                {loading && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', minHeight: 200 }}>
                        <CircularProgress />
                    </Box>
                )}
                {error && !loading && (
                    <Box sx={{ p: 2 }}>
                        <Alert severity="error" sx={{ maxWidth: 500, mx: 'auto' }}>{error}</Alert>
                    </Box>
                )}
                {!error && (
                    <Box sx={{
                        position: 'relative',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: '100%',
                        width: '100%'
                    }}>
                        <Box
                            component="img"
                            ref={imgRef}
                            src={fileUrl}
                            alt="Document preview"
                            onLoad={handleImageLoad}
                            onError={handleImageError}
                            sx={{
                                maxHeight: '100%',
                                maxWidth: '100%',
                                objectFit: 'contain',
                                transform: `scale(${imageState.scale}) rotate(${imageState.rotation}deg)`,
                                transition: 'transform 0.3s ease',
                                display: loading ? 'none' : 'block',
                                // Subtle shadow for better visibility on white backgrounds
                                boxShadow: imageState.isLoaded ? '0 0 10px rgba(0,0,0,0.1)' : 'none'
                            }}
                        />
                    </Box>
                )}
            </Box>
        </Box>
    );
};

export default ImageViewer;
