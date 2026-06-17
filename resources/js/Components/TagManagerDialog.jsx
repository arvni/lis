import React from 'react';
import {
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    Typography,
    Box,
    IconButton,
} from '@mui/material';
import { Close as CloseIcon, LocalOffer as TagIcon } from '@mui/icons-material';
import TagManager from './TagManager';

const TagManagerDialog = ({
    open,
    onClose,
    tags,
    updateUrl,
    entityType,
    title = 'Manage Tags',
}) => {
    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            slotProps={{
                paper: {
                    sx: { borderRadius: 2 },
                },
            }}
        >
            <DialogTitle
                sx={{
                    m: 0,
                    p: 2,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <TagIcon color="primary" />
                    <Typography variant="h6" fontWeight="bold">
                        {title}
                    </Typography>
                </Box>
                <IconButton
                    aria-label="close"
                    onClick={onClose}
                    sx={{
                        color: (theme) => theme.palette.grey[500],
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent dividers>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Add or remove tags for this item. New tags will be created automatically.
                </Typography>
                <TagManager
                    initialTags={tags}
                    updateUrl={updateUrl}
                    entityType={entityType}
                    onSuccess={() => {
                        // We can optionally close the dialog on success,
                        // but maybe it's better to let the user see the success snackbar first.
                        // For now, let's keep it open or provide an option.
                    }}
                />
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
                <Button onClick={onClose} variant="outlined">
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
};

export default TagManagerDialog;
