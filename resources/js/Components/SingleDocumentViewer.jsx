// EnhancedDocumentViewer.jsx
import { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import {
    Box,
    Typography,
    Paper,
    Alert,
    Snackbar,
    Chip,
    useTheme,
    useMediaQuery,
} from '@mui/material';
import { Info } from '@mui/icons-material';
import { formatFileSize } from '@/Services/helper';
import ViewerToolbar from './SingleDocumentViewer/ViewerToolbar';
import ViewerContent from './SingleDocumentViewer/ViewerContent';
import FileInfoDialog from './SingleDocumentViewer/FileInfoDialog';

// Main Document Viewer Component
const EnhancedDocumentViewer = ({ document, fullScreen = false, onClose }) => {
    const [isFullScreen, setIsFullScreen] = useState(fullScreen);
    const [notification, setNotification] = useState({
        open: false,
        message: '',
        severity: 'info',
    });
    const [infoDialogOpen, setInfoDialogOpen] = useState(false);
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

    // Effect to sync internal fullscreen state if the prop changes externally
    useEffect(() => {
        setIsFullScreen(fullScreen);
    }, [fullScreen]);

    // Handle keyboard shortcuts for navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (!isFullScreen) return; // Only apply shortcuts in fullscreen mode

            switch (e.key) {
                case 'Escape':
                    setIsFullScreen(false);
                    break;
                default:
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [isFullScreen]);

    if (!document) {
        return (
            <Paper elevation={1} sx={{ p: 3, textAlign: 'center', m: 2 }}>
                <Typography variant="body1" color="textSecondary">
                    No document selected or document data is incomplete.
                </Typography>
            </Paper>
        );
    }

    // Generate file URLs
    const getFileUrl = () => {
        try {
            // Using the route helper if available
            return route('documents.download', document.hash || document.id);
        } catch (e) {
            // Fallback in case route function is not defined
            console.warn('route function not found, using direct URL construction');
            return route('documents.download', document.hash || document.id);
        }
    };

    // Get file URLs
    const fileUrl = getFileUrl();
    const downloadUrl = fileUrl;

    // Handle download with notification
    const handleDownload = () => {
        window.open(downloadUrl, '_blank');
        setNotification({
            open: true,
            message: 'Download started',
            severity: 'success',
        });
    };

    // Handle sharing (could be extended with actual sharing functionality)
    const handleShare = () => {
        // Attempt to use Web Share API if available
        if (navigator.share) {
            navigator
                .share({
                    title: document.originalName,
                    text: `Check out this document: ${document.originalName}`,
                    url: window.location.href,
                })
                .then(() => {
                    setNotification({
                        open: true,
                        message: 'Document shared successfully',
                        severity: 'success',
                    });
                })
                .catch((error) => {
                    console.error('Share error:', error);
                    // Fall back to clipboard copy
                    copyToClipboard();
                });
        } else {
            // Fall back to clipboard copy
            copyToClipboard();
        }
    };

    // Helper to copy link to clipboard
    const copyToClipboard = () => {
        navigator.clipboard
            .writeText(window.location.href)
            .then(() => {
                setNotification({
                    open: true,
                    message: 'Link copied to clipboard',
                    severity: 'success',
                });
            })
            .catch(() => {
                setNotification({
                    open: true,
                    message: 'Failed to copy link',
                    severity: 'error',
                });
            });
    };

    // Handle printing for supported document types
    const handlePrint = () => {
        if (document?.ext?.toLowerCase() === 'pdf') {
            window.open(fileUrl, '_blank');
            setNotification({
                open: true,
                message: 'Print dialog opened in new tab',
                severity: 'info',
            });
        } else {
            setNotification({
                open: true,
                message: 'Printing is only available for PDF documents',
                severity: 'warning',
            });
        }
    };

    // Show document info
    const showInfo = () => {
        setInfoDialogOpen(true);
    };

    // Determine which viewer to use based on file extension
    // Safely get the file extension
    const ext = document.ext
        ? document.ext.toLowerCase()
        : document.originalName.split('.')[document.originalName.split('.').length - 1];

    // Close notification
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({ ...notification, open: false });
    };

    const handleClose = () => {
        setInfoDialogOpen(false);
        if (onClose) onClose();
    };

    return (
        <Box
            sx={{
                // display: 'flex',
                // flexDirection: 'column',
                height: isFullScreen ? '100vh' : '100%',
                minHeight: isFullScreen ? '100vh' : 300,
                width: '100%',
                position: isFullScreen ? 'fixed' : 'relative',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                zIndex: isFullScreen ? 1300 : 'auto',
                bgcolor: 'background.paper',
                border: !isFullScreen ? '1px solid #e0e0e0' : 'none',
                boxShadow: !isFullScreen ? 1 : 0,
                overflow: 'hidden',
                transition: 'all 0.3s ease',
            }}
        >
            {/* Header bar */}
            <ViewerToolbar
                document={document}
                ext={ext}
                isMobile={isMobile}
                isFullScreen={isFullScreen}
                onDownload={handleDownload}
                onPrint={handlePrint}
                onShare={handleShare}
                onShowInfo={showInfo}
                onToggleFullScreen={() => setIsFullScreen(!isFullScreen)}
                onClose={onClose}
            />

            {/* Document info bar (optional, shows on larger screens) */}
            {!isMobile && document.size && (
                <Box
                    sx={{
                        py: 0.5,
                        px: 2,
                        bgcolor: 'background.default',
                        borderBottom: '1px solid',
                        borderColor: 'divider',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 2,
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                        <Info
                            fontSize="small"
                            sx={{ mr: 0.5, fontSize: 16, color: 'text.secondary' }}
                        />
                        <Typography variant="caption" color="text.secondary">
                            {formatFileSize(document.size || 0)}
                        </Typography>
                    </Box>

                    <Chip
                        label={ext ? ext.toUpperCase() : 'UNKNOWN'}
                        size="small"
                        variant="outlined"
                    />

                    {document.created_at && (
                        <Typography variant="caption" color="text.secondary">
                            Uploaded: {new Date(document.created_at).toLocaleDateString()}
                        </Typography>
                    )}
                </Box>
            )}

            {/* Document viewer content area */}
            <Box sx={{ flex: 1, overflow: 'hidden', position: 'relative', height: '100%' }}>
                <ViewerContent
                    ext={ext}
                    fileUrl={fileUrl}
                    isFullScreen={isFullScreen}
                    fileName={document.originalName}
                    fileSize={document.size}
                    onDownload={handleDownload}
                />
            </Box>

            {/* File information dialog */}
            <FileInfoDialog
                open={infoDialogOpen}
                onClose={() => setInfoDialogOpen(false)}
                onDialogClose={handleClose}
                document={document}
                ext={ext}
                onDownload={handleDownload}
            />

            {/* Notification snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{ width: '100%' }}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

EnhancedDocumentViewer.propTypes = {
    document: PropTypes.shape({
        id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
        hash: PropTypes.string,
        originalName: PropTypes.string,
        ext: PropTypes.string,
        size: PropTypes.number,
        mime_type: PropTypes.string,
        created_at: PropTypes.string,
        updated_at: PropTypes.string,
    }),
    fullScreen: PropTypes.bool,
    onClose: PropTypes.func,
};

// Export all components
export default EnhancedDocumentViewer;
