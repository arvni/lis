import { alpha, Box, Card, CardContent, Chip, IconButton, Typography, useTheme } from '@mui/material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutlined';
import { formatRelativeTime } from './helpers';

const NotificationCard = ({ notification, isSelected, selectMode, onToggleSelect, onMenuOpen }) => {
    const theme = useTheme();

    return (
        <Card
            elevation={1}
            sx={{
                mb: 2,
                borderLeft: notification.read ? 'none' : '4px solid',
                borderColor: 'primary.main',
                backgroundColor: isSelected
                    ? alpha(theme.palette.primary.main, 0.08)
                    : notification.read
                      ? 'background.paper'
                      : alpha(theme.palette.primary.main, 0.04),
                transition: 'all 0.2s ease',
                cursor: selectMode ? 'pointer' : 'default',
                '&:hover': {
                    boxShadow: 3,
                    transform: 'translateY(-2px)',
                },
            }}
            onClick={selectMode ? () => onToggleSelect(notification.id) : undefined}
        >
            <CardContent>
                <Box
                    sx={{
                        display: 'flex',
                        alignItems: 'flex-start',
                        justifyContent: 'space-between',
                    }}
                >
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', flex: 1, mr: 2 }}>
                        {/* If you want to add notification type icons based on type */}
                        {selectMode && (
                            <Box
                                sx={{
                                    width: 24,
                                    height: 24,
                                    borderRadius: '50%',
                                    border: '2px solid',
                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                    mr: 2,
                                    backgroundColor: isSelected ? 'primary.main' : 'transparent',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                }}
                            >
                                {isSelected && (
                                    <CheckCircleOutlineIcon sx={{ color: 'white', fontSize: 16 }} />
                                )}
                            </Box>
                        )}

                        <Box sx={{ flex: 1 }}>
                            <Typography
                                variant="subtitle1"
                                sx={{
                                    fontWeight: notification.read ? 400 : 600,
                                    mb: 0.5,
                                }}
                            >
                                {notification.title || 'Notification'}
                            </Typography>

                            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                {notification.message || notification.text}
                            </Typography>

                            <Box
                                sx={{
                                    display: 'flex',
                                    justifyContent: 'space-between',
                                    alignItems: 'center',
                                }}
                            >
                                <Typography variant="caption" color="text.secondary">
                                    {formatRelativeTime(notification.created_at)}
                                </Typography>

                                {notification.type && (
                                    <Chip
                                        label={notification.type}
                                        size="small"
                                        sx={{ height: 24 }}
                                    />
                                )}
                            </Box>
                        </Box>
                    </Box>

                    {!selectMode && (
                        <IconButton
                            size="small"
                            onClick={(e) => {
                                e.stopPropagation();
                                onMenuOpen(e, notification);
                            }}
                        >
                            <MoreVertIcon fontSize="small" />
                        </IconButton>
                    )}
                </Box>
            </CardContent>
        </Card>
    );
};

export default NotificationCard;
