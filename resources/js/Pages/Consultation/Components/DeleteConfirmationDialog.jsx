import React from 'react';
import PropTypes from 'prop-types';
import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    CircularProgress,
    Box,
    Typography,
    Alert
} from '@mui/material';
import { WarningAmber, ErrorOutline } from '@mui/icons-material';

/**
 * A dialog to confirm deletion of items
 *
 * @param {Object} props - Component props
 * @param {boolean} props.open - Whether the dialog is open
 * @param {Function} props.onClose - Callback for closing dialog
 * @param {Function} props.onConfirm - Callback for confirming deletion
 * @param {string} props.title - Dialog title
 * @param {string} props.itemName - Name of item being deleted
 * @param {string} props.itemType - Type of item being deleted (e.g., "time slot")
 * @param {string} props.description - Additional description text
 * @param {boolean} props.isLoading - Whether deletion is in progress
 * @param {string} props.severity - Severity level ("warning" or "error")
 * @returns {JSX.Element} The DeleteConfirmationDialog component
 */
const DeleteConfirmationDialog = ({
                                      open,
                                      onClose,
                                      onConfirm,
                                      title = "Confirm Deletion",
                                      itemName = "",
                                      itemType = "item",
                                      description = "",
                                      isLoading = false,
                                      severity = "warning"
                                  }) => {
    const isError = severity === 'error';

    return (
        <Dialog
            open={open}
            onClose={!isLoading ? onClose : undefined}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 2,
                    overflow: 'hidden'
                }
            }}
        >
            <DialogTitle sx={{
                pb: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 1,
                color: isError ? 'error.main' : 'warning.main'
            }}>
                {isError ? <ErrorOutline color="error" /> : <WarningAmber color="warning" />}
                {title}
            </DialogTitle>

            <DialogContent sx={{ pt: 1 }}>
                <Alert
                    severity={severity}
                    variant="outlined"
                    sx={{ mb: 2 }}
                >
                    <Typography variant="body2" fontWeight="500">
                        You are about to delete: <strong>{itemName}</strong>
                    </Typography>
                </Alert>

                <DialogContentText>
                    Are you sure you want to delete this {itemType}? This action cannot be undone.
                </DialogContentText>

                {description && (
                    <DialogContentText sx={{ mt: 2, color: isError ? 'error.dark' : 'text.secondary' }}>
                        {description}
                    </DialogContentText>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2 }}>
                <Button
                    onClick={onClose}
                    disabled={isLoading}
                    variant="outlined"
                    color="inherit"
                >
                    Cancel
                </Button>
                <Box sx={{ position: 'relative' }}>
                    <Button
                        onClick={onConfirm}
                        disabled={isLoading}
                        variant="contained"
                        color={isError ? "error" : "warning"}
                        startIcon={isLoading ? null : isError ? <ErrorOutline /> : <WarningAmber />}
                    >
                        {isLoading ? 'Deleting...' : 'Delete'}
                    </Button>
                    {isLoading && (
                        <CircularProgress
                            size={24}
                            sx={{
                                position: 'absolute',
                                top: '50%',
                                left: '50%',
                                marginTop: '-12px',
                                marginLeft: '-12px',
                            }}
                        />
                    )}
                </Box>
            </DialogActions>
        </Dialog>
    );
};

DeleteConfirmationDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onClose: PropTypes.func.isRequired,
    onConfirm: PropTypes.func.isRequired,
    title: PropTypes.string,
    itemName: PropTypes.string,
    itemType: PropTypes.string,
    description: PropTypes.string,
    isLoading: PropTypes.bool,
    severity: PropTypes.oneOf(['warning', 'error'])
};

export default DeleteConfirmationDialog;
