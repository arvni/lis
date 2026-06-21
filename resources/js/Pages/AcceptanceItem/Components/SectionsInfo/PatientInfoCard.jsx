import { Avatar, Box, Card, Stack, Typography, useTheme } from '@mui/material';
import { Person as PersonIcon } from '@mui/icons-material';

// Patient Information Component
const PatientInfoCard = ({ patient, sample }) => {
    const theme = useTheme();

    if (!patient && !sample) return null;

    return (
        <Card
            elevation={1}
            sx={{
                mb: 2,
                borderRadius: 2,
                border: `1px solid ${theme.palette.info.light}`,
                backgroundColor: theme.palette.info.main,
                color: theme.palette.info.contrastText,
            }}
        >
            <Box sx={{ p: 2 }}>
                <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                    <Avatar
                        sx={{
                            bgcolor: theme.palette.info.dark,
                            width: 48,
                            height: 48,
                        }}
                    >
                        <PersonIcon />
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" fontWeight="bold">
                            {patient?.fullName || 'Unknown Patient'}
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                            Patient ID: {patient?.id || 'N/A'}
                        </Typography>
                        {sample?.barcode && (
                            <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                Sample Barcode: {sample.barcode}
                            </Typography>
                        )}
                    </Box>
                </Stack>
            </Box>
        </Card>
    );
};

export default PatientInfoCard;
