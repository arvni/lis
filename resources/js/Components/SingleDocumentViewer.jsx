// EnhancedDocumentViewer.jsx
import React, {useState, useEffect, lazy, Suspense} from 'react';
import {
    Box,
    Typography,
    Paper,
    Button,
    IconButton,
    Alert,
    Toolbar,
    AppBar,
    Tooltip,
    Snackbar,
    Chip,
    useTheme,
    useMediaQuery,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    CircularProgress
} from '@mui/material';
import {
    Close,
    Fullscreen,
    FullscreenExit,
    Description,
    TableChart,
    PictureAsPdf,
    Image as ImageIcon,
    SaveAlt,
    Print,
    Share,
    Info,
    CloudDownload,
    TextFields,
    Error as ErrorIcon
} from '@mui/icons-material';

// Lazy load all viewer components
const GenericFileViewer = lazy(() => import("@/Components/GenericFileViewer.jsx"));
const TextViewer = lazy(() => import("@/Components/TextViewer.jsx"));
const ExcelViewer = lazy(() => import("@/Components/ExcelViewer.jsx"));
const DOCXViewer = lazy(() => import("@/Components/DOCXViewer.jsx"));
const PDFViewer = lazy(() => import("@/Components/PDFViewer.jsx"));
const ImageViewer = lazy(() => import("@/Components/ImageViewer.jsx"));

