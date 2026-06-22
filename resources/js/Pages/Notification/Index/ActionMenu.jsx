import { Menu, MenuItem } from '@mui/material';

const ActionMenu = ({
    anchorEl,
    selectedNotification,
    onClose,
    onMarkAsRead,
    onMarkAsUnread,
    onDelete,
}) => (
    <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={onClose}>
        {selectedNotification && !selectedNotification.read && (
            <MenuItem onClick={() => onMarkAsRead(selectedNotification.id).then(() => onClose())}>
                Mark as read
            </MenuItem>
        )}
        {selectedNotification && selectedNotification.read && (
            <MenuItem onClick={() => onMarkAsUnread(selectedNotification.id).then(() => onClose())}>
                Mark as unread
            </MenuItem>
        )}
        {selectedNotification && (
            <MenuItem
                onClick={() => onDelete(selectedNotification.id).then(() => onClose())}
                sx={{ color: 'error.main' }}
            >
                Delete
            </MenuItem>
        )}
    </Menu>
);

export default ActionMenu;
