import React from 'react';
import { Fade, Menu, MenuItem } from '@mui/material';
import { Visibility as VisibilityIcon, Edit as EditIcon } from '@mui/icons-material';

const ActionsMenu = ({ anchorEl, onClose, onView, onEdit }) => (
    <Menu
        id="card-actions-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={onClose}
        slots={{ Transition: Fade }}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
    >
        <MenuItem onClick={onView}>
            <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
            View Details
        </MenuItem>

        <MenuItem onClick={onEdit}>
            <EditIcon fontSize="small" sx={{ mr: 1 }} />
            Edit
        </MenuItem>
    </Menu>
);

export default ActionsMenu;
