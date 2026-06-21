import { Avatar, Tooltip, useTheme } from '@mui/material';

// User avatar component
const UserAvatar = ({ name, size = 32 }) => {
    const theme = useTheme();

    if (!name) return null;

    const initials = name
        .split(' ')
        .map((part) => part[0])
        .join('')
        .toUpperCase()
        .substring(0, 2);

    return (
        <Tooltip title={name} arrow>
            <Avatar
                sx={{
                    width: size,
                    height: size,
                    bgcolor: theme.palette.primary.main,
                    fontSize: size / 2,
                    fontWeight: 'bold',
                }}
            >
                {initials}
            </Avatar>
        </Tooltip>
    );
};

export default UserAvatar;
