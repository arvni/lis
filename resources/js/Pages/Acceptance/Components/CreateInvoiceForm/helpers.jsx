import { Avatar } from '@mui/material';
import { Person, Business } from '@mui/icons-material';

// Avatar for an invoice owner card — image when available, otherwise a typed fallback.
export const getOwnerAvatar = (type, data) => {
    if (!data) return null;

    if (data.avatar) {
        return (
            <Avatar
                src={data.avatar}
                alt={data.fullName}
                sx={{
                    width: 40,
                    height: 40,
                    border: '2px solid',
                    borderColor: type === 'patient' ? 'primary.main' : 'secondary.main',
                }}
            />
        );
    }

    return (
        <Avatar
            sx={{
                bgcolor: type === 'patient' ? 'primary.main' : 'secondary.main',
                width: 40,
                height: 40,
            }}
        >
            {type === 'patient' ? <Person /> : <Business />}
        </Avatar>
    );
};
