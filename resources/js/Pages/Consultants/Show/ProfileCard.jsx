import { alpha, Avatar, Box, Chip, Divider, Paper, Stack, Typography, useTheme } from '@mui/material';
import Button from '@mui/material/Button';
import { AccessTime, Email, Phone } from '@mui/icons-material';

const ContactRow = ({ icon, color, children }) => {
    const theme = useTheme();
    return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box
                sx={{
                    width: 34,
                    height: 34,
                    borderRadius: 1.5,
                    flexShrink: 0,
                    bgcolor: alpha(theme.palette[color].main, 0.1),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                {icon}
            </Box>
            {children}
        </Box>
    );
};

const ProfileCard = ({ consultant, onAddNew }) => {
    const theme = useTheme();
    return (
        <Paper elevation={2} sx={{ borderRadius: 3, overflow: 'hidden', mb: 3 }}>
            {/* Gradient banner */}
            <Box
                sx={{
                    background: `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.primary.main} 60%, ${theme.palette.primary.light} 100%)`,
                    height: 80,
                }}
            />

            {/* Avatar overlapping banner */}
            <Box sx={{ display: 'flex', justifyContent: 'center', mt: -5.5, mb: 1.5 }}>
                <Avatar
                    src={consultant.avatar}
                    alt={consultant.name}
                    sx={{
                        width: 90,
                        height: 90,
                        border: `4px solid ${theme.palette.background.paper}`,
                        boxShadow: theme.shadows[4],
                        bgcolor: theme.palette.primary.main,
                        fontSize: '2rem',
                    }}
                >
                    {!consultant.avatar && consultant.name.charAt(0)}
                </Avatar>
            </Box>

            <Box sx={{ px: 3, pb: 3, textAlign: 'center' }}>
                <Typography variant="h6" fontWeight="bold">
                    {consultant.name}
                </Typography>
                {consultant.title && (
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        {consultant.title}
                    </Typography>
                )}
                <Stack direction="row" spacing={1} sx={{ justifyContent: 'center', mt: 1, mb: 2.5 }}>
                    {consultant.speciality && (
                        <Chip
                            size="small"
                            label={consultant.speciality}
                            color="primary"
                            variant="outlined"
                        />
                    )}
                    <Chip
                        size="small"
                        label={consultant.active ? 'Active' : 'Inactive'}
                        color={consultant.active ? 'success' : 'default'}
                    />
                </Stack>

                <Button
                    variant="contained"
                    fullWidth
                    onClick={onAddNew}
                    startIcon={<AccessTime />}
                >
                    Reserve a Time
                </Button>

                <Divider sx={{ my: 2.5 }} />

                <Typography
                    variant="overline"
                    color="text.secondary"
                    display="block"
                    sx={{ textAlign: 'left', mb: 1.5 }}
                >
                    Contact
                </Typography>

                <Stack spacing={1.5}>
                    {consultant.user && (
                        <ContactRow
                            color="primary"
                            icon={<Email fontSize="small" color="primary" />}
                        >
                            <Typography
                                variant="body2"
                                sx={{
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                {consultant.user.email}
                            </Typography>
                        </ContactRow>
                    )}
                    <ContactRow color="success" icon={<Phone fontSize="small" color="success" />}>
                        <Typography variant="body2">
                            {consultant.phone || 'No phone number'}
                        </Typography>
                    </ContactRow>
                </Stack>
            </Box>
        </Paper>
    );
};

export default ProfileCard;
