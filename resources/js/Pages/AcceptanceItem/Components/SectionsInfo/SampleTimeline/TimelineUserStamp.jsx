import { Badge, Box, Stack, Typography } from '@mui/material';
import UserAvatar from '../UserAvatar.jsx';
import { formatDateTime } from '../constants.jsx';

/**
 * "Started/Completed/Rejected by <user>" avatar + timestamp block, with a
 * status icon badged onto the avatar.
 */
const TimelineUserStamp = ({ badge, name, action, timestamp, sx }) => (
    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ...sx }}>
        <Badge
            overlap="circular"
            anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
            }}
            badgeContent={badge}
        >
            <UserAvatar name={name} />
        </Badge>
        <Box>
            <Typography variant="body2" color="text.secondary">
                {action} by{' '}
                <Typography component="span" fontWeight="bold">
                    {name || 'Unknown'}
                </Typography>
            </Typography>
            <Typography variant="body2" color="text.secondary">
                {formatDateTime(timestamp)}
            </Typography>
        </Box>
    </Stack>
);

export default TimelineUserStamp;
