import { Box, Typography, IconButton, Toolbar, AppBar, Tooltip, useTheme } from '@mui/material';
import {
    Close,
    Fullscreen,
    FullscreenExit,
    SaveAlt,
    Print,
    Share,
    Info,
} from '@mui/icons-material';
import FileTypeIcon from './FileTypeIcon';

const ViewerToolbar = ({
    document,
    ext,
    isMobile,
    isFullScreen,
    onDownload,
    onPrint,
    onShare,
    onShowInfo,
    onToggleFullScreen,
    onClose,
}) => {
    const theme = useTheme();

    return (
        <AppBar
            position="static"
            color="primary"
            elevation={1}
            sx={{
                background:
                    theme.palette.mode === 'dark'
                        ? 'linear-gradient(45deg, #1976d2 30%, #2196f3 90%)'
                        : 'linear-gradient(45deg, #2196f3 30%, #21cbf3 90%)',
            }}
        >
            <Toolbar variant="dense" sx={{ minHeight: '48px' }}>
                {/* File Type Icon */}
                <Box sx={{ mr: 1.5, display: 'flex', alignItems: 'center' }}>
                    <FileTypeIcon fileType={document?.ext} />
                </Box>

                {/* Filename */}
                <Typography
                    variant="subtitle1"
                    sx={{
                        flex: 1,
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        mr: 1,
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
                        onClick={onDownload}
                        aria-label="Download document"
                    >
                        <SaveAlt />
                    </IconButton>
                </Tooltip>

                {!isMobile && (
                    <>
                        <Tooltip title="Print">
                            <span>
                                <IconButton
                                    size="small"
                                    color="inherit"
                                    onClick={onPrint}
                                    disabled={(document?.ext?.toLowerCase() || ext) !== 'pdf'}
                                    aria-label="Print document"
                                >
                                    <Print />
                                </IconButton>
                            </span>
                        </Tooltip>

                        <Tooltip title="Share">
                            <IconButton
                                size="small"
                                color="inherit"
                                onClick={onShare}
                                aria-label="Share document"
                            >
                                <Share />
                            </IconButton>
                        </Tooltip>

                        <Tooltip title="File info">
                            <IconButton
                                size="small"
                                color="inherit"
                                onClick={onShowInfo}
                                aria-label="File information"
                            >
                                <Info />
                            </IconButton>
                        </Tooltip>
                    </>
                )}

                <Tooltip title={isFullScreen ? 'Exit Fullscreen' : 'Fullscreen'}>
                    <IconButton
                        size="small"
                        color="inherit"
                        onClick={onToggleFullScreen}
                        aria-label={isFullScreen ? 'Exit fullscreen' : 'Enter fullscreen'}
                    >
                        {isFullScreen ? <FullscreenExit /> : <Fullscreen />}
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
                            <Close />
                        </IconButton>
                    </Tooltip>
                )}
            </Toolbar>
        </AppBar>
    );
};

export default ViewerToolbar;
