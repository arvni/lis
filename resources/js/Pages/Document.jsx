// DocumentPage.jsx
import React, { useEffect, useState } from 'react';
import {
    Dialog,
    DialogContent,
    useTheme,
    useMediaQuery,
    Slide
} from '@mui/material';
import SingleDocumentViewer from '@/Components/SingleDocumentViewer';

// Slide transition for dialog
const Transition = React.forwardRef(function Transition(props, ref) {
    return <Slide direction="up" ref={ref} {...props} />;
});

// Example document page that receives a document ID via route params
const Document = ({ document, onClose }) => {
    const [open, setOpen] = useState(Boolean(document));
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
    const isTablet = useMediaQuery(theme.breakpoints.down('md'));

    useEffect(() => {
        if (document) {
            setOpen(true);
        } else {
            setOpen(false);
        }
    }, [document]);

    const handleClose = () => {
        setOpen(false);
        if (onClose) {
            onClose();
        } else {
            window.close();
        }
    };

    // Determine dialog sizing based on screen size and document type
    const getDialogProps = () => {
        const isPDF = document?.ext?.toLowerCase() === 'pdf' ||
            document?.originalName?.toLowerCase().endsWith('.pdf');

        if (isMobile) {
            return {
                fullScreen: true,
                maxWidth: false,
                sx: {
                    '& .MuiDialog-paper': {
                        margin: 0,
                        borderRadius: 0,
                        height: '100vh',
                        width: '100vw'
                    }
                }
            };
        }

        if (isTablet) {
            return {
                fullScreen: false,
                maxWidth: 'lg',
                fullWidth: true,
                sx: {
                    '& .MuiDialog-paper': {
                        margin: theme.spacing(2),
                        height: 'calc(100vh - 32px)',
                        width: 'calc(100vw - 32px)',
                        maxHeight: 'calc(100vh - 32px)',
                    }
                }
            };
        }

        // Desktop - different sizes for different document types
        if (isPDF) {
            return {
                fullScreen: false,
                maxWidth: false,
                sx: {
                    '& .MuiDialog-paper': {
                        width: '90vw',
                        height: '90vh',
                        maxWidth: '1200px',
                        maxHeight: '900px',
                    }
                }
            };
        }

        // Default for other document types
        return {
            fullScreen: false,
            maxWidth: 'md',
            fullWidth: true,
            sx: {
                '& .MuiDialog-paper': {
                    height: '80vh',
                    maxHeight: '800px',
                }
            }
        };
    };

    const dialogProps = getDialogProps();

    return (
        <Dialog
            open={open}
            onClose={handleClose}
            slots={{transition:Transition}}
            keepMounted={false}
            disableEscapeKeyDown={false}
            aria-labelledby="document-dialog-title"
            {...dialogProps}
        >
            <DialogContent
                sx={{
                    p: 0,
                    // display: 'flex',
                    // flexDirection: 'column',
                    overflow: 'hidden',
                    height: '100%'
                }}
            >
                <SingleDocumentViewer
                    document={document}
                    onClose={handleClose}
                    fullScreen={isMobile}
                />
            </DialogContent>
        </Dialog>
    );
};

export default Document;
