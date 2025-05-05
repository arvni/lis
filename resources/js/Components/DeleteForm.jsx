import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import ReportProblemIcon from "@mui/icons-material/ReportProblem";
import { Box, Typography, Stack } from "@mui/material";
import React from "react";

/**
 * Confirmation dialog for delete operations
 *
 * @param {Object} props - Component properties
 * @param {string} props.title - Title of the item to be deleted
 * @param {string} props.message - Optional custom message to display
 * @param {Function} props.agreeCB - Callback function when user confirms deletion
 * @param {Function} props.disAgreeCB - Callback function when user cancels deletion
 * @param {boolean} props.openDelete - Whether the dialog is open
 * @param {boolean} props.loading - Whether deletion is in progress
 * @returns {JSX.Element}
 */
const DeleteForm = ({
                        title,
                        message,
                        agreeCB,
                        disAgreeCB,
                        openDelete,
                        loading = false
                    }) => {
    const defaultMessage = `Are you sure you want to delete ${title}?`;
    const displayMessage = message || defaultMessage;

    return (
        <Dialog
            open={openDelete}
            onClose={!loading ? disAgreeCB : undefined}
            aria-labelledby="delete-dialog-title"
            aria-describedby="delete-dialog-description"
            PaperProps={{
                elevation: 3,
                sx: {
                    borderRadius: 2,
                    minWidth: { xs: '85%', sm: 400 }
                }
            }}
        >
            <DialogTitle
                id="delete-dialog-title"
                sx={{
                    pt: 3,
                    pb: 1
                }}
            >
                <Stack direction="row" spacing={2} alignItems="center">
                    <Box
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            bgcolor: 'error.light',
                            borderRadius: '50%',
                            p: 1,
                            color: 'error.main'
                        }}
                    >
                        <ReportProblemIcon color="error" />
                    </Box>
                    <Typography variant="h6" component="span">
                        Confirm Deletion
                    </Typography>
                </Stack>
            </DialogTitle>

            <DialogContent sx={{ pt: 2, pb: 2 }}>
                <DialogContentText
                    id="delete-dialog-description"
                    sx={{ color: 'text.primary' }}
                >
                    {displayMessage}
                </DialogContentText>

                <Typography
                    variant="caption"
                    color="text.secondary"
                    display="block"
                    sx={{ mt: 2 }}
                >
                    This action cannot be undone.
                </Typography>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid', borderColor: 'divider' }}>
                <Button
                    onClick={disAgreeCB}
                    disabled={loading}
                    sx={{
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 500
                    }}
                >
                    Cancel
                </Button>
                <Button
                    variant="contained"
                    color="error"
                    onClick={agreeCB}
                    autoFocus
                    disabled={loading}
                    sx={{
                        px: 3,
                        textTransform: 'none',
                        fontWeight: 500
                    }}
                >
                    {loading ? "Deleting..." : "Delete"}
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default DeleteForm;
