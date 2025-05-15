import {useState} from 'react';
import useSWR from 'swr';
import {
    IconButton,
    Badge,
    Menu,
    Box,
    Typography,
    Button,
    Divider,
    Tooltip,
    alpha,
    MenuItem as MuiMenuItem
} from '@mui/material';
import {useTheme} from '@mui/material/styles';
import NotificationsIcon from '@mui/icons-material/Notifications';

const fetcher = (...args) => fetch(...args).then(res => res.json());

const Notification = () => {
    const theme = useTheme();
    const [notificationsAnchor, setNotificationsAnchor] = useState(null);

    // Fetch notifications using SWR
    const {data, error, mutate} = useSWR(route('api.notifications.unread'), fetcher, {
        refreshInterval: 30000, // Refresh every 30 seconds
        revalidateOnFocus: true,
        dedupingInterval: 10000, // Dedupe requests within 10 seconds
    });

    // Handle loading and error states
    const isLoading = !data && !error;
    const notifications = data?.notifications || [];
    const unreadCount = data?.unread_count || 0;

    const handleNotificationsOpen = (event) => setNotificationsAnchor(event.currentTarget);
    const handleNotificationsClose = () => setNotificationsAnchor(null);

    const markAllAsRead = async () => {
        try {
            // Send request to mark all as read
            const response = await fetch(route('api.notifications.markAllAsRead'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
            });

            if (response.ok) {
                // If successful, revalidate the data
                mutate();
            }
        } catch (error) {
            console.error('Failed to mark notifications as read:', error);
        }

        handleNotificationsClose();
    };

    const markAsRead = async (id) => {
        try {
            // Send request to mark specific notification as read
            const response = await fetch(route('api.notifications.markAsRead', {id}), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content'),
                },
            });

            if (response.ok) {
                // If successful, revalidate the data
                mutate();
            }
        } catch (error) {
            console.error(`Failed to mark notification ${id} as read:`, error);
        }
    };

    return (
        <>
            {/* Notifications Icon */}
            <Tooltip title="Notifications">
                <IconButton
                    color="inherit"
                    onClick={handleNotificationsOpen}
                    sx={{mr: 1}}
                >
                    <Badge badgeContent={unreadCount} color="error">
                        <NotificationsIcon/>
                    </Badge>
                </IconButton>
            </Tooltip>

            {/* Notifications Menu */}
            <Menu
                anchorEl={notificationsAnchor}
                open={Boolean(notificationsAnchor)}
                onClose={handleNotificationsClose}
                slotProps={{
                    Paper: {
                        elevation: 3,
                        sx: {
                            width: 320,
                            maxHeight: 400,
                            mt: 1.5,
                            borderRadius: 2,
                            overflow: 'hidden',
                        }
                    }
                }}
                transformOrigin={{horizontal: 'right', vertical: 'top'}}
                anchorOrigin={{horizontal: 'right', vertical: 'bottom'}}
            >
                <Box sx={{p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                    <Typography variant="subtitle1" sx={{fontWeight: 600}}>
                        Notifications
                    </Typography>
                    {unreadCount > 0 && (
                        <Button size="small" onClick={markAllAsRead}>
                            Mark all as read
                        </Button>
                    )}
                </Box>
                <Divider/>

                {isLoading ? (
                    <Box sx={{p: 4, textAlign: 'center'}}>
                        <Typography variant="body2" color="text.secondary">
                            Loading notifications...
                        </Typography>
                    </Box>
                ) : error ? (
                    <Box sx={{p: 4, textAlign: 'center'}}>
                        <Typography variant="body2" color="error">
                            Failed to load notifications
                        </Typography>
                    </Box>
                ) : notifications.length > 0 ? (
                    <Box sx={{maxHeight: 320, overflow: 'auto'}}>
                        {notifications.map((notification) => (
                            <MuiMenuItem
                                key={notification.id}
                                onClick={() => {
                                    markAsRead(notification.id);
                                    handleNotificationsClose();
                                }}
                                sx={{
                                    py: 1.5,
                                    px: 2,
                                    borderLeft: notification.read ? 'none' : '3px solid',
                                    borderColor: 'primary.main',
                                    backgroundColor: notification.read ? 'transparent' : alpha(theme.palette.primary.main, 0.04),
                                }}
                            >
                                <Box sx={{width: '100%'}}>
                                    <Box sx={{display: 'flex', justifyContent: 'space-between'}}>
                                        <Typography variant="body2"
                                                    sx={{fontWeight: notification.read ? 400 : 500}}>
                                            {notification.text || notification.message}
                                        </Typography>
                                    </Box>
                                    <Typography variant="caption" color="text.secondary">
                                        {notification.time || notification.created_at_formatted}
                                    </Typography>
                                </Box>
                            </MuiMenuItem>
                        ))}
                    </Box>
                ) : (
                    <Box sx={{p: 4, textAlign: 'center'}}>
                        <Typography variant="body2" color="text.secondary">
                            No notifications yet
                        </Typography>
                    </Box>
                )}

                <Divider/>
                <Box sx={{p: 1}}>
                    <Button
                        fullWidth
                        size="small"
                        onClick={() => {
                            // You can navigate to a full notifications page here
                            window.location.href = route('notifications');
                            handleNotificationsClose();
                        }}
                    >
                        View all notifications
                    </Button>
                </Box>
            </Menu>
        </>
    );
};

export default Notification;
