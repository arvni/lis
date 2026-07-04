import React, { useState } from 'react';
import { IconButton, Stack, Tooltip } from '@mui/material';
import {
    Edit as EditIcon,
    Delete as DeleteIcon,
    Restore as RestoreIcon,
    CallSplit as EjectIcon,
} from '@mui/icons-material';
import { DeleteConfirmDialog, EjectConfirmDialog } from './ConfirmDialogs';

const ActionButtons = ({ panel, onEdit, onDelete, onRestore, onEject }) => {
    const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
    const [ejectDialogOpen, setEjectDialogOpen] = useState(false);

    const handleDeleteClick = () => {
        setDeleteDialogOpen(true);
    };

    const handleDeleteConfirm = () => {
        onDelete();
        setDeleteDialogOpen(false);
    };

    if (panel?.deleted) {
        return (
            <Tooltip title="Restore panel">
                <IconButton
                    onClick={onRestore}
                    size="small"
                    color="success"
                    sx={{
                        '&:hover': {
                            backgroundColor: 'success.main',
                            color: 'white',
                        },
                    }}
                >
                    <RestoreIcon />
                </IconButton>
            </Tooltip>
        );
    }

    return (
        <>
            <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
                {onEject && (
                    <Tooltip title="Eject panel — convert all tests to individual">
                        <IconButton
                            onClick={() => setEjectDialogOpen(true)}
                            size="small"
                            color="warning"
                            sx={{ '&:hover': { backgroundColor: 'warning.main', color: 'white' } }}
                        >
                            <EjectIcon />
                        </IconButton>
                    </Tooltip>
                )}
                {onEdit && (
                    <Tooltip title="Edit panel">
                        <IconButton
                            onClick={onEdit}
                            size="small"
                            color="primary"
                            sx={{ '&:hover': { backgroundColor: 'primary.main', color: 'white' } }}
                        >
                            <EditIcon />
                        </IconButton>
                    </Tooltip>
                )}
                {onDelete && (
                    <Tooltip title="Remove panel">
                        <IconButton
                            onClick={handleDeleteClick}
                            size="small"
                            color="error"
                            sx={{ '&:hover': { backgroundColor: 'error.main', color: 'white' } }}
                        >
                            <DeleteIcon />
                        </IconButton>
                    </Tooltip>
                )}
            </Stack>

            <DeleteConfirmDialog
                open={deleteDialogOpen}
                onClose={() => setDeleteDialogOpen(false)}
                onConfirm={handleDeleteConfirm}
                panelName={panel?.panel?.name}
            />
            <EjectConfirmDialog
                open={ejectDialogOpen}
                onClose={() => setEjectDialogOpen(false)}
                onConfirm={() => {
                    onEject();
                    setEjectDialogOpen(false);
                }}
                panelName={panel?.panel?.name}
            />
        </>
    );
};

export default ActionButtons;
