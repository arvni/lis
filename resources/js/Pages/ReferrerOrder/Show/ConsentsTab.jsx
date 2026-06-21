import {
    Alert,
    Avatar,
    Box,
    Chip,
    Divider,
    Grid,
    IconButton,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { Description, Download, CheckCircle, Info } from '@mui/icons-material';

const ConsentsTab = ({ consents }) =>
    consents ? (
        <Grid container spacing={3}>
            {/* Consent Confirmations */}
            {Object.entries(consents)
                .filter(([key]) => key !== 'consentForm')
                .map(([key, consent]) => (
                    <Grid size={{ xs: 12 }} key={key}>
                        <Paper
                            elevation={2}
                            sx={{
                                p: 3,
                                bgcolor: consent.value === '1' ? 'success.50' : 'warning.50',
                                border: '2px solid',
                                borderColor: consent.value === '1' ? 'success.main' : 'warning.main',
                            }}
                        >
                            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
                                <Avatar
                                    sx={{
                                        bgcolor:
                                            consent.value === '1' ? 'success.main' : 'warning.main',
                                    }}
                                >
                                    {consent.value === '1' ? <CheckCircle /> : <Info />}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                    <Typography variant="body1">
                                        {consent.title || `Consent ${key}`}
                                    </Typography>
                                </Box>
                                <Chip
                                    label={consent.value === '1' ? 'Accepted' : 'Not Accepted'}
                                    color={consent.value === '1' ? 'success' : 'warning'}
                                />
                            </Stack>
                        </Paper>
                    </Grid>
                ))}

            {/* Consent Form Files */}
            {consents.consentForm && (
                <Grid size={{ xs: 12 }}>
                    <Paper elevation={2} sx={{ p: 3 }}>
                        <Typography variant="h6" gutterBottom fontWeight={600}>
                            Consent Form Documents
                        </Typography>
                        <Divider sx={{ mb: 2 }} />
                        <Stack spacing={2}>
                            {consents.consentForm.map((file, index) => (
                                <Paper
                                    key={index}
                                    variant="outlined"
                                    sx={{
                                        p: 2,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 2,
                                        '&:hover': { bgcolor: 'action.hover' },
                                    }}
                                >
                                    <Avatar sx={{ bgcolor: 'primary.main' }}>
                                        <Description />
                                    </Avatar>
                                    <Box sx={{ flex: 1 }}>
                                        <Typography variant="body1" fontWeight={500}>
                                            Consent Form {index + 1}
                                        </Typography>
                                        <Typography variant="caption" color="text.secondary">
                                            {file}
                                        </Typography>
                                    </Box>
                                    <IconButton color="primary">
                                        <Download />
                                    </IconButton>
                                </Paper>
                            ))}
                        </Stack>
                    </Paper>
                </Grid>
            )}
        </Grid>
    ) : (
        <Alert severity="info">No consent information available.</Alert>
    );

export default ConsentsTab;