// Loading component to show while lazy components are loading
const LoadingComponent = () => (
    <Box sx={{display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', width: '100%'}}>
        <CircularProgress/>
        <Typography variant="body2" sx={{ml: 2}}>Loading viewer...</Typography>
    </Box>
);

// Helper function to format file size
const formatFileSize = (bytes) => {
    if (!bytes || typeof bytes !== 'number') return 'Unknown size';
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// File Type icon component
const FileTypeIcon = ({fileType}) => {
    if (!fileType) return <Description/>;

    switch (fileType.toLowerCase()) {
        case 'pdf':
            return <PictureAsPdf/>;
        case 'doc':
        case 'docx':
            return <Description/>;
        case 'xls':
        case 'xlsx':
        case 'csv':
            return <TableChart/>;
        case 'jpg':
        case 'jpeg':
        case 'png':
        case 'gif':
        case 'bmp':
        case 'svg':
        case 'webp':
            return <ImageIcon/>;
        case 'txt':
            return <TextFields/>;
        default:
            return <Description/>;
    }
};

// Error Boundary Component
class ErrorBoundary extends React.Component {
    constructor(props) {
        super(props);
        this.state = {hasError: false, error: null, errorInfo: null};
    }

    static getDerivedStateFromError(error) {
        return {hasError: true, error};
    }

    componentDidCatch(error, errorInfo) {
        console.error("Viewer Error:", error, errorInfo);
        this.setState({errorInfo});
    }

    render() {
        if (this.state.hasError) {
            return (
                <Box sx={{p: 3, textAlign: 'center'}}>
                    <Paper elevation={3} sx={{p: 3, maxWidth: 500, mx: 'auto'}}>
                        <ErrorIcon color="error" sx={{fontSize: 48, mb: 2}}/>
                        <Typography variant="h6" color="error" gutterBottom>
                            Something went wrong loading this component
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{mb: 2}}>
                            {this.state.error?.message || 'Unknown error occurred'}
                        </Typography>
                        <Button
                            variant="contained"
                            onClick={() => this.setState({hasError: false, error: null, errorInfo: null})}
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

// Main Document Viewer Component
const EnhancedDocumentViewer = ({document, fullScreen = false, onClose}) => {
    const [isFullScreen, setIsFullScreen] = useState(fullScreen);
    const [notification, setNotification] = useState({open: false, message: '', severity: 'info'});
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
            <Paper elevation={1} sx={{p: 3, textAlign: 'center', m: 2}}>
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
            return route("documents.download", (document.hash || document.id));
        } catch (e) {
            // Fallback in case route function is not defined
            console.warn("route function not found, using direct URL construction");
            return route("documents.download", (document.hash || document.id));
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
            severity: 'success'
        });
    };

    // Handle sharing (could be extended with actual sharing functionality)
    const handleShare = () => {
        // Attempt to use Web Share API if available
        if (navigator.share) {
            navigator.share({
                title: document.originalName,
                text: `Check out this document: ${document.originalName}`,
                url: window.location.href,
            })
                .then(() => {
                    setNotification({
                        open: true,
                        message: 'Document shared successfully',
                        severity: 'success'
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
        navigator.clipboard.writeText(window.location.href)
            .then(() => {
                setNotification({
                    open: true,
                    message: 'Link copied to clipboard',
                    severity: 'success'
                });
            })
            .catch(() => {
                setNotification({
                    open: true,
                    message: 'Failed to copy link',
                    severity: 'error'
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
                severity: 'info'
            });
        } else {
            setNotification({
                open: true,
                message: 'Printing is only available for PDF documents',
                severity: 'warning'
            });
        }
    };

    // Show document info
    const showInfo = () => {
        setInfoDialogOpen(true);
    };

    // Determine which viewer to use based on file extension
    // Safely get the file extension
    const ext = document.ext ? document.ext.toLowerCase() : document.originalName.split(".")[document.originalName.split(".").length - 1];
    const renderViewer = () => {

        // Image file types
        const imageTypes = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'];
        if (imageTypes.includes(ext)) {
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingComponent/>}>
                        <ImageViewer fileUrl={fileUrl} fullScreen={isFullScreen}/>
                    </Suspense>
                </ErrorBoundary>
            );
        }

        // Document file types
        if (ext === 'pdf') {
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingComponent/>}>
                        <PDFViewer fileUrl={fileUrl} fullScreen={isFullScreen}/>
                    </Suspense>
                </ErrorBoundary>
            );
        }

        if (['doc', 'docx'].includes(ext)) {
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingComponent/>}>
                        <DOCXViewer fileUrl={fileUrl} fullScreen={isFullScreen}/>
                    </Suspense>
                </ErrorBoundary>
            );
        }

        // Spreadsheet file types
        if (['xls', 'xlsx', 'csv'].includes(ext)) {
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingComponent/>}>
                        <ExcelViewer fileUrl={fileUrl} fullScreen={isFullScreen}/>
                    </Suspense>
                </ErrorBoundary>
            );
        }

        // Text files
        if (['txt', 'md', 'json', 'xml', 'html', 'css', 'js'].includes(ext)) {
            return (
                <ErrorBoundary>
                    <Suspense fallback={<LoadingComponent/>}>
                        <TextViewer fileUrl={fileUrl} fullScreen={isFullScreen}/>
                    </Suspense>
                </ErrorBoundary>
            );
        }

        // Generic fallback for unsupported types
        return (
            <ErrorBoundary>
                <Suspense fallback={<LoadingComponent/>}>
                    <GenericFileViewer
                        fileUrl={fileUrl}
                        fileType={ext}
                        fileName={document.originalName}
                        fileSize={document.size}
                        onDownload={handleDownload}
                    />
                </Suspense>
            </ErrorBoundary>
        );
    };

    // Close notification
    const handleCloseNotification = (event, reason) => {
        if (reason === 'clickaway') return;
        setNotification({...notification, open: false});
    };

    const handleClose=()=>{
        setInfoDialogOpen(false)
        if(onClose)
            onClose();
    }

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
                transition: 'all 0.3s ease'
            }}
        >
            {/* Header bar */}
            <AppBar
                position="static"
                color="primary"
                elevation={1}
                sx={{
                    background: theme.palette.mode === 'dark' ?
                        'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)' :
                        'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
                }}
            >
                <Toolbar variant="dense" sx={{minHeight: '48px'}}>
                    {/* File Type Icon */}
                    <Box sx={{mr: 1.5, display: 'flex', alignItems: 'center'}}>
                        <FileTypeIcon fileType={document?.ext}/>
                    </Box>

                    {/* Filename */}
                    <Typography
                        variant="subtitle1"
                        sx={{
                            flex: 1,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            mr: 1
                        }}
                        title={document.originalName}
                    >
                        {document.originalName}
                    </Typography>

                    {/* Action Buttons */}
                    <Tooltip title="Download">
                        <IconButton
                            size="small"
                            color="inherit"
                            onClick={handleDownload}
                            aria-label="Download document"
                        >
                            <SaveAlt/>
                        </IconButton>
                    </Tooltip>

                    {!isMobile && (
                        <>
                            <Tooltip title="Print">
                                <span>
                                    <IconButton
                                        size="small"
                                        color="inherit"
                                        onClick={handlePrint}
                                        disabled={(document?.ext?.toLowerCase()||ext) !== 'pdf'}
                                        aria-label="Print document"
                                    >
                                        <Print/>
                                    </IconButton>
                                </span>
                            </Tooltip>

                            <Tooltip title="Share">
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={handleShare}
                                    aria-label="Share document"
                                >
                                    <Share/>
                                </IconButton>
                            </Tooltip>

                            <Tooltip title="File info">
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={showInfo}
                                    aria-label="File information"
                                >
                                    <Info/>
                                </IconButton>
                            </Tooltip>
                        </>
                    )}

                    <Tooltip title={isFullScreen ? "Exit Fullscreen" : "Fullscreen"}>
                        <IconButton
                            size="small"
                            color="inherit"
                            onClick={() => setIsFullScreen(!isFullScreen)}
                            aria-label={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
                        >
                            {isFullScreen ? <FullscreenExit/> : <Fullscreen/>}
                        </IconButton>
                    </Tooltip>

                    {onClose && (
                        <Tooltip title="Close">
                            <IconButton
                                size="small"
                                color="inherit"
                                onClick={onClose}
                                aria-label="Close viewer"
                            >
                                <Close/>
                            </IconButton>
                        </Tooltip>
                    )}
                </Toolbar>
            </AppBar>

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
                    <Box sx={{display: 'flex', alignItems: 'center'}}>
                        <Info fontSize="small" sx={{mr: 0.5, fontSize: 16, color: 'text.secondary'}}/>
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
            <Box sx={{flex: 1, overflow: 'hidden', position: 'relative',height:'100%'}}>
                {renderViewer()}
            </Box>

            {/* File information dialog */}
            <Dialog
                open={infoDialogOpen}
                onClose={handleClose}
                aria-labelledby="file-info-dialog-title"
            >
                <DialogTitle id="file-info-dialog-title">File Information</DialogTitle>
                <DialogContent dividers>
                    <Box sx={{minWidth: 300}}>
                        <Typography variant="subtitle1" gutterBottom>
                            {document.originalName}
                        </Typography>

                        <Box sx={{my: 2}}>
                            <Box sx={{
                                display: 'flex',
                                justifyContent: 'space-between',
                                py: 1,
                                borderBottom: '1px solid',
                                borderColor: 'divider'
                            }}>
                                <Typography variant="body2" color="text.secondary">Type</Typography>
                                <Typography
                                    variant="body2">{ext ? ext.toUpperCase() : 'Unknown'}</Typography>
                            </Box>

                            {document.size && (
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" color="text.secondary">Size</Typography>
                                    <Typography variant="body2">{formatFileSize(document.size)}</Typography>
                                </Box>
                            )}

                            {document.created_at && (
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" color="text.secondary">Uploaded</Typography>
                                    <Typography
                                        variant="body2">{new Date(document.created_at).toLocaleString()}</Typography>
                                </Box>
                            )}

                            {document.updated_at && (
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" color="text.secondary">Last modified</Typography>
                                    <Typography
                                        variant="body2">{new Date(document.updated_at).toLocaleString()}</Typography>
                                </Box>
                            )}

                            {document.mime_type && (
                                <Box sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    py: 1,
                                    borderBottom: '1px solid',
                                    borderColor: 'divider'
                                }}>
                                    <Typography variant="body2" color="text.secondary">MIME type</Typography>
                                    <Typography variant="body2">{document.mime_type}</Typography>
                                </Box>
                            )}
                        </Box>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setInfoDialogOpen(false)}>Close</Button>
                    <Button variant="contained" onClick={handleDownload} startIcon={<CloudDownload/>}>
                        Download
                    </Button>
                </DialogActions>
            </Dialog>

            {/* Notification snackbar */}
            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleCloseNotification}
                anchorOrigin={{vertical: 'bottom', horizontal: 'center'}}
            >
                <Alert
                    onClose={handleCloseNotification}
                    severity={notification.severity}
                    variant="filled"
                    sx={{width: '100%'}}
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
};

// Export all components
export default EnhancedDocumentViewer;
